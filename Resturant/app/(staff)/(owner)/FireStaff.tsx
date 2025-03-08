import { useState, useEffect } from "react";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { StyleSheet, TouchableOpacity, View, ScrollView } from "react-native";
import axios from "axios";
import ip from "@/Data/Addresses";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { FireWaiterParams } from "@/Types/FireWaiterParams";
import CurvedButton from "@/components/ui/CurvedButton";

export default function FireStaff() {
    const [waiters, setWaiters] = useState<FireWaiterParams[]>([]);

    // ✅ Fetch Waiters Function (Similar to fetchMeals)
    const fetchWaiters = async () => {
        try {
            const token = await AsyncStorage.getItem('token');

            const res = await axios.get(`http://${ip.eyas}:5256/api/owner/waiters`, {
                headers: {
                    "X-Auth-Token": token,
                },
            });

            if (res && res.status === 200) {
                

                // Ensure proper mapping (handling both `id` and `_id`)
                setWaiters(res.data.map((waiter: any) => ({
                    id: waiter.id || waiter._id,
                    name: waiter.name || waiter.Name
                })));
            }
        } catch (error) {
            
        }
    };

    // ✅ Remove Waiter Function
    const RemoveWaiter = async (id: string) => {
        try {
            const token = await AsyncStorage.getItem('token');

            const res = await axios.delete(`http://${ip.julian}:5256/api/owner/delete/waiter?id=${id}`, {
                headers: {
                    "X-Auth-Token": token,
                },
            });
            if(res && res.status===400){
                alert(res.data)
                return;
            }
            if (res && res.status === 200) {
                alert(res.data);

                // ✅ Remove from state immediately
                setWaiters(prevWaiters => prevWaiters.filter(waiter => waiter.id !== id));

                // ✅ Refetch from API to ensure consistency
                fetchWaiters();
            }
        } catch (error) {
            console.error("Error removing waiter:", error);
            alert("Error removing waiter.");
        }
    };

    // ✅ useEffect similar to fetchMeals()
    useEffect(() => {
        fetchWaiters();
    }, []); // ✅ Runs only on component mount

    return (
        <GestureHandlerRootView style={{ flex: 1 }}> 
            <ThemedView style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    {waiters.length === 0 ? (
                        <ThemedText style={styles.noWaitersText}>No waiters found.</ThemedText>
                    ) : (
                        waiters.map((waiter) => (
                            <ThemedView key={waiter.id} style={styles.waiterBox}>
                                <ThemedText style={styles.waiterText}>{waiter.name}</ThemedText>
                                <CurvedButton 
                                    style={styles.removeButton} 
                                    action={() => RemoveWaiter(waiter.id)}
                                    title="Remove"
                                />
                            </ThemedView>
                        ))
                    )}
                </ScrollView>
            </ThemedView>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    waiterBox: {
        width: '90%',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: "#351fff",
        shadowOffset: { width: 5, height: 5 }, // Higher shadow
        shadowOpacity: 1, // Full opacity
        shadowRadius: 10, // Spread out more
        elevation: 20, // Higher elevation for Android
        
    },
    waiterText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    removeButton: {
        backgroundColor: '#ff4d4d',
        padding: 10,
        borderRadius: 5,
    },
    noWaitersText: {
        fontSize: 20,
        fontWeight: "bold",
        color: "gray",
    },
});
