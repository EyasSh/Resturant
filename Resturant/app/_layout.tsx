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
        {/* Signup screen */}
        <Stack.Screen name="(signup)/signup" options={
          { headerShown: false  }}/>
          {/* Menu screen */}
          <Stack.Screen name="(Menu)/Menu" options={
            {headerShown : false}}/>
        {/* Tabs layout */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* 404 or fallback */}
        {/* <Stack.Screen name="+not-found" /> */}
      </Stack>
      
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
