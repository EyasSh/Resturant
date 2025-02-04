import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import React from "react";
import { StyleSheet, View, Text } from "react-native";

const menuItems = [
    { id: 1, name: "Burger", price: 12.99 },
    { id: 2, name: "Pasta", price: 15.49 },
    { id: 3, name: "Coffee", price: 3.99 },
    { id: 4, name: "Ice Cream", price: 5.49 },
];

export default function Menu() {
    return (
        <ThemedView style={styles.container}>
            <ThemedText style={styles.title}>Menu Time DADDY!</ThemedText>
            {menuItems.map((item) => (
                <View key={item.id} style={styles.menuItem}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.price}>${item.price.toFixed(2)}</Text>
                </View>
            ))}
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
});

