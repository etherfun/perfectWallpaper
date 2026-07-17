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
        public static string Validate(string path, out string normalizedPath)
        {
            normalizedPath = null;
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
            // `C:\foo\bar`, etc. The result is used as
            // the caller's working path and also ensures
            // the path can be resolved by the OS.
            try
            {
                normalizedPath = Path.GetFullPath(path);
                return null;
            }
            catch { return "Invalid path"; }
        }
    }
}
