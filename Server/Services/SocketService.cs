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
    Task ReceiveOrderSuccessMessage(bool isOkay = false, Order? order = null);
    Task ReceiveOrders(List<Order?> orders);
    Task SendOrder(Order order);
    Task ReceiveQuickMessageList(List<QuickMessage> messages);
    Task ReceiveOrderReadyMessage(Order order, int tableNumber);
    Task ReceiveMessagesToWaiter(string[] msgs);
    Task ReceiveSuccessOrFail(string message);
}
/// <summary>
/// SignalR service for handling real-time communication between clients.
/// </summary>
public class SocketService : Hub<IHubService>
{
    public SocketService(MongoDBWrapper dBWrapper)
    {
        _tableCollection = dBWrapper.Tables;
        _messageCollection = dBWrapper.QuickMessages;
    }
    IMongoCollection<Table> _tableCollection;
    IMongoCollection<QuickMessage> _messageCollection;
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
                    await Clients.Caller.ReceiveOrders(_orders); // Send orders to the waiter
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
        await Groups.AddToGroupAsync(userId, tableNumber.ToString());
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
    /// Sends the given quick messages to the waiter of the given table number.
    /// </summary>
    /// <param name="tableNumber">The table number to send the messages to.</param>
    /// <param name="quickMessages">The list of quick messages to be sent.</param>
    /// <exception cref="Exception">An exception is thrown if there is an error sending the messages to the waiter.</exception>
    public async Task SendMessagesToWaiter(SelectedNeedMessages needs)
    {
        try
        {
            System.Console.WriteLine($"Sending messages to waiter for Table {needs.TableNumber}");
            if (needs.messages == null || needs.messages.Length == 0)
            {
                await Clients.Caller.ReceiveSuccessOrFail("No messages to send.");
                return;
            }
            await Clients.Group(needs.TableNumber.ToString()).ReceiveMessagesToWaiter(needs.messages);
            await Clients.Caller.ReceiveSuccessOrFail("Messages sent to waiter successfully.");
        }
        catch (Exception ex)
        {
            System.Console.WriteLine($"Error sending messages to waiter: {ex.Message}");
            await Clients.Caller.ReceiveSuccessOrFail($"Failed to send messages: {ex.Message}.");
        }
        finally
        {
            System.Console.WriteLine($"Finished sending messages to waiter for Table {needs.TableNumber}");

        }


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
        if (order != null && order.Orders != null)
        {
            int tableNumber = order.TableNumber;
            System.Console.WriteLine($"Order for Table {tableNumber} received: {order.Orders.Length} items");
            _orders[order.TableNumber - 1] = order;
            await Clients.Caller.ReceiveOrderSuccessMessage(true, order);
            var context = Context.GetHttpContext();
            if (context == null) return;
            string id = context.Request.Query["userid"].ToString() ?? string.Empty;
            Console.WriteLine($"Order sent in Table {tableNumber} from {id}");
        }
        else
        {
            Console.WriteLine("Order is null.");
            await Clients.Caller.ReceiveOrderSuccessMessage(false, null);
        }

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
            await Groups.AddToGroupAsync(id, tableNumber.ToString());


        }
        else
        {
            System.Console.WriteLine($"Table {tableNumber} already has a waiter assigned.");
            return;
        }

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
    /// Sends the order for a table to the waiter.
    /// </summary>
    /// <param name="tableNumber">The table number to send the order for.</param>
    /// <remarks>
    /// This method is called when a waiter requests the order for a table.
    /// It checks if the waiter is assigned to the table and if there is an order for the table.
    /// If both conditions are met, it sends the order to the waiter.
    /// </remarks>
    public async Task PeakOrder(int tableNumber)
    {
        var order = _orders[tableNumber - 1];

        if (order == null)
        {
            Console.WriteLine($"No order found for Table {tableNumber}");
            return;
        }
        await Clients.All.SendOrder(order);
        Console.WriteLine($"Order for Table {tableNumber} sent to waiter.");
    }
    /// <summary>
    /// Retrieves a list of quick messages from the message collection in MongoDB and sends them to the caller.
    /// </summary>
    /// <remarks>
    /// This method is called to fetch all quick messages stored in the database and deliver them to the client that initiated the request.
    /// </remarks>

    public async Task GetQuickMsgs()
    {
        var msgs = FetchMessages();
        await Clients.Caller.ReceiveQuickMessageList(msgs.Result);
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
    /// Marks a meal order as ready and sends a message to all users at the table and the waiter with the order details.
    /// </summary>
    /// <param name="tableNumber">The table number the order is for.</param>
    /// <remarks>
    /// This method is called when a waiter marks an order as ready from the waiter app.
    /// It sets the order's IsReady property to true and sends a message to all users at the table and the waiter with the order details.
    /// </remarks>
    public async Task MarkOrderAsReady(int tableNumber)
    {
        var order = _orders[tableNumber - 1];
        if (order != null && order.Orders != null)
        {
            System.Console.WriteLine($"Order for Table {tableNumber} marked as ready: {order.Orders.Length} items");
            order.IsReady = true;
            Console.WriteLine($"Order for Table {tableNumber} marked as ready.");
            await Clients.Group(tableNumber.ToString()).ReceiveOrderReadyMessage(order, tableNumber);
            System.Console.WriteLine($"Order for Table {tableNumber} sent to waiter.");
        }
        else
        {
            Console.WriteLine($"No order found for Table {tableNumber}");
        }
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
            _tables.ForEach(t =>
            {
                if (t.WaiterId == id)
                {
                    t.WaiterId = string.Empty;
                }
            });
            System.Console.WriteLine("Waiter left all tables");
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
        await Clients.All.ReceiveTableLeaveMessage(_tables);
        await base.OnDisconnectedAsync(exception);
    }

    private async Task<List<QuickMessage>> FetchMessages()
    {
        var msgs = await _messageCollection.Find(_ => true).ToListAsync();
        return msgs;
    }

}