namespace Server.Services;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class OwnerSignupRequest
{
    public string Name { get; set; }
    public string Email { get; set; }
    public string Password { get; set; }
    public string Phone { get; set; }
    public string RestaurantNumber { get; set; }
    public OwnerSignupRequest(string name, string email, string password, string phone, string restaurantNumber)
    {
        Name = name;
        Email = email;
        Password = password;
        Phone = phone;
        RestaurantNumber = restaurantNumber;
    }
}