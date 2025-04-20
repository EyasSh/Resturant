import ThemedInput from '@/components/ThemedInput';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import CurvedButton from '@/components/ui/CurvedButton';
import { useState} from 'react';
import { StyleSheet, ToastAndroid } from 'react-native';
import axios from 'axios';
import ip from "@/Data/Addresses";
import AsyncStorage from '@react-native-async-storage/async-storage';
import ShowMessageOnPlat from '@/components/ui/ShowMessageOnPlat';

/**
 * The waiter signup screen, which displays a form for the owner to sign up a waiter
 * 
 * The form takes in the following fields: name, email, password, and phone
 * 
 * When the form is submitted, the `handleSignup` function is called, which sends a POST request to the server with the data.
 * If the response is successful (200), the waiter is signed up and a success alert is displayed
 * If there is an error, an alert is displayed to the user
 * 
 * The user can navigate back to the login screen using the back button
 */
export default function WaiterSignup() {
    const [email,setEmail] = useState<string>('');
    const [password,setPassword] = useState<string>('');
    const [name,setName] = useState<string>('');
    const [phone,setPhone] = useState<string>('');
/**
 * Handles the signup request for a waiter by sending a POST request to the server
 * with the waiter's details. If the request is successful, it shows an alert
 * with the response message. If there is an error, it shows an alert with the
 * error message.
 *
 * @async
 * @returns {undefined}
 */
    const handleSignup = async() => {
        try{
            const token = await AsyncStorage.getItem("token");
            const res = await axios.post(`http://${ip.julian}:5256/api/owner/add/waiter`,{
                name:name,
                email: email,
                password: password,
                phone: phone,
                

            },
        {
            headers:{
                "Content-Type":"application/json",
                "X-Auth-Token":token
            }
        })
            if(res && res.status===200){
                ShowMessageOnPlat("Waiter added successfully!");
            }
        }
        catch(e){
            alert(e);
        }
       
    }
    return (
        <ThemedView style={styles.container}>
            <ThemedText style={styles.text}>Add Worker</ThemedText>
            <ThemedInput type="text" value={name} action={(text) => setName(text)} placeholder="Name" />
            <ThemedInput type="email-address" value={email} action={(text) => setEmail(text)} placeholder="Email" />
            <ThemedInput type="password" value={password} action={(text) => setPassword(text)} placeholder="Password" />
            <ThemedInput type="phone-pad" value={phone} action={(text) => setPhone(text)} placeholder="Phone" />
            
            <CurvedButton title="Add Worker" action={async()=>await handleSignup()} style={{backgroundColor:"#4800ff"}} />
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

