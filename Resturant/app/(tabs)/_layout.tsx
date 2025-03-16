import React from 'react';
import { Platform } from 'react-native';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import MainPage from './Home';
import ProfilePage from './Profile';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Profile from './Profile';
const Tab = createBottomTabNavigator();
export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
      headerShown: false,
      tabBarStyle: Platform.select({
        ios: { position: 'absolute' },
        default: {},
      }),
    }}
  >
    <Tab.Screen 
      name="Home" 
      component={MainPage} 
      options={{ 
        title: 'Home',
        tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} /> 
      }} 
    />
    <Tab.Screen
      name="Profile"
      component={Profile}
      options={{
        title: 'Profile',
        tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
      }}
    />
  </Tab.Navigator>
  );
}
