import ThemedInput from '@/components/ThemedInput';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import CurvedButton from '@/components/ui/CurvedButton';
import { useState} from 'react';
import { StyleSheet } from 'react-native';

export default function WaiterSignup() {
    const [email,setEmail] = useState<string>('');
    const [password,setPassword] = useState<string>('');
    const [name,setName] = useState<string>('');
    const [phone,setPhone] = useState<string>('');
    return (
        <ThemedView style={styles.container}>
            <ThemedText style={styles.text}>Add Worker</ThemedText>
            <ThemedInput type="text" value={name} action={(text) => setName(text)} placeholder="Name" />
            <ThemedInput type="email-address" value={email} action={(text) => setEmail(text)} placeholder="Email" />
            <ThemedInput type="password" value={password} action={(text) => setPassword(text)} placeholder="Password" />
            <ThemedInput type="phone-pad" value={phone} action={(text) => setPhone(text)} placeholder="Phone" />
            
            <CurvedButton title="Add Worker" action={()=>alert("Name: " + name + "\nEmail: " + email + "\nPassword: " + password + "\nPhone: " + phone + "\n\nAdded Successfully")} style={{backgroundColor:"rgb(72, 0, 255)"}} />
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

