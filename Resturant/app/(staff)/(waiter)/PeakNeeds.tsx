import { useState, useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from "@/Routes/NavigationTypes";
import { Connection } from '@/Data/Hub';
import { useTheme } from '@react-navigation/native';

function PeakNeeds() {
    const route = useRoute<RouteProp<RootStackParamList, 'PeakNeeds'>>();
    const { tableNumber } = route.params as { tableNumber: number };
    const [needs, setNeeds] = useState<string[]>([]);
    const connection = Connection.getHub();
    const { dark } = useTheme();

    // --------------------------------------------------------
    // DELETE MESSAGE (Waiter action)
    // --------------------------------------------------------
    const deleteNeed = (msg: string) => {
        // Remove from UI immediately
        setNeeds(prev => prev.filter(n => n !== msg));

        // Remove from server
        connection?.invoke("DeleteUserNeed", tableNumber, msg)
            .catch(err => console.error("Delete failed:", err));
    };

    // --------------------------------------------------------
    // LOAD + LISTEN TO SIGNALR EVENTS
    // --------------------------------------------------------
    useEffect(() => {
        if (!connection) return;

        const handleReceive = (messages: string[]) => {
            setNeeds(messages);
        };

        const handleDeleted = (tbl: number, msg: string) => {
            if (tbl === tableNumber) {
                setNeeds(prev => prev.filter(n => n !== msg));
            }
        };

        try {
            // Ask server for current needs
            connection.invoke("GetUserNeeds", tableNumber);

            // Listeners
            connection.on("ReceiveMessagesToWaiter", handleReceive);
            connection.on("UserNeedDeleted", handleDeleted);

        } catch (err) {
            console.error("Error:", err);
        }

        return () => {
            connection.off("ReceiveMessagesToWaiter", handleReceive);
            connection.off("UserNeedDeleted", handleDeleted);
        };
    }, [connection, tableNumber]);

    // --------------------------------------------------------
    // UI
    // --------------------------------------------------------
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
                        <Pressable key={idx} onPress={() => deleteNeed(msg)}>
                            <ThemedText style={{ textAlign: 'center', marginBottom: 5, color: dark ? '#aaa' : '#555' }}>
                                (Tap to mark as served)
                            </ThemedText>
                            <ThemedView
                                style={[
                                    styles.messageBox,
                                    { backgroundColor: dark ? "#0c0c0e" : "#f0f0f0" }
                                ]}
                            >
                                <ThemedText style={styles.message}>
                                    {msg}
                                </ThemedText>
                            </ThemedView>
                        </Pressable>
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
        textAlign: 'center',
        padding: 10,
        width: "100%",
    },
    messageBox: {
        marginBottom: 10,
        borderRadius: 10,
        padding: 10,
    },
    messagesContainer: {
        width: '100%',
        flexDirection: 'column',
    },
});

export default PeakNeeds;
