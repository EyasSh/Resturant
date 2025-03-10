import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useState,useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LogoutButton from '@/components/LogoutButton';
import axios from 'axios';
import ip from '@/Data/Addresses';
import * as signalR from '@microsoft/signalr';
type OwnerDTO={
    id : string,
    name: string,
    email: string,
    phone: string,
    password: string,
    restaurantNumber: string
}
function Owner() {
    const [owner, setOwner] =useState<OwnerDTO>({id: "", name: "" , email: "", phone: "", password: "", restaurantNumber: "" });
    const [signalRConnection, setSignalRConnection] = useState<signalR.HubConnection | null>(null);
    useEffect(() => {
        const fetchOwner = async () => {
            const ownerData = await AsyncStorage.getItem("owner");
            if (ownerData) {
                setOwner(JSON.parse(ownerData));
            }
        };
    
        const fetchMeals = async () => {
            const token = await AsyncStorage.getItem('token');
            try {
                const res = await axios.get(`http://${ip.julian}:5256/api/owner/meals`, {
                    headers: { 'x-auth-token': token }
                });
    
                if (res && res.status === 200) {
                    await AsyncStorage.setItem('meals', JSON.stringify(res.data));
                }
            } catch {
                alert("An error occurred or waiter already online");
            }
        };
    
        fetchOwner();
        fetchMeals();
    }, []); // Runs only once on mount
    
    useEffect(() => {
        if (!owner.id) return; // Prevent connecting with an empty owner ID
    
        const connect = async () => {
            const connection = new signalR.HubConnectionBuilder()
                .withUrl(`http://${ip.julian}:5256/hub?ownerid=${owner.id}&privilagelevel=owner`)
                .build();
            
            try {
                await connection.start();
                alert('Session established');
                setSignalRConnection(connection);
            } catch (error) {
                console.error('SignalR connection error:', error);
            }
        };
    
        connect();
    }, [owner.id]); // Runs when owner.id changes
    
    return (
        
        <ThemedView style={styles.view}>
        <ScrollView contentContainerStyle={styles.container}>
            <ThemedText style={styles.header}>Welcome {owner.name}</ThemedText>
            <LogoutButton action={async()=>await signalRConnection?.stop()} />
    
            <ThemedView style={styles.gridContainer}>
                {/* Left side - Add buttons */}
                <ThemedView style={styles.leftColumn}>
                    <TouchableOpacity style={styles.functionBox} onPress={() => router.push("./WaiterSignup")}>
                        <ThemedText style={styles.largeText}>+</ThemedText>
                        <ThemedText style={styles.boldSmallText}>Add Worker</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.functionBox} onPress={() => router.push("./AddTableForm")}>
                        <ThemedText style={styles.largeText}>+</ThemedText>
                        <ThemedText style={styles.boldSmallText}>Add Table</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.functionBox} onPress={() => router.push("./AddMealForm")}>
                        <ThemedText style={styles.largeText}>+</ThemedText>
                        <ThemedText style={styles.boldSmallText}>Add Meals</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.functionBox} onPress={() => alert("View tables")}>
                        <Image source={require("@/assets/images/view.png")} style={{ width: 100, height: 100 }} />
                        <ThemedText style={styles.boldSmallText}>View tables</ThemedText>
                    </TouchableOpacity>
                </ThemedView>
    
                {/* Right side - Remove buttons */}
                <ThemedView style={styles.rightColumn}>
                    <TouchableOpacity style={styles.functionBox} onPress={() => router.push("./FireStaff")}>
                        <ThemedText style={styles.largeText}>-</ThemedText>
                        <ThemedText style={styles.boldSmallText}>Remove Worker</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.functionBox} onPress={() => router.push("./RemoveTable")}>
                        <ThemedText style={styles.largeText}>-</ThemedText>
                        <ThemedText style={styles.boldSmallText}>Remove Table</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.functionBox} onPress={() => router.push("./RemoveMeal")}>
                        <ThemedText style={styles.largeText}>-</ThemedText>
                        <ThemedText style={styles.boldSmallText}>Remove Meals</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.functionBox} onPress={() => alert("View on call workers")}>
                        <Image source={require("@/assets/images/view.png")} style={{ width: 100, height: 100 }} />
                        <ThemedText style={styles.boldSmallText}>View active workers</ThemedText>
                    </TouchableOpacity>

                </ThemedView>
            </ThemedView>
        </ScrollView>
    </ThemedView>
    

        
    );
}
const styles = StyleSheet.create({
    view: {
        height: '100%',
        width: '100%',
    },
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 70,
        gap: 20,
        paddingBottom: 20,
    },
    header: {
        fontSize: 25,
        fontWeight: 'bold',
        height: 'auto',
        width: 'auto',
    },
    gridContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '90%', // Ensure grid fits within the screen
    },
    leftColumn: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start', // Align to the left
        gap: 10,
        width: '48%',
    },
    rightColumn: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end', // Align to the right
        gap: 10,
        width: '48%',
    },
    functionBox: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%', // Takes the full width of the column
        aspectRatio: 1, // Keeps buttons square
        borderColor: "grey",
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        gap: 10,
    },
    largeText: {
        fontSize: 60,
        fontWeight: 'bold',
        color: 'rgb(152, 76, 222)',
        flexShrink: 1,
        textAlign: 'center',
        paddingTop: 40,
    },
    boldSmallText: {
        fontSize: 15,
        fontWeight: 'bold',
        textAlign: 'center',
    }
});


export default Owner;