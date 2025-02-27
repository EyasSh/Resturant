import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Button, FlatList, ActivityIndicator } from "react-native";
import ip from "@/Data/Addresses";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Meal = {
  MealId: string;
  MealName: string;
  Price: number;
};

export default function Menu() {
  const [menuItems, setMenuItems] = useState<Meal[]>([]);
  const [list, setList] = useState<(Meal & { quantity: number })[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch meals from API
  useEffect(() => {
    if (menuItems.length > 0) {
      
      return; // No need to fetch again if we already have items
    }
    async function fetchMeals() {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          throw new Error("User is not authenticated.");
        }

        const response = await axios.get(`http://${ip.eyas}:5256/api/user/meals`, {
          headers: {
            "X-Auth-Token": token,
          },
        });

        if (response.status !== 200) {
          throw new Error("Failed to fetch meals.");
        }
        console.log("Response:", response.data.meals);

        const data: Meal[] = response.data.meals;
        

        console.log("Fetched meals:", data);
        if (Array.isArray(response.data.meals) && response.data.meals.length > 0) {
          console.log("Setting menu items:", response.data.meals);
          setMenuItems([...response.data.meals]); // Spread to force state update
          console.log(menuItems)
        } else {
          setMenuItems([]); // Ensure it does not remain undefined
        }
        
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMeals();
  }, [menuItems]);

  function addItemToList(item: Meal) {
    setList((prevList) => {
      const existingIndex = prevList.findIndex((i) => i.MealId === item.MealId);
      if (existingIndex >= 0) {
        const updatedList = [...prevList];
        updatedList[existingIndex].quantity += 1;
        return updatedList;
      } else {
        return [...prevList, { ...item, quantity: 1 }];
      }
    });
  }

  function calculateTotal() {
    return list
      .reduce((total, item) => total + item.Price * item.quantity, 0)
      .toFixed(2);
  }

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <ThemedText>Loading menu...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>Error: {error}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {menuItems.length > 0 ? (
        menuItems.map((item) => {  // ✅ FIX: Make sure it returns JSX correctly
          const selectedItem = list.find((i) => i.MealId === item.MealId);
          const currentQuantity = selectedItem ? selectedItem.quantity : 0;
  
          return (
            <ThemedView key={item.MealId} style={styles.menuItem}>
              <ThemedText style={styles.name}>{item.MealName}</ThemedText>
              <ThemedText style={styles.price}>{(Number(item.Price) || 0).toFixed(2)} ₪</ThemedText>
              <ThemedText style={styles.price}>x{currentQuantity}</ThemedText>
              <Button title="Add" onPress={() => addItemToList(item)} />
            </ThemedView>
          );
        })
      ) : (
        <ThemedText style={styles.emptyText}>No menu items available.</ThemedText>
      )}
  
      <ThemedText style={styles.subtitle}>Your Selections:</ThemedText>
      {list.length > 0 ? (
        <FlatList
          data={list}
          keyExtractor={(item) => item.MealId}  // ✅ FIX: Remove `.toString()` since MealId is already a string
          renderItem={({ item }) => (
            <View style={styles.selectedItem}>
              <ThemedText>
                {item.MealName} x {item.quantity}
              </ThemedText>
              <ThemedText>{(item.Price * item.quantity).toFixed(2)} ₪</ThemedText>
            </View>
          )}
        />
      ) : (
        <Text style={styles.emptyText}>No items selected.</Text>
      )}
  
      <ThemedText style={styles.total}>Total: {calculateTotal()} ₪</ThemedText>
    </ThemedView>
  );
  
}

const styles = StyleSheet.create({
  container: {
    padding: 30,
    height: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
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
