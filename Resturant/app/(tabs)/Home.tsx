import { ThemedView } from '@/components/ThemedView';
import React, { useState, useEffect } from 'react';
import { StyleSheet,  Dimensions , ScrollView } from 'react-native';
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
const numColumns = screenWidth > 600 ? 3 : 2;
const cardWidth = Math.max((screenWidth / numColumns) - 30, 150);

export default function MainPage() {
  const [tables, setTables] = useState<TableProps[]>([]);
  const [signalRConnection, setSignalRConnection] = useState<signalR.HubConnection | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
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
        setUserName(u.name);
        connect(u.id, u.name ?? "");
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
 * Registers SignalR event listeners for handling various server notifications.
 * 
 * The listeners handle the following events:
 * 
 * - "ConnectNotification": Updates the table state and stores the session ID 
 *   in AsyncStorage upon successful connection.
 * 
 * - "ReceiveTableMessage": Updates the table state and displays a message when 
 *   a user occupies a table.
 * 
 * - "ReceiveTableLeaveMessage": Updates the table state when a user leaves a 
 *   table.
 * 
 * - "ReceiveOrderReadyMessage": Clears order information from AsyncStorage when 
 *   an order is ready, and writes a tombstone to prevent stale restores.
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
    signalRConnection.on(
      "ReceiveTableMessage",
      (message: string, isOkay: boolean, userId: string, tableNumber: number, tables: TableProps[]) => {
        if (isOkay) {
          setTables(tables);
          ShowMessageOnPlat(`Table ${tableNumber} is now occupied by user ${userId}`);
        }
      }
    );

    signalRConnection.off("ReceiveTableLeaveMessage");
    signalRConnection.on("ReceiveTableLeaveMessage", (tables: TableProps[]) => {
      setTables(tables);
    });

    // 🔧 Re-engineered: make Home nuke storage exactly like Menu does + add a tombstone
    signalRConnection.off("ReceiveOrderReadyMessage");
    signalRConnection.on("ReceiveOrderReadyMessage", async (order: Order, tableNumber: number) => {
      try {
        // Only clear if the saved order matches this table
        const raw = await AsyncStorage.getItem("order");
        if (raw) {
          const local: Order = JSON.parse(raw);
          if (local.tableNumber === order.tableNumber) {
            await AsyncStorage.removeItem("order");

            // Verify removal; if some race re-wrote it, force an empty/ready object
            const check = await AsyncStorage.getItem("order");
            if (check) {
              const tombstone: Order = {
                tableNumber: order.tableNumber,
                orders: [],
                total: 0,
                isReady: true,
              };
              await AsyncStorage.setItem("order", JSON.stringify(tombstone));
            }
          }
        }

        // Write a tombstone (defensive): if Menu mounts later, it can choose to ignore stale restores
        await AsyncStorage.setItem(
          "order:tombstone",
          JSON.stringify({ tableNumber: order.tableNumber, ts: Date.now() })
        );
      } catch {
        // swallow
      } finally {
        ShowMessageOnPlat(`Order is ready at table ${tableNumber}`);
      }
    });
  };

  registerListeners();

  return () => {
    signalRConnection.off("ConnectNotification");
    signalRConnection.off("ReceiveTableMessage");
    signalRConnection.off("ReceiveTableLeaveMessage");
    signalRConnection.off("ReceiveOrderReadyMessage");
  };
}, [signalRConnection]);


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
  wrapper: { flex: 1, paddingTop: 50 },
  container: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 20 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 15 },
  text:{ fontSize: 25, fontWeight: 'bold', height: 'auto', width: 'auto' },
});
