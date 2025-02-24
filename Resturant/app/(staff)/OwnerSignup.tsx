import ThemedInput from '@/components/ThemedInput';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import CurvedButton from '@/components/ui/CurvedButton';
import { useState} from 'react';
import { StyleSheet } from 'react-native';
import axios from 'axios';
import ip from '@/Data/Addresses';

export default function OwnerSignup() {
    const [name,setName] = useState<string>('');
    const [email,setEmail] = useState<string>('');
    const [password,setPassword] = useState<string>('');
    const [phone,setPhone] = useState<string>('');
    const [restaurantNumber,setRestaurantNumber] = useState<string>('');
    const handleSignup = async() => {
        try{
            alert("in try");
            const res = await axios.post(`http://${ip.eyas}:5256/api/owner/signup`,{
                Name:name,
                Email:email,
                Password:password,
                Phone: phone,
                RestaurantNumber:restaurantNumber
            })
            alert(res.data);
            
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
            <ThemedText style={styles.text}>Owner Signup</ThemedText>
            <ThemedInput type="text" placeholder="Name" action={(text) => setName(text)} value={name} />
            <ThemedInput type="email-address" placeholder="Email" action={(text) => setEmail(text)} value={email} />
            <ThemedInput type="password" placeholder="Password" action={(text) => setPassword(text)} value={password} />
            <ThemedInput type="phone-pad" placeholder="Phone" action={(text) => setPhone(text)} value={phone} />
            <ThemedInput type="phone-pad" placeholder="Restaurant Number" action={(text) => setRestaurantNumber(text)} value={restaurantNumber}/>
            <CurvedButton title="Signup" 
            action={async() => await handleSignup()} 
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
        gap:25,
    },
    text:{
        fontSize: 25,
        fontWeight: 'bold',
        height: 'auto',
        width: 'auto',
    },
});
