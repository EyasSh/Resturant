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
namespace Server.Controllers;
[ApiController]
[Route("api/user")] // Base route for all actions in this controller
public class UserController : ControllerBase
{
    private readonly IHubContext<SocketService> _hubContext;
    IMongoCollection<User> _users;
    IMongoCollection<Meal> _meals;
    IMongoCollection<Table> _tables;
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
        _meals = dBWrapper.Meals;
        _tables = dBWrapper.Tables;
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
    /// <summary>
    /// Retrieves the list of meals in the database. This action is restricted to authorized users.
    /// </summary>
    /// <returns>A successful status code (200) if the request was successful, along with the list of meals as a JSON payload.</returns>
    [Authorize]
    [HttpGet("meals")]
    public async Task<IActionResult> GetMeals()
    {
        var dbfetch = await _meals.Find(_ => true).ToListAsync();
        var meals = dbfetch.ToArray();
        return Ok(new { meals });
    }
    [Authorize]
    [HttpGet("tables")]
    public async Task<IActionResult> GetTables()
    {
        var dbfetch = await _tables.Find(_ => true).ToListAsync();
        var tables = dbfetch.ToArray();
        return Ok(new { tables });
    }

}

[ApiController]
[Route("api/waiter")]
public class WaiterController : ControllerBase
{
    IMongoCollection<Waiter> _waiters;
    private readonly SecurityManager _securityManager;
    public WaiterController(MongoDBWrapper dBWrapper, SecurityManager securityManager)
    {
        _waiters = dBWrapper.Waiters;
        _securityManager = securityManager;
    }

    /// <summary>
    /// Authenticates a waiter and provides access to the system. This action is accessible to anonymous users.
    /// </summary>
    /// <param name="request">The waiter's login credentials.</param>
    /// <returns>A successful status code (200) if the login request was successful.</returns>
    /// <remarks>
    /// The request body should contain a JSON object with the following structure:
    /// <code>
    /// {
    ///     "Email": string,
    ///     "Password": string
    /// }
    /// </code>
    /// </remarks>
    [HttpPost]
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
        if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
        {
            return BadRequest("Invalid login credentials.");
        }
        Response.Headers["X-Auth-Token"] = _securityManager.GenerateJwtToken(waiter.Id ?? new Guid().ToString(), request.Email);
        return Ok(new { Waiter = waiter });
    }
    [HttpGet("test")]
    public IActionResult Test() => Ok("Test Successful");
}
[ApiController]
[Route("api/owner")]
public class OwnerController : ControllerBase
{
    IMongoCollection<Owner> _owners;
    IMongoCollection<Waiter> _waiters;
    IMongoCollection<Meal> _meals;
    IMongoCollection<Table> _tables;
    private readonly SecurityManager _securityManager;
    public OwnerController(MongoDBWrapper dBWrapper, SecurityManager securityManager)
    {
        _owners = dBWrapper.Owners;
        _waiters = dBWrapper.Waiters;
        _meals = dBWrapper.Meals;
        _tables = dBWrapper.Tables;
        _securityManager = securityManager;
    }
    [AllowAnonymous]
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
        if (!_securityManager.Validate(request.Password, owner.Password))
        {
            return BadRequest("Invalid login credentials.");
        }
        var token = _securityManager.GenerateJwtToken(owner.Id ?? new Guid().ToString(), request.Email);
        Response.Headers["X-Auth-Token"] = token; // ✅ Correctly set in response headers

        return Ok(new { Owner = owner });
    }
    /// <summary>
    /// Registers a new owner in the system.
    /// </summary>
    /// <param name="request">The owner's signup details including name, email, password, phone, and restaurant number.</param>
    /// <returns>A successful status code (200) if the signup is successful, otherwise a bad request error if required fields are missing or the owner already exists.</returns>
    /// <remarks>
    /// This endpoint is accessible to anonymous users.
    /// </remarks>

    [AllowAnonymous]
    [HttpPost("signup")]
    public async Task<IActionResult> SignUp([FromBody] OwnerSignupRequest request)
    {

        if (string.IsNullOrEmpty(request.Name) ||
            string.IsNullOrEmpty(request.Email) ||
            string.IsNullOrEmpty(request.Password) ||
            string.IsNullOrEmpty(request.Phone) ||
            string.IsNullOrEmpty(request.RestaurantNumber))
        {
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
    /// <summary>
    /// Adds a new meal to the restaurant's database. This action is restricted to authorized users.
    /// </summary>
    /// <param name="meal">The meal object containing the name and price of the meal to be added.</param>
    /// <returns>A successful status code (200) if the meal was added successfully, or a bad request status code (400) if the meal already exists or required fields are missing.</returns>

    [Authorize]
    [HttpPost("add/meal")]
    public async Task<IActionResult> AddMeal([FromBody] Meal meal)
    {

        if (string.IsNullOrEmpty(meal.MealName) || meal.Price <= 0)
        {
            System.Console.WriteLine("Meal name and price are required.");
            return BadRequest("All fields are required.");
        }
        var cursor = await _meals.FindAsync(m => m.MealName == meal.MealName);
        var existingMeal = cursor.FirstOrDefault();
        if (existingMeal is not null)
        {
            System.Console.WriteLine("Meal already exists.");
            return BadRequest("Meal already exists.");
        }
        await _meals.InsertOneAsync(meal);
        return Ok("Meal added successfully.");
    }
    /// <summary>
    /// Adds a new table to the restaurant's database. This action is restricted to authorized users.
    /// </summary>
    /// <param name="request">The table data including capacity and window side preference.</param>
    /// <returns>A successful status code (200) if the table was added successfully, or a bad request status code (400) if the table capacity is invalid.</returns>

    [Authorize]
    [HttpPost("add/table")]
    public async Task<IActionResult> AddTable([FromBody] Table request)
    {

        if (request.Capacity <= 0)
        {
            return BadRequest("All fields are required.");
        }
        long tableCount = await _tables.CountDocumentsAsync(FilterDefinition<Table>.Empty);
        request.TableNumber = (int)tableCount + 1;
        await _tables.InsertOneAsync(request);
        return Ok("Table added successfully.");
    }
    [Authorize]
    [HttpDelete("delete/meal/{mealId}")]
    public async Task<IActionResult> DeleteMeal([FromQuery] string mealId)
    {
        var meal = await _meals.FindOneAndDeleteAsync(m => m.MealId == mealId);
        if (meal is null)
        {
            return BadRequest("Meal not found.");
        }
        return Ok($"{meal.MealName} deleted successfully.");
    }
    [Authorize]
    [HttpGet("meals")]
    public async Task<IActionResult> GetMeals()
    {
        var dbfetch = await _meals.Find(_ => true).ToListAsync();
        var meals = dbfetch.ToArray();
        return Ok(meals);
    }
}
