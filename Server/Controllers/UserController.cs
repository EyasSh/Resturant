using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using MongoDB.Driver.Encryption;
using Server.DB;
using Server.Models;
using Server.Services;
using BCrypt;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.SignalR;
using Server.Security;
namespace Server.Controllers
{
    [ApiController]
    [Route("api/user")] // Base route for all actions in this controller
    public class UserController : ControllerBase
    {
        private readonly IHubContext<SocketService> _hubContext;
        IMongoCollection<User> _users;
        private readonly EmailService _emailService;

        private readonly SecurityManager _securityManager;
        /*
         <summary>
         This is the user controller constructor to perform user actions
         using services such as an email service ETC
         </summary>
        */
        public UserController(MongoDBWrapper dBWrapper, IConfiguration conf
        , IHubContext<SocketService> hubContext, EmailService emailService,
        SecurityManager securityManager
        )
        {
            _users = dBWrapper.Users;
            _hubContext = hubContext;
            _emailService = emailService;
            _securityManager = securityManager;
        }

        /// <summary>
        /// Authenticates a user and provides access to the system. This action is accessible to anonymous users.
        /// </summary>
        /// <returns>A successful status code (200) if the login request was successful.</returns>
        [AllowAnonymous]
        [HttpPost("login")] // Route: api/user/login
        public IActionResult Login([FromBody] Services.LoginRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
                {
                    return BadRequest("Invalid login credentials.");
                }
                var user = _users.Find(user => user.Email == request.Email).FirstOrDefault();


                if (user == null)
                {
                    return BadRequest("User not found.");
                }
                if (user != null && _securityManager.Validate(request.Password, user.Password))
                {
                    var token = _securityManager.GenerateJwtToken(user.Id ?? new Guid().ToString(), request.Email);
                    var resbod = new User
                    { Id = user.Id, Name = user.Name, Email = user.Email, Password = user.Password, date = user.date, phone = user.phone };
                    Response.Headers["X-Auth-Token"] = token;
                    return Ok(new { User = resbod });
                }
                else
                {

                    return BadRequest("Invalid login credentials or user not found." + $"{user?.Email ?? "No email or user found"}\nplain pass encrypted:{_securityManager.Encrypt(request.Password)}\nalready encrypted:{user?.Password ?? "No password found"}");
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }

        }



        /// <summary>
        /// Sign-up a new user using the provided user credentials. This action
        /// is accessible to anonymous users.
        /// </summary>
        /// <returns>A successful status code (200) if the sign-up request was
        /// successful.</returns>

        [AllowAnonymous]
        [HttpPost("signup")] // Route: api/user/signup
        public async Task<IActionResult> SignUp([FromBody] SignupRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Name) || string.IsNullOrEmpty(request.Password) || string.IsNullOrEmpty(request.date.ToString()))
                {
                    return BadRequest("All fields are required.");
                }

                if (_users.FindSync(user => user.Email == request.Email).Any())
                {
                    return BadRequest("User already exists.");
                }

                var user = new User
                {
                    Name = request.Name,
                    Email = request.Email,
                    Password = _securityManager.Encrypt(request.Password),
                    date = request.date,
                    phone = request.phone
                };
                _users.InsertOne(user);
                await _emailService.SendEmailAsync(user.Email, "Welcome to The Service"
                ,
                $@"<html><body>Hello {user.Name}, <p>Welcome to Bite Byte. 
                We're glad you're here. We're here to make it easier for you to dine out.</p>
                <br /> 
                <p>We hope you have a nice day!</p>
                The ReCoursia Team</body></html>");

                return Ok("Sign-up successful.");
            }
            catch (Exception ex)
            {
                System.Console.WriteLine(ex.ToString());
                return StatusCode(500, $"An error occurred: {ex.Message} at signup");
            }
        }



        /// <summary>
        /// Terminates the user account. This action is restricted to authorized users.
        /// </summary>
        /// <returns>A successful status code (200) if the account termination was successful.</returns>
        [Authorize]
        [HttpDelete("terminate/account/{email}")] // Route: api/user/terminate/account
        public IActionResult TerminateAccount(string email)
        {
            var user = _users.FindSync(user => user.Email == email).FirstOrDefault();
            if (user == null || (user is not null && string.IsNullOrEmpty(user.Email)))
            {
                return BadRequest("User not found.");
            }
            _users.DeleteOne(user => user.Email == email);
            return Ok("Account terminated.");
        }
        /// <summary>
        /// A test endpoint to verify that the API is properly deployed.
        /// </summary>
        /// <returns>A successful status code (200) if the test request was successful.</returns>
        [HttpGet("test")]
        [AllowAnonymous]
        public IActionResult Test() => Ok("Test Successful");


    }
}
[ApiController]
[Route("api/waiter")]
class WaiterController : ControllerBase
{
    IMongoCollection<Waiter> _waiters;
    private readonly SecurityManager _securityManager;
    public WaiterController(MongoDBWrapper dBWrapper, SecurityManager securityManager)
    {
        _waiters = dBWrapper.Waiters;
        _securityManager = securityManager;
    }

    [HttpPost("/")]
    public async Task<IActionResult> Login([FromBody] WaiterLogin request)
    {
        if (string.IsNullOrEmpty(request.Email) && string.IsNullOrEmpty(request.Password))
        {
            return BadRequest("Credentials are missing.");
        }
        var cursor = await _waiters.FindAsync<Waiter>(waiter => waiter.Email == request.Email);
        var waiter = cursor.FirstOrDefault();
        if (waiter is null)
        {
            return BadRequest("Waiter not found.");
        }
        Request.Headers["X-Auth-Token"] = _securityManager.GenerateJwtToken(waiter.Id ?? new Guid().ToString(), request.Email);
        return Ok(new { Waiter = waiter });
    }
    [HttpGet("test")]
    public IActionResult Test() => Ok("Test Successful");
}
[ApiController]
[Route("api/owner")]
class OwnerController : ControllerBase
{
    IMongoCollection<Owner> _owners;
    IMongoCollection<Waiter> _waiters;
    private readonly SecurityManager _securityManager;
    public OwnerController(MongoDBWrapper dBWrapper, SecurityManager securityManager)
    {
        _owners = dBWrapper.Owners;
        _waiters = dBWrapper.Waiters;
        _securityManager = securityManager;
    }
    [HttpPost]
    public async Task<IActionResult> Login([FromBody] Server.Services.LoginRequest request)
    {
        if (string.IsNullOrEmpty(request.Email) && string.IsNullOrEmpty(request.Password))
        {
            return BadRequest("Credentials are missing.");
        }
        var cursor = await _owners.FindAsync<Owner>(owner => owner.Email == request.Email);
        var owner = cursor.FirstOrDefault();
        if (owner is null)
        {
            return BadRequest("Owner not found.");
        }
        Request.Headers["X-Auth-Token"] = _securityManager.GenerateJwtToken(owner.Id ?? new Guid().ToString(), request.Email);
        return Ok(new { Owner = owner });
    }
    [HttpPost("signup")]
    public async Task<IActionResult> SignUp([FromBody] OwnerSignupRequest request)
    {
        System.Console.WriteLine(request.Name);
        if (string.IsNullOrEmpty(request.Name) ||
            string.IsNullOrEmpty(request.Email) ||
            string.IsNullOrEmpty(request.Password) ||
            string.IsNullOrEmpty(request.Phone) ||
            string.IsNullOrEmpty(request.RestaurantNumber))
        {
            System.Console.WriteLine("in if");
            return BadRequest("All fields are required.");
        }
        var cursor = await _owners.FindAsync<Owner>(owner => owner.Email == request.Email);
        var owner = cursor.FirstOrDefault();
        if (owner is not null)
        {
            return BadRequest("Owner already exists.");
        }
        var newOwner = new Owner
        {
            Name = request.Name,
            Email = request.Email,
            Password = _securityManager.Encrypt(request.Password),
            Phone = request.Phone,
            RestaurantNumber = request.RestaurantNumber
        };
        await _owners.InsertOneAsync(newOwner);
        return Ok("Sign-up successful.");
    }
    /// <summary>
    /// Adds a waiter to the restaurant staff.
    /// </summary>
    /// <param name="request">The waiter's details.</param>
    /// <returns>A successful status code (200) if the waiter was added successfully.</returns>
    /// <remarks>
    /// This action is restricted to authorized users (i.e. the restaurant owners).
    /// </remarks>
    [Authorize]
    [HttpPost("add/waiter")]
    public async Task<IActionResult> AddWaiter([FromBody] WaiterSignupRequest request)
    {
        if (string.IsNullOrEmpty(request.Name) ||
        string.IsNullOrEmpty(request.Email) ||
        string.IsNullOrEmpty(request.Password)
        || string.IsNullOrEmpty(request.Phone))
        {
            return BadRequest("All fields are required.");
        }
        var cursor = await _waiters.FindAsync<Waiter>(waiter => waiter.Email == request.Email);
        var waiter = cursor.FirstOrDefault();
        if (waiter is not null)
        {
            return BadRequest("Waiter already exists.");
        }
        var newStaff = new Waiter
        {
            Name = request.Name,
            Email = request.Email,
            Password = _securityManager.Encrypt(request.Password),
            Phone = request.Phone,
        };
        _waiters.InsertOne(newStaff);
        return Ok("Waiter added successfully.");
    }
}
