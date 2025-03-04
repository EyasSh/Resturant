import { useState, useEffect } from "react";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { StyleSheet} from "react-native";
import axios from "axios";
import ip from "@/Data/Addresses";
import AsyncStorage from "@react-native-async-storage/async-storage";
import router from "expo-router";
import { ScrollView } from "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Meal } from "../../(Menu)/Menu";
import CurvedButton from "@/components/ui/CurvedButton";

/**
 * Component for removing meals from the database and AsyncStorage.
 * Fetches meals from AsyncStorage when mounted and displays them in a list.
 * Each meal has a remove button that calls the RemoveMealFromDbAndStorage function.
 * If the meal is removed successfully, the UI is updated to reflect the change.
 * If there are no meals available, displays a "No meals available" message.
 */
export default function RemoveMeal() {
    const [meals, setMeals] = useState<Meal[]>([]);
/**
 * Removes a meal from the database and AsyncStorage by its ID.
 * 
 * This function performs the following steps:
 * 1. Finds the meal by its ID from the current state.
 * 2. Alerts if the meal is not found.
 * 3. Sends a DELETE request to the server to remove the meal from the database.
 * 4. Alerts the user if the meal is removed successfully.
 * 5. Updates the local meals array and AsyncStorage to exclude the removed meal.
 * 6. Updates the state to reflect the removal in the UI.
 * 
 * @param {string} mealId - The ID of the meal to be removed.
 */
    const RemoveMealFromDbAndStorage = async (mealId: string) => {
        try {
            // ✅ Find the meal by ID before removing it
            const mealToRemove = meals.find(meal => meal.mealId === mealId);
    
            if (!mealToRemove) {
                alert(`Meal with ID ${mealId} not found.`);
                return;
            }
            const token = await AsyncStorage.getItem('token');
            
            const res = await axios.delete(`http://${ip.eyas}:5256/api/owner/delete/meal?mealId=${mealId}`,{
                headers: {
                "x-auth-token": token,
            }});
            if (res && res.status === 200) {
                alert(`${mealToRemove.mealName} removed successfully!\nPrice: ${mealToRemove.price}`);
            }
            // ✅ Remove meal from array
            const updatedMeals = meals.filter(meal => meal.mealId !== mealId);
    
            // ✅ Update AsyncStorage
            await AsyncStorage.setItem("meals", JSON.stringify(updatedMeals));
    
            // ✅ Update the state to reflect UI changes
            setMeals(updatedMeals);
    
           
        } catch (error) {
            console.error("Error removing meal:", error);
        }
    };
    
    useEffect(() => {
        /**
         * Fetches meals from AsyncStorage and updates the component state.
         * If meals are found, they are parsed and mapped to ensure correct type.
         * If meals are not found, the state remains unchanged.
         * If there is an error parsing meals, an error is logged to the console.
         */
        const fetchMeals = async () => {
            try {
                const m = await AsyncStorage.getItem("meals");
                if (m) {
                    
                    // Parse and map the data to ensure correct type
                    const parsedMeals: Meal[] = JSON.parse(m).map((meal: any) => ({
                        mealId: meal.mealId || "",
                        mealName: meal.mealName || "",
                        price: typeof meal.price === "number" ? meal.price : 0, // Ensure price is a number
                    }));
    
                    setMeals(parsedMeals);
                }
            } catch (error) {
                console.error("Error parsing meals:", error);
            }
        };
    
        fetchMeals();
    }, []);
    
    return (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemedView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
            {meals.length > 0 ? (
        meals.map((meal) => (
            <ThemedView key={meal.mealId} style={styles.mealItem}>
                <ThemedText style={styles.mealName}>{meal.mealName}</ThemedText>
                <ThemedText style={styles.mealPrice}>${meal.price.toFixed(2)}</ThemedText>
                <CurvedButton
                    style={styles.removeButton}
                    action={() => RemoveMealFromDbAndStorage(meal.mealId)}
                    title="Remove"
                />

            </ThemedView>
        ))
    ) : (
        <ThemedText style={styles.text}>No meals available</ThemedText>
    )}
            </ScrollView>
        </ThemedView>
    </GestureHandlerRootView>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        paddingVertical: 25,
    },
    scrollContainer: {
        flexGrow: 1, // Ensures ScrollView content expands properly
        paddingVertical: 10,
    },
    mealItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 1,  // ✅ Adds an HR-like separator
        borderBottomColor: "#ccc", // ✅ Light gray line between items
        width: "100%",
    },
    mealName: {
        fontSize: 18,
        fontWeight: "bold",
        flex: 1, // ✅ Allows text to take available space
    },
    mealPrice: {
        fontSize: 16,
        marginRight: 10, // ✅ Provides spacing between price and button
    },
    removeButton: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
        backgroundColor: "#e74c3c", // ✅ Matches previous remove button color
    },
    text: {
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
        marginTop: 50,
    },
});

