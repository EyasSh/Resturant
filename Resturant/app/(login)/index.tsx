import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React, { useState } from 'react';
import { TextInput, StyleSheet, Button } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function Login() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const { colors } = useTheme(); // Access theme colors
  const router = useRouter();

  const handleLogin = () => {
    // Perform login validation (optional)
    if (email && password) {
      // Navigate to the tabs layout
      router.replace('/(tabs)/explore');
      
    } else {
      alert('Please enter email and password!');
    }
  };

  return (
    
    <ThemedView style={styles.container}>
      <ThemedText style={styles.emailText}>Enter your Email and Password</ThemedText>
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
      <Button
        title="Login"
        onPress={handleLogin}
        color={colors.primary}
      />
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
    backgroundColor: 'rgba(75, 75, 75, 0.5)',
    gap: 20,
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
  emailText: {
    fontSize: 16,
    marginBottom: 10,
  },
});
