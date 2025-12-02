import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React, { useState } from 'react';
import { TextInput, StyleSheet, Button, TouchableOpacity,Platform  } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@react-navigation/native';
import Logo from "@/components/ui/Logo";
import axios from 'axios';
import ip from '@/Data/Addresses'
import CurvedButton from '@/components/ui/CurvedButton';
import ThemedInput from '@/components/ThemedInput';
import ShowMessageOnPlat from '@/components/ui/ShowMessageOnPlat';
/**
 * Signup component
 * 
 * @return {JSX.Element} - Signup component
 */
export default function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [dob, setDob] = useState(''); // Store as YYYY-MM-DD
    const [dobDate, setDobDate] = useState(new Date(2000, 0, 1)); // Default to Year 2000
    const [phone, setPhone] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const { colors, dark: isDark } = useTheme();

/**
 * Handles the change of the date selection from the date picker.
 * Updates both the display date and the formatted date of birth.
 * 
 * @param {any} event - The event triggered by the date picker.
 * @param {Date} [selectedDate] - The date selected by the user.
 *                                If a date is selected, the function updates the 
 *                                state with the formatted date in 'YYYY-MM-DD' format.
 */

    const handleDateChange = (event:any, selectedDate?:Date) => {
        if (selectedDate) {
            setDobDate(selectedDate);
            
            // ✅ Fix: Use toLocaleDateString() to prevent timezone issues
            const formattedDate = selectedDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
            setDob(formattedDate);
        }
        setShowDatePicker(false); // Hide picker after selecting
    };

    /**
     * Handles the sign up request by sending a post request to the backend
     * with the user's details. If the request is successful, it shows an alert
     * with the response message. If there is an error, it shows an alert with
     * the error message.
     * 
     * @function
     * @async
     * @returns {undefined}
     */
    const handleSignup = async() => {
        try{
            const res = await axios.post(`http://${ip.julian}:5256/api/user/signup`,{
                name:name,
                email: email,
                password: password,
                date: dob,
                phone: phone
            })
            if(res && res.status===200){
                ShowMessageOnPlat(res.data);
            }
        }
        catch(e:any){
            alert(e.message);
        }
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
            gap: 20,
          },
        header:{
            fontWeight: 'bold',
            fontSize: 25,
            
        },
        input: {
            height: 40,
            width: '95%',
            borderWidth: 0.5,
            borderRadius: 10,
            backgroundColor: 'transparent',
            paddingHorizontal: 10,
            marginBottom: 20,
            color: isDark ? "white" : "black",
            borderColor: isDark ? "white" : "black",
          },
        button: {
            marginTop: 20,
            backgroundColor: 'rgb(134, 0, 175)',
        },
        opacity:{
            width: '100%',
           justifyContent: 'center',
           alignItems: 'center',
        }
    });

    return (
        <ThemedView style={styles.container}>
            <ThemedText style={styles.header}>Sign up</ThemedText>
            <ThemedInput 
                type="text"
                 placeholder="Name"
                action={(text) => setName(text)} 
                value={name}/>
            <ThemedInput
                
                placeholder="example@domain.com"
                type={"email-address"}
                action={(text) => setEmail(text)}
                value={email}
            />
            <ThemedInput
                placeholder="Password"
                type="password"
                action={(text) => setPassword(text)}
                value={password}
            />
               <TouchableOpacity style={styles.opacity} onPress={() => setShowDatePicker(true)} >
                <TextInput
                    style={styles.input}
                    placeholder="Date of Birth"
                    placeholderTextColor={isDark ? "white" : "black"}
                    value={dob} 
                    editable={false} // Prevent manual typing
                />
            </TouchableOpacity>

            {/* Show picker when `showDatePicker` is true */}
            {showDatePicker && (
                <DateTimePicker
                    value={dobDate} // Default date
                    mode="date"
                    display={"spinner"} // 🔥 Now "spinner" on Android
                    onChange={handleDateChange}
                    maximumDate={new Date()} // Prevent selecting future dates
                />
            )}
            <ThemedInput
              placeholder='Phone Number'
                type="phone-pad"
                action={(text) => setPhone(text)}
                value={phone}
            />
            <CurvedButton
                title="Signup"
                action={async() => await handleSignup()}
                style={ {backgroundColor: "rgb(134, 0, 175)"}}
                
            />
        </ThemedView>
    );
}