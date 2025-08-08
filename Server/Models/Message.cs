namespace Server.Models;
/// <summary>
/// Represents a message in the system.
/// This class is used to encapsulate the sender, recipient, and content of a message.
/// </summary>
public class Message
{
    public required string SenderId { get; set; }
    public required string RecipientId { get; set; }
    public required string message { get; set; }
}