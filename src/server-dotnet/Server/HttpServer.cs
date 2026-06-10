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

        public HttpContext(HttpListenerRequest req, HttpListenerResponse resp, Dictionary<string, string> pathParams)
        {
            Request = req;
            Response = resp;
            PathParams = pathParams;
        }

        public string QueryParam(string key, string defaultValue = null)
        {
            var v = Request.QueryString[key];
            return string.IsNullOrEmpty(v) ? defaultValue : v;
        }

        public string ReadBody()
        {
            using (var reader = new StreamReader(Request.InputStream, Request.ContentEncoding ?? Encoding.UTF8))
            {
                return reader.ReadToEnd();
            }
        }

        public async Task WriteJsonAsync(object payload, int status = 200)
        {
            var json = JsonConvert.SerializeObject(payload);
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
                _ = Task.Run(() => HandleAsync(ctx));
            }
        }

        private async Task HandleAsync(HttpListenerContext ctx)
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

                var routeCtx = new HttpContext(ctx.Request, ctx.Response, new Dictionary<string, string>());
                var handled = await _router.DispatchAsync(routeCtx);
                if (!handled)
                {
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
