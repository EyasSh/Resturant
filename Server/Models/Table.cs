using System;
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
    public string? WaiterId { get; set; }
    [BsonElement("userId")]
    public string? UserId { get; set; }
    public bool isWindowSide { get; set; } = false;
    public bool isOccupied { get; set; } = false;
    public Table()
    {
    }
    public Table(bool isWindowSide) => this.isWindowSide = isWindowSide;
    public Table(int tableNumber, string? waiterId, string? userId, bool isWindowSide, bool isOccupied)
    {
        TableNumber = tableNumber;
        WaiterId = waiterId;
        UserId = userId;
        this.isWindowSide = isWindowSide;
        this.isOccupied = isOccupied;
    }
}