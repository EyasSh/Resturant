using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
namespace Server.Models;
public class Waiter
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    [BsonElement("name")]
    public required string Name { get; set; }
    [BsonElement("email")]
    public required string Email { get; set; }
    [BsonElement("phone")]
    public required string Phone { get; set; }
    public Waiter(string name, string email, string phone)
    {
        Name = name;
        Email = email;
        Phone = phone;
    }
}
public class Owner : Waiter
{
    [BsonElement("restaurantNumber")]
    public required string RestaurantNumber { get; set; }
    public Owner(string name, string email, string phone, string restaurantNumber) :
     base(name, email, phone)
    {
        RestaurantNumber = restaurantNumber;
    }
}
