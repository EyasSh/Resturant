import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import React, { useState, useEffect } from "react";
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

/**
 * Renders the menu screen allowing users to browse meals, select items, and place orders.
 *
 * The `Menu` component manages the state of menu items, selected order list, loading status, 
 * and handles interactions with a hub connection for real-time updates. It restores previous 
 * orders from AsyncStorage, loads menu items from an API, and maintains a persistent order 
 * draft while providing filtering options by category.
 *
 * The component also listens for server acknowledgments for successful order placements and 
 * order readiness notifications. Users can add or remove items from their order, view the 
 * total cost, and send orders to the server.
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

  // For basic UI messaging (not strictly required, but handy)
  const [savedOrderReady, setSavedOrderReady] = useState<boolean>(false);

  // Filter dropdown
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const categories = ["All", ...items.map((i) => i.value)];

  useEffect(() => {
/**
 * Waits for the SignalR hub connection to reach the "Connected" state within a specified timeout period.
 *
 * @param {number} [timeout=5000] - The maximum time to wait for the hub connection in milliseconds.
 * @returns {Promise<signalR.HubConnection | null>} - A promise that resolves to the connected hub instance
 * if successful, or null if the timeout is reached before the connection is established.
 */

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

/**
 * Initializes the menu component by performing several tasks:
 * - Sets loading state to true at the beginning and false at the end.
 * - Checks for and handles "tombstone" entries in AsyncStorage to determine if 
 *   a previously ready order exists, clearing stale orders if necessary.
 * - Restores a saved order from AsyncStorage for the current table if no 
 *   tombstone is handled and the order is not ready.
 * - Fetches and sets the menu items from the server using the user's authentication token.
 * - Attempts to establish a SignalR hub connection for real-time updates.
 * - Handles errors by setting an error state with the error message.
 */

  async function init() {
    try {
      setLoading(true);

      // --- Tombstone check (did Home already handle "ready" while we weren't here?) ---
      let tombHit = false;
      try {
        const tomb = await AsyncStorage.getItem("order:tombstone");
        if (tomb) {
          const parsed = JSON.parse(tomb);
          const tNum = Number(parsed?.tableNumber);
          if (!Number.isNaN(tNum) && tNum === tableNumber) {
            // Kill any stale order and mark UI as "ready"
            await AsyncStorage.removeItem("order");
            await AsyncStorage.removeItem("order:tombstone");
            setList([]);
            setSavedOrderReady(true);
            tombHit = true;
          }
        }
      } catch {
        // ignore tombstone parse/removal errors
      }

      if (!tombHit) {
        // Hard reset UI before reading storage (only if no tombstone handled)
        setList([]);
        setSavedOrderReady(false);

        // Restore from AsyncStorage ONLY if key exists, for this table, and NOT ready
        if (tableNumber >= 0) {
          try {
            const raw = await AsyncStorage.getItem("order");
            if (raw) {
              const saved: Order = JSON.parse(raw);
              if (saved.tableNumber === tableNumber && saved.isReady === false) {
                setList(saved.orders ?? []);
              }
            }
          } catch {
            // ignore restore errors
          }
        }
      }

      // Load menu items
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("User is not authenticated.");
      const resp = await axios.get<{ meals: Meal[] }>(
        `http://${ip.julian}:5256/api/user/meals`,
        { headers: { "X-Auth-Token": token } }
      );
      if (resp.status !== 200) throw new Error("Failed to fetch meals.");
      setMenuItems(Array.isArray(resp.data.meals) ? resp.data.meals : []);

      // Hub
      const conn = await waitForHubConnection();
      if (conn) {
        setHubConnection(conn);
        ShowMessageOnPlat("Connected set at Menu");
      } else {
        ShowMessageOnPlat("SignalR connection not ready");
      }
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  init();
}, [tableNumber]);


  // Persist the current draft ONLY while not ready.
  useEffect(() => {
    if (tableNumber < 0) return; // browsing menu, no table
    
    /**
     * Persists the current draft order to AsyncStorage.
     * If the list is empty, it simply removes the stored order.
     * Otherwise, it computes the total and stores a draft order
     * with the table number, orders, total, and readiness status.
     * Ignores any storage errors.
     */
    const persist = async () => {
      try {
        if (list.length === 0) {
          await AsyncStorage.removeItem("order");
          return;
        }
        const total = Number(
          list.reduce((sum, i) => sum + i.meal.price * i.quantity, 0).toFixed(2)
        );
        const draft: Order = {
          tableNumber,
          orders: list,
          total,
          isReady: false,
        };
        await AsyncStorage.setItem("order", JSON.stringify(draft));
      } catch {
        // ignore
      }
    };
    persist();
  }, [list, tableNumber]);

  // Server ACK after sending (keep list as-is until ready)
  useEffect(() => {
    if (!hubConnection) return;

    /**
     * Called by the hub when the order has been successfully stored.
     * If `isOkay` is true, shows a success message with the table number.
     * If `isOkay` is false, shows a failure message.
     * @param {boolean} isOkay Whether the order was stored successfully.
     * @param {Order} order The order that was stored.
     */
    const onSuccess = (isOkay: boolean, order: Order) => {
      if (isOkay) {
        ShowMessageOnPlat(`Order sent successfully for table ${order.tableNumber}`);
        // Keep showing until ready
      } else {
        ShowMessageOnPlat("Failed to send order");
      }
    };

    hubConnection.off("ReceiveOrderSuccessMessage");
    hubConnection.on("ReceiveOrderSuccessMessage", onSuccess);

    return () => hubConnection.off("ReceiveOrderSuccessMessage", onSuccess);
  }, [hubConnection]);

  // When order becomes READY: nuke storage + clear UI (for this table only)
  useEffect(() => {
    if (!hubConnection) return;

/**
 * Handles the event when an order becomes ready.
 * 
 * Clears the local storage for the order and updates the UI to reflect that 
 * the order is ready, specifically for the current table.
 * 
 * @param {Order} order - The order object that has been marked as ready.
 * @param {number} tblNum - The table number associated with the order.
 */
    const onOrderReady = async (order: Order, tblNum: number) => {
      if (!order) return;
      if (order.tableNumber !== tableNumber) return;

      try {
        await AsyncStorage.removeItem("order");
      } catch {}
      setList([]);
      setSavedOrderReady(true);
      ShowMessageOnPlat(`Order is ready for table ${tblNum}`);
    };

    hubConnection.off("ReceiveOrderReadyMessage");
    hubConnection.on("ReceiveOrderReadyMessage", onOrderReady);

    return () => hubConnection.off("ReceiveOrderReadyMessage", onOrderReady);
  }, [hubConnection, tableNumber]);

  /**
   * Handles the button press for sending the order to the server.
   * @function
   * @async
   * @throws {Error} If the hub connection is not connected or there is an error sending the order.
   * @description
   * If the table number is 0 or there are no items in the list, shows an alert with instructions.
   * If the hub connection is not connected, shows an alert with the hub connection state.
   * Otherwise, sends the order to the server and stores it in the local storage until the order is ready.
   */
  const handleSendOrder = async () => {
    if (tableNumber === 0 || list.length === 0) {
      alert(
        `Please select a table and add items to your order.\nTable: ${tableNumber}\nItems: ${list.length}`
      );
      return;
    }
    if (!hubConnection || hubConnection.state !== "Connected") {
      alert(`Hub is ${hubConnection?.state} or disconnected at table ${tableNumber}`);
      return;
    }

    const order: Order = {
      tableNumber,
      orders: list,
      total: Number(calculateTotal()),
      isReady: false,
    };
    try {
      await hubConnection.invoke("OrderMeal", order);
      await AsyncStorage.setItem("order", JSON.stringify(order)); // ensure it's there until ready
      navigation.pop();
    } catch (err) {
      console.error("Failed to send order:", err);
      alert("Error sending order to the server.");
    }
  };

  /**
   * Adds a meal to the list of items to order.
   * @param {Meal} item The meal to add to the list.
   * @description
   * If the meal is already in the list, increments the quantity of that meal.
   * Otherwise, adds the meal to the list with a quantity of 1.
   * @returns {void}
   */
  function addItemToList(item: Meal) {
    setList((prev) => {
      const idx = prev.findIndex((i) => i.meal.mealId === item.mealId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      }
      return [...prev, { meal: item, quantity: 1 }];
    });
  }

  /**
   * Removes a meal from the list of items to order.
   * @param {Meal} item The meal to remove from the list.
   * @description
   * If the meal is in the list and has a quantity greater than 1, decrements the quantity.
   * Otherwise, removes the meal from the list.
   * @returns {void}
   */
  function removeItemFromList(item: Meal) {
    setList((prev) => {
      const idx = prev.findIndex((i) => i.meal.mealId === item.mealId);
      if (idx >= 0) {
        const updated = [...prev];
        if (updated[idx].quantity > 1) {
          updated[idx].quantity -= 1;
          return updated;
        }
        return prev.filter((i) => i.meal.mealId !== item.mealId);
      }
      return prev;
    });
  }

  /**
   * Calculates the total price of all items in the list.
   * @returns {string} The total price as a string, rounded to two decimal places.
   */
  function calculateTotal() {
    return list.reduce((sum, i) => sum + i.meal.price * i.quantity, 0).toFixed(2);
  }

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
          <Image source={require("@/assets/images/expand.png")} style={styles.filterIcon} />
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
              {tableNumber >= 0 && list.length >= 0 && (
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
                <Text style={styles.emptyText}>
                  {savedOrderReady ? "Your last order is ready." : "No items selected."}
                </Text>
              )}
              <ThemedText style={styles.total}>Total: {calculateTotal()} ₪</ThemedText>
              {list.length > 0 && (
                <>
                  <ThemedText style={styles.ptext}>So what's it gonna be?</ThemedText>
                  <ThemedView style={styles.paymentmethods}>
                    <TouchableOpacity style={styles.paymeth} onPress={handleSendOrder}>
                      <Image source={require("@/assets/images/money.png")} style={styles.image} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.paymeth} onPress={handleSendOrder}>
                      <Image
                        source={require("@/assets/images/payment-method.png")}
                        style={styles.image}
                      />
                    </TouchableOpacity>
                  </ThemedView>
                </>
              )}
            </>
          ) : null
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 30 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "red", fontSize: 16 },

  filterContainer: { marginVertical: 12, zIndex: 10 },
  filterSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
  },
  filterIcon: { width: 16, height: 16, marginLeft: 8 },
  filterOptions: { marginTop: 4, borderWidth: 1, borderColor: "#ccc", borderRadius: 6 },
  filterOption: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1 },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  listImage: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  textContainer: { flex: 1, justifyContent: "center" },
  name: { fontSize: 16, fontWeight: "bold" },
  category: { fontSize: 14, color: "gray", marginTop: 2 },
  price: { fontSize: 14, color: "gray", marginTop: 4 },
  quantity: { fontSize: 14, color: "gray", marginTop: 2 },
  buttonContainer: { flexDirection: "column", alignItems: "center" },
  addButton: { backgroundColor: "#00B0CC", marginBottom: 8, paddingHorizontal: 12, paddingVertical: 6 },
  removeButton: { backgroundColor: "red", paddingHorizontal: 12, paddingVertical: 6 },

  subtitle: { fontSize: 20, fontWeight: "bold", marginTop: 20 },
  selectedItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  emptyText: { fontSize: 16, color: "gray", textAlign: "center", marginTop: 10 },
  total: { fontSize: 18, fontWeight: "bold", marginTop: 20, textAlign: "right" },
  ptext: { textAlign: "center", marginTop: 10, fontSize: 18, fontWeight: "bold" },
  paymentmethods: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 16 },
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
  image: { width: 100, height: 100, borderRadius: 10, resizeMode: "cover" },
});
