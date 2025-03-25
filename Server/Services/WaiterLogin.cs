namespace Server.Services;
/// <summary>
/// Request object for waiter login.
/// </summary>
public class WaiterLogin
{
    public string? Email { get; set; }
    public string? Password { get; set; }
}