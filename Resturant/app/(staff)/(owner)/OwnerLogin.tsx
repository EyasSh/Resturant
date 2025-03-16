import ThemedInput from '@/components/ThemedInput';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import CurvedButton from '@/components/ui/CurvedButton';
import React,{ useState} from 'react';
import { StyleSheet } from 'react-native';
import Logo from '@/components/ui/Logo';
import axios from 'axios';
import ip from '@/Data/Addresses';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp } from '@/Routes/NavigationTypes';
import { useNavigation } from '@react-navigation/native';
export default function OwnerLogin() {
    const [email,setEmail] = useState<string>('');
    const [password,setPassword] = useState<string>('');
    const navigation = useNavigation<NavigationProp>();
    const handleLogin = async() => {
        try{
            if(email==='' || password===''){
                alert("Please fill all the fields");
                return;
            }
            const res = await axios.post(`http://${ip.julian}:5256/api/owner`,{
                email: email,
                password: password
            })
            if(res && res.status===200){
                
                await AsyncStorage.setItem('token', res.headers['x-auth-token']);
                await AsyncStorage.setItem("owner",JSON.stringify(res.data.owner))
                navigation.navigate("Owner");
            }
        }
        catch(e){
            alert(e);
        }
    }
    return (
        <ThemedView style={styles.container}>
            <ThemedText style={styles.text}>Owner Login</ThemedText>
            <Logo />
            <ThemedInput
                placeholder="Email"
                type='email-address'
                value={email}
                action={(text) => setEmail(text)}
             />
            <ThemedInput
                placeholder="Password"
                type='password'
                value={password}
                action={(text) => setPassword(text)}
                />
                <CurvedButton
                title="Login"
                action={async() => await handleLogin()}
                style={{backgroundColor:"rgb(153, 0, 255)"}}
                 />
                <CurvedButton title="Sign Up" 
                action={()=>navigation.navigate("OwnerSignup")} 
                style={{backgroundColor:"rgb(1, 119, 80)"}} />
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