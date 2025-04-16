
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
import Toast from 'react-native-toast-message';

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
  const [orders, setOrders] = useState<Order[] | null>([]);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
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

    const fetchUser = async () => {
      const user = await AsyncStorage.getItem("user");
      if (user) {
        const u = JSON.parse(user);
        setUserId(u.id);
        connect(u.id);
      } else {
        alert("No user found");
      }
    };

    fetchUser();
    fetchTables();
  }, []);

  useEffect(() => {
    if (!signalRConnection) return;

    const registerListeners = () => {
      signalRConnection.off("ConnectNotification");
      signalRConnection.on("ConnectNotification", async (sid: string, isOkay: boolean, tables: TableProps[]) => {
        if (isOkay) {
          ToastAndroid.show("Connected to the server", ToastAndroid.CENTER);
          await AsyncStorage.setItem("sid", sid);
          setTables(tables);
        }
      });

      signalRConnection.off("ReceiveTableMessage");
      signalRConnection.on("ReceiveTableMessage", (message: string, isOkay: boolean, userId: string, tableNumber: number, tables: TableProps[]) => {
        if (isOkay) {
          setTables(tables);
          ToastAndroid.show(`Table ${tableNumber} is now occupied by user ${userId}`, ToastAndroid.CENTER);
          
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
            console.log(`Order is ready at table ${tableNumber}`, ToastAndroid.CENTER);
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

  const connect = async (id: string) => {
    if (!id) return;

   
    try {
      const connection = await Connection.connectHub(id, "user");
      if(!connection) {
        alert("Failed to establish SignalR connection");
        return;

      }
      if(connection.state === "Connected"){
        ToastAndroid.show("Connected to the server", ToastAndroid.SHORT);
      }
      setSignalRConnection(connection);
      Connection.setHub(connection);
    } catch (error) {
      console.error("SignalR connection error:", error);
    }
  };

  const handleAssignUserToTable = async (userId: string, tableNumber: number) => {
    try {
      const existingTable = tables.find(t => t.userId === userId && t.tableNumber !== tableNumber);
      if (existingTable) {
        ToastAndroid.show(`Already seated at table ${existingTable.tableNumber}. Cannot occupy another table.`, ToastAndroid.LONG);
        return;
      }

      signalRConnection?.invoke("AssignUserToTable", userId, tableNumber);
      navigation.navigate("Menu", { tableNumber });
    } catch (err) {
      ToastAndroid.show("Failed to assign user to table", ToastAndroid.CENTER);
    }
  };

  const handleLeaveTable = async (tableNumber: number) => {
    try {
      if(signalRConnection){
        signalRConnection.invoke("LeaveTable", tableNumber);
        signalRConnection.on("ReceiveTableLeaveMessage", (tables: TableProps[]) => {
          setTables(tables);
          ToastAndroid.show(`Left table ${tableNumber}`, ToastAndroid.CENTER);
        });
      }
      
    } catch (err) {
      ToastAndroid.show("Failed to leave table", ToastAndroid.CENTER);
    }
  };

  return (
    <ThemedView style={styles.wrapper}>
      <LogoutButton action={async () => await signalRConnection?.stop()} />
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