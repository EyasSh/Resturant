import { useTheme } from '@react-navigation/native';
import Logo from "@/components/ui/Logo";import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React, { useState, useEffect } from 'react';
import { TextInput, StyleSheet, Button, TouchableOpacity, Dimensions , ScrollView } from 'react-native';
import TableCard from '@/components/TableCard';
import axios from 'axios';
import ip from '@/Data/Addresses';
import AsyncStorage from '@react-native-async-storage/async-storage';


const screenWidth = Dimensions.get("window").width;
const numColumns = screenWidth > 600 ? 3 : 2; // Use 3 columns on larger screens, otherwise 2
const cardWidth = Math.max((screenWidth / numColumns) - 30, 150); // Ensure cards don't get too small
type TableProps = {
  tableNumber: number;
  isWindowSide: boolean;
  isOccupied: boolean;
  waiterId: string;
  userId: string;
  capacity : number;

}
export default function MainPage() {
  const [tables, setTables] = useState<TableProps[]>([]);
  useEffect(() => {
    const fetchTables = async () => {
      const token = await AsyncStorage.getItem('token');
      try{
        const res = await axios.get(`http://${ip.julian}:5256/api/user/tables`,{
          headers:{
            'x-auth-token':token
          }
        });
        if(res && res.status===200){
          
          setTables(res.data.tables);
        }
      }catch(e){
        alert(e);
      }
      
    }
   fetchTables();
  }, []);
  return (
    <ThemedView style={styles.wrapper}>
      
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={true}>
        <ThemedView style={styles.gridContainer}>
          {Array.from({ length: tables.length }).map((_, index) => (
            <TableCard key={index} 
            width={cardWidth} 
            tableNumber={tables[index].tableNumber}  
            isOccupied={tables[index].isOccupied} 
            isWindowSide={tables[index].isWindowSide} 
            userId={"No ID"} waiterId={"No ID"} 
            capacity={tables[index].capacity} />
          ))}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}
const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
      },
      container: {
        paddingTop: 80,
        paddingHorizontal: 20, // Add padding to prevent edge cramping
        paddingBottom: 20,

      },
      gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between', // Space items evenly
        gap: 15, // Add gap between items
      },
    text:{
        fontSize: 25,
        fontWeight: 'bold',
        height: 'auto',
        width: 'auto',
    },
});