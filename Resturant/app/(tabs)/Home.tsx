import { ThemedView } from '@/components/ThemedView';
import React, { useState, useEffect } from 'react';
import { StyleSheet,  Dimensions , ScrollView, ToastAndroid} from 'react-native';
import TableCard from '@/components/TableCard';
import axios from 'axios';
import ip from '@/Data/Addresses';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as signalR from '@microsoft/signalr';
import LogoutButton from '@/components/LogoutButton';
import { TableProps } from '@/components/TableCard';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@/Routes/NavigationTypes';
import { Order } from "@/Types/Order";
import { Connection } from '@/Data/Hub';
import ShowMessageOnPlat from '@/components/ui/ShowMessageOnPlat';
import CurvedButton from '@/components/ui/CurvedButton';

const screenWidth = Dimensions.get("window").width;
const numColumns = screenWidth > 600 ? 3 : 2; // Use 3 columns on larger screens, otherwise 2
const cardWidth = Math.max((screenWidth / numColumns) - 30, 150); // Ensure cards don't get too small

/**
 * The main page of the app, displaying a grid of tables and allowing the user to assign themselves to a table or leave a table.
 *
 * @returns A JSX element representing the main page of the app.
 */
export default function MainPage() {
  const [tables, setTables] = useState<TableProps[]>([]);
  const [signalRConnection, setSignalRConnection] = useState<signalR.HubConnection | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [orders, setOrders] = useState<Order[] | null>([]);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    /**
     * Fetches the list of tables from the server and updates the state.
     * If the response is successful (200), the tables are stored in the state
     * If there is an error, an alert is displayed to the user
     */
    const fetchTables = async () => {
      const token = await AsyncStorage.getItem("token");
      try {
        const res = await axios.get(`http://${ip.julian}:5256/api/user/tables`, {
          headers: { "x-auth-token": token },
        });
        if (res && res.status === 200) {
          setTables(res.data.tables);
          setOrders(new Array(res.data.tables.length).fill([]));
        }
      } catch (e) {
        alert(e);
      }
    };

/**
 * Fetches the current user's information from AsyncStorage and establishes a connection.
 * If the user data is found, it parses the data and sets the user ID state.
 * It also connects using the user's ID.
 * If no user data is found, it displays an alert notifying the user.
 *
 * @returns {Promise<void>}
 */

    const fetchUser = async () => {
      const user = await AsyncStorage.getItem("user");
      if (user) {
        const u = JSON.parse(user);
        setUserId(u.id);
        setUserName(u.name);
        alert(`Welcome ${u.name}`);
        connect(u.id, u.name ?? ""); // Connect to the SignalR hub with the user ID and name
      } else {
        alert("No user found");
      }
    };

    fetchUser();
    fetchTables();
  }, []);

  useEffect(() => {
    if (!signalRConnection) return;

  /**
   * Registers listeners for the SignalR hub.
   *
   * Listeners are registered for the following events:
   * - "ConnectNotification": When a user connects to the server, their session ID is stored in AsyncStorage and the tables state is updated.
   * - "ReceiveTableMessage": When a user joins or leaves a table, the tables state is updated and a Toast notification is displayed.
   * - "ReceiveTableLeaveMessage": When a user leaves a table, the tables state is updated.
   * - "ReceiveOrderReadyMessage": When an order is ready for a table, the order is added to the orders state and a Toast notification is displayed.
   */
    const registerListeners = () => {
      signalRConnection.off("ConnectNotification");
      signalRConnection.on("ConnectNotification", async (sid: string, isOkay: boolean, tables: TableProps[]) => {
        if (isOkay) {
          ShowMessageOnPlat("Connected to the server");
          await AsyncStorage.setItem("sid", sid);
          setTables(tables);
        }
      });

      signalRConnection.off("ReceiveTableMessage");
      signalRConnection.on("ReceiveTableMessage", (message: string, isOkay: boolean, userId: string, tableNumber: number, tables: TableProps[]) => {
        if (isOkay) {
          setTables(tables);
          ShowMessageOnPlat(`Table ${tableNumber} is now occupied by user ${userId}`);
          
        }
      });

      signalRConnection.off("ReceiveTableLeaveMessage");
      signalRConnection.on("ReceiveTableLeaveMessage", (tables: TableProps[]) => {
        setTables(tables);
      });

      signalRConnection.off("ReceiveOrderReadyMessage");
      signalRConnection.on("ReceiveOrderReadyMessage", (order: Order, tableNumber: number) => {
        if (order) {
          setOrders(prevOrders => {
            const updatedOrders = [...(prevOrders ?? [])];
            updatedOrders[order.tableNumber - 1] = order;
            ShowMessageOnPlat(`Order is ready at table ${tableNumber}`);
            return updatedOrders;
          });
        }
      });
    };

    registerListeners();

    return () => {
      // Cleanup to avoid memory leaks or duplicate listeners
      signalRConnection.off("ConnectNotification");
      signalRConnection.off("ReceiveTableMessage");
      signalRConnection.off("ReceiveTableLeaveMessage");
      signalRConnection.off("ReceiveOrderReadyMessage");
    };
  }, [signalRConnection]);

  /**
   * Establishes a connection to the SignalR hub with the given user ID.
   *
   * If the connection is successful, it stores the connection in the component's state and displays a Toast notification.
   * If the connection fails, it displays an alert with the error message.
   * @param {string} id - The user ID to use for the connection.
   */
  const connect = async (id: string, name: string) => {
    if (!id) return;

   
    try {
      const connection = await Connection.connectHub(id, "user", name);
      if(!connection) {
        alert("Failed to establish SignalR connection");
        return;

      }
      if(connection.state === "Connected"){
        ShowMessageOnPlat("Connected to the server");
      }
      setSignalRConnection(connection);
      Connection.setHub(connection);
    } catch (error) {
      console.error("SignalR connection error:", error);
    }
  };

  /**
   * Assigns a user to a table and navigates to the menu screen.
   * @param {string} userId - The ID of the user to assign to the table.
   * @param {number} tableNumber - The number of the table to assign the user to.
   * @throws {Error} If the user is already assigned to a table.
   */
  const handleAssignUserToTable = async (userId: string, tableNumber: number) => {
    try {
      const existingTable = tables.find(t => t.userId === userId && t.tableNumber !== tableNumber);
      if (existingTable) {
        ShowMessageOnPlat(`Already seated at table ${existingTable.tableNumber}. Cannot occupy another table.`);
        return;
      }

      signalRConnection?.invoke("AssignUserToTable", userId, tableNumber);
      navigation.navigate("Menu", { tableNumber });
    } catch (err) {
      ShowMessageOnPlat("Failed to assign user to table");
    }
  };

  /**
   * Leaves a table and updates the tables state.
   * @param {number} tableNumber - The number of the table to leave.
   * @throws {Error} If the user is not assigned to the table or if the connection to the hub fails.
   */
  const handleLeaveTable = async (tableNumber: number) => {
    try {
      if(signalRConnection){
        signalRConnection.invoke("LeaveTable", tableNumber);
        signalRConnection.on("ReceiveTableLeaveMessage", (tables: TableProps[]) => {
          setTables(tables);
          ShowMessageOnPlat(`Left table ${tableNumber}`);
        });
      }
      
    } catch (err) {
      ShowMessageOnPlat("Failed to leave table");
    }
  };

  return (
    <ThemedView style={styles.wrapper}>
      <LogoutButton action={async () => await signalRConnection?.stop()} />
        <CurvedButton title="View Menu" action={() => navigation.navigate("Menu",{tableNumber: -1})} 
          style={{backgroundColor:"rgb(153, 0, 255)", alignSelf:"center",marginTop:10}}/>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={true}>
        <ThemedView style={styles.gridContainer}>
          {signalRConnection != null && tables.length > 0 &&
            tables.map((table, index) => (
              <TableCard
                key={index}
                width={cardWidth}
                tableNumber={table.tableNumber}
                isOccupied={table.isOccupied}
                isWindowSide={table.isWindowSide}
                userId={table.userId ?? ""}
                waiterId={table.waiterId ?? ""}
                capacity={table.capacity}
                hub={signalRConnection}
                onAssignUserToTable={async () => await handleAssignUserToTable(userId, table.tableNumber)}
                onLeaveTable={async (tableNumber) => await handleLeaveTable(tableNumber)}
              />
            ))}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}


const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        paddingTop: 50,
      },
      container: {
        paddingTop: 20,
        paddingHorizontal: 20, // Add padding to prevent edge cramping
        paddingBottom: 20,

      },
      gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between', // Space items evenly
        gap: 15, // Add gap between items
      },
    text:{
        fontSize: 25,
        fontWeight: 'bold',
        height: 'auto',
        width: 'auto',
    },
});