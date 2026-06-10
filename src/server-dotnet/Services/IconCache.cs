using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;

namespace PerfectWall.Server.Services
{
    /// <summary>
    /// 100-entry FIFO cache of base64 PNG icons, keyed by the
    /// absolute path of the source file. Mirrors the Rust
    /// <c>ICON_CACHE</c> <c>HashMap</c> with the same eviction
    /// rule (drop the first inserted entry when full).
    /// </summary>
    public sealed class IconCache
    {
        public const int MaxEntries = 100;
        private readonly object _lock = new object();
        private readonly LinkedList<string> _order = new LinkedList<string>();
        private readonly Dictionary<string, string> _data = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        public bool TryGet(string key, out string value)
        {
            lock (_lock)
            {
                if (_data.TryGetValue(key, out value)) return true;
                value = null;
                return false;
            }
        }

        public void Put(string key, string value)
        {
            lock (_lock)
            {
                if (_data.ContainsKey(key))
                {
                    _data[key] = value;
                    return;
                }
                if (_data.Count >= MaxEntries)
                {
                    var first = _order.First;
                    if (first != null)
                    {
                        _data.Remove(first.Value);
                        _order.RemoveFirst();
                    }
                }
                _data[key] = value;
                _order.AddLast(key);
            }
        }

        public int Clear()
        {
            lock (_lock)
            {
                var n = _data.Count;
                _data.Clear();
                _order.Clear();
                return n;
            }
        }
    }
}
