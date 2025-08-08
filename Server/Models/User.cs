using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
namespace Server.Models
{
    /// <summary>
    /// Represents a user in the system.
    /// </summary>
    public class User
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)] // Ensures correct ObjectId serialization
        public string? Id { get; set; }
        [BsonElement("name")]
        public required string Name { get; set; } = "";
        [BsonElement("email")]
        public required string Email { get; set; } = "";
        [BsonElement("password")]
        public required string Password { get; set; } = "";
        [BsonElement("date")]
        public required DateOnly date { get; set; } = DateOnly.FromDateTime(DateTime.Now);
        [BsonElement("phone")]
        public required string phone { get; set; } = "";
        public User()
        { }
        public User(string name, string email, string password, DateOnly date)
        {
            Name = name;
            Email = email;
            Password = password;
        }
    }

}
