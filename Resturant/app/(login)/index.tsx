import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React, { useState } from 'react';
import { TextInput, StyleSheet, Button, View } from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import Logo from "@/components/ui/Logo";
import CurvedButton from '@/components/ui/CurvedButton';
import axios from 'axios';
import { Constants } from 'expo-constants';
import ip from '@/Data/Addresses';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ThemedInput from '@/components/ThemedInput';
import { NavigationProp } from '@/Routes/NavigationTypes';

export default function Login() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const { colors,dark:isDark  } = useTheme(); // Access theme colors
  const navigation = useNavigation<NavigationProp>();

  const styles = StyleSheet.create({
    headerImage: {
      color: '#808080',
      bottom: -90,
      left: -35,
      position: 'absolute',
    },
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      gap: 20,
    },
    emailText: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    signupContainer:{
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 20,
    },
    staff:{
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      width: '90%',
      backgroundColor:"transparent"
    }
  });
  const handleLogin = async() => {
    // Perform login validation (optional)
    if (email && password) {
      // Send login request to the server
      try{
        const res = await axios.post(`http://${ip.julian}:5256/api/user/login`,{
            email: email,
            password: password
        })
        if(res&& res.status===200){
            await AsyncStorage.setItem('token', res.headers['x-auth-token']);
            await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
            const user =await AsyncStorage.getItem('user')
            
            
        }
        // Navigate to the tabs layout
        navigation.navigate('Tabs');
      }
      catch(e:any){
        alert(e.message);
      }
      
      
    } else {
      alert('Please enter email and password!');
    }
  };
  return (
    
    <ThemedView style={styles.container}>
      <Logo />
      <ThemedInput
        type="email-address"
        value={email}
        placeholder="Email"
        action={(text)=>setEmail(text)} 
        />
      <ThemedInput
        placeholder='Password'
        type="password"
        value={password}
        action={(text) => setPassword(text) }
      />
      <CurvedButton
        title="Login"
        action={handleLogin}
        style={{ backgroundColor: '#34baeb'}}
      />
      <View style={styles.signupContainer}>
        <ThemedText style={styles.emailText}>Don't have an account?</ThemedText>
        <CurvedButton
          title="Sign Up"
          action={() => navigation.navigate('Signup')}
          style={{backgroundColor:"rgb(134, 0, 175)"}}
          />
          
      </View>
      <View style={styles.staff}>
          <ThemedText style={styles.emailText}>Are you staff?</ThemedText>
          <CurvedButton
            title="Staff Terminal"
            action={()=>navigation.navigate('Terminals')}
            style={{backgroundColor:"rgb(0, 175, 122)"}}
            />
      </View>
    </ThemedView>
  );
}

