using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
namespace Server.Models;
public class Meal
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? MealId { get; set; }
    [BsonElement("name")]
    public string MealName { get; set; } = "";
    [BsonElement("price")]
    public double Price { get; set; } = 0;
    public Meal() { }
    public Meal(string mealName, double price)
    {
        MealName = mealName;
        Price = price;
    }
}

