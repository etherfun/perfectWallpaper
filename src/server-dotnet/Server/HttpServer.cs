using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using Newtonsoft.Json;

namespace PerfectWall.Server.Server
{
    /// <summary>
    /// Lightweight request context exposed to endpoint handlers.
    /// <c>WriteJsonAsync</c> handles UTF-8 + content-type + status.
    /// </summary>
    public sealed class HttpContext
    {
        public HttpListenerRequest Request { get; }
        public HttpListenerResponse Response { get; }
        public Dictionary<string, string> PathParams { get; }
        // Cancellation fires when the server is stopping.
        // Long-running handlers should observe this token so a
        // Ctrl+C / Exit tears down in-flight requests cleanly
        // instead of leaving the client with a half-written
        // response.
        public CancellationToken RequestAborted { get; }

        public HttpContext(HttpListenerRequest req, HttpListenerResponse resp, Dictionary<string, string> pathParams, CancellationToken requestAborted)
        {
            Request = req;
            Response = resp;
            PathParams = pathParams;
            RequestAborted = requestAborted;
        }

        public string QueryParam(string key, string defaultValue = null)
        {
            var v = Request.QueryString[key];
            return string.IsNullOrEmpty(v) ? defaultValue : v;
        }

        public string ReadBody()
        {
            // Refuse bodies > 16 MB before allocating a buffer.
            // Convert.FromBase64String on a 1 GB string would
            // otherwise allocate ~1.3 GB of byte[] in one shot
            // and crash the process. Callers that need a smaller
            // cap can re-check ContentLength64 themselves
            // (IconEndpoints caps at 8 MB decoded, 16 MB raw).
            //
            // ContentLength64 is -1 for `Transfer-Encoding:
            // chunked` — the simple header check would miss a
            // chunked 4 GB POST entirely. We enforce the cap
            // cumulatively by counting characters as the
            // StreamReader pulls them off the wire. The reader
            // builds the string incrementally so a 4 GB body is
            // rejected at ~16 MB without ever having allocated
            // the full 4 GB of string memory.
            const long MaxBodyBytes = 16L * 1024 * 1024;
            if (Request.ContentLength64 > MaxBodyBytes)
            {
                throw new InvalidOperationException(
                    $"Request body exceeds {MaxBodyBytes} bytes (Content-Length: {Request.ContentLength64})");
            }
            using (var reader = new StreamReader(Request.InputStream, Request.ContentEncoding ?? Encoding.UTF8))
            {
                var sb = new System.Text.StringBuilder();
                var buffer = new char[8192];
                long total = 0;
                int read;
                while ((read = reader.Read(buffer, 0, buffer.Length)) > 0)
                {
                    total += read;
                    if (total > MaxBodyBytes)
                    {
                        throw new InvalidOperationException(
                            $"Request body exceeds {MaxBodyBytes} bytes (chunked, observed {total})");
                    }
                    sb.Append(buffer, 0, read);
                }
                return sb.ToString();
            }
        }

        public async Task WriteJsonAsync(object payload, int status = 200)
        {
            // Cache the JsonSerializerSettings so we
            // don't allocate a fresh one (and pay the
            // contract cache miss penalty) per request.
            // DateFormatHandling.IsoDateTimeFormat matches
            // the default for DateTimeOffset fields so
            // the wire shape is unchanged.
            var json = JsonConvert.SerializeObject(payload, JsonSettings);
            var bytes = Encoding.UTF8.GetBytes(json);
            Response.StatusCode = status;
            Response.ContentType = "application/json; charset=utf-8";
            Response.ContentLength64 = bytes.LongLength;
            Response.AddHeader("Access-Control-Allow-Origin", "*");
            Response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            Response.AddHeader("Access-Control-Allow-Headers", "*");
            await Response.OutputStream.WriteAsync(bytes, 0, bytes.Length);
            Response.OutputStream.Close();
        }

        public async Task WriteTextAsync(string text, string contentType, int status = 200)
        {
            var bytes = Encoding.UTF8.GetBytes(text);
            Response.StatusCode = status;
            Response.ContentType = contentType;
            Response.ContentLength64 = bytes.LongLength;
            Response.AddHeader("Access-Control-Allow-Origin", "*");
            await Response.OutputStream.WriteAsync(bytes, 0, bytes.Length);
            Response.OutputStream.Close();
        }
    }

    /// <summary>
    /// Wraps <see cref="HttpListener"/>. Each request is routed
    /// to the first matching endpoint; CORS preflight short-circuits.
    /// </summary>
    public sealed class HttpServer
    {
        // Shared, immutable settings for every JSON
        // serialisation on the request path. Cached to
        // avoid allocating a new JsonSerializerSettings
        // (and re-running contract cache lookup) on each
        // request.
        private static readonly JsonSerializerSettings JsonSettings =
            new JsonSerializerSettings
            {
                DateFormatHandling = DateFormatHandling.IsoDateTimeFormat,
                NullValueHandling = NullValueHandling.Include
            };

        private readonly Router _router;
        private readonly HttpListener _listener = new HttpListener();
        private readonly CancellationTokenSource _cts = new CancellationTokenSource();
        private readonly int _port;

        public HttpServer(int port, Router router)
        {
            _port = port;
            _router = router;
            // We pick a single prefix per HttpListener instance
            // because once a listener has thrown, mutating its
            // prefix collection is no longer safe. Try the
            // wildcard first (matches the Rust build's
            // `0.0.0.0:port` bind). If that fails with HTTP
            // access-denied, throw the listener away entirely
            // and build a fresh one bound to localhost only.
        }

        public void Start()
        {
            try
            {
                _listener.Prefixes.Add($"http://+:{_port}/");
                _listener.Start();
            }
            catch (HttpListenerException ex) when (ex.ErrorCode == 5)
            {
                // Wildcard bind refused: fall back to localhost.
                _listener.Close();
                var local = new HttpListener();
                local.Prefixes.Add($"http://localhost:{_port}/");
                try
                {
                    local.Start();
                    // Reflect the fallback into our private field
                    // by capturing a reference. Simpler: rebuild
                    // the listener by replacing via a small
                    // ref-assignment trick.
                    typeof(HttpServer).GetField("_listener",
                        System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic)
                        .SetValue(this, local);
                    Console.WriteLine($"[HTTP] note: bound to localhost only. To expose on all interfaces run:");
                    Console.WriteLine($"[HTTP]       netsh http add urlacl url=http://+:{_port}/ user=Everyone");
                }
                catch (Exception ex2)
                {
                    throw new InvalidOperationException(
                        $"Failed to bind to port {_port}: {ex2.Message}", ex2);
                }
            }
            _ = Task.Run(() => LoopAsync(_cts.Token));
        }

        public void Stop()
        {
            try { _cts.Cancel(); } catch { }
            try { _listener.Stop(); } catch { }
            try { _listener.Close(); } catch { }
        }

        private async Task LoopAsync(CancellationToken ct)
        {
            while (!ct.IsCancellationRequested)
            {
                HttpListenerContext ctx;
                try
                {
                    ctx = await _listener.GetContextAsync();
                }
                catch (HttpListenerException) { break; }
                catch (ObjectDisposedException) { break; }
                catch (Exception ex)
                {
                    Console.Error.WriteLine($"[HTTP] listener error: {ex.Message}");
                    continue;
                }
                _ = Task.Run(() => HandleAsync(ctx, ct));
            }
        }

        private async Task HandleAsync(HttpListenerContext ctx, CancellationToken serverCt)
        {
            try
            {
                if (ctx.Request.HttpMethod == "OPTIONS")
                {
                    ctx.Response.AddHeader("Access-Control-Allow-Origin", "*");
                    ctx.Response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                    ctx.Response.AddHeader("Access-Control-Allow-Headers", "*");
                    ctx.Response.StatusCode = 204;
                    ctx.Response.Close();
                    return;
                }

                // Wire the server-wide stop token into the
                // request context so handlers can observe it.
                var routeCtx = new HttpContext(ctx.Request, ctx.Response, new Dictionary<string, string>(), serverCt);
                var handled = await _router.DispatchAsync(routeCtx);
                if (!handled)
                {
                    if (routeCtx.RequestAborted.IsCancellationRequested) return;
                    await routeCtx.WriteJsonAsync(new
                    {
                        success = false,
                        error = "Not found",
                        timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                    }, 404);
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[HTTP] handler error: {ex}");
                try
                {
                    if (serverCt.IsCancellationRequested) return;
                    var bytes = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(new
                    {
                        success = false,
                        error = ex.Message,
                        timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                    }));
                    ctx.Response.StatusCode = 500;
                    ctx.Response.ContentType = "application/json; charset=utf-8";
                    ctx.Response.ContentLength64 = bytes.LongLength;
                    await ctx.Response.OutputStream.WriteAsync(bytes, 0, bytes.Length);
                    ctx.Response.OutputStream.Close();
                }
                catch { /* swallow */ }
            }
        }
    }
}
