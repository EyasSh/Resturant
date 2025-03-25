namespace Server.Services;
/// <summary>
/// Request object for user signup.
/// </summary>
public class SignupRequest
{
    public required string Name { get; set; }
    public required string Email { get; set; }
    public required string Password { get; set; }
    public required DateOnly date { get; set; }
    public required string phone { get; set; }
}