import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ThemedInput from '@/components/ThemedInput';
import { useState} from 'react';
import { StyleSheet } from 'react-native';
import CurvedButton from '@/components/ui/CurvedButton';
import axios from 'axios';
import ip from '@/Data/Addresses';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {router} from 'expo-router';

export default  function WaiterLogin() {
    const [email,setEmail] = useState<string>('');
    const [password,setPassword] = useState<string>('');
    const handleLogin = async() => {
        try{
            if(email==='' || password===''){
                alert("Please fill all the fields");
                return;
            }
            const res = await axios.post(`http://${ip.eyas}:5256/api/waiter`,{
                email: email,
                password: password
            })
            if(res && res.status===200){
                await AsyncStorage.setItem('token', res.headers['x-auth-token']);
                await AsyncStorage.setItem("waiter",JSON.stringify(res.data.waiter))
                router.push("./Waiter");
            }
        }
        catch(e){
            alert(e);
        }
    }
    return (
        <ThemedView style={styles.container}>
            <ThemedText style={styles.text}>Waiter Login</ThemedText>
            <ThemedInput 
            type="email-address" 
            placeholder="Email" 
            action={(text)=>setEmail(text)} 
            value={email}/>
            <ThemedInput
            type="password" 
            placeholder="Password" 
            action={(text)=>setPassword(text)} 
            value={password} />
            <CurvedButton 
            title="Login"
            action={async()=>await handleLogin()}
            style={{backgroundColor:"rgb(72, 0, 255)"}} />
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
        gap: 20,
    },
    text:{
        fontSize: 25,
        fontWeight: 'bold',
        height: 'auto',
        width: 'auto',
    },
})