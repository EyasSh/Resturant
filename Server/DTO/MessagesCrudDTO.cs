/// <summary>
///  A request object for deleting a single quick message by its ID.
///  This class is used to encapsulate the ID of the quick message to be deleted
/// </summary>
public class SingleDeleteRequest
{
    public string? QuickMessageId { get; set; }
}
/// <summary>
/// A request object for bulk deleting quick messages by their IDs.
/// This class is used to encapsulate an array of IDs for the quick messages to be deleted
/// </summary>
public class BulkDeleteRequest
{
    public string[]? QuickMessageIds { get; set; }
}