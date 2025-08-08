using Server.DB;
using Server.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Server.Controllers;
using MongoDB.Driver;
using Server.Security;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
//Enabling Controllers and adding NewtonsoftJson for json formatting
builder.Services.AddControllers().AddNewtonsoftJson();
//Enable the app to see the controllers
builder.Services.AddEndpointsApiExplorer();
//Adding UI to test controllers when running the server
builder.Services.AddSwaggerGen();
//Adding SignalR for real-time communication
builder.Services.AddSignalR();

// MongoDB Dependency Injection
builder.Services.AddSingleton<IMongoClient>(sp =>
{
    var configuration = sp.GetRequiredService<IConfiguration>();
    var connectionString = configuration.GetValue<string>("DB:ConnectionString");
    return new MongoClient(connectionString);
});
//Adding the MongoDBWrapper to the services
builder.Services.AddScoped<MongoDBWrapper>();
//Adding the sockets to the services
builder.Services.AddScoped<SocketService>();
// Controller Injection
builder.Services.AddScoped<UserController>();
builder.Services.AddScoped<OwnerController>();
builder.Services.AddScoped<WaiterController>();
//Email Service Injection
builder.Services.AddScoped<EmailService>();
//Security Manager Injection
builder.Services.AddScoped<SecurityManager>();
//Authentication Service
builder.Services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();

// JWT Authentication Configuration
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? string.Empty)
        )
    };
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            if (context.Request.Headers.ContainsKey("X-Auth-Token".ToLower()))
            {
                context.Token = context.Request.Headers["X-Auth-Token".ToLower()];
            }
            else if (context.Request.Headers.ContainsKey("X-Auth-Token"))
            {
                context.Token = context.Request.Headers["X-Auth-Token"];
            }
            return Task.CompletedTask;
        }
    };
});


/// <summary>
/// Configures CORS policy to allow requests from specific origins.
/// </summary>
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAllHosts", policy =>
    {
        // Base origins for Expo and localhost
        var allowedOrigins = new List<string>
        {
            "http://localhost:8081",    // Expo Metro bundler
            "http://localhost:8081",    // Expo Debugging tools
            "http://127.0.0.1:8081",    // Loopback for Metro bundler
            "http://127.0.0.1:8081",
            "http://localhost:5173",
             "http://localhost:5174",
             "http://localhost:5176",
             "http://localhost:5177"    // Loopback for Debugging tools
        };

        // Dynamically add LAN IPs
        var hostName = System.Net.Dns.GetHostName();
        var localAddresses = System.Net.Dns.GetHostAddresses(hostName)
            .Where(ip => ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork); // Only IPv4

        foreach (var ip in localAddresses)
        {
            allowedOrigins.Add($"http://{ip}:8081"); // Add port 19000
            allowedOrigins.Add($"http://{ip}:8081"); // Add port 19006
            allowedOrigins.Add($"http://{ip}:5173");
            allowedOrigins.Add($"http://{ip}:5174");
            allowedOrigins.Add($"http://{ip}:5176");
            allowedOrigins.Add($"http://{ip}:5177");
        }
        allowedOrigins.Add("http://10.0.0.140:8081");
        allowedOrigins.Add("http://localhost:8081");
        allowedOrigins.Add("http://10.0.0.159:8081");
        // Apply the CORS policy
        policy.WithOrigins(allowedOrigins.ToArray())
            .WithMethods("GET", "POST", "PUT", "DELETE")
            .WithHeaders(
                "Content-Type",
                "X-Auth-Token",
                "content-type",
                "x-auth-token",
                "Accept",
                "Authorization",
                "User-Agent",
                "X-Requested-With",
                "Referer",
                "Connection",
                "Sec-WebSocket-Protocol",
                "Sec-WebSocket-Key",
                "Sec-WebSocket-Version",
                "Origin",
                "x-signalr-user-agent" // Include this custom header
            )
            .WithExposedHeaders(
                "X-Auth-Token",
                "x-auth-token",
                "Content-Type",
                "Accept",
                "Authorization",
                "User-Agent",
                "X-Requested-With",
                "Referer",
                "Connection",
                "Sec-WebSocket-Protocol",
                "Sec-WebSocket-Key",
                "Sec-WebSocket-Version",
                "Origin",
                "x-signalr-user-agent" // Expose this custom header
            )
            .AllowCredentials();
    });
});
//using a url available on the entire network IE if you're on a router called "router" 
// you can access the server from any device on the network
builder.WebHost.UseUrls("http://0.0.0.0:5256");

//Building the app with the services
var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    //Using swagger functionality
    app.UseSwagger();
    //Using swagger UI
    app.UseSwaggerUI();
}
//Enabling access to the hub through a "/hub" endpoint
app.MapHub<SocketService>("hub");
app.UseHttpsRedirection();
//Enabling CORS
app.UseCors("AllowAllHosts");
//Enabling routing
app.UseRouting();
//Enabling authentication and authorization
app.UseAuthentication();
app.UseAuthorization();
//Enabling the controllers
app.MapControllers();         // CORS Middleware
// API Endpoints
app.MapGet("/weatherforecast", () =>
{
    var summaries = new[]
    {
        "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
    };

    var forecast = Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast(
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
});



app.MapControllers(); // Map API Controllers


app.Run();

// Record for Weather Forecast
record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
