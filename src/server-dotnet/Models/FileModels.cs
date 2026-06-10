using System.Collections.Generic;
using Newtonsoft.Json;

namespace PerfectWall.Server.Models
{
    public sealed class FileEntry
    {
        [JsonProperty("name")] public string Name { get; set; }
        [JsonProperty("path")] public string Path { get; set; }
    }

    public sealed class FileListResult
    {
        [JsonProperty("directory")] public string Directory { get; set; }
        [JsonProperty("files")] public List<FileEntry> Files { get; set; } = new List<FileEntry>();
        [JsonProperty("count")] public int Count { get; set; }
    }

    public sealed class AudioMetadata
    {
        [JsonProperty("title")] public string Title { get; set; } = string.Empty;
        [JsonProperty("artist")] public string Artist { get; set; } = "Unknown Artist";
        [JsonProperty("album")] public string Album { get; set; } = "Unknown Album";
        [JsonProperty("year")] public int? Year { get; set; }
        [JsonProperty("duration")] public double? Duration { get; set; }
        [JsonProperty("genre")] public List<string> Genre { get; set; }
        [JsonProperty("track")] public int? Track { get; set; }
        [JsonProperty("picture")] public object Picture { get; set; }
    }

    public sealed class OpenItemRequest
    {
        [JsonProperty("type")] public string Type { get; set; }
        [JsonProperty("path")] public string Path { get; set; }
        [JsonProperty("url")] public string Url { get; set; }
    }

    public sealed class SelectFileResult
    {
        [JsonProperty("path")] public string Path { get; set; }
        [JsonProperty("name")] public string Name { get; set; }
    }

    public sealed class CustomIconRequest
    {
        [JsonProperty("data")] public string Data { get; set; }
        [JsonProperty("type")] public string Type { get; set; }
    }

    public sealed class IconData
    {
        [JsonProperty("icon")] public string Icon { get; set; }
        [JsonProperty("cached")] public bool Cached { get; set; }
    }

    public sealed class AllIconsResult
    {
        [JsonProperty("icons")] public List<object> Icons { get; set; } = new List<object>();
        [JsonProperty("count")] public int Count { get; set; }
    }

    public sealed class UpdateConfigRequest
    {
        [JsonProperty("port")] public int? Port { get; set; }
        [JsonProperty("auto_start")] public bool? AutoStart { get; set; }
        [JsonProperty("log_level")] public string LogLevel { get; set; }
    }

    public sealed class ConfigView
    {
        [JsonProperty("port")] public int Port { get; set; }
        [JsonProperty("auto_start")] public bool AutoStart { get; set; }
        [JsonProperty("log_level")] public string LogLevel { get; set; }
    }
}
