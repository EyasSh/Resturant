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
    /**
     * Fetches the current waiter from AsyncStorage and updates the component's state.
     * 
     * @async
     * @returns {Promise<void>} A Promise that resolves when the waiter data is successfully
     * fetched and updated in the state, or rejects with an error if the request fails.
     * 
     * @remarks
     * This function retrieves the authentication token from AsyncStorage and uses it
     * to make an authorized GET request to the server. Upon successful response, it
     * maps the waiter's data to ensure proper handling of various field names and updates
     * the state with the waiter. If an error occurs, it is caught and handled.
     */
    const fetchWaiter = async () => {
      try {
        const waiterData = await AsyncStorage.getItem('waiter');
        if (waiterData) setWaiter(JSON.parse(waiterData));
      } catch (error) { alert(error); }
    };
    fetchWaiter();
  }, []);

  useEffect(() => {
    /**
     * Initializes the SignalR connection for the current waiter, and sets up
     * all the event handlers for the various hub events.
     * 
     * @async
     * @returns {Promise<void>} A Promise that resolves when the connection is successfully
     * established and all event handlers are set up.
     * 
     * @remarks
     * If the waiter is not logged in, or if there is an error in establishing the connection,
     * the function does nothing.
     */
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

/**
 * Handles the connection notification event.
 * 
 * @param {string} sid - The session ID assigned by the server.
 * @param {boolean} isOkay - Indicates if the connection was successful.
 * @param {TableProps[]} _tables - The array of table properties received from the server.
 * 
 * @remarks
 * If the connection is successful, stores the session ID in AsyncStorage,
 * updates the state with the tables information, and displays a success message.
 * If the connection is not successful, the function returns early without any actions.
 */
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

        /**
         * Handles the table message event.
         * 
         * @param {string} message - The message sent by the server.
         * @param {boolean} isOkay - Indicates if the operation was successful.
         * @param {string} userId - The MongoDB user ID for the user who occupied the table.
         * @param {number} tableNumber - The table number that was occupied.
         * @param {TableProps[]} _tables - The array of table properties received from the server.
         * 
         * @remarks
         * If the operation is not successful, displays the error message.
         * If the operation is successful, updates the state with the tables information and displays a success message.
         */
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

        /**
         * Handles the waiter assignment event.
         * 
         * @param {string} message - The message sent by the server.
         * @param {TableProps[]} _tables - The array of table properties received from the server.
         * 
         * @remarks
         * If the message indicates that the table is already occupied by another waiter, displays the error message.
         * If the message is successful, updates the state with the tables information.
         */
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
        /**
         * Handles the waiter leave event.
         * 
         * @param {TableProps[]} _tables - The array of table properties received from the server.
         * 
         * @remarks
         * Updates the state with the tables information.
         */
        const onReceiveWaiterLeaveMessage = (_tables : TableProps[]) => {
          setTables(_tables.map((t) => ({
            tableNumber: t.tableNumber,
            waiterid: t.waiterId,
            isOccupied: t.isOccupied,
            userName: t.userName,
          })));
        }
        /**
         * Handles the updating of the state when a user leaves a table.
         * 
         * @param {TableProps[]} _tables - The array of table properties received from the server.
         * 
         * @remarks
         * Updates the state with the tables information.
         */
        const onReceiveTableLeaveMessage = (_tables: TableProps[]) => {
          setTables(_tables.map((t) => ({
            tableNumber: t.tableNumber,
            waiterid: t.waiterId,
            isOccupied: t.isOccupied,
            userName: t.userName,
          })));
        };

/**
 * Handles the reception of incoming orders.
 * 
 * @param {Order[]} incoming - An array of incoming order objects.
 * 
 * @remarks
 * If the incoming orders array is not empty, updates the state with the new orders
 * and stores them in AsyncStorage. If an error occurs during storage, it is caught and ignored.
 */
        const onReceiveOrders = (incoming: Order[]) => {
          if (!incoming?.length) return;
          setOrders(incoming);
          AsyncStorage.setItem('orders', JSON.stringify(incoming)).catch(() => {});
        };

        /**
         * Handles the sending of an order to the server.
         * 
         * @param {Order} order - The order object to be sent.
         * 
         * @remarks
         * If the order is null or undefined, does nothing.
         * Otherwise, updates the state with the new order and stores it in AsyncStorage.
         * If an error occurs during storage, it is caught and ignored.
         * If the order is for the table that was previously requested, navigates to the OrderPeak screen
         * and resets the pending table number to null.
         */
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

        /**
         * Handles the reception of the order ready message from the server.
         * 
         * @param {Order} order - The order object that has been marked as ready.
         * @param {number} tblNum - The table number associated with the order.
         * 
         * @remarks
         * If the order is null or undefined, does nothing.
         * Otherwise, updates the state with the new order and stores it in AsyncStorage.
         * If an error occurs during storage, it is caught and ignored.
         * Shows a toast message indicating that the order for the table is ready.
         * Customer devices handle nuking their own AsyncStorage["order"] when they receive this.
         */
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

  /**
   * Handles the event when the waiter wants to view an order from a table.
   * 
   * @param {number} tableNumber - The table number associated with the order.
   * 
   * @remarks
   * If no SignalR connection is established, does nothing.
   * Otherwise, sets the current pending table number to the table number and
   * invokes the 'PeakOrder' method on the SignalR connection with the table number
   * as the argument. If an error occurs during invocation, it is caught and ignored.
   */
  const handlePeakOrder = (tableNumber: number) => {
    if (!signalRConnection) return;
    pendingPeakTableRef.current = tableNumber;
    signalRConnection.invoke('PeakOrder', tableNumber).catch(() => {});
  };

  /**
   * Handles the event when the waiter wants to wait a table.
   * 
   * @param {number} tableNumber - The table number associated with the order.
   * 
   * @remarks
   * If no SignalR connection is established, does nothing.
   * Otherwise, invokes the 'AssignWaiterToTable' method on the SignalR connection with
   * the waiter's ID and the table number as arguments. If an error occurs during invocation,
   * it is caught and ignored.
   */
  const handleWaitTable = (tableNumber: number) => {
    if (!signalRConnection) return;
    signalRConnection.invoke('AssignWaiterToTable', waiter?.id, tableNumber).catch(() => {});
  };

/**
 * Handles the event when the waiter wants to leave a table.
 * 
 * @param {number} tableNumber - The table number associated with the order.
 * 
 * @remarks
 * If no SignalR connection is established, does nothing.
 * Otherwise, invokes the 'StopWaitingTable' method on the SignalR connection with
 * the table number as an argument. If an error occurs during invocation, it is caught
 * and ignored.
 */
  const handleLeaveTable = (tableNumber: number) => {
    if (!signalRConnection) return;
    signalRConnection.invoke('StopWaitingTable', tableNumber).catch(() => {});
  };

  /**
   * Handles the event when the waiter wants to view the peak needs for a table.
   * 
   * @param {number} tableNumber - The table number associated with the order.
   * 
   * @remarks
   * Navigates to the 'PeakNeeds' screen with the table number as a parameter.
   */
  const handlePeakNeeds = (tableNumber: number) => {
    navigation.navigate('PeakNeeds', { tableNumber });
  };

  /**
   * Handles the event when the waiter wants to mark an order as ready.
   * 
   * @param {number} tableNumber - The table number associated with the order.
   * 
   * @remarks
   * If no SignalR connection is established, does nothing.
   * Otherwise, invokes the 'MarkOrderAsReady' method on the SignalR connection with
   * the table number as an argument. If an error occurs during invocation, it is caught
   * and ignored.
   */
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
