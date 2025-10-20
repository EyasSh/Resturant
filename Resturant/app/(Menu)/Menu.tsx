import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ip from "@/Data/Addresses";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CurvedButton from "@/components/ui/CurvedButton";
import { NavigationProp, RootStackParamList } from "@/Routes/NavigationTypes";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { Order, ProtoOrder } from "@/Types/Order";
import { Connection } from "@/Data/Hub";
import ShowMessageOnPlat from "@/components/ui/ShowMessageOnPlat";
import mealImages from "@/Types/MealImages";
import { items } from "@/app/(staff)/(owner)/AddMealForm";
import * as signalR from "@microsoft/signalr";

/* ===========================
   Module-level (global) stuff
   =========================== */

// Per-table storage keys (avoid collisions)
const orderKey = (tn: number) => `order:${tn}`;
const tombKey = (tn: number) => `order:tombstone:${tn}`;

// Track tombstones we already handled this session (avoid double nuking on remounts)
const handledTombstones = new Set<number>();

export type Meal = {
  mealId: string;
  mealName: string;
  price: number;
  category: string;
};

type ScreenProps = RouteProp<RootStackParamList, "Menu">;

/**
 * Initializes the component by hydrating the data and fetching the menu items.
 * Also sets up the SignalR hub connection. If either fails, logs the error to the console.
 * Finally, sets loading to false.
 * @returns {void}
 */
export default function Menu() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenProps>();
  // Use -1 as “browse only”. If caller passes nothing, treat as browse.
  const { tableNumber = -1 } = route.params ?? { tableNumber: -1 };

  const [menuItems, setMenuItems] = useState<Meal[]>([]);
  const [list, setList] = useState<ProtoOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hubConnection, setHubConnection] = useState<signalR.HubConnection | null>(null);

  // UI hint used when a previous order was completed while away
  const [savedOrderReady, setSavedOrderReady] = useState<boolean>(false);

  // Filter UI
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const categories = ["All", ...items.map((i) => i.value)];

  // Prevent the persist effect from firing while we hydrate
  const hydratingRef = useRef(true);

  // ===== SignalR helper: wait until Connected (enum, not string) =====
  async function waitForHubConnection(timeout = 5000): Promise<signalR.HubConnection | null> {
    const start = Date.now();
    return new Promise((resolve) => {
      const t = setInterval(() => {
        const conn = Connection.getHub();
        if (conn && conn.state === signalR.HubConnectionState.Connected) {
          clearInterval(t);
          resolve(conn);
        } else if (Date.now() - start > timeout) {
          clearInterval(t);
          resolve(null);
        }
      }, 100);
    });
  }

  // ======================
  // Init (hydrate + fetch)
  // ======================
  useEffect(() => {
    let mounted = true;

  /**
   * Initializes the component by hydrating the data and fetching the menu items.
   * Also sets up the SignalR hub connection. If either fails, logs the error to the console.
   * Finally, sets loading to false.
   */
    async function init() {
      try {
        setLoading(true);
        hydratingRef.current = true;
        setError(null);

        // ---- Tombstone handling (global per session) ----
        if (tableNumber >= 0 && !handledTombstones.has(tableNumber)) {
          try {
            const tomb = await AsyncStorage.getItem(tombKey(tableNumber));
            if (tomb) {
              // If there’s any tomb for this table, nuke local draft and flip the “ready” flag
              await AsyncStorage.removeItem(orderKey(tableNumber));
              await AsyncStorage.removeItem(tombKey(tableNumber));
              handledTombstones.add(tableNumber);
              if (mounted) {
                setList([]);
                setSavedOrderReady(true);
              }
            }
          } catch {
            // ignore
          }
        }

        // ---- Restore draft if not already “ready” and we’re on a real table ----
        if (tableNumber >= 0 && !handledTombstones.has(tableNumber)) {
          try {
            const raw = await AsyncStorage.getItem(orderKey(tableNumber));
            if (raw) {
              const saved: Order = JSON.parse(raw);
              if (saved.tableNumber === tableNumber && saved.isReady === false) {
                if (mounted) {
                  setList(saved.orders ?? []);
                  setSavedOrderReady(false);
                }
              } else if (mounted) {
                setList([]);
              }
            } else if (mounted) {
              setList([]);
            }
          } catch {
            if (mounted) setList([]);
          }
        } else {
          // Browsing or tomb handled: start clean unless we already set it above
          if (mounted && tableNumber < 0) {
            setList([]);
            setSavedOrderReady(false);
          }
        }

        // ---- Fetch menu items ----
        const token = await AsyncStorage.getItem("token");
        if (!token) throw new Error("User is not authenticated.");
        const resp = await axios.get<{ meals: Meal[] }>(
          `http://${ip.julian}:5256/api/user/meals`,
          { headers: { "X-Auth-Token": token } }
        );
        if (resp.status !== 200) throw new Error("Failed to fetch meals.");
        if (mounted) setMenuItems(Array.isArray(resp.data.meals) ? resp.data.meals : []);

        // ---- Hub connection ----
        const conn = await waitForHubConnection();
        if (mounted) {
          if (conn) {
            setHubConnection(conn);
            ShowMessageOnPlat("Connected set at Menu");
          } else {
            setHubConnection(null);
            ShowMessageOnPlat("SignalR connection not ready");
          }
        }
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Unknown error");
      } finally {
        if (mounted) {
          hydratingRef.current = false; // allow persistence now
          setLoading(false);
        }
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, [tableNumber]);

  // =======================
  // Persist draft on change
  // =======================
  useEffect(() => {
    if (hydratingRef.current) return;         // skip during hydration
    if (tableNumber < 0) return;              // browsing only -> don’t persist

/**
 * Persist the current draft order to storage.
 * If the list is empty, remove the persisted item instead.
 * @ignore storage errors
 */
    const persist = async () => {
      try {
        if (list.length === 0) {
          await AsyncStorage.removeItem(orderKey(tableNumber));
          return;
        }
        const total = Number(
          list.reduce((sum, i) => sum + i.meal.price * i.quantity, 0).toFixed(2)
        );
        const draft: Order = { tableNumber, orders: list, total, isReady: false };
        await AsyncStorage.setItem(orderKey(tableNumber), JSON.stringify(draft));
      } catch {
        // ignore storage errors
      }
    };
    persist();
  }, [list, tableNumber]);

  // ====================
  // Server ACK (success)
  // ====================
  useEffect(() => {
    if (!hubConnection) return;

    const onSuccess = (isOkay: boolean, order: Order) => {
      if (isOkay) {
        ShowMessageOnPlat(`Order sent successfully for table ${order.tableNumber}`);
      } else {
        ShowMessageOnPlat("Failed to send order");
      }
    };

    hubConnection.off("ReceiveOrderSuccessMessage");
    hubConnection.on("ReceiveOrderSuccessMessage", onSuccess);

    return () => hubConnection.off("ReceiveOrderSuccessMessage", onSuccess);
  }, [hubConnection]);

  // ===========================
  // Order becomes READY handler
  // ===========================
  useEffect(() => {
    if (!hubConnection) return;

    const onOrderReady = async (order: Order, tblNum: number) => {
      if (!order) return;
      if (order.tableNumber !== tableNumber) return;

      try {
        await AsyncStorage.removeItem(orderKey(tableNumber));
        // Write a tombstone for this table so if we navigate away and back, we won’t re-hydrate
        await AsyncStorage.setItem(tombKey(tableNumber), JSON.stringify({ tableNumber }));
        handledTombstones.add(tableNumber);
      } catch {}

      setList([]);
      setSavedOrderReady(true);
      ShowMessageOnPlat(`Order is ready for table ${tblNum}`);
    };

    hubConnection.off("ReceiveOrderReadyMessage");
    hubConnection.on("ReceiveOrderReadyMessage", onOrderReady);

    return () => hubConnection.off("ReceiveOrderReadyMessage", onOrderReady);
  }, [hubConnection, tableNumber]);

  // =================
  // UI actions / calc
  // =================
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
 * Removes an item from the list of meals to be ordered.
 *
 * @param {Meal} item - The meal to remove from the list.
 *
 * If the item is found in the list and has a quantity greater than 1, the quantity is
 * decremented by 1. If the item is found in the list and has a quantity of 1, the
 * item is removed from the list. If the item is not found in the list, the list
 * remains unchanged.
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
 * Calculates the total cost of the current order.
 * It iterates over the list of order items and sums up the cost of each item.
 * The total cost is then formatted to two decimal places and returned as a string.
 * @returns {string} The total cost of the order as a string, formatted to two decimal places.
 */
  function calculateTotal() {
    return list.reduce((sum, i) => sum + i.meal.price * i.quantity, 0).toFixed(2);
  }

/**
 * Handle sending an order to the server.
 * If the table number is invalid or no items are in the order, an alert is shown.
 * If the hub connection is not connected, an alert is shown.
 * Otherwise, the order is sent to the server and stored in AsyncStorage until it is marked as ready.
 * If the request fails, an error alert is shown.
 */
const handleSendOrder = async () => {
  if (tableNumber < 0 || list.length === 0) {
    alert(
      `Please select a table and add items to your order.\nTable: ${tableNumber}\nItems: ${list.length}`
    );
    return;
  }

  if (!hubConnection || hubConnection.state !== signalR.HubConnectionState.Connected) {
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
    // ✅ send to server
    await hubConnection.invoke("OrderMeal", order);

    // ✅ delete local draft immediately
    await AsyncStorage.removeItem(orderKey(tableNumber));

    // optional UI reset
    setList([]);
    setSavedOrderReady(false);

    // navigate away or give feedback
    ShowMessageOnPlat(`Order sent for table ${tableNumber}`);
    navigation.pop();
  } catch (err) {
    console.error("Failed to send order:", err);
    alert("Error sending order to the server.");
  }
};


  const filteredItems =
    selectedCategory === "All"
      ? menuItems
      : menuItems.filter((m) => m.category === selectedCategory);

  // =========
  // Rendering
  // =========
  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
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
