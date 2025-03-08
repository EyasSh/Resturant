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
    [BsonElement("password")]
    public required string Password { get; set; }
    [BsonElement("phone")]
    public required string Phone { get; set; }
    // Parameterless constructor
    public Waiter() { }

    public Waiter(string name, string email, string password, string phone)
    {
        Name = name;
        Email = email;
        Password = password;
        Phone = phone;
    }
}
public class Owner : Waiter
{
    [BsonElement("restaurantNumber")]
    public required string RestaurantNumber { get; set; }
    public Owner() { }
    public Owner(string name, string email, string password, string phone, string restaurantNumber) :
     base(name, email, password, phone)
    {
        RestaurantNumber = restaurantNumber;
    }
}
