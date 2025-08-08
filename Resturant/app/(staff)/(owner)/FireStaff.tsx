import { useState, useEffect } from "react";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { StyleSheet, TouchableOpacity, View, ScrollView, ToastAndroid } from "react-native";
import axios from "axios";
import ip from "@/Data/Addresses";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { FireWaiterParams } from "@/Types/FireWaiterParams";
import CurvedButton from "@/components/ui/CurvedButton";
import ShowMessageOnPlat from "@/components/ui/ShowMessageOnPlat";
/**
 * FireStaff Component
 * 
 * This component displays a list of waiters, along with a button to remove each waiter.
 * Upon removing a waiter, the component updates the list of waiters and re-fetches from the API.
 * 
 * @returns JSX.Element
 */
export default function FireStaff() {
    const [waiters, setWaiters] = useState<FireWaiterParams[]>([]);

/**
 * Fetches the list of waiters from the server and updates the component's state.
 * 
 * @async
 * @returns {Promise<void>} A Promise that resolves when the waiters list is successfully
 * fetched and updated in the state, or rejects with an error if the request fails.
 * 
 * @remarks
 * This function retrieves the authentication token from AsyncStorage and uses it
 * to make an authorized GET request to the server. Upon successful response, it
 * maps the waiters' data to ensure proper handling of various field names and updates
 * the state with the list of waiters. If an error occurs, it is caught and handled.
 */
    const fetchWaiters = async () => {
        try {
            const token = await AsyncStorage.getItem('token');

            const res = await axios.get(`http://${ip.julian}:5256/api/owner/waiters`, {
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


    /**
     * Removes a waiter from the restaurant's database.
     * 
     * @param id The ID of the waiter to be removed.
     * 
     * @returns A Promise that resolves if the waiter was removed successfully, or rejects if there is an error.
     * 
     * @remarks
     * This function is called when a user clicks the "Remove" button on a waiter in the "Fire Staff" screen.
     * It removes the waiter from the restaurant's database and updates the component's state immediately.
     * It also re-fetches the list of waiters from the API to ensure consistency.
     */
    const RemoveWaiter = async (id: string) => {
        try {
            const token = await AsyncStorage.getItem('token');

            const res = await axios.delete(`http://${ip.julian}:5256/api/owner/delete/waiter?id=${id}`, {
                headers: {
                    "X-Auth-Token": token,
                },
            });
            if(res && res.status===400){
                
                ShowMessageOnPlat(`${res.data}`);
                return;
            }
            if (res && res.status === 200) {
               
                ToastAndroid.show("Removed Waiter Successfully", ToastAndroid.LONG);

                // ✅ Remove from state immediately
                setWaiters(prevWaiters => prevWaiters.filter(waiter => waiter.id !== id));

                // ✅ Refetch from API to ensure consistency
                fetchWaiters();
            }
        } catch (error) {
            console.error("Error removing waiter:", error);
            ShowMessageOnPlat("Error removing waiter.");
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
