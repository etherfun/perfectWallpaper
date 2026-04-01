// Error types - kept for potential future use
pub enum ApiError {
    BadRequest(String),
    NotFound(String),
    Internal(String),
}
