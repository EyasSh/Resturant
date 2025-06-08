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
} from "react-native";
import ip from "@/Data/Addresses";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CurvedButton from "@/components/ui/CurvedButton";
import { TouchableOpacity } from "react-native";
import { NavigationProp, RootStackParamList } from "@/Routes/NavigationTypes";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Order, ProtoOrder } from "@/Types/Order";
import { Connection } from "@/Data/Hub";
import ShowMessageOnPlat from "@/components/ui/ShowMessageOnPlat";
import mealImages from "@/Types/MealImages";

type ScreenProps = RouteProp<RootStackParamList, "Menu">;

export type Meal = {
  mealId: string;
  mealName: string;
  price: number;
  category: string;
};

/**
 * Displays the menu items and allows users to select items to add to their order.
 * If there is an error fetching the menu items, an error message is displayed.
 * If the user is not authenticated, they are redirected to the login screen.
 * @returns {JSX.Element} The Menu component
 */
export default function Menu() {
  const [menuItems, setMenuItems] = useState<Meal[]>([]);
  const [list, setList] = useState<ProtoOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenProps>();
  const { tableNumber } = route.params || { tableNumber: 0 };
  const [hubConnection, setHubConnection] = useState<signalR.HubConnection | null>(null);

  const handleSendOrderRef = useRef<() => Promise<void>>(async () => {});
  // … (the same useEffect blocks for fetching meals & setting up SignalR) …

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

        const response = await axios.get(`http://${ip.julian}:5256/api/user/meals`, {
          headers: { "X-Auth-Token": token },
        });

        if (response.status !== 200) throw new Error("Failed to fetch meals.");

        const data: Meal[] = response.data.meals;
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
        }
        else{
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
        tableNumber: tableNumber,
        orders: list,
        total: Number(calculateTotal()),
        isReady: false,
      };

      try {
        hubConnection.invoke("OrderMeal", order);
       
      } catch (err) {
        console.error("Failed to send order:", err);
        alert("Error sending order to the server.");
      }
    } else {
      alert(`Hub is ${hubConnection?.state} or disconnected at table ${tableNumber}`);
    }
  };

  function addItemToList(item: Meal) {
    setList((prevList) => {
      const existingIndex = prevList.findIndex((i) => i.meal.mealId === item.mealId);
      if (existingIndex >= 0) {
        const updatedList = [...prevList];
        updatedList[existingIndex].quantity += 1;
        return updatedList;
      } else {
        return [...prevList, { meal: item, quantity: 1 }];
      }
    });
  }

  function removeItemFromList(item: Meal) {
    setList((prevList) => {
      const existingIndex = prevList.findIndex((i) => i.meal.mealId === item.mealId);
      if (existingIndex >= 0) {
        const updatedList = [...prevList];
        if (updatedList[existingIndex].quantity > 1) {
          updatedList[existingIndex].quantity -= 1;
          return updatedList;
        } else {
          return prevList.filter((i) => i.meal.mealId !== item.mealId);
        }
      }
      return prevList;
    });
  }

  function calculateTotal() {
    return list.reduce((total, item) => total + item.meal.price * item.quantity, 0).toFixed(2);
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
      <FlatList
        data={menuItems}
        keyExtractor={(item) => item.mealId}
        renderItem={({ item }) => {
          const selectedItem = list.find((i) => i.meal.mealId === item.mealId);
          const currentQuantity = selectedItem ? selectedItem.quantity : 0;
          const imageKey = item.mealName.replace(/\s+/g, "");
          const sourceImage =
            mealImages[imageKey] ?? require("@/assets/images/no-pictures.png");

          return (
            <ThemedView style={styles.menuItem}>
              {/* LEFT: Image */}
              <Image source={sourceImage} style={styles.listImage} resizeMode="cover" />

              {/* MIDDLE: Text block */}
              <View style={styles.textContainer}>
                <ThemedText style={styles.name}>{item.mealName}</ThemedText>
                <ThemedText style={styles.category}>{item.category}</ThemedText>
                <ThemedText style={styles.price}>{item.price.toFixed(2)} ₪</ThemedText>
                {currentQuantity > 0 && (
                  <ThemedText style={styles.quantity}>x{currentQuantity}</ThemedText>
                )}
              </View>

              {/* RIGHT: Add/Remove buttons – only when tableNumber ≥ 0 */}
              {tableNumber >= 0 && (
                <View style={styles.buttonContainer}>
                  <CurvedButton
                    title="Add"
                    action={() => addItemToList(item)}
                    style={styles.addButton}
                  />
                  <CurvedButton
                    title="Remove"
                    action={() => removeItemFromList(item)}
                    style={styles.removeButton}
                  />
                </View>
              )}
            </ThemedView>
          );
        }}
        ListFooterComponent={
          <>
          {tableNumber >= 0 && (
          <>
            <ThemedText style={styles.subtitle}>Your Selections:</ThemedText>

            {list.length > 0 ? (
            list.map((item) => (
              <View key={item.meal.mealId} style={styles.selectedItem}>
                <ThemedText>
                  {item.meal.mealName} x {item.quantity}
                </ThemedText>
                <ThemedText>
                  {(item.meal.price * item.quantity).toFixed(2)} ₪
                </ThemedText>
        </View>
      ))
    ) : (
      <Text style={styles.emptyText}>No items selected.</Text>
    )}

    <ThemedText style={styles.total}>Total: {calculateTotal()} ₪</ThemedText>
  </>
)}
            

            {/* payment prompt + buttons only when tableNumber ≥ 0 */}
            {tableNumber >= 0 && (
              <>
                <ThemedText style={styles.ptext}>So what's it gonna be?</ThemedText>
                <ThemedView style={styles.paymentmethods}>
                  <TouchableOpacity
                    style={styles.paymeth}
                    onPress={async () => {
                      await handleSendOrder();
                    }}
                  >
                    <Image
                      source={require("@/assets/images/money.png")}
                      style={styles.image}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.paymeth}
                    onPress={async () => {
                      await handleSendOrder();
                    }}
                  >
                    <Image
                      source={require("@/assets/images/payment-method.png")}
                      style={styles.image}
                    />
                  </TouchableOpacity>
                </ThemedView>
              </>
            )}
          </>
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

  /***** LIST ITEM STYLES *****/
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

  /***** FOOTER & PAYMENT STYLES (unchanged) *****/
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
