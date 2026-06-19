using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;

namespace PerfectWall.Server.Services
{
    /// <summary>
    /// 100-entry LRU cache of base64 PNG icons, keyed by
    /// the absolute path of the source file. Mirrors the
    /// Rust <c>ICON_CACHE</c> <c>HashMap</c> with the same
    /// 100-entry cap, but uses LRU eviction (re-order on
    /// every Put that touches an existing key) so
    /// frequently-requested icons don't get evicted just
    /// because they were requested first.
    /// </summary>
    public sealed class IconCache
    {
        public const int MaxEntries = 100;
        private readonly object _lock = new object();
        private readonly LinkedList<string> _order = new LinkedList<string>();
        private readonly Dictionary<string, LinkedListNode<string>> _nodes
            = new Dictionary<string, LinkedListNode<string>>(StringComparer.OrdinalIgnoreCase);
        private readonly Dictionary<string, string> _data
            = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

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
                if (_data.TryGetValue(key, out _))
                {
                    // Re-insert moves the node to the
                    // tail, making the entry most
                    // recently used. The dictionary
                    // value is updated in place; the
                    // linked-list node pointer is
                    // unchanged (still the same node,
                    // just repositioned in the list).
                    var node = _nodes[key];
                    _data[key] = value;
                    _order.Remove(node);
                    _order.AddLast(node);
                    return;
                }
                if (_data.Count >= MaxEntries)
                {
                    var first = _order.First;
                    if (first != null)
                    {
                        _data.Remove(first.Value);
                        _nodes.Remove(first.Value);
                        _order.RemoveFirst();
                    }
                }
                var newNode = _order.AddLast(key);
                _data[key] = value;
                _nodes[key] = newNode;
            }
        }

        public int Clear()
        {
            lock (_lock)
            {
                var n = _data.Count;
                _data.Clear();
                _nodes.Clear();
                _order.Clear();
                return n;
            }
        }
    }
}
