using System;
using System.IO;

namespace PerfectWall.Server.Utils
{
    /// <summary>
    /// Rejects paths the browser should never reach: relative
    /// paths, traversal, null bytes, and home-directory
    /// expansion. Mirrors <c>routes/files.rs::is_valid_path</c>.
    /// </summary>
    public static class PathValidator
    {
        public static string Validate(string path)
        {
            if (string.IsNullOrEmpty(path))
                return "Path is required";
            // NUL terminates Win32 paths silently — a
            // canonical defence is to reject the byte
            // outright. `Path.GetFullPath` accepts NUL
            // on its way to throwing, so check first.
            if (path.IndexOf('\0') >= 0)
                return "Invalid path characters";
            if (!Path.IsPathRooted(path))
                return "Only absolute paths are allowed";
            if (path.Contains("..") || path.Contains("~"))
                return "Invalid path characters";
            // Canonicalise: collapse `.\` / `..\`
            // separators, resolve `C:\foo\.\bar` →
            // `C:\foo\bar`, etc. The result is only used
            // to ensure the path can be resolved by the
            // OS; a failure here is itself the error
            // signal.
            try { Path.GetFullPath(path); }
            catch { return "Invalid path"; }
            return null;
        }
    }
}
