namespace Server.Models;

public class Message
{
    public required string SenderId { get; set; }
    public required string RecipientId { get; set; }
    public required string message { get; set; }
}