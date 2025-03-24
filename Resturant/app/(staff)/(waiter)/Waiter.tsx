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
type Waiter=
{
    id: string
    name: string
    email: string
    phone: string
}
export default function Waiter() {
    const [waiter, setWaiter] = useState<Waiter | null>(null);
    const [signalRConnection, setSignalRConnection] = useState<signalR.HubConnection | null>(null);
    const navigation = useNavigation<NavigationProp>();
    useEffect(() => {
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

        const connect = async () => {
            const connection = new signalR.HubConnectionBuilder()
                .withUrl(`http://${ip.nitc}:5256/hub?waiterid=${waiter.id}&privilagelevel=waiter`)
                .build();
            try {
                await connection.start();  
                setSignalRConnection(connection);
                connection.off("ConnectNotification");
                await connection.on("ConnectNotification", async(sid: string,isOkay: boolean) => {
                    if(isOkay){
                        alert('Session established');
                        await AsyncStorage.setItem('sid', sid);
                    }
                })
            } catch (error) {
                console.error('SignalR connection error:', error);
            }
        };

        connect();
    }, [waiter?.id]); // Only runs when waiter.id is defined
    return (
       
        <SafeAreaView style={styles.safeArea}>
            <ThemedView>
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <LogoutButton action={async () => await signalRConnection?.stop()} />
                    <ThemedText style={styles.text}>
                        Hello {waiter?.name}
                    </ThemedText>
                     {Array.from({ length: 12 }).map((_, index) => (
                        <WaiterTableCard key={index} tableNumber={index + 1}/>
                    ))}
                </ScrollView>
            </ThemedView>
        </SafeAreaView>
        
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
        marginVertical: 10,
      },
    });