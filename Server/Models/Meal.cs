using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
namespace Server.Models;
/// <summary>
/// Represents a meal in the restaurant
/// </summary>
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
    /// <summary>
    /// Initializes a new instance of the <see cref="Meal"/> class.
    /// </summary>
    /// <param name="mealName">Name of the meal.</param>
    /// <param name="price">The price.</param>
    public Meal(string mealName, double price)
    {
        MealName = mealName;
        Price = price;
    }
}
/// <summary>
/// Represents an order in the restaurant
/// </summary>
public class Order
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? OrderId { get; set; }
    public Meal? Meal { get; set; }
    public int Quantity { get; set; }
    public Order() { }
    /// <summary>
    /// Initializes a new instance of the <see cref="Order"/> class.
    /// </summary>
    /// <param name="meal">The meal.</param>
    /// <param name="quantity">The quantity.</param>
    public Order(Meal? meal, int quantity)
    {
        Meal = meal;
        Quantity = quantity;
    }
}

