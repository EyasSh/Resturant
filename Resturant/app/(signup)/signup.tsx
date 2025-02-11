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
export default function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [dob, setDob] = useState(''); // Store as YYYY-MM-DD
    const [dobDate, setDobDate] = useState(new Date(2000, 0, 1)); // Default to Year 2000
    const [phone, setPhone] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const { colors } = useTheme();

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
            const res = await axios.post(`http://${ip.eyas.toString()}:5256/api/user/signup`,{
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
    return (
        <ThemedView style={styles.container}>
            <Logo />
            <ThemedText style={styles.header}>Sign up</ThemedText>
            <TextInput 
                style={styles.input} placeholder="Name" 
                placeholderTextColor={'rgb(0, 0, 0)'} 
                autoCapitalize="none" autoCorrect={false} 
                onChangeText={(text) => setName(text)} 
                value={name}/>
            <TextInput
                style={styles.input}
                placeholder="example@domain.com"
                placeholderTextColor={'rgb(0, 0, 0)'}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(text) => setEmail(text)}
                value={email}
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={'rgb(0, 0, 0)'}
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(text) => setPassword(text)}
                value={password}
            />
               {/* Open Date Picker */}
               <TouchableOpacity style={styles.opacity} onPress={() => setShowDatePicker(true)}>
                <TextInput
                    style={styles.input}
                    placeholder="Date of Birth"
                    placeholderTextColor={'rgb(0, 0, 0)'}
                    value={dob} 
                    editable={false} // Prevent manual typing
                />
            </TouchableOpacity>

            {/* Show picker when `showDatePicker` is true */}
            {showDatePicker && (
                <DateTimePicker
                    value={dobDate} // Default date
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'spinner'} // 🔥 Now "spinner" on Android
                    onChange={handleDateChange}
                    maximumDate={new Date()} // Prevent selecting future dates
                />
            )}
            <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor={'rgb(0, 0, 0)'}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="phone-pad"
                onChangeText={(text) => setPhone(text)}
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
        width: '100%',
        borderWidth: 0,
        borderRadius: 10,
        backgroundColor: 'rgb(160, 160, 160)',
        paddingHorizontal: 10,
        marginBottom: 20,
        color: 'black',
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