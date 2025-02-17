import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React from 'react';
import { StyleSheet } from 'react-native';

function WaiterLogin() {
    return (
        <ThemedView style={styles.container}>
            <ThemedText >Waiter Login</ThemedText>
        </ThemedView>
    );
}

export default WaiterLogin;
const styles = StyleSheet.create({
    container:{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        height: '100%',
        width: '100%',
    },
})