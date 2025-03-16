import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Button, FlatList, ActivityIndicator } from "react-native";
import ip from "@/Data/Addresses";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CurvedButton from "@/components/ui/CurvedButton";
import { GestureHandlerRootView, ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import { Image } from "react-native";
import { NavigationProp } from '@/Routes/NavigationTypes';
import { useNavigation } from '@react-navigation/native';

export  type Meal = {
  mealId: string;
  mealName: string;
  price: number;
  category: string;
};

export default function Menu() {
  const [menuItems, setMenuItems] = useState<Meal[]>([]);
  const [list, setList] = useState<(Meal & { quantity: number })[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<NavigationProp>();

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

        const response = await axios.get(`http://${ip.julian}:5256/api/user/meals`, {
          headers: {
            "X-Auth-Token": token,
          },
        });

        if (response.status !== 200) {
          throw new Error("Failed to fetch meals.");
        }


        const data: Meal[] = response.data.meals;
        

        if (Array.isArray(response.data.meals) && response.data.meals.length > 0) {

          setMenuItems([...data]); // Spread to force state update

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
      const existingIndex = prevList.findIndex((i) => i.mealId === item.mealId);
      if (existingIndex >= 0) {
        const updatedList = [...prevList];
        updatedList[existingIndex].quantity += 1;
        return updatedList;
      } else {
        return [...prevList, { ...item, quantity: 1 }];
      }
    });
  }
  function removeItemFromList(item: Meal) {
    setList((prevList) => {
      const existingIndex = prevList.findIndex((i) => i.mealId === item.mealId);
      if (existingIndex >= 0) {
        const updatedList = [...prevList];
        if (updatedList[existingIndex].quantity > 1) {
          updatedList[existingIndex].quantity -= 1;
          return updatedList;
        } else {
          return prevList.filter((i) => i.mealId !== item.mealId);
        }
      }
      return prevList;
    });
  }
  
  function calculateTotal() {
    return list
      .reduce((total, item) => total + item.price * item.quantity, 0)
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
      <GestureHandlerRootView style={{padding:0}}>
      <ScrollView style={{padding:0}}>
      {menuItems.length > 0 ? (
        menuItems.map((item) => {  // ✅ FIX: Make sure it returns JSX correctly
          const selectedItem = list.find((i) => i.mealId === item.mealId);
          const currentQuantity = selectedItem ? selectedItem.quantity : 0;
  
          return (
            <ThemedView key={item.mealId} style={styles.menuItem}>
              <ThemedView>
              <ThemedText style={styles.name}>{item.mealName}</ThemedText>
              <ThemedText style={styles.name}>{item.category}</ThemedText>
              </ThemedView>
              <ThemedText style={styles.price}>{(Number(item.price) || 0).toFixed(2)} ₪</ThemedText>
              <ThemedText style={styles.price}>x{currentQuantity}</ThemedText>
              <ThemedView>
              <CurvedButton title="Add" action={() => addItemToList(item)} style={{backgroundColor:"#00B0CC",marginBottom:10}}/>
                <CurvedButton title="Remove" action={() => removeItemFromList(item)} style={{backgroundColor:"red"}}/>
                </ThemedView>
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
          keyExtractor={(item) => item.mealId}  // ✅ FIX: Remove `.toString()` since MealId is already a string
          renderItem={({ item }) => (
            <View style={styles.selectedItem}>
              <ThemedText>
                {item.mealName} x {item.quantity}
              </ThemedText>
              <ThemedText>{(item.price * item.quantity).toFixed(2)} ₪</ThemedText>
            </View>
          )}
        />
      ) : (
        <Text style={styles.emptyText}>No items selected.</Text>
      )}
  
      <ThemedText style={styles.total}>Total: {calculateTotal()} ₪</ThemedText>
  
      <ThemedText style={styles.ptext}>So what's it gonna be?</ThemedText>
      <GestureHandlerRootView style={styles.paymentmethods}>
      <TouchableOpacity style={styles.paymeth} onPress={()=>navigation.navigate("Chat")}>
        <Image source={require("@/assets/images/money.png")} style={styles.image}/>
      </TouchableOpacity>
      <TouchableOpacity style={styles.paymeth} onPress={()=>navigation.navigate("Chat")}>
        <Image source={require("@/assets/images/payment-method.png")} style={styles.image}/>
      </TouchableOpacity>
      </GestureHandlerRootView>
      </ScrollView>
    </GestureHandlerRootView>
    </ThemedView>
    
  );
  
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 30,
    paddingTop: 30,
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
