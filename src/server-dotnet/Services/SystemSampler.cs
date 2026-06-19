using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using PerfectWall.Server.Models;

namespace PerfectWall.Server.Services
{
    /// <summary>
    /// Caches the previous network counters so we can emit
    /// delta-based B/s rates on <c>GET /api/sysinfo</c>. The
    /// Rust implementation does this with a <c>RwLock</c>;
    /// here we just lock the object itself.
    /// </summary>
    public sealed class SystemSampler
    {
        private readonly object _lock = new object();
        // Last sample: (rx, tx, time) for delta B/s.
        // Per-interface last sample for delta B/s.
        private (ulong rx, ulong tx, long timestamp) _last;
        private readonly Dictionary<string, (ulong rx, ulong tx, long ts)> _perIface
            = new Dictionary<string, (ulong, ulong, long)>(StringComparer.OrdinalIgnoreCase);

        public NetworkInfo ReadNetwork(long now)
        {
            var result = new NetworkInfo();
            ulong totalRx = 0, totalTx = 0;
            // Snapshot the set of currently-up interfaces
            // so we can prune `_perIface` at the end of
            // the call. Without the prune, hot-pluggable
            // NICs (USB Ethernet, VPN, Hyper-V virtual
            // switches) that come and go would leak keys
            // forever and grow the dictionary unbounded
            // over the process lifetime.
            var liveNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            try
            {
                foreach (var ni in NetworkInterface.GetAllNetworkInterfaces())
                {
                    if (ni.OperationalStatus != OperationalStatus.Up) continue;

                    var info = BuildInterfaceInfo(ni, now);
                    if (info == null) continue;
                    result.Interfaces.Add(info);
                    liveNames.Add(info.Name);
                    if (info.RxBytes.HasValue) totalRx += (ulong)info.RxBytes.Value;
                    if (info.TxBytes.HasValue) totalTx += (ulong)info.TxBytes.Value;
                }
            }
            catch
            {
                // network enumeration can throw on a NIC that
                // disappeared mid-poll — swallow
            }

            // Prune keys that no longer correspond to a
            // live interface. O(n) over the cache which
            // is itself bounded by the number of NICs a
            // machine can plausibly have (~20 in the
            // worst case with every VPN / VM switched
            // on).
            lock (_lock)
            {
                var toRemove = new List<string>();
                foreach (var key in _perIface.Keys)
                {
                    if (!liveNames.Contains(key)) toRemove.Add(key);
                }
                foreach (var key in toRemove) _perIface.Remove(key);
            }

            result.InterfaceCount = result.Interfaces.Count;
            result.RxTotal = (long)totalRx;
            result.TxTotal = (long)totalTx;

            // Update the global rate sample.
            double rx, tx;
            lock (_lock)
            {
                var (lrx, ltx, lt) = _last;
                if (lt > 0)
                {
                    var elapsed = (now - lt) / 1000.0;
                    if (elapsed > 0)
                    {
                        rx = Math.Max(0.0, ((double)totalRx - (double)lrx) / elapsed);
                        tx = Math.Max(0.0, ((double)totalTx - (double)ltx) / elapsed);
                    }
                    else { rx = 0; tx = 0; }
                }
                else { rx = 0; tx = 0; }
                _last = (totalRx, totalTx, now);
            }
            result.Rx = rx;
            result.Tx = tx;
            return result;
        }

        private NetworkInterfaceInfo BuildInterfaceInfo(NetworkInterface ni, long now)
        {
            try
            {
                var info = new NetworkInterfaceInfo
                {
                    Name = ni.Name ?? string.Empty,
                    Description = ni.Description ?? string.Empty,
                    Type = ClassifyType(ni),
                    IsUp = ni.OperationalStatus == OperationalStatus.Up,
                };

                // MAC is always available.
                var macBytes = ni.GetPhysicalAddress()?.GetAddressBytes();
                if (macBytes != null && macBytes.Length > 0)
                {
                    info.Mac = string.Join("-", macBytes.Select(b => b.ToString("X2")));
                }

                // Speed + IP addresses: wrap each in try-catch
                // because virtual / loopback adapters can throw
                // on Windows when GetIPProperties is called.
                try
                {
                    if (ni.Speed > 0) info.SpeedMbps = (long)((ulong)ni.Speed / 1_000_000UL);
                }
                catch { }
                try
                {
                    var ip = ni.GetIPProperties();
                    var v4 = new List<string>();
                    var v6 = new List<string>();
                    foreach (var ua in ip.UnicastAddresses)
                    {
                        if (ua.Address.AddressFamily == AddressFamily.InterNetwork) v4.Add(ua.Address.ToString());
                        else if (ua.Address.AddressFamily == AddressFamily.InterNetworkV6) v6.Add(ua.Address.ToString());
                    }
                    info.Ipv4 = v4.ToArray();
                    info.Ipv6 = v6.ToArray();
                }
                catch { /* virtual adapters without IP */ }

                // Counters: bytes and rates. BytesReceived/BytesSent
                // are cumulative monotonic per the docs.
                long rx = 0, tx = 0;
                try
                {
                    var s = ni.GetIPStatistics();
                    rx = s.BytesReceived;
                    tx = s.BytesSent;
                }
                catch { }
                if (rx > 0) info.RxBytes = rx;
                if (tx > 0) info.TxBytes = tx;

                lock (_lock)
                {
                    if (_perIface.TryGetValue(info.Name, out var prev))
                    {
                        var elapsed = (now - prev.ts) / 1000.0;
                        if (elapsed > 0 && rx > 0 && tx > 0)
                        {
                            info.RxBps = (float)Math.Max(0.0, ((double)rx - (double)prev.rx) / elapsed);
                            info.TxBps = (float)Math.Max(0.0, ((double)tx - (double)prev.tx) / elapsed);
                        }
                    }
                    _perIface[info.Name] = ((ulong)Math.Max(0, rx), (ulong)Math.Max(0, tx), now);
                }
                return info;
            }
            catch
            {
                return null;
            }
        }

        private static string ClassifyType(NetworkInterface ni)
        {
            try
            {
                var t = ni.NetworkInterfaceType;
                if (t == NetworkInterfaceType.Wireless80211) return "wifi";
                if (t == NetworkInterfaceType.Ethernet) return "ethernet";
                if (t == NetworkInterfaceType.Loopback) return "loopback";
                if (t == NetworkInterfaceType.Tunnel) return "tunnel";
                if (t == NetworkInterfaceType.Ppp) return "ppp";
                if (ni.Description?.IndexOf("VPN", StringComparison.OrdinalIgnoreCase) >= 0) return "vpn";
                if (ni.Description?.IndexOf("Bluetooth", StringComparison.OrdinalIgnoreCase) >= 0) return "bluetooth";
                if (ni.Description?.IndexOf("Direct", StringComparison.OrdinalIgnoreCase) >= 0) return "wifi-direct";
                return t.ToString().ToLowerInvariant();
            }
            catch { return "unknown"; }
        }
    }
}
