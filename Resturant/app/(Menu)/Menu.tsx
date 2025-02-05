import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import React, { useState } from "react";
import { StyleSheet, View, Text, Button, FlatList, Alert } from "react-native";

const menuItems = [
    { id: 1, name: "Burger", price: 12.99 },
    { id: 2, name: "Pasta", price: 15.49 },
    { id: 3, name: "Coffee", price: 3.99 },
    { id: 4, name: "Ice Cream", price: 5.49 },
];

export default function Menu() {
    const [list, setList] = useState<{ id: number; name: string; price: number }[]>([]);

    function addItemToList(item: { id: number; name: string; price: number }) {
        if (list.some((i) => i.id === item.id)) {
            Alert.alert("Item Already Added", `${item.name} is already in your list.`);
            return;
        }
        setList([...list, item]);
    }

    function calculateTotal() {
        return list.reduce((total, item) => total + item.price, 0).toFixed(2);
    }

    return (
        <ThemedView style={styles.container}>
            <ThemedText style={styles.title}>Menu</ThemedText>
            {menuItems.map((item) => (
                <View key={item.id} style={styles.menuItem}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.price}>${item.price.toFixed(2)}</Text>
                    <Button title="Add" onPress={() => addItemToList(item)} />
                </View>
            ))}

            <ThemedText style={styles.subtitle}>Your Selections:</ThemedText>
            {list.length > 0 ? (
                <FlatList
                    data={list}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.selectedItem}>
                            <Text>{item.name}</Text>
                            <Text>${item.price.toFixed(2)}</Text>
                        </View>
                    )}
                />
            ) : (
                <Text style={styles.emptyText}>No items selected.</Text>
            )}

            <ThemedText style={styles.total}>Total: ${calculateTotal()}</ThemedText>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 10,
    },
    menuItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
    },
    name: {
        fontSize: 18,
        fontWeight: "bold",
    },
    price: {
        fontSize: 16,
        color: "gray",
    },
    subtitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginTop: 20,
    },
    selectedItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
    },
    emptyText: {
        fontSize: 16,
        color: "gray",
        textAlign: "center",
        marginTop: 10,
    },
    total: {
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 20,
        textAlign: "right",
    },
});

