import { useState, useEffect } from 'react';
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from "@/Routes/NavigationTypes";
import { StyleSheet } from 'react-native';
import { Connection } from '@/Data/Hub';
import { useTheme } from '@react-navigation/native';

/**
 * Component to display the peak needs for a given table.
 *
 * @param {number} tableNumber - The table number to display peak needs for.
 *
 * This component will fetch the list of peak needs for the given table and display them
 * in a scrollable list. If there are no peak needs for the table, it will display a message
 * indicating that the customer does not need anything.
 */
function PeakNeeds() {
    const route = useRoute<RouteProp<RootStackParamList, 'PeakNeeds'>>();
    const { tableNumber } = route.params as { tableNumber: number };
    const [needs, setNeeds] = useState<string[]>([]);
    const connection = Connection.getHub();
    const { colors, dark } = useTheme();

    useEffect(() => {}, [needs]);

    useEffect(() => {
        const getNeeds = () => {
            try {
                connection?.invoke("GetUserNeeds", tableNumber);
                connection?.on("ReceiveMessagesToWaiter", (message: string[]) => {
                    setNeeds(message);
                });
            } catch (error) {
                console.error("Error fetching needs:", error);
            }
        };
        getNeeds();

        return () => {
            connection?.off("ReceiveMessagesToWaiter");
        };
    }, []);

    return (
        <ThemedView style={styles.container}>
            <ThemedText style={styles.heading}>
                Peak Needs for table {tableNumber}
            </ThemedText>

            {needs.length === 0 ? (
                <ThemedText style={styles.emptyText}>
                    The customer does not need anything
                </ThemedText>
                ) : (
                    <ThemedView style={styles.messagesContainer}>
                        {needs.slice().reverse().map((msg, idx) => (
                            <ThemedView style={[styles.messageBox, { backgroundColor: dark ? "#0c0c0e" : "#f0f0f0" }]} key={idx}>
                                    <ThemedText  style={styles.message}>
                                        {msg}
                                    </ThemedText>
                            </ThemedView>
                        
                    ))}
                </ThemedView>
)}

        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 40,
        paddingHorizontal: 20,
    },
    heading: {
        fontSize: 25,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    emptyText: {
        fontSize: 18,
        fontStyle: 'italic',
        color: '#888',
    },
    message: {
        fontSize: 21,
        marginVertical: 5,
        padding: 10,
        borderRadius: 10,
        width: '100%',
        textAlign: 'center',
    },
    messageBox:{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
        borderRadius: 10,
        padding: 10,
    },
    messagesContainer: {
        width: '100%',
        flexDirection: 'column',
        alignItems: 'flex-start',
      },
      
});

export default PeakNeeds;
