import { useState } from "react";
import ip from "../../../Data/Addresses";
import {router} from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import ThemedInput from "@/components/ThemedInput";
import CurvedButton from "@/components/ui/CurvedButton";
import { StyleSheet, ToastAndroid } from "react-native";
import Logo from "@/components/ui/Logo";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DropDownPicker from "react-native-dropdown-picker";
import { useTheme } from "@react-navigation/native";

/**
 * Component for adding a meal to the database and AsyncStorage.
 * Provides a form with three fields: name, price, and category.
 * The category is a dropdown menu with the options from the database.
 * The user can add a meal by pressing the "Add meal" button.
 * If the meal is added successfully, the user is alerted with a success message.
 * If there is an error, the user is alerted with the error message.
 */
export default function AddMealForm() {
    const { colors } = useTheme();
    const [name, setName] = useState<string>('');
    const [price, setPrice] = useState<number>(0);
    const [open, setOpen] = useState(false);
    const [category, setCategory] = useState<string | null>(null);
    const [items, setItems] = useState([
        { label: 'Desserts', value: 'Desserts' },
        { label: 'Main Dish', value: 'Main Dish' },
        { label: 'Side Dish', value: 'Side Dish' },
        { label: 'beverages', value: 'beverages' },
        // change the all the drinks to beverages
    
    ]);
    
    /**
     * Handles the addition of a meal to the database and AsyncStorage.
     * 
     * Before making the API call, the function checks if the meal name and price are valid.
     * If the meal name is empty or the price is 0, the user is alerted with an error message.
     * If the meal is added successfully, the user is alerted with a success message.
     * If there is an error, the user is alerted with the error message.
     */
    const handleAddMeal = async () => {
        if(name==='' || price===0){
            alert("Can't add a no named OR free meal");
            return;
        }
        try{
            const token = await AsyncStorage.getItem('token');
            const res = await axios.post(`http://${ip.julian}:5256/api/owner/add/meal`,{
                mealName:name,
                price:price,
                category:category
            },
            {
                headers:{
                    'x-auth-token':token
                }
            })


            ToastAndroid.show(`${name} Added Successfully!\nPrice: ${price}`, ToastAndroid.CENTER);
        }catch(e){
            ToastAndroid.show(`${e}`, ToastAndroid.LONG);
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
            <ThemedText style={styles.text}>Category</ThemedText>
            <ThemedView>
            <DropDownPicker
                    open={open}
                    value={category}
                    items={items}
                    setOpen={setOpen}
                    setValue={setCategory}
                    setItems={setItems}
                    placeholder="Select a category"
                    style={[styles.picker, { backgroundColor: colors.card }]}  // Background color from theme
                    dropDownContainerStyle={[styles.dropdown, { backgroundColor: colors.card }]}  // List background color from theme
                    textStyle={{ color: colors.text }}  // Text color from theme
                    labelStyle={{ fontWeight: 'bold' }}  // Bolding the labels
                />
            </ThemedView>
            
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
    picker: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        height: 50,
        width: '90%',
    },
    dropdown: {
        borderColor: '#ccc',
        borderWidth: 1,
        width: '90%',
    },
})