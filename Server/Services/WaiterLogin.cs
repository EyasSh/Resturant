using System;
namespace Server.Services;
public class WaiterLogin
{
    public required string Email { get; set; }
    public required string Password { get; set; }
}