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
    [BsonElement("category")]
    public string Category { get; set; } = "";
    public Meal() { }
    /// <summary>
    /// Initializes a new instance of the <see cref="Meal"/> class.
    /// </summary>
    /// <param name="mealName">Name of the meal.</param>
    /// <param name="price">The price.</param>
    public Meal(string mealName, double price, string category)
    {
        MealName = mealName;
        Price = price;
        Category = category;
    }
}
/// <summary>
/// Represents an order in the restaurant
/// </summary>
public class ProtoOrder
{

    public Meal? Meal { get; set; }
    public int Quantity { get; set; }
    public ProtoOrder() { }
    /// <summary>
    /// Initializes a new instance of the <see cref="Order"/> class.
    /// </summary>
    /// <param name="meal">The meal.</param>
    /// <param name="quantity">The quantity.</param>
    public ProtoOrder(Meal? meal, int quantity)
    {
        Meal = meal;
        Quantity = quantity;
    }
}
public class Order
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    [BsonElement("meals")]
    public ProtoOrder[]? Orders { get; set; }
    [BsonElement("tableNumber")]
    public int TableNumber { get; set; } = 0;
    [BsonElement("total")]
    public double Total { get; set; } = 0;
    public bool IsReady { get; set; } = false;
    public Order() { }
    public Order(ProtoOrder[] orders)
    {
        Orders = orders;
    }
}

