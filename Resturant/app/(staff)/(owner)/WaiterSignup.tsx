import ThemedInput from '@/components/ThemedInput';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import CurvedButton from '@/components/ui/CurvedButton';
import { useState} from 'react';
import { StyleSheet } from 'react-native';
import axios from 'axios';
import ip from "@/Data/Addresses";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WaiterSignup() {
    const [email,setEmail] = useState<string>('');
    const [password,setPassword] = useState<string>('');
    const [name,setName] = useState<string>('');
    const [phone,setPhone] = useState<string>('');
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
                alert(res.data);
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
            
            <CurvedButton title="Add Worker" action={async()=>await handleSignup()} style={{backgroundColor:"rgb(72, 0, 255)"}} />
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

