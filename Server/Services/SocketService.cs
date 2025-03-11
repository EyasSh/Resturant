namespace Server.Services;
using System.Collections.Concurrent;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Server.Models;

public interface IHubService
{
    Task ConnectNotification(string sid, bool isOkay);
    Task ReceiveMessage(Message message);
}
public class SocketService : Hub<IHubService>
{
    public static readonly ConcurrentDictionary<string, string> _userConnections = new(); // sid => MongoDB ID
    public static readonly ConcurrentDictionary<string, string> _waiterConnections = new(); // sid => MongoDB ID
    public static readonly ConcurrentDictionary<string, string> _ownerConnections = new(); // sid => MongoDB ID
    public static readonly ConcurrentDictionary<string, HashSet<string>> _userids2sid = new(); // MongoDB ID => Set of sids
    public static readonly ConcurrentDictionary<string, HashSet<string>> _waiterids2sid = new(); // MongoDB ID => Set of sids
    public static readonly ConcurrentDictionary<string, string> _tableConnections = new(); // Table ID => Waiter ID
    public static readonly List<Table> _tables = new(); // List of tables

    // Map tables to assigned users and waiters
    public static readonly ConcurrentDictionary<string, string> _tableToUser = new(); // Table ID => User ID
    public static readonly ConcurrentDictionary<string, string> _tableToWaiter = new(); // Table ID => Waiter ID

    /// <summary>
    /// Called when a new connection is established.
    /// </summary>
    /// <remarks>
    /// This method is called when a new connection is established.
    /// It stores the connection id (sid) and the corresponding MongoDB user id in the dictionary.
    /// If the user is a waiter, it also stores the sid in a HashSet for the waiter's id.
    /// If the user is an owner, it stores the sid in a dictionary for the owner's id.
    /// If the user is a regular user, it stores the sid in a HashSet for the user's id.
    /// </remarks>
    public override async Task OnConnectedAsync()
    {
        var sid = Context.ConnectionId;
        try
        {
            var httpContext = Context.GetHttpContext();
            if (httpContext?.Request.Query.ContainsKey("privilagelevel") == true)
            {
                var privilageLevel = httpContext.Request.Query["privilagelevel"].ToString();
                if (privilageLevel == "waiter")
                {
                    var waiterid = httpContext.Request.Query["waiterid"].ToString() ?? string.Empty;
                    _waiterConnections[sid] = waiterid;

                    // Add or update sid in HashSet
                    _waiterids2sid.AddOrUpdate(waiterid,
                        new HashSet<string> { sid },
                        (key, existingSids) =>
                        {
                            existingSids.Add(sid);
                            return existingSids;
                        });

                    Console.WriteLine($"Waiter connected sid: {sid}\n waiterid: {waiterid}");
                    await Clients.Caller.ConnectNotification(sid, true);
                }
                else if (privilageLevel == "owner")
                {
                    var ownerId = httpContext.Request.Query["ownerid"].ToString() ?? string.Empty;
                    _ownerConnections[sid] = ownerId;

                    Console.WriteLine($"Owner connected sid: {sid}\n ownerid: {ownerId}");
                    await Clients.Caller.ConnectNotification(sid, true);
                }
                else if (privilageLevel == "user" && httpContext.Request.Query.ContainsKey("userid"))
                {
                    var userid = httpContext.Request.Query["userid"].ToString() ?? string.Empty;
                    _userConnections[sid] = userid;

                    // Add or update sid in HashSet
                    _userids2sid.AddOrUpdate(userid,
                        new HashSet<string> { sid },
                        (key, existingSids) =>
                        {
                            existingSids.Add(sid);
                            return existingSids;
                        });

                    Console.WriteLine($"User connected sid: {sid}\n userid: {userid}");
                    await Clients.Caller.ConnectNotification(sid, true);
                }
            }
        }
        catch (Exception ex)
        {
            await Clients.Caller.ConnectNotification(sid, false);
            Console.WriteLine($"Connection Error: {ex.Message}");
        }
        finally
        {
            await base.OnConnectedAsync();
        }
    }

    /// <summary>
    /// Assigns a user to a table and adds them to the SignalR group.
    /// </summary>
    public async Task AssignUserToTable(string userId, string tableId)
    {
        var sid = Context.ConnectionId;

        // Remove user from previous table, if any
        if (_tableToUser.ContainsKey(userId))
        {
            var previousTable = _tableToUser[userId];
            await Groups.RemoveFromGroupAsync(sid, previousTable);
            _tableToUser.TryRemove(userId, out _);
            Console.WriteLine($"User {userId} left Table {previousTable}");
        }

        // Assign user to the new table
        _tableToUser[tableId] = userId;
        await Groups.AddToGroupAsync(sid, tableId);
        Console.WriteLine($"User {userId} joined Table {tableId}");

        // Store user ID in dictionary
        _userConnections[sid] = userId;
        _userids2sid.AddOrUpdate(userId,
            new HashSet<string> { sid },
            (key, existingSids) =>
            {
                existingSids.Add(sid);
                return existingSids;
            });
    }

    /// <summary>
    /// Assigns a waiter to a table and adds them to the SignalR group.
    /// </summary>
    public async Task AssignWaiterToTable(string waiterId, string tableId)
    {
        var sid = Context.ConnectionId;

        // Remove waiter from previous table, if any
        if (_tableToWaiter.ContainsKey(waiterId))
        {
            var previousTable = _tableToWaiter[waiterId];
            await Groups.RemoveFromGroupAsync(sid, previousTable);
            _tableToWaiter.TryRemove(waiterId, out _);
            Console.WriteLine($"Waiter {waiterId} left Table {previousTable}");
        }

        // Assign waiter to the new table
        _tableToWaiter[tableId] = waiterId;
        await Groups.AddToGroupAsync(sid, tableId);
        Console.WriteLine($"Waiter {waiterId} joined Table {tableId}");

        // Store waiter ID in dictionary
        _waiterConnections[sid] = waiterId;
        _waiterids2sid.AddOrUpdate(waiterId,
            new HashSet<string> { sid },
            (key, existingSids) =>
            {
                existingSids.Add(sid);
                return existingSids;
            });
    }

    /// <summary>
    /// Sends a message within a table.
    /// </summary>
    public async Task SendMessageToTable(string tableId, string senderId, string recipientId, string message)
    {
        await Clients.Group(tableId).ReceiveMessage(new Message
        {
            SenderId = senderId,
            RecipientId = recipientId,
            message = message
        });

        Console.WriteLine($"Message sent in Table {tableId} from {senderId} to {recipientId}: {message}");
    }
    /// <summary>
    /// Handles the disconnection of a client from the server.
    /// It removes the client connection ID from various connection dictionaries
    /// based on their role (user, waiter, or owner) and updates the associated
    /// signalR connection mappings. If a user or waiter has no more active
    /// connections, their entry is removed from the mapping.
    /// </summary>
    /// <param name="exception">The exception that occurred during disconnection, if any.</param>
    /// <returns>A Task representing the asynchronous operation.</returns>

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var sid = Context.ConnectionId;

        if (_userConnections.TryGetValue(sid, out string? mongoId))
        {
            _userConnections.TryRemove(sid, out _);

            if (_userids2sid.TryGetValue(mongoId, out var sids))
            {
                sids.Remove(sid);
                if (sids.Count == 0) _userids2sid.TryRemove(mongoId, out _);
            }
        }
        else if (_waiterConnections.TryGetValue(sid, out string? waiterMongoId))
        {
            _waiterConnections.TryRemove(sid, out _);

            if (_waiterids2sid.TryGetValue(waiterMongoId, out var sids))
            {
                sids.Remove(sid);
                if (sids.Count == 0) _waiterids2sid.TryRemove(waiterMongoId, out _);
            }
        }
        else if (_ownerConnections.ContainsKey(sid))
        {
            _ownerConnections.TryRemove(sid, out _);
        }
        else
        {
            System.Console.WriteLine("Connection not found");
            return;
        }

        Console.WriteLine($"Disconnected: {sid}");
        await base.OnDisconnectedAsync(exception);
    }



}