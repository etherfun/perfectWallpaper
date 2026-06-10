using System;
using System.IO;

namespace PerfectWall.Server.Utils
{
    /// <summary>
    /// Rejects paths the browser should never reach: relative
    /// paths, traversal, and home-directory expansion. Mirrors
    /// <c>routes/files.rs::is_valid_path</c>.
    /// </summary>
    public static class PathValidator
    {
        public static string Validate(string path)
        {
            if (string.IsNullOrEmpty(path))
                return "Path is required";
            if (!Path.IsPathRooted(path))
                return "Only absolute paths are allowed";
            if (path.Contains("..") || path.Contains("~"))
                return "Invalid path characters";
            return null;
        }
    }
}
