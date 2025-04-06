import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import {useEffect, useState} from 'react';
import { StyleSheet } from 'react-native';
import LogoutButton from '@/components/LogoutButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as signalR from '@microsoft/signalr';
import ip from '@/Data/Addresses';
import { NavigationProp } from '@/Routes/NavigationTypes';
import { useNavigation } from '@react-navigation/native';
import WaiterTableCard from '@/components/WaiterTableCard';
import { ScrollView, SafeAreaView } from 'react-native'
import { WaiterTableProps } from '@/Types/WaiterTableProps';
import { TableProps } from '@/components/TableCard';
import { Order } from '@/Types/Order';
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
        if (!waiter?.id) return; // Prevents calling connect() when waiter.id is not available

        /**
         * Establishes a connection to the SignalR hub with the specified waiter ID and "waiter" privilage level
         * 
         * The connection is established using the HubConnectionBuilder
         * 
         * The connection is then stored in the component's state
         * 
         * An event listener is set for the "ConnectNotification" event. When this event is triggered, an alert is displayed to the user
         * and the session ID is stored in AsyncStorage
         * 
         * If an error occurs during connection, an error is logged to the console
         */
        const connect = async () => {
            const connection = new signalR.HubConnectionBuilder()
                .withUrl(`http://${ip.julian}:5256/hub?waiterid=${waiter.id}&privilagelevel=waiter`)
                .build();
            try {
                await connection.start();  
                setSignalRConnection(connection);
                connection.off("ConnectNotification");
                await connection.on(
                    "ConnectNotification",
                    async (sid: string, isOkay: boolean, tables: TableProps[]) => {
                      if (isOkay) {
                        await AsyncStorage.setItem("sid", sid);
                  
                        const filteredTables: WaiterTableProps[] = tables.map((table) => ({
                          tableNumber: table.tableNumber,
                          waiterid: table.waiterId,
                        }));
                  
                        setTables(filteredTables);
                      }
                    }
                  );
                  await connection.on("ReceiveOrders", (orders: Order[]) => {
                    if(orders){
                        setOrders(orders);
                        AsyncStorage.setItem("orders", JSON.stringify(orders));
                        
                    }
                    

                }
            );
            } catch (error) {
                console.error('SignalR connection error:', error);
            }
        };

        connect();
        
    }, [waiter?.id]); // Only runs when waiter.id is defined
    useEffect(()=>{},[tables]); //re-renders when table state changes
    useEffect(()=>{alert("Orders updated")},[orders]); //re-renders when order state changes
    
    /**
    * Handles the peak order action.
    * This function is called when the waiter presses the "Peak Order" button.
    * It should be used to display the order for the waiter to see.
    */
    const handlePeakOrder =()=>{
        navigation.navigate("OrderPeak")
    }

    /**
    * Handles the wait table action.
    * This function is called when the waiter presses the "Wait Table" button.
    * It should be used to start waiting at the table and send a request to the server to update the table's status.
    * @param tableNumber The number of the table to wait at.
    */
    const handleWaitTable = (tableNumber: number) => {
        signalRConnection?.invoke("AssignWaiterToTable", waiter?.id, tableNumber)
    }
    /**
     * Handles the mark order ready action.
     * This function is called when the waiter presses the "Mark Order Ready" button.
     * It should be used to mark the order as ready and send a request to the server to update the order's status.
     */
    const handleMarkOrderReady =()=>{
        // Handle mark order ready action here
        alert("Mark Order Ready")
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
                                {tables.map((table, index) => (
                                <WaiterTableCard key={index} 
                                    tableNumber={table.tableNumber}
                                    peakOrderAction={()=>handlePeakOrder()}
                                    occupyAction={()=>handleWaitTable(index+1)}
                                    markOrderReadyAction={()=>handleMarkOrderReady()}
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