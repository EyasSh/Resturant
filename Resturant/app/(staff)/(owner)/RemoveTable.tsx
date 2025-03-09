import { useState, useEffect } from "react";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { StyleSheet, TouchableOpacity } from "react-native";
import axios from "axios";
import ip from "@/Data/Addresses";
import AsyncStorage from "@react-native-async-storage/async-storage";
import router from "expo-router";
import { ScrollView } from "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RemoveTable() {
    const [tables, setTables] = useState<{ id: number; capacity: number; isWindowSide: boolean }[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                alert("User is not authenticated.");
                return;
            }
            const res = await axios.get(`http://${ip.julian}:5256/api/owner/tables`, {
                headers: { "X-Auth-Token": token },
            });
            if (res.status === 200) {
                setTables(res.data);
            }
        } catch (error) {
            alert("Error fetching tables.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (tableId: number) => {
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                alert("User is not authenticated.");
                return;
            }

            const res = await axios.delete(`http://${ip.julian}:5256/api/owner/delete/table/${tableId}`, {
                headers: { "X-Auth-Token": token },
            });

            if (res.status === 200) {
                alert("Table deleted successfully!");
                setTables(tables.filter(table => table.id !== tableId));
            }
        } catch (error) {
            alert("Failed to delete table.");
        }
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemedView style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <ThemedText style={styles.text}>Remove Table</ThemedText>
                    {loading ? (
                        <ThemedText>Loading...</ThemedText>
                    ) : (
                        tables.map((table) => (
                            <TouchableOpacity key={table.id} style={styles.tableItem} onPress={() => handleDelete(table.id)}>
                                <ThemedText style={styles.tableText}>
                                    Table {table.id} - Capacity: {table.capacity} - {table.isWindowSide ? "Window Side" : "Regular"}
                                </ThemedText>
                            </TouchableOpacity>
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
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    scrollContainer: {
        alignItems: "center",
        paddingVertical: 20,
    },
    text: {
        fontSize: 25,
        fontWeight: "bold",
        marginBottom: 20,
    },
    tableItem: {
        backgroundColor: "red",
        padding: 15,
        marginVertical: 10,
        borderRadius: 10,
        width: "90%",
        alignItems: "center",
    },
    tableText: {
        fontSize: 18,
        color: "white",
    },
});
