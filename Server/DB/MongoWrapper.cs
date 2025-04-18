using MongoDB.Driver;
using Server.Models;
namespace Server.DB;

/// <summary>
/// Wrapper class for MongoDB client and database.
/// This class is responsible for initializing the MongoDB client and database, and providing access to collections.
/// </summary>
public class MongoDBWrapper
{
    private readonly IMongoClient _client;
    private readonly IMongoDatabase _database;
    public IMongoCollection<User> Users { get; init; }
    public IMongoCollection<Waiter> Waiters { get; init; }
    public IMongoCollection<Owner> Owners { get; init; }
    public IMongoCollection<Meal> Meals { get; init; }
    public IMongoCollection<Table> Tables { get; init; }
    public IMongoCollection<QuickMessage> QuickMessages { get; init; }

    public MongoDBWrapper(IConfiguration configuration)
    {
        // Fetch values directly using GetValue<T>
        var connectionString = configuration.GetValue<string>("DB:ConnectionString");
        var databaseName = configuration.GetValue<string>("DB:DatabaseName");

        if (string.IsNullOrWhiteSpace(connectionString) || string.IsNullOrWhiteSpace(databaseName))
        {
            throw new ArgumentException("MongoDB configuration is missing or invalid.");
        }

        // Initialize MongoDB client and database
        _client = new MongoClient(connectionString);
        _database = _client.GetDatabase(databaseName);

        // Initialize collections
        Users = _database.GetCollection<User>("Users");
        Waiters = _database.GetCollection<Waiter>("Waiters");
        Owners = _database.GetCollection<Owner>("Owners");
        Meals = _database.GetCollection<Meal>("Meals");
        Tables = _database.GetCollection<Table>("Tables");
        QuickMessages = _database.GetCollection<QuickMessage>("QuickMessages");

    }


    public IMongoDatabase GetDatabase() => _database;
}

// Example POCO classes for MongoDB documents


