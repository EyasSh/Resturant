import { useState, useEffect } from "react";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { StyleSheet } from "react-native";
import axios from "axios";
import ip from "@/Data/Addresses";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScrollView } from "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import CurvedButton from "@/components/ui/CurvedButton";

export type Table = {
    id: string;
    capacity: number;
    tableNumber: number;
    isWindowSide: boolean;
    isOccupied: boolean;
    waiterId: string;
    userId: string;
};

export default function RemoveTable() {
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchTables = async () => {
            try {
                const token = await AsyncStorage.getItem("token");
                const res = await axios.get(`http://${ip.nitc}:5256/api/owner/tables`, {
                    headers: { "x-auth-token": token },
                });
                if (res && res.status === 200) {
                    setTables(res.data);
                    await AsyncStorage.setItem("tables", JSON.stringify(res.data));
                }
            } catch (e) {
                alert(e);
            } finally {
                setLoading(false);
            }
        };
        fetchTables();
    }, []);

    const handleDelete = async (number: number) => {
        try {
            // Retrieve stored tables
            const storedTables = await AsyncStorage.getItem("tables");
            let tablesArray = storedTables ? JSON.parse(storedTables) : [];

            // Remove the table with the given number
            const updatedTables = tablesArray.filter((table: { tableNumber: number }) => table.tableNumber !== number);

            // Update AsyncStorage with the filtered list
            await AsyncStorage.setItem("tables", JSON.stringify(updatedTables));

            const token = await AsyncStorage.getItem("token");
            const res = await axios.delete(
                `http://${ip.nitc}:5256/api/owner/delete/tables?number=${number}`,
                { headers: { "x-auth-token": token } }
            );

            if (res && res.status === 200) {
                console.log("API Response:", res.data);

                // Ensure tables exist in response before setting state
                if (Array.isArray(res.data.tables)) {
                    setTables(res.data.tables);
                    await AsyncStorage.setItem("tables", JSON.stringify(res.data.tables));
                } else {
                    setTables(updatedTables); // Fallback to filtered list if API response is missing tables
                }
            }
        } catch (e) {
            alert(e);
        }
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <ThemedView style={styles.container}>
                <ThemedText style={styles.text}>Remove Table</ThemedText>
                
                    {loading ? (
                        <ThemedText>Loading...</ThemedText>
                    ) : Array.isArray(tables) && tables.length > 0 ? (
                        tables.map((table) => (
                            <ThemedView key={table.id} style={styles.tableItem}>
                                <ThemedText style={styles.tableText}>Table {table.tableNumber}</ThemedText>
                                <ThemedText style={styles.tableText}>Capacity: {table.capacity}</ThemedText>
                                <ThemedText style={styles.tableText}>
                                    {table.isWindowSide ? "Window Side" : "Not Window Side"}
                                </ThemedText>
                                <ThemedText style={styles.tableText}>
                                    {table.isOccupied ? "Occupied" : "Not Occupied"}
                                </ThemedText>
                                <CurvedButton
                                    action={() => handleDelete(table.tableNumber)}
                                    title={"Remove"}
                                    style={{ backgroundColor: "red" }}
                                />
                            </ThemedView>
                        ))
                    ) : (
                        <ThemedText>No tables available.</ThemedText>
                    )}
                
                </ThemedView>
            </ScrollView>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1, // Ensures full screen usage
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
    },
    scrollContainer: {
        alignItems: "center",
        width: "100%", // Ensures ScrollView is as wide as ThemedView
    },
    text: {
        fontSize: 25,
        fontWeight: "bold",
        marginTop: 50,
    },
    tableItem: {
        flexDirection: "column",
        padding: 20,
        marginVertical: 10,
        borderRadius: 10,
        borderColor: "#351fff",
        borderWidth: 1,
        width: "70%",
        alignItems: "center",
        shadowColor: "#351fff",
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 15, // Required for Android shadow
    },
    tableText: {
        fontSize: 20,
        textAlign: "center",
        fontWeight: "bold",
        padding: 10,
    },
});
