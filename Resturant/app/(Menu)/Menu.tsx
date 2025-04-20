import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, Text, Button, FlatList, ActivityIndicator, ToastAndroid } from "react-native";
import ip from "@/Data/Addresses";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CurvedButton from "@/components/ui/CurvedButton";
import { GestureHandlerRootView, ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import { Image } from "react-native";
import { NavigationProp, RootStackParamList } from '@/Routes/NavigationTypes';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Order, ProtoOrder } from "@/Types/Order";
import { Connection } from "@/Data/Hub";
import ShowMessageOnPlat from "@/components/ui/ShowMessageOnPlat";
type ScreenProps = RouteProp<RootStackParamList, 'Menu'>

export  type Meal = {
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
  const route = useRoute<RouteProp<RootStackParamList, 'Menu'>>();
  const {tableNumber} = route.params || { tableNumber: 0};
  const [hubConnection,setHubConnection] = useState<signalR.HubConnection | null>(null);
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
        }, 100); // check every 100ms
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
    hubConnection?.on("ReceiveOrderSuccessMessage", ( isOkay: boolean, order: Order) => {
      if (isOkay) {
        ShowMessageOnPlat(`Order sent successfully for table ${order.tableNumber}`);
        setList([]); // Clear the order list after sending
        navigation.pop(); // Navigate back to the previous screen
      } else {
        ShowMessageOnPlat(`Failed to send order`);
      }
    });
  }, [hubConnection]);
  
    
  const handleSendOrder = async () => {
    if (tableNumber === 0 || list.length === 0) {
      alert(`Please select a table and add items to your order.\nTable: ${tableNumber}\nItems: ${list.length}`);
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
  
  

  /**
   * Adds a meal item to the order list. If the item is already in the list, increments the quantity by one.
   * Otherwise, adds the item to the list with a quantity of one.
   * @param {Meal} item - The meal to add to the list.
   */
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
/**
 * Removes a meal item from the order list. If the item's quantity is greater than one,
 * decrements the quantity by one. Otherwise, removes the item from the list entirely.
 * If the item is not found, the list remains unchanged.
 * @param {Meal} item - The meal to remove from the list.
 */

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
  
  /**
   * Calculates the total cost of the order by summing the prices of all items on the list
   * and multiplying each price by its corresponding quantity.
   * @returns {string} The total cost of the order as a string with two decimal places.
   */
  function calculateTotal() {
    return list
      .reduce((total, item) => total + item.meal.price * item.quantity, 0)
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
  <FlatList
    data={menuItems}
    keyExtractor={(item) => item.mealId}
   
    renderItem={({ item }) => {
      const selectedItem = list.find((i) => i.meal.mealId === item.mealId);
      const currentQuantity = selectedItem ? selectedItem.quantity : 0;

      return (
        <ThemedView style={styles.menuItem}>
          <ThemedView>
            <ThemedText style={styles.name}>{item.mealName}</ThemedText>
            <ThemedText style={styles.name}>{item.category}</ThemedText>
          </ThemedView>
          <ThemedText style={styles.price}>{item.price.toFixed(2)} ₪</ThemedText>
          <ThemedText style={styles.price}>x{currentQuantity}</ThemedText>
          <ThemedView>
            <CurvedButton title="Add" action={() => addItemToList(item)} style={{ backgroundColor: "#00B0CC", marginBottom: 10 }} />
            <CurvedButton title="Remove" action={() => removeItemFromList(item)} style={{ backgroundColor: "red" }} />
          </ThemedView>
        </ThemedView>
      );
    }}
    ListFooterComponent={
      <>
        <ThemedText style={styles.subtitle}>Your Selections:</ThemedText>

        {list.length > 0 ? (
          list.map((item) => (
            <View key={item.meal.mealId} style={styles.selectedItem}>
              <ThemedText>{item.meal.mealName} x {item.quantity}</ThemedText>
              <ThemedText>{(item.meal.price * item.quantity).toFixed(2)} ₪</ThemedText>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No items selected.</Text>
        )}

        <ThemedText style={styles.total}>Total: {calculateTotal()} ₪</ThemedText>
        <ThemedText style={styles.ptext}>So what's it gonna be?</ThemedText>

        <ThemedView style={styles.paymentmethods}>
          <TouchableOpacity style={styles.paymeth} onPress={async()=>{await handleSendOrder();}}>
            <Image source={require("@/assets/images/money.png")} style={styles.image} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.paymeth} onPress={async()=>{await handleSendOrder();}}>
            <Image source={require("@/assets/images/payment-method.png")} style={styles.image} />
          </TouchableOpacity>
        </ThemedView>
        
      </>
    }
  />
</ThemedView>

    
  );
  
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 30,
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
  ptext:{
    textAlign:'center',
    marginTop:10,
    fontSize:18,
    fontWeight:'bold'
  },
  paymentmethods:{
    display:'flex',
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
  },
  paymeth:{
    display:'flex',
    flexDirection:'column',
    alignItems:'center',
    justifyContent:'center',
    width:150,
    height:150,
    margin:10,
    borderColor:"grey",
    borderWidth:1,
    borderRadius:5,
    padding:10
},
image: {
    width: 100,
    height: 100,
    borderRadius: 10,
    resizeMode: 'cover',
  },
});
