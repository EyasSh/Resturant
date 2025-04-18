import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Platform,
  ToastAndroid,
  ActivityIndicator,
  Alert,
  FlatList,
  View,
  Button,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@/Routes/NavigationTypes';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { HapticTab } from '@/components/HapticTab';
import ip from '@/Data/Addresses';

// Define the QuickMessage type
type QuickMessage = { id: string; message: string };
const API_BASE = `http://${ip.julian}:5256/api/owner`;

function RemoveQuickMessage() {
  const navigation = useNavigation<NavigationProp>();
  const [quickMessages, setQuickMessages] = useState<QuickMessage[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [removing, setRemoving] = useState<boolean>(false);

  const showToast = (msg: string) => {
    if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
    else Alert.alert(msg);
  };

  const fetchQuickMessages = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get<QuickMessage[]>(`${API_BASE}/messages`, {
        headers: { 'x-auth-token': token || '' },
      });
      setQuickMessages(response.data);
    } catch (error) {
      console.error('Fetch error:', error);
      showToast('Failed to load quick messages.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuickMessages();
  }, [fetchQuickMessages]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const handleRemove = useCallback(async () => {
    if (!selectedIds.length) return;
    setRemoving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.delete(`${API_BASE}/delete/messages`, {
        headers: { 'x-auth-token': token || '' },
        data: { quickMessageIds: selectedIds },
      });
      if (response.status === 200) {
        setQuickMessages(prev => prev.filter(msg => !selectedIds.includes(msg.id)));
        setSelectedIds([]);
        showToast('Selected messages removed.');
      } else {
        showToast('Error removing messages.');
      }
    } catch (error) {
      console.error('Remove error:', error);
      showToast('Failed to remove messages.');
    } finally {
      setRemoving(false);
    }
  }, [selectedIds]);

  const renderItem = ({ item }: { item: QuickMessage }) => {
    const isSelected = selectedIds.includes(item.id);
    return (
      <HapticTab
        onPress={() => toggleSelection(item.id)}
        style={[styles.item, isSelected && styles.selectedItem]}
      >
        <View style={styles.itemContent}>
          <ThemedText style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected ? '☑' : '☐'}
          </ThemedText>
          <ThemedText style={styles.messageText}>{item.message}</ThemedText>
        </View>
      </HapticTab>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Remove Quick Messages</ThemedText>

      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : quickMessages.length ? (
        <FlatList
          data={quickMessages}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      ) : (
        <ThemedText style={styles.emptyText}>No quick messages available.</ThemedText>
      )}

      <View style={styles.buttonContainer}>
        <Button
          title={removing ? 'Removing...' : 'Remove Selected'}
          onPress={handleRemove}
          disabled={!selectedIds.length || removing}
        />
      </View>
    </ThemedView>
  );
}

export default RemoveQuickMessage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  loader: {
    marginTop: 20,
  },
  list: {
    paddingBottom: 20,
  },
  item: {
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  selectedItem: {
    borderColor: '#EE0000',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    fontSize: 18,
    marginRight: 12,
    color: '#888',
  },
  checkboxSelected: {
    color: '#e00',
  },
  messageText: {
    fontSize: 16,
    flex: 1,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 'auto',
    marginBottom: 16,
  },
});
