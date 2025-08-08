namespace Server.Services;
/// <summary>
/// Represents a request for user login.
/// </summary>
public class LoginRequest
{
    public required string Email { get; set; }
    public required string Password { get; set; }

}
