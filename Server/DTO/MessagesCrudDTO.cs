    // Request DTOs
    public class SingleDeleteRequest
    {
        public string? QuickMessageId { get; set; }
    }

    public class BulkDeleteRequest
    {
        public string[]? QuickMessageIds { get; set; }
    }