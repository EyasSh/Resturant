import { useState, useEffect } from "react";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { StyleSheet, TouchableOpacity } from "react-native";
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
}
export default function RemoveTable() {
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchTables = async () => {
            try {
                const token = await AsyncStorage.getItem("token");
                const res = await axios.get(`http://${ip.julian}:5256/api/owner/tables`, {
                    headers: {
                        "x-auth-token": token,
                    },
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
                `http://${ip.julian}:5256/api/owner/delete/tables?number=${number}`,
                {
                    headers: {
                        "x-auth-token": token,
                    },
                }
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
            <ThemedView style={styles.container}>
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false} // Hide scrollbar
                >
                    <ThemedText style={styles.text}>Remove Table</ThemedText>
                    {loading ? (
    <ThemedText>Loading...</ThemedText>
) : (
    Array.isArray(tables) && tables.length > 0 ? (
        tables.map((table) => (
            <ThemedView key={table.id} style={styles.tableItem}>
                <ThemedText style={styles.tableText}>
                    Table {table.tableNumber} {"\n"} Capacity: {table.capacity} {"\n"}{" "}
                    {table.isWindowSide ? "Window Side" : "Regular"}
                </ThemedText>
                <CurvedButton
                    action={() => handleDelete(table.tableNumber)}
                    title={"Remove"}
                    style={{ backgroundColor: "red" }}
                />
            </ThemedView>
        ))
    ) : (
        <ThemedText>No tables available.</ThemedText> // Fallback if tables is empty or undefined
    )
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
        width: "100%",
    },
    scrollContainer: {
        alignItems: "center",
        paddingVertical: 20,
        width: "100%", // Ensures ScrollView is as wide as ThemedView
    },
    text: {
        fontSize: 25,
        fontWeight: "bold",
        marginBottom: 20,
    },
    tableItem: {
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: 15,
        marginVertical: 10,
        borderRadius: 10,
        borderColor: "#351fff",
        borderWidth: 1,
        width: "100%",
        alignItems: "center",
        shadowColor: "#351fff",
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 15, // Required for Android shadow
    },
    tableText: {
        fontSize: 30,
        textAlign: "center",
        fontWeight: "bold",
        paddingBottom: 20,
    },
});