import { useState, useEffect } from "react";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { StyleSheet} from "react-native";
import axios from "axios";
import ip from "@/Data/Addresses";
import AsyncStorage from "@react-native-async-storage/async-storage";
import router from "expo-router";
import { ScrollView } from "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function FireStaff() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}> 
            <ThemedView style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <ThemedText style={styles.text}>Fire Staff</ThemedText>
                </ScrollView>
            </ThemedView>
        </GestureHandlerRootView>
    );
}
const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',    
        height: '100%',
        width: '100%',
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1, // Ensures ScrollView content expands properly
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 60,
        fontWeight: 'bold',
        height: 'auto',
        width: 'auto',
        paddingTop: 100,
        flexShrink: 20,
        
    },
});