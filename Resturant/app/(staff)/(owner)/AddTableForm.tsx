import {useState} from 'react';
import ip from '@/Data/Addresses';
import axios from 'axios';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import ThemedInput from '@/components/ThemedInput';
import CurvedButton from '@/components/ui/CurvedButton';
import { StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A form for the owner to add a table to the database. The form
 * includes two inputs: capacity and isWindowSide. The capacity is
 * the number of customers that can sit at the table, and isWindowSide
 * is a boolean that indicates whether the table is window side or not.
 * The form also includes two buttons: "Add Table" and "Cancel". The
 * "Add Table" button will add the table to the database and alert the
 * user that the table was added successfully. The "Cancel" button will
 * navigate the user back to the previous screen.
 */
export default function AddTableForm() {
    const [capacity,setCapacity] = useState<number>(0);
    const [isWindowSide,setIsWindowSide] = useState<boolean>(false);
/**
 * Submits the form data to add a new table to the restaurant's database.
 * This function first checks for user authentication via token retrieval.
 * If the user is authenticated, it sends a POST request with the table's
 * capacity and window side preference. On successful addition, it alerts
 * the user. If an error occurs, it alerts the user with the error message.
 */

    const handleSubmit=async()=>{
        const token = await AsyncStorage.getItem("token");
        if(!token){
            alert("User is not authenticated.");
            return;
        }
        try{
            const res = await axios.post(`http://${ip.julian}:5256/api/owner/add/table`,{
                capacity:capacity,
                isWindowSide:isWindowSide
            },
            {
                headers:{
                    "Content-Type":"application/json",
                    "X-Auth-Token":token
                }
            })
            if(res && res.status===200){
                alert("Table added successfully!");
            }
        }catch(e){
            alert(e);
        }
        
    }
    return(
        <ThemedView style={styles.container}>
            <ThemedText style={styles.text}>Capacity:</ThemedText>
            <ThemedInput placeholder="Capacity" action={(text)=>setCapacity(parseInt(text))} type="phone-pad" />
            <ThemedText style={styles.text}>Is the table Window Side:</ThemedText>
            <CurvedButton title={isWindowSide?"Yes":"No"} 
            action={()=>setIsWindowSide(!isWindowSide)} 
            style={{backgroundColor:"rgb(72, 0, 255)"}} 
            />
            <CurvedButton title="Add Table" 
            action={async()=>await handleSubmit()} 
            style={{backgroundColor:"rgb(72, 0, 255)"}} 
            />
        </ThemedView>
    )
}
const styles = StyleSheet.create({
    container:{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        paddingVertical: 35,
        gap: 20,
        height: '100%',
        width: '100%',
    },
    text:{
        fontSize: 25,
        fontWeight: 'bold',
        height: 'auto',
        width: 'auto',
    },
})