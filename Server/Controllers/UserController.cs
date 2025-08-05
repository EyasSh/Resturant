using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using Server.DB;
using Server.Models;
using Server.Services;
using Microsoft.AspNetCore.SignalR;
using Server.Security;
using System.Net.Sockets;

namespace Server.Controllers;
[ApiController]
[Route("api/user")] // Base route for all actions in this controller
/// <summary>
/// The user controller class is responsible for handling user-related actions such as login, sign-up, and account termination.
/// </summary>
public class UserController : ControllerBase
{
   
    IMongoCollection<User> _users;
    IMongoCollection<Meal> _meals;
    
    private readonly EmailService _emailService;

    private readonly SecurityManager _securityManager;
    /*
     <summary>
     This is the user controller constructor to perform user actions
     using services such as an email service ETC
     </summary>
    */
    public UserController(MongoDBWrapper dBWrapper, 
     EmailService emailService,
    SecurityManager securityManager
    )
    {
        _users = dBWrapper.Users;
        _meals = dBWrapper.Meals;
        
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
    /// <summary>
    /// Retrieves the list of tables currently available in the restaurant system.
    /// This action is restricted to authorized users.
    /// </summary>
    /// <returns>A successful status code (200) along with the list of tables as a JSON payload.</returns>

    [Authorize]
    [HttpGet("tables")]
    public IActionResult GetTables()
    {

        var tables = SocketService._tables.ToArray();
        return Ok(new { tables });
    }

}

[ApiController]
[Route("api/waiter")]
/// <summary>
/// A controller for managing waiters and waiter actions in the system.
/// </summary>
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
/// <summary>
/// A controller for managing restaurant owners and owner actions in the system.
/// </summary>
public class OwnerController : ControllerBase
{
    IMongoCollection<Owner> _owners;
    IMongoCollection<Waiter> _waiters;
    IMongoCollection<Meal> _meals;
    IMongoCollection<Table> _tables;
    IMongoCollection<QuickMessage> _messages;
    private readonly SocketService _socketService;
    private readonly SecurityManager _securityManager;
    public OwnerController(MongoDBWrapper dBWrapper, SecurityManager securityManager,
    SocketService socketService)
    {
        _owners = dBWrapper.Owners;
        _waiters = dBWrapper.Waiters;
        _meals = dBWrapper.Meals;
        _tables = dBWrapper.Tables;
        _messages = dBWrapper.QuickMessages;
        _securityManager = securityManager;
        _socketService = socketService;
    }
    /// <summary>
    /// Authenticates an owner and provides access to the system. This action is accessible to anonymous users.
    /// </summary>
    /// <param name="request">The owner's login credentials.</param>
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
        System.Console.WriteLine(meal.Category ?? "category is null");
        if (string.IsNullOrEmpty(meal.MealName) || meal.Price <= 0 || string.IsNullOrEmpty(meal.Category))
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
    /// <summary>
    /// Deletes a meal from the restaurant's database. This action is restricted to authorized users.
    /// </summary>
    /// <param name="mealId">The ID of the meal to be deleted.</param>
    /// <returns>A successful status code (200) if the meal was deleted successfully, or a bad request status code (400) if the meal was not found.</returns>
    [Authorize]
    [HttpDelete("delete/meal")]
    public async Task<IActionResult> DeleteMeal([FromQuery] string mealId)
    {
        var meal = await _meals.FindOneAndDeleteAsync(m => m.MealId == mealId);
        if (meal is null)
        {
            return BadRequest("Meal not found.");
        }
        return Ok($"{meal.MealName} deleted successfully.");
    }
    /// <summary>
    /// Retrieves all meals from the restaurant's database. This action is restricted to authorized users.
    /// </summary>
    /// <returns>A successful status code (200) along with the list of meals as a JSON payload.</returns>
    [Authorize]
    [HttpGet("meals")]
    public async Task<IActionResult> GetMeals()
    {
        var dbfetch = await _meals.Find(_ => true).ToListAsync();
        var meals = dbfetch.ToArray();
        return Ok(meals);
    }
    /// <summary>
    /// Retrieves the list of waiters from the restaurant's database. This action is restricted to authorized users.
    /// </summary>
    /// <returns>A successful status code (200) along with the list of waiters as a JSON payload.</returns>
    [Authorize]
    [HttpGet("waiters")]
    public async Task<IActionResult> GetWaiters()
    {
        var dbfetch = await _waiters.Find(_ => true).ToListAsync();
        var waiters = dbfetch.ToArray();

        return Ok(waiters);
    }
    /// <summary>
    /// Deletes a waiter from the restaurant's database. This action is restricted to authorized users.
    /// </summary>
    /// <param name="id">The ID of the waiter to be deleted.</param>
    /// <returns>A successful status code (200) if the waiter was deleted successfully, or a bad request status code (400) if the waiter is online or was not found.</returns>
    /// <remarks>
    /// This action is restricted to authorized users (i.e. the restaurant owners).
    /// </remarks>
    [Authorize]
    [HttpDelete("delete/waiter")]
    public IActionResult RemoveWaiter([FromQuery] string id)
    {
        // Check if the waiter ID exists in the values of _waiterConnections dictionary
        if (SocketService._waiterConnections.Values.Contains(id))
        {
            return BadRequest("Waiter is currently online and cannot be removed.");
        }

        // Proceed with removing the waiter from your database
        var result = _waiters.DeleteOne(w => w.Id == id);
        if (result.DeletedCount == 0)
        {
            return BadRequest("Waiter not found.");
        }
        return Ok("Waiter removed successfully.");
    }
    /// <summary>
    /// Deletes a table from the restaurant's database and updates the table numbers accordingly.
    /// This action is restricted to authorized users.
    /// </summary>
    /// <param name="number">The table number to be deleted.</param>
    /// <returns>A successful status code (200) with the updated list of tables if the deletion is successful,
    /// or a bad request status code (400) if the table is occupied, other tables are occupied making shifting impossible,
    /// or if the table was not found.</returns>
    /// <remarks>
    /// The function checks if the table is occupied or if it exists. It prevents deletion if the table is occupied
    /// or if shifting other table numbers is not possible due to occupied tables.
    /// The table is removed from the database and from the SocketService list if all conditions are met.
    /// </remarks>

    [Authorize]
    [HttpDelete("delete/tables")]
    public async Task<IActionResult> DeleteTable([FromQuery] int number)
    {
        System.Console.WriteLine("Attempting to delete table number: " + number);

        // Find the table in the SocketService list
        var table = SocketService._tables.FirstOrDefault(t => t.TableNumber == number);

        // If the table is not found in the list, assume it’s not occupied and delete it from MongoDB
        if (table == null)
        {
            var result = await _tables.DeleteOneAsync(t => t.TableNumber == number);
            if (result.DeletedCount == 0)
            {
                return BadRequest("Table not found.");
            }

            await ShiftTableNumbers(number);
            return Ok("Table deleted successfully.");
        }

        // If the table exists but is occupied, prevent deletion
        if (!string.IsNullOrEmpty(table.UserId))
        {
            return BadRequest("Table is currently in use and cannot be removed.");
        }

        // If other tables are occupied and shifting is not possible, prevent deletion
        if (SocketService._tables.Any(t => t.TableNumber > number && t.isOccupied))
        {
            return BadRequest("Tables are occupied and their indexes cannot be shifted down.");
        }

        // Delete the table from MongoDB
        var deleteResult = await _tables.DeleteOneAsync(t => t.TableNumber == number);
        if (deleteResult.DeletedCount == 0)
        {
            return BadRequest("Table not found.");
        }

        // Remove the table from the SocketService list
        SocketService._tables.RemoveAll(t => t.TableNumber == number);

        // Shift table numbers in MongoDB and SocketService._tables
        await ShiftTableNumbers(number);
        var tables = await _tables.Find(_ => true).ToListAsync();
        return Ok(tables);
    }

    /// <summary>
    /// Shifts the table numbers down by one for all tables with numbers greater than the deleted table number.
    /// </summary>
    /// <param name="deletedTableNumber">The table number that was deleted.</param>
    /// <remarks>
    /// Shifting the table numbers is done in two steps: first, all tables in the database are updated in a bulk operation,
    /// and second, the in-memory list of tables is updated.
    /// </remarks>
    private async Task ShiftTableNumbers(int deletedTableNumber)
    {
        var tablesToShift = await _tables
            .Find(t => t.TableNumber > deletedTableNumber)
            .SortBy(t => t.TableNumber)
            .ToListAsync();

        if (tablesToShift.Any())
        {
            // Bulk update MongoDB tables
            var bulkOps = new List<WriteModel<Table>>();
            foreach (var table in tablesToShift)
            {
                var filter = Builders<Table>.Filter.Eq(x => x.TableNumber, table.TableNumber);
                var update = Builders<Table>.Update.Set(x => x.TableNumber, table.TableNumber - 1);
                bulkOps.Add(new UpdateOneModel<Table>(filter, update));
            }
            await _tables.BulkWriteAsync(bulkOps);

            // Update the in-memory list
            foreach (var table in tablesToShift)
            {
                table.TableNumber--;
            }
        }
    }

    /// <summary>
    /// Retrieves the list of tables from the restaurant's database. This action is restricted to authorized users.
    /// </summary>
    /// <returns>A successful status code (200) along with the list of tables as a JSON payload.</returns>

    [Authorize]
    [HttpGet("tables")]
    public async Task<IActionResult> GetTables()
    {
        if (SocketService._tables.Count == 0)
        {
            var dbfetch = await _tables.Find(_ => true).ToListAsync();
            var tables = dbfetch.ToArray();
            return Ok(tables);
        }
        else
        {
            var servicefetch = SocketService._tables;
            var tables = servicefetch.ToArray();
            return Ok(tables);
        }

    }
    /// <summary>
    /// Adds a new quick message to the database. This action is restricted to authorized users.
    /// </summary>
    /// <param name="request">The quick message to be added.</param>
    /// <returns>A successful status code (200) if the message was added successfully, or a bad request status code (400) if the message is empty or already exists.</returns>
    [Authorize]
    [HttpPost("add/message")]
    public async Task<IActionResult> AddMessage([FromBody] QuickMessage request)
    {
        if (string.IsNullOrEmpty(request.Message))
        {
            return BadRequest("Message cannot be empty.");
        }
        var cursor = await _messages.FindAsync<QuickMessage>(message => message.Message == request.Message);
        if (cursor.Any())
        {
            return BadRequest("Message already exists.");
        }
        await _messages.InsertOneAsync(request);
        return Ok($"Message \"{request.Message}\" added successfully.");
    }
    // DELETE api/owner/delete/message
    [HttpDelete("delete/message")]
    public async Task<IActionResult> DeleteMessage([FromBody] SingleDeleteRequest request)
    {
        if (!EnsureRestaurantEmpty())
        {
            return BadRequest(new { error = "Restaurant must be empty before deleting messages." });
        }

        var filter = Builders<QuickMessage>.Filter.Eq(m => m.Id, request.QuickMessageId);
        var deleted = await _messages.FindOneAndDeleteAsync(filter);
        if (deleted == null)
        {
            return NotFound(new { error = "Message not found." });
        }

        return Ok(new { success = true, message = deleted.Message });
    }

    // DELETE api/owner/delete/messages
    [HttpDelete("delete/messages")]
    public async Task<IActionResult> DeleteMessages([FromBody] BulkDeleteRequest request)
    {
        if (!EnsureRestaurantEmpty())
        {
            return BadRequest(new { error = "Restaurant must be empty before deleting messages." });
        }

        if (request.QuickMessageIds == null || !request.QuickMessageIds.Any())
        {
            return BadRequest(new { error = "No message IDs provided." });
        }

        var filter = Builders<QuickMessage>.Filter.In(m => m.Id, request.QuickMessageIds);
        var result = await _messages.DeleteManyAsync(filter);
        if (result.DeletedCount == 0)
        {
            return NotFound(new { error = "No messages found for given IDs." });
        }

        return Ok(new { success = true, deletedCount = result.DeletedCount });
    }

    private bool EnsureRestaurantEmpty()
    {
        return SocketService._tables.All(t => string.IsNullOrEmpty(t.UserId) && t.isOccupied == false);
    }

    [Authorize]
    [HttpGet("messages")]
    public async Task<IActionResult> GetMessages()
    {
        var dbfetch = await _messages.Find(_ => true).ToListAsync();
        var messages = dbfetch.ToArray();
        return Ok(messages);
    }
}
