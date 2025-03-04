import {useState} from 'react';
import ip from '@/Data/Addresses';
import axios from 'axios';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import ThemedInput from '@/components/ThemedInput';
import CurvedButton from '@/components/ui/CurvedButton';
import { StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AddTableForm() {
    const [capacity,setCapacity] = useState<number>(0);
    const [isWindowSide,setIsWindowSide] = useState<boolean>(false);
    const handleSubmit=async()=>{
        const token = await AsyncStorage.getItem("token");
        if(!token){
            alert("User is not authenticated.");
            return;
        }
        try{
            const res = await axios.post(`http://${ip.eyas}:5256/api/owner/add/table`,{
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