using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Driver;
namespace Server.Models;
public class QuickMessage
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    [BsonRequired]
    [BsonElement("message")]
    public string Message { get; set; } = "";
    public QuickMessage() { }
    public QuickMessage(string message)
    {
        Message = message;
    }

}