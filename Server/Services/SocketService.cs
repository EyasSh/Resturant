namespace Server.Services;

using System.Collections.Concurrent;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using MongoDB.Driver;
using Server.DB;
using Server.Models;
using System.Linq;
using System;
using System.Collections.Generic;
using System.Text;
using System.Net;
using System.Globalization;

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
    public SocketService(MongoDBWrapper dBWrapper, IConfiguration configuration)
    {
        _tableCollection = dBWrapper.Tables;
        _messageCollection = dBWrapper.QuickMessages;
        _userCollection = dBWrapper.Users;

        _emailService = new EmailService(configuration);
    }

    IMongoCollection<Table> _tableCollection;
    IMongoCollection<QuickMessage> _messageCollection;
    IMongoCollection<User> _userCollection;

    EmailService _emailService;

    public static readonly ConcurrentDictionary<string, string> _userConnections = new();   // sid => MongoDB User ID
    public static readonly ConcurrentDictionary<string, string> _waiterConnections = new(); // sid => MongoDB Waiter ID
    public static readonly ConcurrentDictionary<string, string> _ownerConnections = new();  // sid => MongoDB Owner ID

    public static readonly ConcurrentDictionary<string, HashSet<string>> _userids2sid = new();   // UserID => set of sids
    public static readonly ConcurrentDictionary<string, HashSet<string>> _waiterids2sid = new(); // WaiterID => set of sids

    public static readonly ConcurrentDictionary<int, string> _tableToUser = new();   // TableNumber => UserID
    public static readonly ConcurrentDictionary<int, string> _tableToWaiter = new(); // TableNumber => WaiterID

    public static readonly ConcurrentDictionary<string, SelectedNeedMessages> tableToNeeds = new(); // TableNumber(string) => needs

    public static List<Table> _tables = new();   // In-memory tables snapshot
    public static List<Order?> _orders = new();  // In-memory orders per table index (tableNumber - 1)

    #region Group Helpers (use connectionIds, not userId/waiterId)
    private Task AddUserToTableGroup(string userId, int tableNumber)
    {
        if (_userids2sid.TryGetValue(userId, out var sids) && sids.Count > 0)
        {
            return Task.WhenAll(sids.Select(sid => Groups.AddToGroupAsync(sid, tableNumber.ToString())));
        }
        return Task.CompletedTask;
    }

    private Task RemoveUserFromTableGroup(string userId, int tableNumber)
    {
        if (_userids2sid.TryGetValue(userId, out var sids) && sids.Count > 0)
        {
            return Task.WhenAll(sids.Select(sid => Groups.RemoveFromGroupAsync(sid, tableNumber.ToString())));
        }
        return Task.CompletedTask;
    }

    private Task AddWaiterToTableGroup(string waiterId, int tableNumber)
    {
        if (_waiterids2sid.TryGetValue(waiterId, out var sids) && sids.Count > 0)
        {
            return Task.WhenAll(sids.Select(sid => Groups.AddToGroupAsync(sid, tableNumber.ToString())));
        }
        return Task.CompletedTask;
    }

    private Task RemoveWaiterFromTableGroup(string waiterId, int tableNumber)
    {
        if (_waiterids2sid.TryGetValue(waiterId, out var sids) && sids.Count > 0)
        {
            return Task.WhenAll(sids.Select(sid => Groups.RemoveFromGroupAsync(sid, tableNumber.ToString())));
        }
        return Task.CompletedTask;
    }
    #endregion

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
            Console.WriteLine("Tables are null or empty.");
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

        // If user already seated, notify caller
        if (_tables.Count > 0 && _tables.Any(t => t.UserId == userId) && _tableToUser.Any(kv => kv.Value == userId))
        {
            await Clients.Caller.ReceiveTableMessage("User Already in a table.", false, userId, 0, _tables);
            return;
        }

        // Assign user
        _tableToUser[tableNumber] = userId;
        var idx = tableNumber - 1;
        _tables[idx].UserId = userId;
        _tables[idx].CheckOccupation();
        _tables[idx].UserName = Context.GetHttpContext()?.Request.Query["name"].ToString() ?? string.Empty;

        // Add ALL current connections for this user to the table group
        await AddUserToTableGroup(userId, tableNumber);

        await Clients.All.ReceiveTableMessage($"User {userId} joined Table {tableNumber}", true, userId, tableNumber, _tables);
        Console.WriteLine($"User {userId} joined Table {tableNumber}");

        // Track this connection
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
            if (string.IsNullOrEmpty(_tables[needs.TableNumber - 1].WaiterId))
            {
                await Clients.Caller.ReceiveSuccessOrFail("No waiter assigned to this table.");
                return;
            }

            Console.WriteLine($"Sending messages to waiter for Table {needs.TableNumber}");
            if (needs.messages == null || needs.messages.Length == 0)
            {
                await Clients.Caller.ReceiveSuccessOrFail("No messages to send.");
                return;
            }

            // Store messages
            tableToNeeds.AddOrUpdate(needs.TableNumber.ToString(), needs, (key, oldValue) => needs);

            // Send to table group (will reach waiter if assigned to group)
            await Clients.Group(needs.TableNumber.ToString()).ReceiveMessagesToWaiter(needs.messages);
            await Clients.Caller.ReceiveSuccessOrFail("Messages sent to waiter successfully.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error sending messages to waiter: {ex.Message}");
            await Clients.Caller.ReceiveSuccessOrFail($"Failed to send messages: {ex.Message}.");
        }
        finally
        {
            Console.WriteLine($"Finished sending messages to waiter for Table {needs.TableNumber}");
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
            Console.WriteLine($"Order for Table {tableNumber} received: {order.Orders.Length} items");
            _orders[tableNumber - 1] = order;
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
        var userId = Context.GetHttpContext()?.Request.Query["userid"].ToString() ?? string.Empty;

        _tableToUser[tableNumber] = string.Empty;
        var idx = tableNumber - 1;
        _tables[idx].UserId = string.Empty;
        _tables[idx].isOccupied = false;
        _tables[idx].UserName = string.Empty;

        // Remove ALL user connections from the table group
        await RemoveUserFromTableGroup(userId, tableNumber);

        // Clear order for the table (once)
        _orders[idx] = null;
        await Clients.All.ReceiveOrders(_orders);

        // Clear needs
        tableToNeeds.TryRemove(tableNumber.ToString(), out _);

        await Clients.All.ReceiveTableLeaveMessage(_tables);
        Console.WriteLine($"User {userId} left Table {tableNumber}");
    }

    /// <summary>
    /// Assigns a waiter to a table and adds them to the SignalR group.
    /// </summary>
    public async Task AssignWaiterToTable(string waiterId, int tableNumber)
    {
        var httpWaiterId = Context.GetHttpContext()?.Request.Query["waiterid"].ToString() ?? string.Empty;
        var connectionId = Context.ConnectionId;

        var idx = tableNumber - 1;
        if (idx < 0 || idx >= _tables.Count)
        {
            await Clients.Caller.ReceiveWaiterAssignMessage($"Invalid table number: {tableNumber}", _tables);
            return;
        }

        var table = _tables[idx];

        // only assign if there is no waiter yet
        if (!string.IsNullOrEmpty(table.WaiterId))
        {
            await Clients.Caller.ReceiveWaiterAssignMessage($"Table {tableNumber} is already occupied by waiter {table.WaiterId}", _tables);
            return;
        }

        // assign the waiter
        table.WaiterId = waiterId;
        _tableToWaiter[tableNumber] = waiterId;

        // Add ALL waiter connections to the group
        await AddWaiterToTableGroup(waiterId, tableNumber);

        // broadcast
        await Clients.All.ReceiveWaiterAssignMessage($"Waiter {waiterId} joined Table {tableNumber}", _tables);
        Console.WriteLine($"Waiter {waiterId} joined Table {tableNumber}");

        // track this connection
        _waiterConnections[connectionId] = waiterId;
        _waiterids2sid.AddOrUpdate(waiterId, new HashSet<string> { connectionId }, (key, set) => { set.Add(connectionId); return set; });
    }

    /// <summary>
    /// Sends the order for a table to the waiter who requested it.
    /// </summary>
    public async Task PeakOrder(int tableNumber)
    {
        var order = _orders[tableNumber - 1];

        if (order == null)
        {
            Console.WriteLine($"No order found for Table {tableNumber}");
            return;
        }
        // Only send to the caller (the waiter who asked)
        await Clients.Caller.SendOrder(order);
        Console.WriteLine($"Order for Table {tableNumber} sent to waiter.");
    }

    /// <summary>
    /// Retrieves the user needs messages for a table.
    /// </summary>
    public async Task GetUserNeeds(int tableNumber)
    {
        if (tableToNeeds.TryGetValue(tableNumber.ToString(), out var needs))
        {
            await Clients.Caller.ReceiveMessagesToWaiter(needs.messages ?? Array.Empty<string>());
        }
        else
        {
            await Clients.Caller.ReceiveSuccessOrFail("No messages found for this table.");
        }
    }

    /// <summary>
    /// Retrieves a list of quick messages from the message collection in MongoDB and sends them to the caller.
    /// </summary>
    public async Task GetQuickMsgs()
    {
        var msgs = await FetchMessages();
        await Clients.Caller.ReceiveQuickMessageList(msgs);
    }

    /// <summary>
    /// Removes a waiter from a table and updates all clients about the table's updated status.
    /// </summary>
    public async Task StopWaitingTable(int tableNumber)
    {
        var waiterId = Context.GetHttpContext()?.Request.Query["waiterid"].ToString() ?? string.Empty;

        _tables[tableNumber - 1].WaiterId = string.Empty;

        // Remove ALL waiter connections from the table group
        await RemoveWaiterFromTableGroup(waiterId, tableNumber);

        await Clients.All.ReceiveWaiterLeaveMessage(_tables);
        Console.WriteLine($"Waiter {waiterId} left Table {tableNumber}");
    }

    /// <summary>
    /// Marks a meal order as ready and sends a message to all users at the table and the waiter with the order details.
    /// </summary>
    public async Task MarkOrderAsReady(int tableNumber)
    {
        Console.WriteLine($"Marking order for Table {tableNumber} as ready");
        var order = _orders[tableNumber - 1];
        if (order != null && order.Orders != null)
        {
            Console.WriteLine($"Order for Table {tableNumber} marked as ready: {order.Orders.Length} items");
            order.IsReady = true;

            // Notify everyone in the table group (users + waiter connections added earlier)
            await Clients.Group(tableNumber.ToString()).ReceiveOrderReadyMessage(order, tableNumber);
            Console.WriteLine($"Order for Table {tableNumber} ready event broadcast to group.");
            var userOnTable = _tables[tableNumber - 1].UserId;
            string userEmail = _userCollection.Find(x => x.Id == userOnTable).FirstOrDefault()?.Email ?? string.Empty;
            string emailBody = GenerateEmailRecieptString(order);
            await _emailService.SendEmailAsync(userEmail, $"Order for Table {tableNumber} at {DateTime.Now}", emailBody);
        }
        else
        {
            Console.WriteLine($"No order found for Table {tableNumber}");
        }
    }

    /// <summary>
    /// Handles the disconnection of a client from the server.
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var sid = Context.ConnectionId;
        var httpContext = Context.GetHttpContext();

        if (_userConnections.TryGetValue(sid, out string? userMongoId))
        {
            _userConnections.TryRemove(sid, out _);

            if (_userids2sid.TryGetValue(userMongoId, out var sids))
            {
                sids.Remove(sid);
                if (sids.Count == 0) _userids2sid.TryRemove(userMongoId, out _);
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

            // Clear waiter assignment on tables that reference this waiter
            _tables.ForEach(t =>
            {
                if (t.WaiterId == waiterMongoId)
                {
                    t.WaiterId = string.Empty;
                }
            });
            Console.WriteLine("Waiter left all tables");
        }
        else if (_ownerConnections.ContainsKey(sid))
        {
            _ownerConnections.TryRemove(sid, out _);
        }
        else
        {
            Console.WriteLine("Connection not found");
            return;
        }

        Console.WriteLine($"Disconnected: {sid}");
        await Clients.All.ReceiveTableLeaveMessage(_tables);
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Asynchronously fetches a list of quick messages from the message collection in the database.
    /// </summary>
    /// <returns>A task that represents the asynchronous operation, containing a list of QuickMessage objects.</returns>
    private async Task<List<QuickMessage>> FetchMessages()
    {
        var msgs = await _messageCollection.Find(_ => true).ToListAsync();
        return msgs;
    }
    /// <summary>
    /// Generates an HTML email receipt for a given order.
    /// </summary>
    /// <param name="order">The order containing details of the items purchased.</param>
    /// <returns>A string representing the HTML structure of the email receipt.</returns>
    /// <remarks>
    /// If the order is null or contains no items, a message indicating no orders are found is returned.
    /// The HTML includes a styled table listing each meal item with its quantity, price, and line total,
    /// along with the overall total price of the order. The currency is formatted in shekels (₪).
    /// </remarks>
    private string GenerateEmailRecieptString(Order order)
    {
        if (order == null || order.Orders == null || order.Orders.Length == 0)
        {
            return "No orders found.";
        }

        // Currency helper (₪). Switch if you need locale-based formatting.
        static string Money(decimal val) => $"{val:0.00} ₪";

        var sbRows = new StringBuilder();

        foreach (var line in order.Orders)
        {
            var name = WebUtility.HtmlEncode(line?.Meal?.MealName ?? "Item");
            var qty = line?.Quantity ?? 0;

            decimal price = 0m;
            try
            {
                if (line?.Meal != null)
                    price = Convert.ToDecimal(line.Meal.Price, CultureInfo.InvariantCulture);
            }
            catch { /* fallback stays 0m */ }

            var lineTotal = price * qty;

            sbRows.Append($@"
          <tr>
            <td class=""item"">{name}</td>
            <td class=""qty"">x{qty}</td>
            <td class=""price"">{Money(price)}</td>
            <td class=""line"">{Money(lineTotal)}</td>
          </tr>");
        }

        // Compute total if the Order.Total isn't reliable
        decimal computedTotal = 0m;
        try
        {
            computedTotal = order.Orders.Sum(p =>
            {
                decimal pprice = 0m;
                try
                {
                    if (p?.Meal != null)
                        pprice = Convert.ToDecimal(p.Meal.Price, CultureInfo.InvariantCulture);
                }
                catch { /* 0m */ }

                return pprice * (p?.Quantity ?? 0);
            });
        }
        catch { /* leave as 0m */ }

        decimal total;
        try
        {
            total = order.Total > 0 ? Convert.ToDecimal(order.Total, CultureInfo.InvariantCulture) : computedTotal;
        }
        catch
        {
            total = computedTotal;
        }

        var safeTable = WebUtility.HtmlEncode(order.TableNumber.ToString(CultureInfo.InvariantCulture));

        var html = $@"
<!DOCTYPE html>
<html lang=""en"">
<head>
  <meta charset=""utf-8"" />
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
  <title>Your order is ready</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      background: #f6f6f6;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #222;
    }}
    .wrap {{
      max-width: 560px;
      margin: 24px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #eaeaea;
    }}
    .header {{
      background: #111827;
      color: #fff;
      padding: 16px 20px;
    }}
    .header h1 {{
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }}
    .meta {{
      padding: 12px 20px 0 20px;
      font-size: 13px;
      color: #6b7280;
    }}
    .content {{
      padding: 12px 20px 20px 20px;
    }}
    .table {{
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }}
    .table th {{
      background: #f3f4f6;
      text-align: left;
      padding: 10px;
      font-size: 13px;
      border-bottom: 1px solid #e5e7eb;
    }}
    .table td {{
      padding: 10px;
      font-size: 14px;
      border-bottom: 1px solid #f3f4f6;
      vertical-align: top;
    }}
    .item {{ width: 55%; }}
    .qty  {{ width: 10%; white-space: nowrap; }}
    .price{{ width: 15%; white-space: nowrap; text-align: right; }}
    .line {{ width: 20%; white-space: nowrap; text-align: right; }}
    .total-row {{
      margin-top: 16px;
      font-size: 16px;
      font-weight: 700;
      text-align: left;
    }}
    .footer {{
      padding: 14px 20px 18px 20px;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #f3f4f6;
    }}
    .badge {{
      display: inline-block;
      padding: 3px 8px;
      font-size: 12px;
      border-radius: 9999px;
      background: #16a34a;
      color: #fff;
      font-weight: 600;
      vertical-align: middle;
    }}
  </style>
</head>
<body>
  <div class=""wrap"">
    <div class=""header"">
      <h1>Your order is ready ✅</h1>
    </div>

    <div class=""meta"">
      <div>Table: <strong>#{safeTable}</strong></div>
      <div>Status: <span class=""badge"">READY</span></div>
    </div>

    <div class=""content"">
      <table class=""table"" role=""presentation"" cellspacing=""0"" cellpadding=""0"">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th style=""text-align:right"">Price</th>
            <th style=""text-align:right"">Total For Meal</th>
          </tr>
        </thead>
        <tbody>
          {sbRows}
        </tbody>
      </table>

      <div class=""total-row"">Total: {Money(total)}</div>
    </div>

    <div class=""footer"">
      Thanks for dining with us! If you have any questions, reply to this email.
    </div>
  </div>
</body>
</html>";

        return html;
    }
}
