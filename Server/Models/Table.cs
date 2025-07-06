using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
namespace Server.Models;

public class Table
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    [BsonElement("tableNumber")]
    public int TableNumber { get; set; } = 0;
    [BsonElement("waiterId")]
    public string? WaiterId { get; set; } = string.Empty;
    [BsonElement("userId")]
    public string? UserId { get; set; } = string.Empty;
    [BsonIgnore]
    [BsonElement("userName")]
    public string? UserName { get; set; } = string.Empty;
    [BsonElement("isWindowSide")]
    public bool isWindowSide { get; set; } = false;
    [BsonElement("isOccupied")]
    public bool isOccupied { get; set; } = false;
    [BsonElement("capacity")]
    public int Capacity { get; set; } = 2;
    public Table()
    {
        isOccupied = CheckOccupation();
    }
    public Table(bool isWindowSide) => this.isWindowSide = isWindowSide;
    public Table(int tableNumber, string? waiterId, string? userId, bool isWindowSide, bool isOccupied)
    {
        TableNumber = tableNumber;
        WaiterId = waiterId;
        UserId = userId;
        this.isOccupied = !string.IsNullOrEmpty(userId) || isOccupied;
        this.isOccupied = CheckOccupation();
    }
    public bool CheckOccupation() => isOccupied = !string.IsNullOrEmpty(UserId);
}