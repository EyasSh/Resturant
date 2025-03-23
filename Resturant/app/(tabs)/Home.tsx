import { useTheme } from '@react-navigation/native';
import Logo from "@/components/ui/Logo";import { ThemedText } from '@/components/ThemedText';
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


const screenWidth = Dimensions.get("window").width;
const numColumns = screenWidth > 600 ? 3 : 2; // Use 3 columns on larger screens, otherwise 2
const cardWidth = Math.max((screenWidth / numColumns) - 30, 150); // Ensure cards don't get too small

export default function MainPage() {
  const [tables, setTables] = useState<TableProps[]>([]);
  const [signalRConnection, setSignalRConnection] = useState<signalR.HubConnection | null>(null);
  const [userId, setUserId] = useState<any | null>(null);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const fetchTables = async () => {
      const token = await AsyncStorage.getItem('token');
      try {
        const res = await axios.get(`http://${ip.julian}:5256/api/user/tables`, {
          headers: { 'x-auth-token': token }
        });
        if (res && res.status === 200) {
          setTables(res.data.tables);
        }
      } catch (e) {
        alert(e);
      }
    };

    const fetchUser = async () => {
      let user = await AsyncStorage.getItem('user');
      if (user) {
        let u = JSON.parse(user);
        setUserId(u.id);
        connect(u.id);
      } else {
        alert("No user found");
      }
    };

    const connect = async (id: string) => {
      if (!id) return;

      const connection = new signalR.HubConnectionBuilder()
        .withUrl(`http://${ip.julian}:5256/hub?userid=${id}&privilagelevel=user`)
        .build();

      try {
        await connection.start();
        setSignalRConnection(connection);

        connection.off("ConnectNotification");
        connection.on("ConnectNotification", async (sid: string, isOkay: boolean, tables: TableProps[]) => {
          if (isOkay) {
            alert('Session established');
            await AsyncStorage.setItem('sid', sid);
            setTables(tables);
          }
        });

        connection.on("ReceiveTableMessage", (message: string, isOkay: boolean, userId: string, tableNumber: number, tables: TableProps[]) => {
          if (isOkay) {
            setTables(tables);
            console.log(`Table update: ${message}`);
          }
        });
      } catch (error) {
        console.error('SignalR connection error:', error);
      }
    };

    fetchUser();
    fetchTables();
  }, []);

  // ✅ Assign table handler
  const handleAssignUserToTable = async (userId: string, tableNumber: number) => {
    try {
      await signalRConnection?.invoke("AssignUserToTable", userId, tableNumber);
      navigation.navigate('Menu');
    } catch (err) {
      console.error("Failed to assign user to table", err);
    }
  };

  // ✅ Leave table handler
  const handleLeaveTable = async (userId: string, tableNumber: number) => {
    try {
      // Here you could also notify via SignalR if needed
      setTables(prev =>
        prev.map(table =>
          table.tableNumber === tableNumber
            ? { ...table, isOccupied: false, userId: "" }
            : table
        )
      );
    } catch (err) {
      console.error("Failed to leave table", err);
    }
  };

  return (
    <ThemedView style={styles.wrapper}>
      <LogoutButton action={async () => await signalRConnection?.stop()} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={true}>
        <ThemedView style={styles.gridContainer}>
          {signalRConnection && tables.length > 0 &&
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
                onAssignUserToTable={handleAssignUserToTable}
                onLeaveTable={handleLeaveTable}
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