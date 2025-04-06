namespace Server.Services;
using System.Collections.Concurrent;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using MongoDB.Driver;
using Server.DB;
using Server.Models;
/// <summary>
/// Interface for the SignalR hub service.
/// </summary>
public interface IHubService
{
    Task ConnectNotification(string sid, bool isOkay, List<Table> tables);
    Task ReceiveMessage(Message message);
    Task ReceiveTableMessage(string message, bool isOkay = false, string userId = "", int tableNum = 0, List<Table>? tables = null);
    Task ReceiveWaiterAssignMessage(string message, List<Table> tables);
    Task ReceiveTableLeaveMessage(List<Table> tables);
    Task ReceiveWaiterLeaveMessage(List<Table> tables);
    Task ReceiveOrderSuccessMessage(bool isOkay = false);
    Task ReceiveOrders(List<Order?> orders);
}
/// <summary>
/// SignalR service for handling real-time communication between clients.
/// </summary>
public class SocketService : Hub<IHubService>
{
    public SocketService(MongoDBWrapper dBWrapper)
    {
        _tableCollection = dBWrapper.Tables;
    }
    IMongoCollection<Table> _tableCollection;
    public static readonly ConcurrentDictionary<string, string> _userConnections = new(); // sid => MongoDB ID
    public static readonly ConcurrentDictionary<string, string> _waiterConnections = new(); // sid => MongoDB ID
    public static readonly ConcurrentDictionary<string, string> _ownerConnections = new(); // sid => MongoDB ID
    public static readonly ConcurrentDictionary<string, HashSet<string>> _userids2sid = new(); // MongoDB ID => Set of sids
    public static readonly ConcurrentDictionary<string, HashSet<string>> _waiterids2sid = new(); // MongoDB ID => Set of sids
    public static readonly ConcurrentDictionary<string, string> _tableConnections = new(); // Table ID => Waiter ID
    public static List<Table> _tables = new(); // List of tables
    public static List<Order?> _orders = new(); // List of orders

    // Map tables to assigned users and waiters
    public static readonly ConcurrentDictionary<int, string> _tableToUser = new(); // Table ID => User ID
    public static readonly ConcurrentDictionary<int, string> _tableToWaiter = new(); // Table ID => Waiter ID

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
        if (_tables.Count == 0 || _tableCollection.CountDocuments(FilterDefinition<Table>.Empty) == 0)
        {
            System.Console.WriteLine("Tables are null or empty.");
            _tables.Clear();
            _tables.AddRange(await _tableCollection.Find(_ => true).ToListAsync());
            _orders = Enumerable.Repeat<Order?>(null, _tables.Count).ToList();

        }

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
                    await Clients.Caller.ConnectNotification(sid, true, _tables);
                }
                else if (privilageLevel == "owner")
                {
                    var ownerId = httpContext.Request.Query["ownerid"].ToString() ?? string.Empty;
                    _ownerConnections[sid] = ownerId;

                    Console.WriteLine($"Owner connected sid: {sid}\n ownerid: {ownerId}");
                    await Clients.Caller.ConnectNotification(sid, true, _tables);
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
                    await Clients.Caller.ConnectNotification(sid, true, _tables);
                }
            }
        }
        catch (Exception ex)
        {
            await Clients.Caller.ConnectNotification(sid, false, _tables);
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
    public async Task AssignUserToTable(string userId, int tableNumber)
    {
        Console.WriteLine($"Assigning user {userId} to table {tableNumber}");
        var sid = Context.ConnectionId;

        // Check if user is already in a table
        if (_tables.Count > 0 && _tables.Any(t => t.UserId == userId) && _tableToUser.Any(kv => kv.Value == userId))
        {
            await Clients.Caller.ReceiveTableMessage("User Already in a table.", false, userId, 0, _tables);
        }



        // Assign user to a table if he is not already in one
        _tableToUser[tableNumber] = userId;
        _tables[tableNumber - 1].UserId = userId;
        _tables[tableNumber - 1].CheckOccupation();
        System.Console.WriteLine($"User {userId} assigned to Table {tableNumber}, isOccupied: {_tables[tableNumber - 1].isOccupied}");
        await Groups.AddToGroupAsync(sid, tableNumber.ToString());
        await Clients.All.ReceiveTableMessage($"User {userId} joined Table {tableNumber}", true, userId, tableNumber, _tables);
        System.Console.WriteLine($"User {userId} joined Table {tableNumber}");
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
    /// Removes the user from the table and sends a message to all users about the table's updated status.
    /// </summary>
    /// <param name="tableNumber">The table number the user is leaving.</param>
    /// <remarks>
    /// This method is called when a user wants to leave a table.
    /// It sets the user ID of the table to an empty string and sends a message to all users about the table's updated status.
    /// </remarks>
    public async Task LeaveTable(int tableNumber)
    {
        var id = Context.GetHttpContext()?.Request.Query["userid"].ToString() ?? string.Empty;
        _tables[tableNumber - 1].UserId = string.Empty;
        _tables[tableNumber - 1].isOccupied = false;
        await Clients.All.ReceiveTableLeaveMessage(_tables);
        await Groups.RemoveFromGroupAsync(id, tableNumber.ToString());
        _orders[tableNumber - 1] = null; // Clear the order for the table
        await Clients.All.ReceiveOrders(_orders); // Send updated orders to all clients
        System.Console.WriteLine($"User {id} left Table {tableNumber}");

    }
    /// <summary>
    /// Assigns a waiter to a table and adds them to the SignalR group.
    /// </summary>
    public async Task AssignWaiterToTable(string waiterId, int tableNumber)
    {
        var id = Context.GetHttpContext()?.Request.Query["waiterid"].ToString() ?? string.Empty;
        var sid = Context.ConnectionId;


        // Assign waiter to the new table
        _tableToWaiter[tableNumber] = waiterId;
        if (string.IsNullOrEmpty(_tables[tableNumber - 1].WaiterId))
        {
            _tables[tableNumber - 1].WaiterId = waiterId;
            await Clients.All.ReceiveWaiterAssignMessage($"Waiter {waiterId} joined Table {tableNumber}", _tables);

        }
        else
        {
            await Clients.Caller.ReceiveWaiterAssignMessage("Table already has a waiter", _tables);
            return;
        }
        await Groups.AddToGroupAsync(id, tableNumber.ToString());
        Console.WriteLine($"Waiter {waiterId} joined Table {tableNumber}");

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
    /// Removes a waiter from a table and updates all clients about the table's updated status.
    /// </summary>
    /// <param name="tableNumber">The table number the waiter is leaving.</param>
    /// <remarks>
    /// This method is called when a waiter stops waiting at a table.
    /// It sets the waiter ID of the table to an empty string and sends a message to all clients about the table's updated status.
    /// </remarks>
    public async Task StopWaitingTable(int tableNumber)
    {
        var waiterId = Context.GetHttpContext()?.Request.Query["waiterid"].ToString() ?? string.Empty;
        _tables[tableNumber - 1].WaiterId = string.Empty;
        await Clients.All.ReceiveWaiterLeaveMessage(_tables);
        await Groups.RemoveFromGroupAsync(waiterId, tableNumber.ToString());
        Console.WriteLine($"Waiter {waiterId} left Table {tableNumber}");
    }
    /// <summary>
    /// Sends a message within a table.
    /// </summary>
    public async Task SendMessageToTable(int tableNumber, string senderId, string recipientId, string message)
    {
        await Clients.Group(tableNumber.ToString()).ReceiveMessage(new Message
        {
            SenderId = senderId,
            RecipientId = recipientId,
            message = message
        });

        Console.WriteLine($"Message sent in Table {tableNumber} from {senderId} to {recipientId}: {message}");
    }

    /// <summary>
    /// Sends a meal order to the server.
    /// </summary>
    /// <param name="order">The order to be sent.</param>
    /// <remarks>
    /// This method is called when a user sends a meal order from the menu.
    /// It stores the order in the in-memory list of orders and sends a message to the waiter and all users at the table
    /// with the order details.
    /// </remarks>
    public async Task OrderMeal(Order order)
    {
        int tableNumber = order.TableNumber;
        _orders[order.TableNumber - 1] = order;
        await Clients.Caller.ReceiveOrderSuccessMessage(true);
        await Clients.Group(tableNumber.ToString()).ReceiveOrders(_orders);
        var context = Context.GetHttpContext();
        if (context == null) return;
        string id = context.Request.Query["userid"].ToString() ?? string.Empty;
        Console.WriteLine($"Order sent in Table {tableNumber} from {id}");
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
        var httpContext = Context.GetHttpContext();
        var id = httpContext?.Request.Query["userid"].ToString() ?? string.Empty;

        if (_userConnections.TryGetValue(sid, out string? mongoId))
        {
            _userConnections.TryRemove(sid, out _);
            _tables.ForEach(t =>
            {
                if (t.UserId == id)
                {
                    t.UserId = string.Empty;
                    t.CheckOccupation();
                }
            });

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