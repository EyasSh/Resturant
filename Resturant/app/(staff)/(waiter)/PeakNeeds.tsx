import {useState, useEffect} from 'react';
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from "@/Routes/NavigationTypes";
import ip from "@/Data/Addresses";
import { StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
function PeakNeeds() {
    const route = useRoute<RouteProp<RootStackParamList, 'PeakNeeds'>>();
    const {tableNumber} = route.params as {tableNumber: number};
    return (
        <ThemedView style={styles.container}>
            <ThemedText style={styles.text}>Peak Needs for table {tableNumber}</ThemedText>
        </ThemedView>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 25,
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 20
      },
})
export default PeakNeeds;