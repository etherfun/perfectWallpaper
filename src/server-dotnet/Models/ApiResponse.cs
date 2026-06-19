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

        // Preserved for back-compat with the 27 existing
        // call sites that already use
        // `ApiResponse<object>.Fail(...)`. New code should
        // prefer `ApiResponse.Fail<T>(...)` (the non-generic
        // helper below) so the returned envelope keeps the
        // success-path type instead of collapsing to
        // `ApiResponse<object>`.
        public static ApiResponse<object> Fail(string message) =>
            new ApiResponse<object>
            {
                Success = false,
                Data = default,
                Error = message,
                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            };
    }

    /// <summary>
    /// Type-safe factory helpers that don't pin the
    /// response to <c>object</c>. Use these from new
    /// endpoints so the error envelope matches the
    /// success envelope's <c>T</c>.
    /// </summary>
    public static class ApiResponse
    {
        public static ApiResponse<T> Fail<T>(string message) =>
            new ApiResponse<T>
            {
                Success = false,
                Data = default,
                Error = message,
                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            };
    }
}
