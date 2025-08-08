import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, ToastAndroid, ScrollView } from 'react-native';
import LogoutButton from '@/components/LogoutButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as signalR from '@microsoft/signalr';
import { NavigationProp } from '@/Routes/NavigationTypes';
import { useNavigation } from '@react-navigation/native';
import WaiterTableCard from '@/components/WaiterTableCard';
import { WaiterTableProps } from '@/Types/WaiterTableProps';
import { TableProps } from '@/components/TableCard';
import { Order } from '@/Types/Order';
import { Connection } from '@/Data/Hub';
import ShowMessageOnPlat from '@/components/ui/ShowMessageOnPlat';

type Waiter = { id: string; name: string; email: string; phone: string };

export default function Waiter() {
  const [waiter, setWaiter] = useState<Waiter | null>(null);
  const [signalRConnection, setSignalRConnection] = useState<signalR.HubConnection | null>(null);
  const [tables, setTables] = useState<WaiterTableProps[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const navigation = useNavigation<NavigationProp>();
  const pendingPeakTableRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchWaiter = async () => {
      try {
        const waiterData = await AsyncStorage.getItem('waiter');
        if (waiterData) setWaiter(JSON.parse(waiterData));
      } catch (error) { alert(error); }
    };
    fetchWaiter();
  }, []);

  useEffect(() => {
    const initSignalR = async () => {
      if (!waiter?.id) return;
      try {
        const connection = await Connection.connectHub(waiter.id, 'waiter');
        if (!connection) return;

        connection.off('ConnectNotification');
        connection.off('ReceiveOrders');
        connection.off('ReceiveTableMessage');
        connection.off('ReceiveWaiterAssignMessage');
        connection.off('ReceiveTableLeaveMessage');
        connection.off('SendOrder');
        connection.off('ReceiveOrderReadyMessage');

        const onConnectNotification = async (sid: string, isOkay: boolean, _tables: TableProps[]) => {
          if (!isOkay) return;
          await AsyncStorage.setItem('sid', sid);
          setTables(_tables.map((t) => ({
            tableNumber: t.tableNumber,
            waiterid: t.waiterId,
            isOccupied: t.isOccupied,
            userName: t.userName,
          })));
          ShowMessageOnPlat('Connected to the server');
        };

        const onReceiveTableMessage = (
          message: string, isOkay: boolean, userId: string, tableNumber: number, _tables: TableProps[]
        ) => {
          if (!isOkay) { ShowMessageOnPlat(message); return; }
          setTables(_tables.map((t) => ({
            tableNumber: t.tableNumber,
            waiterid: t.waiterId,
            isOccupied: t.isOccupied,
            userName: t.userName,
          })));
          ShowMessageOnPlat(`Table ${tableNumber} is now occupied by ${userId}`);
        };

        const onReceiveWaiterAssignMessage = (message: string, _tables: TableProps[]) => {
          if (message.includes('Table is already occupied by waiter')) {
            ShowMessageOnPlat(message);
          }
          setTables(_tables.map((t) => ({
            tableNumber: t.tableNumber,
            waiterid: t.waiterId,
            isOccupied: t.isOccupied,
            userName: t.userName,
          })));
        };
        const onReceiveWaiterLeaveMessage = (_tables : TableProps[]) => {
          setTables(_tables.map((t) => ({
            tableNumber: t.tableNumber,
            waiterid: t.waiterId,
            isOccupied: t.isOccupied,
            userName: t.userName,
          })));
        }
        const onReceiveTableLeaveMessage = (_tables: TableProps[]) => {
          setTables(_tables.map((t) => ({
            tableNumber: t.tableNumber,
            waiterid: t.waiterId,
            isOccupied: t.isOccupied,
            userName: t.userName,
          })));
        };

        const onReceiveOrders = (incoming: Order[]) => {
          if (!incoming?.length) return;
          setOrders(incoming);
          AsyncStorage.setItem('orders', JSON.stringify(incoming)).catch(() => {});
        };

        const onSendOrder = (order: Order) => {
          if (!order) return;
          setOrders((prev) => {
            const updated = [...prev];
            updated[order.tableNumber - 1] = order;
            AsyncStorage.setItem('orders', JSON.stringify(updated)).catch(() => {});
            return updated;
          });
          if (pendingPeakTableRef.current === order.tableNumber) {
            navigation.navigate('OrderPeak', { order });
            pendingPeakTableRef.current = null;
          }
        };

        const onReceiveOrderReadyMessage = (order: Order, tblNum: number) => {
          if (!order) return;
          setOrders((prev) => {
            const updated = [...prev];
            updated[order.tableNumber - 1] = order;
            AsyncStorage.setItem('orders', JSON.stringify(updated)).catch(() => {});
            return updated;
          });
          ToastAndroid.show(`Order for table ${tblNum} is ready`, ToastAndroid.SHORT);
          // Customer devices handle nuking their own AsyncStorage["order"] when they receive this.
        };

        connection.on('ConnectNotification', onConnectNotification);
        connection.on('ReceiveOrders', onReceiveOrders);
        connection.on('ReceiveTableMessage', onReceiveTableMessage);
        connection.on('ReceiveWaiterAssignMessage', onReceiveWaiterAssignMessage);
        connection.on('ReceiveTableLeaveMessage', onReceiveTableLeaveMessage);
        connection.on('SendOrder', onSendOrder);
        connection.on('ReceiveOrderReadyMessage', onReceiveOrderReadyMessage);
        connection.on('ReceiveWaiterLeaveMessage', onReceiveWaiterLeaveMessage);

        setSignalRConnection(connection);
      } catch (error) {
        console.error('SignalR connection error:', error);
      }
    };

    initSignalR();
  }, [waiter?.id, navigation]);

  const handlePeakOrder = (tableNumber: number) => {
    if (!signalRConnection) return;
    pendingPeakTableRef.current = tableNumber;
    signalRConnection.invoke('PeakOrder', tableNumber).catch(() => {});
  };

  const handleWaitTable = (tableNumber: number) => {
    if (!signalRConnection) return;
    signalRConnection.invoke('AssignWaiterToTable', waiter?.id, tableNumber).catch(() => {});
  };

  const handleLeaveTable = (tableNumber: number) => {
    if (!signalRConnection) return;
    signalRConnection.invoke('StopWaitingTable', tableNumber).catch(() => {});
  };

  const handlePeakNeeds = (tableNumber: number) => {
    navigation.navigate('PeakNeeds', { tableNumber });
  };

  const handleMarkOrderReady = (tableNumber: number) => {
    if (!signalRConnection) return;
    signalRConnection.invoke('MarkOrderAsReady', tableNumber).catch(() => {});
  };

  return (
    <ThemedView style={styles.safeArea}>
      <ThemedView>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <LogoutButton action={async () => await signalRConnection?.stop()} />
          <ThemedText style={styles.text}>Hello {waiter?.name}</ThemedText>

          {signalRConnection && tables.length > 0 ? (
            <>
              {tables.map((table) => (
                <WaiterTableCard
                  key={table.tableNumber}
                  tableNumber={table.tableNumber}
                  occupyAction={() => handleWaitTable(table.tableNumber)}
                  leaveAction={() => handleLeaveTable(table.tableNumber)}
                  peakOrderAction={() => handlePeakOrder(table.tableNumber)}
                  markOrderReadyAction={() => handleMarkOrderReady(table.tableNumber)}
                  peakNeedAction={() => handlePeakNeeds(table.tableNumber)}
                  isOccupied={table.isOccupied}
                  waiterid={table.waiterid}
                  setter={setTables}
                  userName={table.userName}
                />
              ))}
            </>
          ) : (
            <ThemedText>An error occurred or there are no tables.</ThemedText>
          )}
        </ScrollView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
  },
  text: { fontSize: 25, fontWeight: 'bold', marginBottom: 10, marginTop: 20 },
});
