import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React, { useState } from 'react';
import { TextInput, StyleSheet, Button, View } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import Logo from "@/components/ui/Logo";
import CurvedButton from '@/components/ui/CurvedButton';
import axios from 'axios';
import { Constants } from 'expo-constants';
import ip from '@/Data/Addresses';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Login() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const { colors } = useTheme(); // Access theme colors
  const router = useRouter();

  const handleLogin = async() => {
    // Perform login validation (optional)
    if (email && password) {
      // Send login request to the server
      try{
        const res = await axios.post(`http://${ip.eyas.toString()}:5256/api/user/login`,{
            email: email,
            password: password
        })
        if(res&& res.status===200){
           alert("status 200");
            await AsyncStorage.setItem('token', res.headers['x-auth-token']);
            const token =await AsyncStorage.getItem('token')
            alert(token);
        }
        // Navigate to the tabs layout
        router.replace('../(tabs)/Home');
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
      <CurvedButton
        title="Login"
        action={handleLogin}
        style={{ backgroundColor: '#34baeb'}}
      />
      <View style={styles.signupContainer}>
        <ThemedText style={styles.emailText}>Don't have an account?</ThemedText>
        <CurvedButton
          title="Sign Up"
          action={() => router.push("../(signup)/signup")}
          style={{backgroundColor:"rgb(134, 0, 175)"}}
          />
          
      </View>
    </ThemedView>
  );
}
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
  }
});
