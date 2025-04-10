import { DarkTheme, DefaultTheme, NavigationContainer, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
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
        <StatusBar
        style={colorScheme === 'dark' ? 'light' : 'dark'} // icon color
        backgroundColor={colorScheme === 'dark' ? '#121212' : '#ffffff'} // status bar background
        translucent={false}
      />
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

        {/* Signup screen */}
        <Stack.Screen name="Signup" component={Signup} options={
          { headerShown: false  }}/>
        {/* Tabs layout */}
        <Stack.Screen name="Tabs" component={TabLayout} options={{ headerShown: false }} />
        {/* 404 or fallback */}
         <Stack.Screen name="+not-found" component={NotFoundScreen} /> 
        
      </Stack.Navigator>
    </ThemeProvider>
  );
}
