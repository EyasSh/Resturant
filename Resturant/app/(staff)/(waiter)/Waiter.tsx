import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import {useEffect, useState} from 'react';
import { StyleSheet, ToastAndroid } from 'react-native';
import LogoutButton from '@/components/LogoutButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as signalR from '@microsoft/signalr';
import ip from '@/Data/Addresses';
import { NavigationProp } from '@/Routes/NavigationTypes';
import { useNavigation } from '@react-navigation/native';
import WaiterTableCard from '@/components/WaiterTableCard';
import { ScrollView} from 'react-native'
import { WaiterTableProps } from '@/Types/WaiterTableProps';
import { TableProps } from '@/components/TableCard';
import { Order } from '@/Types/Order';
import { Connection } from '@/Data/Hub';
import ShowMessageOnPlat from '@/components/ui/ShowMessageOnPlat';
type Waiter=
{
    id: string
    name: string
    email: string
    phone: string
}
/**
 * The Waiter component is the main screen for the waiter app.
 * It renders a logout button, a greeting for the waiter, and a list of 12 table cards.
 * When the component mounts, it attempts to connect to the SignalR hub with the waiter's ID.
 * If the connection is successful, it displays an alert and stores the SID in AsyncStorage.
 * If the connection fails, it logs the error to the console.
 * The component also includes two useEffect hooks. The first hook fetches the waiter's data from AsyncStorage
 * and sets the component's state. The second hook connects to the SignalR hub and sets the connection to the component's state.
 * The component re-renders when the waiter's ID changes.
 */
export default function Waiter() {
    const [waiter, setWaiter] = useState<Waiter | null>(null);
    const [signalRConnection, setSignalRConnection] = useState<signalR.HubConnection | null>(null);
    const navigation = useNavigation<NavigationProp>();
    const [tables, setTables] = useState<WaiterTableProps[]>([]);
    const [orders, setOrders]= useState<Order[]>([]);
    useEffect(() => {
        /**
         * Fetches the waiter's data from AsyncStorage and sets the component's state.
         * If the data is not available, it does nothing.
         * If the data is available but cannot be parsed as JSON, it displays an alert with the error.
         */
        const fetchWaiter = async () => {
            try {
                const waiterData = await AsyncStorage.getItem('waiter');
                if (waiterData) {
                    setWaiter(JSON.parse(waiterData));
                }
            } catch (error) {
                alert(error);
            }
        };
        fetchWaiter();
    }, []);

    useEffect(() => {
        // define an async init routine
        const initSignalR = async () => {
          if (!waiter?.id) {
            // bail out early if there's no waiter.id yet
            return;
          }
      
          try {
            const connection = await Connection.connectHub(waiter.id, "waiter");
            setSignalRConnection(connection);
            if(connection){
                // detach any old listeners
            connection.off("ConnectNotification");
            connection.off("ReceiveOrders");
      
            // register the new ones
            connection.on(
              "ConnectNotification",
              async (sid: string, isOkay: boolean, tables: TableProps[]) => {
                if (!isOkay) return;
                await AsyncStorage.setItem("sid", sid);

                setTables(
                  tables.map((t) => ({
                    tableNumber: t.tableNumber,
                    waiterid: t.waiterId,
                    isOccupied: t.isOccupied
                  }))
                  
                );
                ShowMessageOnPlat(tables[0].waiterId)
              }
            );
      
            connection.on("ReceiveOrders", (orders: Order[]) => {
              if (!orders?.length) return;
              setOrders(orders);
              AsyncStorage.setItem("orders", JSON.stringify(orders));
            });
            connection.on("ReceiveWaiterAssignMessage", (message: string, tables: TableProps[]) => {
              if (message.includes("Table is already occupied by waiter")) {
                ShowMessageOnPlat(message);
                setTables(
                  tables.map((t) => ({
                    tableNumber: t.tableNumber,
                    waiterid: t.waiterId,
                    isOccupied: t.isOccupied
                  }))
                );
                return;
              }
              setTables(
                tables.map((t) => ({
                  tableNumber: t.tableNumber,
                  waiterid: t.waiterId,
                  isOccupied: t.isOccupied
                }))
              );
            })
            connection?.on("ReceiveTableLeaveMessage", (tables: TableProps[]) => {
              setTables(
                tables.map((t) => ({
                  tableNumber: t.tableNumber,
                  waiterid: t.waiterId,
                  isOccupied: t.isOccupied
                })))
            })
            }
            
          } catch (error) {
            console.error("SignalR connection error:", error);
          }
        };
      
        // always call it—inside it you’ll early‑return if id’s missing
        initSignalR();
      
       
      }, [waiter?.id, tables, signalRConnection]);
      
    useEffect(()=>{
      ShowMessageOnPlat("Tables updated")
    },[tables]); //re-renders when table state changes
    useEffect(()=>{ShowMessageOnPlat("Orders updated")},[orders]); //re-renders when order state changes
    
    /**
    * Handles the peak order action.
    * This function is called when the waiter presses the "Peak Order" button.
    * It should be used to display the order for the waiter to see.
    */
    const handlePeakOrder =(tableNumber: number)=>{
        //Logic for getting the order by table number
        signalRConnection?.invoke("PeakOrder", tableNumber)
        signalRConnection?.on("SendOrder", (order: Order) => {
            try{
                setOrders(prevOrders => {
                    const updatedOrders = [...prevOrders];
                    updatedOrders[tableNumber - 1] = order; // newOrder is the order you received from the socket
                    return updatedOrders;
                  });
                  navigation.navigate("OrderPeak", {order: order});
                  
            }catch(error){
                alert(error)
            }finally{
                signalRConnection?.off("SendOrder")
            }
        })
        
    }

    /**
    * Handles the wait table action.
    * This function is called when the waiter presses the "Wait Table" button.
    * It should be used to start waiting at the table and send a request to the server to update the table's status.
    * @param tableNumber The number of the table to wait at.
    */
    const handleWaitTable = (tableNumber: number) => {
        signalRConnection?.invoke("AssignWaiterToTable", waiter?.id, tableNumber)
        signalRConnection?.on("ReceiveWaiterAssignMessage",(message:string, tables: TableProps[])=>{
          if(message.includes(`Table ${tableNumber} is already occupied by waiter`)){
            ShowMessageOnPlat(message);
            setTables(
              tables.map((t) => ({
                tableNumber: t.tableNumber,
                waiterid: t.waiterId,
                isOccupied: t.isOccupied
              }))
            );
            return;
          }
          setTables(
            tables.map((t) => ({
              tableNumber: t.tableNumber,
              waiterid: t.waiterId,
              isOccupied: t.isOccupied
            }))
          );
        })
        
    }
/**
 * Handles the action of leaving a table.
 * Invokes the server to stop waiting at the specified table and updates the table's state upon receiving a leave message.
 * @param {number} tableNumber - The number of the table to leave.
 */
    const handleLeaveTable = (tableNumber: number) => {
      signalRConnection?.invoke("StopWaitingTable", tableNumber)
      signalRConnection?.on("ReceiveTableLeaveMessage", (tables: TableProps[]) => {
        setTables(
          tables.map((t) => ({
            tableNumber: t.tableNumber,
            waiterid: t.waiterId,
            isOccupied: t.isOccupied
          })))
      })
    }
    /**
     * Handles the peak needs action.
     * This function is called when the waiter presses the "Peak Needs" button.
     * It should be used to navigate to the "PeakNeeds" screen and pass the table number as a parameter.
     * @param tableNumber The number of the table to peak needs at.
     */
    const handlePeakNeeds = (tableNumber: number) => {
        navigation.navigate("PeakNeeds", { tableNumber });
    }
    /**
     * Handles the mark order ready action.
     * This function is called when the waiter presses the "Mark Order Ready" button.
     * It should be used to mark the order as ready and send a request to the server to update the order's status.
     */
    const handleMarkOrderReady =(tableNumber: number)=>{
        // Handle mark order ready action here
        signalRConnection?.invoke("MarkOrderAsReady", tableNumber)
        signalRConnection?.on("ReceiveOrderReadyMessage", async(order: Order, tableNumber: number) => {
            try{
                setOrders(prevOrders => {
                    const updatedOrders = [...prevOrders];
                    updatedOrders[tableNumber - 1] = order; // newOrder is the order you received from the socket
                    return updatedOrders;
                  });
                  ToastAndroid.show(`Order for table ${tableNumber} is ready`, ToastAndroid.SHORT);
                  await AsyncStorage.setItem("orders", JSON.stringify(orders));
                
                  
            }catch(error){
                alert(error)
            }finally{
                signalRConnection?.off("SendOrder")
            }
        })
        }
    return (
       
        <ThemedView style={styles.safeArea}>
            <ThemedView>
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <LogoutButton action={async () => await signalRConnection?.stop()} />
                    <ThemedText style={styles.text}>
                        Hello {waiter?.name}
                    </ThemedText>
                    {signalRConnection && tables.length > 0 ? (
                             <>
                                {tables.map(table => (
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
        safeArea: {
            flex: 1,
           
          },
      scrollContainer: {
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 20,
        alignItems: 'center',
      },
      text: {
        fontSize: 25,
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 20
      },
    });