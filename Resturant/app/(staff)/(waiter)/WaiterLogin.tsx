import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ThemedInput from '@/components/ThemedInput';
import { useState} from 'react';
import { StyleSheet } from 'react-native';
import CurvedButton from '@/components/ui/CurvedButton';
import axios from 'axios';
import ip from '@/Data/Addresses';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@/Routes/NavigationTypes';
import Logo from '@/components/ui/Logo';
import ShowMessageOnPlat from '@/components/ui/ShowMessageOnPlat';

/**
 * Component for the waiter login screen
 * 
 * @remarks
 * This component is navigated to when the user clicks on the "Waiter Login" button on the login screen.
 * The component renders a logo, two input fields for the email and password, a login button, and a sign up button.
 * When the user clicks on the login button, the email and password are sent to the server to be validated.
 * If the validation is successful, the user is navigated to the Waiter screen.
 * If the validation fails, the user is shown an alert with the error message.
 * When the user clicks on the sign up button, the user is navigated to the Waiter Signup screen.
 * 
 * @returns the Waiter Login component
 */
export default  function WaiterLogin() {
    const [email,setEmail] = useState<string>('');
    const [password,setPassword] = useState<string>('');
    const navigation = useNavigation<NavigationProp>();
    /**
     * Handles the login process for the waiter.
     * Performs validation and sends a request to the server to
     * authenticate the user.
     * If the user is authenticated, sets the token and user data in
     * AsyncStorage and navigates to the Waiter screen.
     * If the user is not authenticated, displays an error message.
     */
    const handleLogin = async() => {
        try{
            if(email==='' || password===''){
                ShowMessageOnPlat("Please fill all the fields");
                return;
            }
            const res = await axios.post(`http://${ip.julian}:5256/api/waiter`,{
                email: email,
                password: password
            })
            if(res && res.status===200){
                await AsyncStorage.setItem('token', res.headers['x-auth-token']);
                await AsyncStorage.setItem("waiter",JSON.stringify(res.data.waiter))
                navigation.navigate("Waiter")
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