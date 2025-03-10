namespace Server.Services;
using System.Collections.Concurrent;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Server.Models;

public interface IHubService
{
    Task ConnectNotification(string sid, bool isOkay);
}
public class SocketService : Hub<IHubService>
{
    public static readonly ConcurrentDictionary<string, string> _userConnections = new();
    public static readonly ConcurrentDictionary<string, string> _waiterConnections = new();
    public static readonly ConcurrentDictionary<string, string> _ownerConnections = new();
    public static readonly List<Table> _tables = new(); // List of tables
    /// <summary>
    /// This is the OnConnectedAsync method that will be called when the client establishes a connection to the server.
    /// It will add the connection to the list of connections and send a message to the client with the connection ID.
    /// If there is an error, it will send an error message to the client.
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        var sid = Context.ConnectionId;
        try
        {
            if (Context.GetHttpContext()?.Request.Query.ContainsKey("privilagelevel") == true)
            {
                var httpContext = Context.GetHttpContext();
                var privilageLevel = httpContext?.Request.Query["privilagelevel"];
                if (httpContext != null && privilageLevel?.ToString() == "waiter")
                {
                    _waiterConnections[sid] = httpContext?.Request.Query["waiterid"].ToString() ?? string.Empty;
                    System.Console.WriteLine($"Waiter connected sid: {sid}\n waiterid: {httpContext?.Request.Query["waiterid"].ToString() ?? string.Empty}");
                    await Clients.Caller.ConnectNotification(sid, true);
                }
                else if (httpContext != null && privilageLevel?.ToString() == "owner")
                {
                    _ownerConnections[sid] = httpContext?.Request.Query["ownerid"].ToString() ?? string.Empty;
                    System.Console.WriteLine($"Owner connected sid: {sid}\n ownerid: {httpContext?.Request.Query["ownerid"].ToString() ?? string.Empty}");
                    await Clients.Caller.ConnectNotification(sid, true);
                }
                else
                {
                    if (httpContext != null
                    && httpContext.Request.Query.ContainsKey("userid")
                    && httpContext.Request.Query["privilagelevel"].ToString() == "user")
                    {
                        _userConnections[sid] = httpContext.Request.Query["userid"].ToString() ?? string.Empty;
                        System.Console.WriteLine($"User connected sid: {sid}\n userid: {httpContext.Request.Query["userid"].ToString() ?? string.Empty}");
                        await Clients.Caller.ConnectNotification(sid, true);
                    }

                }

            }
        }
        catch (Exception ex)
        {
            await Clients.Caller.ConnectNotification(sid, false);
            Console.WriteLine(ex.Message);
        }
        finally
        {
            await base.OnConnectedAsync();
        }
    }
    /// <summary>
    /// This is the OnDisconnectedAsync method that will be called when the client disconnects from the server.
    /// It will remove the connection from the list of connections and write a message to the console.
    /// If there is an error, it will write the exception message to the console.
    /// </summary>
    /// <param name="exception">Optional exception that may be related to the disconnection.</param>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var sid = Context.ConnectionId;
        if (_userConnections.ContainsKey(sid))
        {
            _userConnections.TryRemove(sid, out _);
        }
        else if (_waiterConnections.ContainsKey(sid))
        {
            _waiterConnections.TryRemove(sid, out _);
        }
        else if (_ownerConnections.ContainsKey(sid))
        {
            _ownerConnections.TryRemove(sid, out _);
        }

        System.Console.WriteLine($"Disconnected: {sid}");
        // Perform any additional logic here if needed
        await base.OnDisconnectedAsync(exception);
    }

}