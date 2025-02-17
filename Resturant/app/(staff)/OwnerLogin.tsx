import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React from 'react';
import { StyleSheet } from 'react-native';

function OwnerLogin() {
    return (
        <ThemedView style={styles.container}>
            <ThemedText >Owner Login</ThemedText>
        </ThemedView>
    );
}

export default OwnerLogin;
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