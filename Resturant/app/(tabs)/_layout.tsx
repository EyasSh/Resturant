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
/**
 * TabLayout is a navigator for the bottom tab bar.
 * It has two tabs: Home and Profile.
 * The Home tab displays the main page of the app.
 * The Profile tab displays the user's profile information.
 * The tab bar uses the tint color of the current color scheme.
 * The header is hidden.
 * On iOS, the tab bar is positioned at the bottom of the screen.
 * On Android, the tab bar is positioned at the bottom of the screen.
 */
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
