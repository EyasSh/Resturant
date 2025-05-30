import { useState, useEffect } from "react";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { StyleSheet, ToastAndroid} from "react-native";
import ThemedInput from "@/components/ThemedInput";
import CurvedButton from "@/components/ui/CurvedButton";
import axios from "axios";
import ip from "@/Data/Addresses";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ShowMessageOnPlat from "@/components/ui/ShowMessageOnPlat";

/**
 * AddQuickMessage component allows the user to input a quick message and 
 * add it using a button. It utilizes ThemedView for layout, ThemedText for 
 * displaying the title, ThemedInput for capturing the message, and CurvedButton 
 * for the action to add the message.
 * 
 * @component
 * @returns A component consisting of a themed view, text, input field, and button.
 */
export default function AddQuickMessage() {
    const [message, setMessage] = useState<string>("")
/**
 * Sends a POST request to add a quick message to the server.
 *
 * This function retrieves the authentication token from AsyncStorage and
 * uses it to authenticate the request. The message to be added is sent
 * in the request body. On success, it displays a toast with the server's
 * response message. On failure, it displays an error message in a toast.
 */
    const handleAddMessage = async() => {
        try{
            const token = await AsyncStorage.getItem('token')
            const res = await axios.post(`http://${ip.julian}:5256/api/owner/add/message`,
                {
                    message: message
                }, 
                {
                    headers: 
                    {
                    'x-auth-token':token 
                    }
                }
            )
            ShowMessageOnPlat(res.data)
        }
        catch(e){
            ShowMessageOnPlat(`${e}`)
        }
    }
    return(
        <ThemedView style={styles.container}>
            <ThemedText style={styles.text}>Quick Message</ThemedText>
            <ThemedInput
                placeholder="Quick Message"
                type="text"
                value={message}
                action={(msg)=>setMessage(msg)}
            />
            <CurvedButton title="Add" action={() => handleAddMessage()} style={{backgroundColor:"#4800ff"}}/>            
        </ThemedView>
    )
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',        
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
});