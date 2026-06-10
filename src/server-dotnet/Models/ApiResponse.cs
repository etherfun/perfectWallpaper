using System;
using Newtonsoft.Json;

namespace PerfectWall.Server.Models
{
    /// <summary>
    /// Standard envelope used by every endpoint. Matches the
    /// `ApiResponse&lt;T&gt;` shape in the previous Rust
    /// implementation so the frontend's fetch path does not need
    /// to change.
    /// </summary>
    public sealed class ApiResponse<T>
    {
        [JsonProperty("success")]
        public bool Success { get; set; }

        [JsonProperty("data")]
        public T Data { get; set; }

        [JsonProperty("error")]
        public string Error { get; set; }

        [JsonProperty("timestamp")]
        public long Timestamp { get; set; }

        public static ApiResponse<T> Ok(T data) =>
            new ApiResponse<T>
            {
                Success = true,
                Data = data,
                Error = null,
                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            };

        public static ApiResponse<object> Fail(string message) =>
            new ApiResponse<object>
            {
                Success = false,
                Data = null,
                Error = message,
                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            };
    }
}
