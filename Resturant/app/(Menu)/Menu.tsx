import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import React, { useState } from "react";
import { StyleSheet, View, Text, Button, FlatList } from "react-native";

const menuItems = [
  { id: 1, name: "Burger", price: 12.99, quantity: 0 },
  { id: 2, name: "Pasta", price: 15.49, quantity: 0 },
  { id: 3, name: "Coffee", price: 3.99, quantity: 0 },
  { id: 4, name: "Ice Cream", price: 5.49, quantity: 0 },
];

export default function Menu() {
  const [list, setList] = useState<
    { id: number; name: string; price: number; quantity: number }[]
  >([]);

  /**
   * Adds (or increments) an item in the 'list'.
   */
  function addItemToList(item: { id: number; name: string; price: number; quantity: number }) {
    setList((prevList) => {
      // Check if the item is already in the list
      const existingIndex = prevList.findIndex((i) => i.id === item.id);

      if (existingIndex >= 0) {
        // If it's already there, increment the quantity
        const updatedList = [...prevList];
        updatedList[existingIndex].quantity += 1;
        return updatedList;
      } else {
        // If not, add it with quantity= item.quantity + 1 (since default is 0)
        return [...prevList, { ...item, quantity: item.quantity + 1 }];
      }
    });
  }

  /**
   * Calculate total price by summing price * quantity of each item.
   */
  function calculateTotal() {
    return list
      .reduce((total, item) => total + item.price * item.quantity, 0)
      .toFixed(2);
  }

  return (
    <ThemedView style={styles.container}>

      {menuItems.map((item) => {
        // Find the current quantity in 'list' for this item
        const selectedItem = list.find((i) => i.id === item.id);
        // If not found, quantity remains what is defined in menuItems (initially 0)
        const currentQuantity = selectedItem ? selectedItem.quantity : item.quantity;

        return (
          <ThemedView key={item.id} style={styles.menuItem}>
            <ThemedText style={styles.name}>{item.name}</ThemedText>
            {/* Show total price for that item = price * current quantity */}
            <ThemedText style={styles.price}>
              ${ item.price.toFixed(2) }
            </ThemedText>
            <ThemedText style={styles.price}>x{currentQuantity}</ThemedText>
            <Button title="Add" onPress={() => addItemToList(item)} />
          </ThemedView>
        );
      })}

      <ThemedText style={styles.subtitle}>Your Selections:</ThemedText>
      {list.length > 0 ? (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.selectedItem}>
              <ThemedText>
                {item.name} x {item.quantity}
              </ThemedText>
              <ThemedText>${(item.price * item.quantity).toFixed(2)}</ThemedText>
            </View>
          )}
        />
      ) : (
        <Text style={styles.emptyText}>No items selected.</Text>
      )}

      <ThemedText style={styles.total}>
        Total: ${calculateTotal()}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 30,
    height: "100%",
   
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
