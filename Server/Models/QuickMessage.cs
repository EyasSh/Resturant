using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
namespace Server.Models;
/// <summary>
/// Represents a quick message in the system.
/// </summary>
public class QuickMessage
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    [BsonRequired]
    [BsonElement("message")]
    public string Message { get; set; } = "";
    public QuickMessage() { }
    /// <summary>
    /// Initializes a new instance of the <see cref="QuickMessage"/> class with a specified message.
    /// </summary>
    /// <param name="message">The message content of the quick message.</param>
    public QuickMessage(string message)
    {
        Message = message;
    }

}
/// <summary>
/// Represents a request to select quick messages for a specific table.
/// </summary>
public class SelectedNeedMessages
{
    public int TableNumber { get; set; } = 0;
    public string[]? messages { get; set; } = null;
}