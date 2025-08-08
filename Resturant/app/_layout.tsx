import { DarkTheme, DefaultTheme, NavigationContainer, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
//import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationProp } from "@/Routes/NavigationTypes";
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
import Menu from '@/app/(Menu)/Menu';
import UserNeeds from './(user)/UserNeeds';
import OrderPeak from './(staff)/(waiter)/OrderPeak';
import AddQuickMessage from './(staff)/(owner)/AddQuickMessage';
import Toast from 'react-native-toast-message';
import RemoveQuickMessage from './(staff)/(owner)/RemoveQuickMessage';
import PeakNeeds from './(staff)/(waiter)/PeakNeeds';
import {StatusBar,SafeAreaView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage';


SplashScreen.preventAutoHideAsync();

/**
 * RootLayout sets up the main application layout and navigation structure.
 * It initializes the font loading, theme setting based on the color scheme,
 * and configures the stack navigator with various screens for the application.
 * The layout includes a status bar and a toast notification component.
 * 
 * Screens are grouped into sections for login, staff operations, signup, 
 * and tab navigation, each with header visibility options.
 * The component also handles splash screen visibility based on font loading status.
 */

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const Stack = createStackNavigator();
  const insets = useSafeAreaInsets();
  const STATUS_BAR_BG= colorScheme === 'dark' ? '#121212' : '#eee';
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
    const clean= async()=>{
      await AsyncStorage.clear();
      console.log("AsyncStorage cleared");
    }
    clean();
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <>
     <StatusBar
        translucent
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
      />

      {/* this view sits under the status bar */}
      <View style={{
        height: insets.top,
        backgroundColor: STATUS_BAR_BG
      }}/>
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>

        
            <Toast />
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
      <Stack.Screen name="WaiterLogin" component={WaiterLogin} options={{ headerShown: false }} />
      <Stack.Screen name="OwnerLogin" component={OwnerLogin} options={{ headerShown: false }} />
      <Stack.Screen name="WaiterSignup" component={WaiterSignup} options={{ headerShown: false }} />
      <Stack.Screen name="OwnerSignup" component={OwnerSignup} options={{ headerShown: false }} />
      <Stack.Screen name="AddMealForm" component={AddMealForm} options={{ headerShown: false }} />
      <Stack.Screen name="AddTableForm" component={AddTableForm} options={{ headerShown: false }} />
      <Stack.Screen name="RemoveTable" component={RemoveTable} options={{ headerShown: false }} />
      <Stack.Screen name="RemoveMeal" component={RemoveMeal} options={{ headerShown: false }} />
      <Stack.Screen name="FireStaff" component={FireStaff} options={{ headerShown: false }} />
      <Stack.Screen name="Menu" component={Menu}  options={{ headerShown: false }} />
      <Stack.Screen name = "UserNeeds" component={UserNeeds} options={{ headerShown: false }} />
      <Stack.Screen name='OrderPeak' component={OrderPeak} options={{ headerShown: false }}/>
      <Stack.Screen name='AddQuickMessage' component={AddQuickMessage} options={{ headerShown: false }}/>
      <Stack.Screen name='RemoveQuickMessage' component={RemoveQuickMessage} options={{ headerShown: false }}/>
      <Stack.Screen name='PeakNeeds' component={PeakNeeds} options={{ headerShown: false }}/>

        {/* Signup screen */}
        <Stack.Screen name="Signup" component={Signup} options={
          { headerShown: false  }}/>
        {/* Tabs layout */}
        <Stack.Screen name="Tabs" component={TabLayout} options={{ headerShown: false }} />
        {/* 404 or fallback */}
         <Stack.Screen name="+not-found" component={NotFoundScreen} /> 
        
      </Stack.Navigator>
    </ThemeProvider>
    <View style={{ height: insets.bottom, backgroundColor: STATUS_BAR_BG }} />
    </>
  );
}
