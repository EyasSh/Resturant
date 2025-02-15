using System;
using BCrypt.Net;
using Server.Services;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Security.Cryptography;
namespace Server.Security;
/// <summary>
/// Manages the security of the server's users.W
/// </summary>
public class SecurityManager
{
    private IConfiguration _conf;
    private EmailService _emailService;
    public SecurityManager(IConfiguration conf, EmailService emailService)
    {
        _conf = conf;
        _emailService = emailService;
    }

    /// <summary>
    /// Generates a JWT token for a user that is valid for a set period of time.
    /// </summary>
    /// <param name="Id">The user's unique identifier.</param>
    /// <param name="email">The user's email address.</param>
    /// <returns>The JWT token.</returns>
    /// <remarks>
    /// The token is valid for 30 days from the time of generation.
    /// </remarks>
    public string GenerateJwtToken(string Id, string email)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_conf["Jwt:Key"] ?? string.Empty));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
                new Claim(ClaimTypes.Email, email),
                new Claim(JwtRegisteredClaimNames.Jti,Id )
            };

        var token = new JwtSecurityToken(
            issuer: _conf["Jwt:Issuer"],
            audience: _conf["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(30),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
    /// <summary>
    /// Encrypts the given password with the BCrypt algorithm.
    /// </summary>
    /// <param name="password">The password to encrypt.</param>
    /// <returns>The encrypted password.</returns>
    /// <remarks>
    /// The strength of the encryption is determined by the <c>BCrypt.Net.BCrypt.MinimumHashingIterations</c> value.
    /// </remarks>
    public string Encrypt(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }
    /// <summary>
    /// Validates the password by comparing it with the hashed password stored in the database.
    /// </summary>
    /// <param name="plainText">The plaintext password</param>
    /// <param name="password">The hashed password</param>
    /// <returns>True if the password is valid, false otherwise</returns>
    public bool Validate(string plainText, string password) => BCrypt.Net.BCrypt.Verify(plainText, password);
    public async Task<string> Send2FAEmailAsync(string to)
    {
        string number = GenerateSecureCode(6);
        await _emailService.SendEmailAsync(to, "2FA Code",
        @$"<html><body>
        Your 2FA code is <strong>{number}</strong>
        </body></html>");
        return number;
    }
    /// <summary>
    /// Generates a secure code of the given length.
    /// </summary>
    /// <param name="length">The length of the code to generate.</param>
    /// <returns>The generated code.</returns>
    /// <remarks>
    /// The code is generated using the <see cref="RandomNumberGenerator"/> class, which
    /// provides a cryptographically secure random number generator.
    /// Each byte is converted to a digit (0-9) by taking the modulo 10 of the byte value.
    /// </remarks>
    string GenerateSecureCode(int length)
    {
        using var rng = RandomNumberGenerator.Create();
        var bytes = new byte[length];
        rng.GetBytes(bytes);

        var code = string.Empty;
        foreach (var b in bytes)
        {
            // Convert each byte to a digit (0-9)
            code += (b % 10).ToString();
        }

        return code;
    }
}