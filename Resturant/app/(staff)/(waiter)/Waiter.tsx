import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import {useEffect, useState} from 'react';
import { StyleSheet } from 'react-native';
import LogoutButton from '@/components/LogoutButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as signalR from '@microsoft/signalr';
import ip from '@/Data/Addresses';
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
  useEffect(() => {
    const fetchWaiter = async () => {
      try {
      await  setWaiter(JSON.parse((await AsyncStorage.getItem('waiter')) as string));
      }catch (error) {
          alert(error);
      }
    }
    fetchWaiter();
    
    
    

  },[])
  useEffect(() => {
    const connect= async () => {
        const connection = new signalR.HubConnectionBuilder()
        .withUrl(`http://${ip.julian}:5256/hub?waiterid=${waiter?.id.toString()}&privilagelevel=waiter`)
        .build();
        try {
            await connection.start();
            alert('SignalR connected');
            setSignalRConnection(connection);
    }catch (error) {
        console.error('SignalR connection error:'+ error);
    }
}
connect();
  },[waiter])
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
                Your phone id is {waiter?.id}
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