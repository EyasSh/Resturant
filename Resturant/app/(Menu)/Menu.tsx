// src/screens/Menu.tsx

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from "react-native";
import ip from "@/Data/Addresses";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CurvedButton from "@/components/ui/CurvedButton";
import { NavigationProp, RootStackParamList } from "@/Routes/NavigationTypes";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Order, ProtoOrder } from "@/Types/Order";
import { Connection } from "@/Data/Hub";
import ShowMessageOnPlat from "@/components/ui/ShowMessageOnPlat";
import mealImages from "@/Types/MealImages";
import { items } from "@/app/(staff)/(owner)/AddMealForm";
import * as signalR from "@microsoft/signalr";

export type Meal = {
  mealId: string;
  mealName: string;
  price: number;
  category: string;
};

type ScreenProps = RouteProp<RootStackParamList, "Menu">;

export default function Menu() {
  const [menuItems, setMenuItems] = useState<Meal[]>([]);
  const [list, setList] = useState<ProtoOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenProps>();
  const { tableNumber } = route.params || { tableNumber: 0 };
  const [hubConnection, setHubConnection] = useState<signalR.HubConnection | null>(null);

  // Filter dropdown state
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const categories = ["All", ...items.map((i) => i.value)];

  const handleSendOrderRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    async function waitForHubConnection(timeout = 5000): Promise<signalR.HubConnection | null> {
      const start = Date.now();
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const conn = Connection.getHub();
          if (conn && conn.state === "Connected") {
            clearInterval(checkInterval);
            resolve(conn);
          } else if (Date.now() - start > timeout) {
            clearInterval(checkInterval);
            resolve(null);
          }
        }, 100);
      });
    }

    async function fetchMealsAndHub() {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem("token");
        if (!token) throw new Error("User is not authenticated.");

        const response = await axios.get<{ meals: Meal[] }>(
          `http://${ip.julian}:5256/api/user/meals`,
          { headers: { "X-Auth-Token": token } }
        );
        if (response.status !== 200) throw new Error("Failed to fetch meals.");

        const data = response.data.meals;
        setMenuItems(Array.isArray(data) ? data : []);

        const conn = await waitForHubConnection();
        if (conn) {
          setHubConnection(conn);
          ShowMessageOnPlat("Connected set at Menu");
        } else {
          ShowMessageOnPlat("SignalR connection not ready");
        }
      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching meals:", err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMealsAndHub();
  }, []);

  useEffect(() => {
    hubConnection?.on("ReceiveOrderSuccessMessage", (isOkay: boolean, order: Order) => {
      if (isOkay) {
        ShowMessageOnPlat(`Order sent successfully for table ${order.tableNumber}`);
        setList([]); // Clear the order list after sending
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate("Tabs");
        }
      } else {
        ShowMessageOnPlat(`Failed to send order`);
      }
    });
  }, [hubConnection]);

  const handleSendOrder = async () => {
    if (tableNumber === 0 || list.length === 0) {
      alert(
        `Please select a table and add items to your order.\nTable: ${tableNumber}\nItems: ${list.length}`
      );
      return;
    }

    if (hubConnection && hubConnection.state === "Connected") {
      const order: Order = {
        tableNumber,
        orders: list,
        total: Number(calculateTotal()),
        isReady: false,
      };
      try {
        await hubConnection.invoke("OrderMeal", order);
      } catch (err) {
        console.error("Failed to send order:", err);
        alert("Error sending order to the server.");
      }
    } else {
      alert(`Hub is ${hubConnection?.state} or disconnected at table ${tableNumber}`);
    }
  };

  function addItemToList(item: Meal) {
    setList((prev) => {
      const idx = prev.findIndex((i) => i.meal.mealId === item.mealId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      } else {
        return [...prev, { meal: item, quantity: 1 }];
      }
    });
  }

  function removeItemFromList(item: Meal) {
    setList((prev) => {
      const idx = prev.findIndex((i) => i.meal.mealId === item.mealId);
      if (idx >= 0) {
        const updated = [...prev];
        if (updated[idx].quantity > 1) {
          updated[idx].quantity -= 1;
          return updated;
        } else {
          return prev.filter((i) => i.meal.mealId !== item.mealId);
        }
      }
      return prev;
    });
  }

  function calculateTotal() {
    return list.reduce((sum, i) => sum + i.meal.price * i.quantity, 0).toFixed(2);
  }

  // Apply category filter
  const filteredItems =
    selectedCategory === "All"
      ? menuItems
      : menuItems.filter((m) => m.category === selectedCategory);

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
      {/* Filter Dropdown */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterSelector}
          onPress={() => setFilterOpen((v) => !v)}
        >
          <ThemedText>{selectedCategory}</ThemedText>
          <Image
            source={require("@/assets/images/expand.png")}
            style={styles.filterIcon}
          />
        </TouchableOpacity>
        {filterOpen && (
          <ThemedView style={styles.filterOptions}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={styles.filterOption}
                onPress={() => {
                  setSelectedCategory(cat);
                  setFilterOpen(false);
                }}
              >
                <ThemedText>{cat}</ThemedText>
              </TouchableOpacity>
            ))}
          </ThemedView>
        )}
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.mealId}
        renderItem={({ item }) => {
          const selected = list.find((i) => i.meal.mealId === item.mealId);
          const qty = selected ? selected.quantity : 0;
          const imageKey = item.mealName.replace(/\s+/g, "");
          const sourceImage =
            mealImages[imageKey] ?? require("@/assets/images/no-pictures.png");

          return (
            <ThemedView style={styles.menuItem}>
              <Image source={sourceImage} style={styles.listImage} resizeMode="cover" />
              <View style={styles.textContainer}>
                <ThemedText style={styles.name}>{item.mealName}</ThemedText>
                <ThemedText style={styles.category}>{item.category}</ThemedText>
                <ThemedText style={styles.price}>{item.price.toFixed(2)} ₪</ThemedText>
                {qty > 0 && <ThemedText style={styles.quantity}>x{qty}</ThemedText>}
              </View>
              {tableNumber >= 0 && (
                <View style={styles.buttonContainer}>
                  <CurvedButton title="Add" action={() => addItemToList(item)} style={styles.addButton} />
                  <CurvedButton title="Remove" action={() => removeItemFromList(item)} style={styles.removeButton} />
                </View>
              )}
            </ThemedView>
          );
        }}
        ListFooterComponent={
          tableNumber >= 0 ? (
            <>
              <ThemedText style={styles.subtitle}>Your Selections:</ThemedText>
              {list.length > 0 ? (
                list.map((i) => (
                  <View key={i.meal.mealId} style={styles.selectedItem}>
                    <ThemedText>
                      {i.meal.mealName} x {i.quantity}
                    </ThemedText>
                    <ThemedText>{(i.meal.price * i.quantity).toFixed(2)} ₪</ThemedText>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No items selected.</Text>
              )}
              <ThemedText style={styles.total}>Total: {calculateTotal()} ₪</ThemedText>
              <ThemedText style={styles.ptext}>So what's it gonna be?</ThemedText>
              <ThemedView style={styles.paymentmethods}>
                <TouchableOpacity style={styles.paymeth} onPress={handleSendOrder}>
                  <Image source={require("@/assets/images/money.png")} style={styles.image} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.paymeth} onPress={handleSendOrder}>
                  <Image source={require("@/assets/images/payment-method.png")} style={styles.image} />
                </TouchableOpacity>
              </ThemedView>
            </>
          ) : null
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 30,
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

  // Filter styles
  filterContainer: {
    marginVertical: 12,
    zIndex: 10,
  },
  filterSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
   
  },
  filterIcon: {
    width: 16,
    height: 16,
    marginLeft: 8,
  },
  filterOptions: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    
  },
  filterOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    
  },

  // Menu item styles
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  listImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  category: {
    fontSize: 14,
    color: "gray",
    marginTop: 2,
  },
  price: {
    fontSize: 14,
    color: "gray",
    marginTop: 4,
  },
  quantity: {
    fontSize: 14,
    color: "gray",
    marginTop: 2,
  },
  buttonContainer: {
    flexDirection: "column",
    alignItems: "center",
  },
  addButton: {
    backgroundColor: "#00B0CC",
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  removeButton: {
    backgroundColor: "red",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  // Footer & payment
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
  ptext: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 18,
    fontWeight: "bold",
  },
  paymentmethods: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  paymeth: {
    width: 150,
    height: 150,
    margin: 10,
    borderColor: "grey",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
    resizeMode: "cover",
  },
});
