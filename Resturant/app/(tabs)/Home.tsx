import { useTheme } from '@react-navigation/native';
import Logo from "@/components/ui/Logo";import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React, { useState } from 'react';
import { TextInput, StyleSheet, Button, TouchableOpacity, View } from 'react-native';
import TableCard from '@/components/TableCard';
export default function MainPage() {
 return(
    <ThemedView style={styles.container}>
       <TableCard />
    </ThemedView>
 );   
}
const styles = StyleSheet.create({
    container:{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        gap: 20,
        height: '100%',
        width: '100%',
    },
    text:{
        fontSize: 25,
        fontWeight: 'bold',
        height: 'auto',
        width: 'auto',
    },
});