import { useState } from "react";
import { StyleSheet, FlatList, View } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/Routes/NavigationTypes";
import { Order } from "@/Types/Order";
import { useTheme } from "@react-navigation/native";

/**
 * A screen that displays the details of an order.
 *
 * This screen is used to display the details of an order that was placed
 * by a waiter. It displays each meal in the order, along with the quantity
 * and price of each meal. The total price of the order is also displayed
 * at the bottom of the screen.
 *
 * @returns A JSX element representing the OrderPeak screen.
 */
export default function OrderPeak() {
    const route = useRoute<RouteProp<RootStackParamList, 'OrderPeak'>>();
    const params = route.params;
    const order = params && 'order' in params ? params.order : null;
    const [orderDetails, setOrderDetails] = useState<Order | null>(order);

    const { colors, dark } = useTheme();

    return (
        <ThemedView style={styles.container}>
            <FlatList
                data={orderDetails?.orders || []}
                keyExtractor={(_, index) => index.toString()}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <ThemedView
                        style={[
                            styles.item,
                            { backgroundColor: dark ? "#2c2c2e" : "#f0f0f0" },
                        ]}
                    >
                        <ThemedText style={[styles.mealText, { color: dark ? "#fff" : "#000" }]}>
                            {item.meal.mealName} x {item.quantity}
                        </ThemedText>
                        <ThemedText style={[styles.categoryText, { color: dark ? "#ccc" : "#444" }]}>
                            {item.meal.category+"\t\t"+item.meal.price.toFixed(2)} ₪
                        </ThemedText>
                    </ThemedView>
                )}
                ListFooterComponent={
                    orderDetails ? (
                        <View style={styles.totalContainer}>
                            <ThemedText style={styles.totalText}>
                                Total: {orderDetails.total.toFixed(2)} ₪
                            </ThemedText>
                        </View>
                    ) : null
                }
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    list: {
        paddingBottom: 40,
    },
    item: {
        marginBottom: 12,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#2c2c2e',
    },
    mealText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    categoryText: {
        fontSize: 14,
        color: '#aaa',
    },
    totalContainer: {
        marginTop: 20,
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#444',
    },
    totalText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#00cc99',
        textAlign: 'center',
    },
});
