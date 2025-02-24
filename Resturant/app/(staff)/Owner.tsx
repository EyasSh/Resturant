import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React from 'react';
import { StyleSheet, TouchableOpacity,ScrollView } from 'react-native';
import { router } from 'expo-router';
function Owner() {
    return (
        
        <ThemedView style={styles.view}>
            <ScrollView contentContainerStyle={styles.container}>
            <ThemedText style={styles.header}>Owner Terminal</ThemedText>
            <TouchableOpacity style={styles.functionBox} onPress={() => router.push("./WaiterSignup")}>
                <ThemedText style={styles.largeText}>+</ThemedText>
                <ThemedText style={styles.boldSmallText}>Add Worker</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionBox} onPress={() => alert("pressed")}>
                <ThemedText style={styles.largeText}>+</ThemedText>
                <ThemedText style={styles.boldSmallText}>Add Table</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionBox} onPress={() => alert("pressed")}>
                <ThemedText style={styles.largeText}>+</ThemedText>
                <ThemedText style={styles.boldSmallText}>Add Meals</ThemedText>
            </TouchableOpacity>
            
            </ScrollView>
            </ThemedView>
        
    );
}
const styles = StyleSheet.create({
    view: {
        height: '100%',
        width: '100%',
    },
    container:{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 70,
        gap: 20,
    },
    header:{
        fontSize: 25,
        fontWeight: 'bold',
        height: 'auto',
        width: 'auto',
    },
    functionBox:{
        display:'flex',
        flexDirection:'column',
        alignItems:'center',
        justifyContent:'center',
        width:200,
        height:200,
        margin:10,
        borderColor:"grey",
        borderWidth:1,
        borderRadius:5,
        padding:20,
    },
    largeText:{
        fontSize: 60,
        fontWeight: 'bold',
        color: 'rgb(152, 76, 222)',
        flexShrink: 1, // Ensures text does not break the layout
        textAlign: 'center',
        paddingTop: 40,
        
    },
    boldSmallText:
    {
        fontSize: 15,
        fontWeight: 'bold',
    }
})
export default Owner;