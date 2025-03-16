import { DarkTheme, DefaultTheme, NavigationContainer, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { createStackNavigator } from '@react-navigation/stack';

import { useColorScheme } from '@/hooks/useColorScheme';
import Login from './(login)';
import Main from './(staff)/Main';
import Waiter from './(staff)/(waiter)/Waiter';
import Owner from './(staff)/(owner)/Owner';
import WaiterLogin from './(staff)/(waiter)/WaiterLogin';
import OwnerLogin from './(staff)/(owner)/OwnerLogin';
import WaiterSignup from './(staff)/(owner)/WaiterSignup';
import OwnerSignup from './(staff)/(owner)/OwnerSignup';
import AddMealForm from './(staff)/(owner)/AddMealForm';
import AddTableForm from './(staff)/(owner)/AddTableForm';
import NotFoundScreen from './+not-found';
import TabLayout from './(tabs)/_layout';
import Signup from './(signup)/signup';
import RemoveTable from './(staff)/(owner)/RemoveTable';
import RemoveMeal from './(staff)/(owner)/RemoveMeal';
import FireStaff from './(staff)/(owner)/FireStaff';
import Menu from './(Menu)/Menu';
import Chat from './(chat)/Chat';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const Stack = createStackNavigator();
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
      <NavigationContainer>
      <Stack.Navigator>
        {/* Login is the initial screen */}
        <Stack.Screen 
        name="Login"
        component={Login} 
        options={{
          headerShown: false
        }}
      />
      {/*Staff Screens */}
      <Stack.Screen name="Terminals" component={Main} options={{ headerShown: false }} />
      <Stack.Screen name="Waiter" component={Waiter} options={{ headerShown: false }} />
      <Stack.Screen name="Owner" component={Owner} options={{ headerShown: false }} />
      <Stack.Screen name="Waiter Login" component={WaiterLogin} options={{ headerShown: false }} />
      <Stack.Screen name="Owner Login" component={OwnerLogin} options={{ headerShown: false }} />
      <Stack.Screen name="Waiter Signup" component={WaiterSignup} options={{ headerShown: false }} />
      <Stack.Screen name="Owner Signup" component={OwnerSignup} options={{ headerShown: false }} />
      <Stack.Screen name="Add Meal" component={AddMealForm} options={{ headerShown: false }} />
      <Stack.Screen name="Add Table" component={AddTableForm} options={{ headerShown: false }} />
      <Stack.Screen name="Remove Table" component={RemoveTable} options={{ headerShown: false }} />
      <Stack.Screen name="Remove Meal" component={RemoveMeal} options={{ headerShown: false }} />
      <Stack.Screen name="Fire Staff" component={FireStaff} options={{ headerShown: false }} />
      <Stack.Screen name="Menu" component={Menu}  options={{ headerShown: false }} />
      <Stack.Screen name="Chat" component={Chat} options={{ headerShown: false }} />
        {/* Signup screen */}
        <Stack.Screen name="(signup)/signup" component={Signup} options={
          { headerShown: false  }}/>
        {/* Tabs layout */}
        <Stack.Screen name="(tabs)" component={TabLayout} options={{ headerShown: false }} />
        {/* 404 or fallback */}
         <Stack.Screen name="+not-found" component={NotFoundScreen} /> 
        
      </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
