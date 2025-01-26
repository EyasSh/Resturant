import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React, { useState } from 'react';
import { TextInput, StyleSheet, Button, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@react-navigation/native';
import Logo from "@/components/ui/Logo";

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [dob, setDob] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const { colors } = useTheme();

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false); // Hide the picker when a date is selected
        if (selectedDate) {
            setDob(selectedDate.toISOString().split('T')[0]); // Format as YYYY-MM-DD
        }
    };

    return (
        <ThemedView style={styles.container}>
            <Logo />
            <ThemedText style={styles.header}>Sign up</ThemedText>
            <TextInput
                style={styles.input}
                placeholder="example@domain.com"
                placeholderTextColor={'rgba(255, 255, 255, 0.4)'}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(text) => setEmail(text)}
                value={email}
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={'rgba(255, 255, 255, 0.4)'}
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(text) => setPassword(text)}
                value={password}
            />
            <TouchableOpacity style={styles.opacity} onPress={() => setShowDatePicker(true)}>
                <TextInput
                    style={styles.input}
                    placeholder="Date of Birth"
                    placeholderTextColor={'rgba(255, 255, 255, 0.4)'}
                    value={dob}
                    editable={false} // Make input non-editable
                />
            </TouchableOpacity>
            {showDatePicker && (
                <DateTimePicker
                    value={dob ? new Date(dob) : new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                />
            )}
            <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor={'rgba(255, 255, 255, 0.4)'}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="phone-pad"
            />
            <Button
                title="Signup"
                onPress={() => {}}
                color={' backgroundColor: rgb(134, 0, 175)'}
                
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
        backgroundColor: 'rgba(75, 75, 75, 0.5)',
        gap: 20,
      },
    header:{
        fontWeight: 'bold',
        fontSize: 25,
        
    },

  
      input: {
        height: 40,
        width: '100%',
        borderWidth: 1.2,
        borderRadius: 10,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        paddingHorizontal: 10,
        marginBottom: 20,
        color: 'white',
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