using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace PerfectWall.Server.Server
{
    public delegate Task EndpointHandler(HttpContext ctx);

    /// <summary>
    /// Tiny trie-free router. Patterns use <c>{name}</c> to
    /// capture path segments. First match wins. The pattern
    /// order in <see cref="Routes"/> is significant.
    /// </summary>
    public sealed class Router
    {
        private readonly List<(string Method, Regex Pattern, Dictionary<string, int> GroupMap, EndpointHandler Handler)> _routes
            = new List<(string, Regex, Dictionary<string, int>, EndpointHandler)>();

        public void Add(string method, string pattern, EndpointHandler handler)
        {
            var groupMap = new Dictionary<string, int>();
            var regexStr = "^" + Regex.Replace(pattern, @"\{(\w+)\}", m =>
            {
                var name = m.Groups[1].Value;
                if (!groupMap.ContainsKey(name)) groupMap[name] = groupMap.Count + 1;
                return $"([^/]+)";
            }) + "$";
            _routes.Add((method.ToUpperInvariant(), new Regex(regexStr, RegexOptions.Compiled), groupMap, handler));
        }

        public void Get(string p, EndpointHandler h) => Add("GET", p, h);
        public void Post(string p, EndpointHandler h) => Add("POST", p, h);

        public async Task<bool> DispatchAsync(HttpContext ctx)
        {
            var path = ctx.Request.Url?.AbsolutePath ?? "/";
            var method = ctx.Request.HttpMethod.ToUpperInvariant();
            foreach (var (m, pattern, groupMap, handler) in _routes)
            {
                if (m != method) continue;
                var match = pattern.Match(path);
                if (!match.Success) continue;
                foreach (var kv in groupMap)
                {
                    ctx.PathParams[kv.Key] = Uri.UnescapeDataString(match.Groups[kv.Value].Value);
                }
                await handler(ctx);
                return true;
            }
            return false;
        }
    }
}
