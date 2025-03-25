import { StyleSheet, Image, Platform } from 'react-native';
import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import LogoutButton from '@/components/LogoutButton';

/**
 * Profile component displays the user's profile information.
 * 
 * This component fetches the user's name from AsyncStorage and displays it.
 * If the user's name is not found, it defaults to 'Guest'.
 * 
 * @returns A ThemedView containing a welcome message and the user's name.
 */

export default function Profile() {
  const [name, setName] = useState(null);

  useEffect(() => {
  /**
   * Fetches the user's name from AsyncStorage and sets it to the component's
   * state. If the user's name is not found, it defaults to 'Guest'.
   * 
   * @returns {Promise<void>}
   */
    const fetchUser = async () => {
      try {
        const user = await AsyncStorage.getItem('user');
        
        if (user) {
          const parsedUser = JSON.parse(user);
          setName(parsedUser?.name ?? 'Guest');
        } else {
          alert('User not found in AsyncStorage.');
        }
      } catch (error) {
        console.error('Failed to load user from AsyncStorage:', error);
      }
    };

    fetchUser();
  }, []);

  return (
    <ThemedView style={styles.titleContainer}>
      <ThemedText style={styles.text}>Welcome to the Profile page</ThemedText>
      <ThemedText style={styles.text}>{name ? name : 'Guest'}</ThemedText>
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
  titleContainer: {
    flexDirection: 'column',
    gap: 8,
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text:{
    fontSize: 25,
    fontWeight: 'bold',
    height: '10%',
    width: 'auto',
    paddingTop: 40,
    flexShrink: 1,
  
  },
});
