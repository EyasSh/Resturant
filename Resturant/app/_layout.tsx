import { DarkTheme, DefaultTheme, NavigationContainer, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import  Login  from '@/app/(login)/index';

import { useColorScheme } from '@/hooks/useColorScheme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      
      <Stack>
        {/* Login is the initial screen */}
        <Stack.Screen 
        name="(login)/index" 
        options={{
          headerShown: false
        }}
      />
      {/*Staff Screens */}
      <Stack.Screen name="(staff)/Main" options={{ headerShown: false }} />
      <Stack.Screen name="(staff)/(waiter)/Waiter" options={{ headerShown: false }} />
      <Stack.Screen name="(staff)/(owner)/Owner" options={{ headerShown: false }} />
      <Stack.Screen name="(staff)/(waiter)/WaiterLogin" options={{ headerShown: false }} />
      <Stack.Screen name="(staff)/(owner)/OwnerLogin" options={{ headerShown: false }} />
      <Stack.Screen name="(staff)/(owner)/WaiterSignup" options={{ headerShown: false }} />
      <Stack.Screen name="(staff)/(owner)/OwnerSignup" options={{ headerShown: false }} />
      <Stack.Screen name="(staff)/(owner)/AddMealForm" options={{ headerShown: false }} />
      <Stack.Screen name="(staff)/(owner)/AddTableForm" options={{ headerShown: false }} />
      <Stack.Screen name="(staff)/(owner)/RemoveTable" options={{ headerShown: false }} />
      <Stack.Screen name="(staff)/(owner)/RemoveMeal" options={{ headerShown: false }} />
      <Stack.Screen name="(staff)/(owner)/FireStaff" options={{ headerShown: false }} />
      <Stack.Screen name="(Menu)/Menu"  options={{ headerShown: false }} />
      <Stack.Screen name="(chat)/Chat"  options={{ headerShown: false }} />
        {/* Signup screen */}
        <Stack.Screen name="(signup)/signup" options={
          { headerShown: false  }}/>
        {/* Tabs layout */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* 404 or fallback */}
         <Stack.Screen name="+not-found" /> 
        
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
