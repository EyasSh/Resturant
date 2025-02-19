import ThemedInput from '@/components/ThemedInput';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import CurvedButton from '@/components/ui/CurvedButton';
import React,{ useState} from 'react';
import { StyleSheet } from 'react-native';
import {router} from 'expo-router';
import Logo from '@/components/ui/Logo';

export default function OwnerLogin() {
    const [email,setEmail] = useState<string>('');
    const [password,setPassword] = useState<string>('');

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
                action={()=>router.push("./Owner")}
                style={{backgroundColor:"rgb(153, 0, 255)"}}
                 />
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