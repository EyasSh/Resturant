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
                .withUrl(`http://${ip.julian}:5256/hub?waiterid=${waiter.id}&privilagelevel=waiter`)
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
        <ThemedView style={styles.container}>
            <LogoutButton action={async()=> await signalRConnection?.stop()}/>
            <ThemedText style={styles.text}>
                Hello {waiter?.name}
            </ThemedText>
            <ThemedText>
                Your email is {waiter?.email}
            </ThemedText>
            <ThemedText>
                Your id is {waiter?.id}
            </ThemedText>
        </ThemedView>
    );
}
const styles = StyleSheet.create({
    container:{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        height: '100%',
        width: '100%',
        gap:25,
    },
    text:{
        fontSize: 25,
        fontWeight: 'bold',
        height: 'auto',
        width: 'auto',
    },
});