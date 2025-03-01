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
export default function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [dob, setDob] = useState(''); // Store as YYYY-MM-DD
    const [dobDate, setDobDate] = useState(new Date(2000, 0, 1)); // Default to Year 2000
    const [phone, setPhone] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const { colors, dark: isDark } = useTheme();

    const handleDateChange = (event:any, selectedDate?:Date) => {
        if (selectedDate) {
            setDobDate(selectedDate);
            
            // ✅ Fix: Use toLocaleDateString() to prevent timezone issues
            const formattedDate = selectedDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
            setDob(formattedDate);
        }
        setShowDatePicker(false); // Hide picker after selecting
    };

    const handleSignup = async() => {
        try{
            const res = await axios.post(`http://${ip.julian.toString()}:5256/api/user/signup`,{
                name:name,
                email: email,
                password: password,
                date: dob,
                phone: phone
            })
            if(res && res.status===200){
                alert(res.data);
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
            <Logo />
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