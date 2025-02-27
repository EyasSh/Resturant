import { useState } from "react";
import ip from "../../Data/Addresses";
import {router} from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import ThemedInput from "@/components/ThemedInput";
import CurvedButton from "@/components/ui/CurvedButton";
import { StyleSheet } from "react-native";
import Logo from "@/components/ui/Logo";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AddMealForm() {
    const [name, setName] = useState<string>('');
    const [price, setPrice] = useState<number>(0);
    const handleAddMeal = async () => {
        if(name==='' || price===0){
            alert("Can't add a no named OR free meal");
            return;
        }
        try{
            const token = await AsyncStorage.getItem('token');
            const res = await axios.post(`http://${ip.eyas}:5256/api/owner/add/meal`,{
                mealName:name,
                price:price
            },
            {
                headers:{
                    'x-auth-token':token
                }
            })


            alert(`${name} Added Successfully!\nPrice: ${price}`);
        }catch(e){
            alert(e);
        }
        
    }
    return (
        <ThemedView style={styles.container}>
            <ThemedText style={styles.text}>Add a meal</ThemedText>
            <Logo/>
            <ThemedInput
                placeholder="Name"
                type="default"
                action={(text:string)=>setName(text)}
                value={name}
            />
            <ThemedInput
                placeholder="Price"
                type="phone-pad"
                action={(price:number)=>setPrice(price)}
                value={price==0? '' : price.toString()}
            />
            <CurvedButton
                title="Add meal"
                action={async()=>await handleAddMeal()}
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