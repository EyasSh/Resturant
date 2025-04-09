import { StyleSheet, ScrollView } from "react-native";
import { useState, useEffect } from "react";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import TableNeedMessage from "@/components/ui/TableNeedMessage";
import { NeedMessageProps, SelectedNeedMessages } from "@/Types/NeedMessageProps";
import CurvedButton from "@/components/ui/CurvedButton";

/**
 * Component for managing user needs messages at a table.
 *
 * @param {number} tableNumber - The table number associated with the user needs.
 * 
 * This component allows users to add and remove predefined need messages for a table.
 * The messages are displayed in a scrollable view, and users can select messages to 
 * notify the waiter. The selected messages are stored in the component's state, and 
 * duplicates are prevented. Users can also remove messages from the selected list.
 */

export default function UserNeeds() {
    const [selectedNeedMessages, setSelectedNeedMessages] = useState<SelectedNeedMessages | null>(null);
/**
 * Adds a new message to the list of selected need messages for the table.
 *
 * @param {string} message - The need message to add.
 *
 * This function updates the state with a new message for a specific table
 * if the message does not already exist in the current list. It prevents
 * duplicate messages from being added.
 */

    const Add = (message: string) => {
        setSelectedNeedMessages(prev => {
            const messages = prev?.messages ?? [];
            const existingTableNumber = prev?.tableNumber ?? 1;
    
            // Prevent duplicates
            if (messages.includes(message)) {
                return prev; // No update
            }
    
            return {
                tableNumber: existingTableNumber,
                messages: [...messages, message],
            };
        });
    };
    
    
/**
 * Removes a message from the list of selected need messages for the table.
 *
 * @param {string} messageToRemove - The need message to remove.
 *
 * This function updates the state by filtering out the specified message from the
 * current list of messages for a specific table. If the message is not found, no
 * update is made to the state.
 */

    const Remove = (messageToRemove: string) => {
        setSelectedNeedMessages(prev => {
          if (!prev?.messages) return prev;
      
          const updatedMessages = prev.messages.filter(msg => msg !== messageToRemove);
          return {
            ...prev,
            messages: updatedMessages,
          };
        });
      };
      
    
    
    useEffect(() => {}, [selectedNeedMessages]);
    return (
        <ThemedView style={styles.container}>
            <ThemedView>
                <ThemedText style={styles.needsText}>What do you need?</ThemedText>
                {selectedNeedMessages?.messages && selectedNeedMessages.messages.map((msg, index) => (
                    <ThemedView key={index} style={styles.messageBox}>
                        <ThemedText key={index} style={styles.messageText}>
                            {msg}
                        </ThemedText>
                        <CurvedButton title="Remove" action={() => Remove(msg)} style={{backgroundColor:"#fc9b00"}}/>
                    </ThemedView>
                ))}


            </ThemedView>
           
               
            <ThemedText style={styles.needsText}>Press the messages below and let the waiter help</ThemedText>
                <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollView}>
                
                    <TableNeedMessage message="Water" handleClick={() => Add("Water") } />
                    <TableNeedMessage message="Can you please come over" handleClick={() => Add("Can you please come over")}/>
                    <TableNeedMessage message="Check please" handleClick={() => Add("Check please")}/>
                    <TableNeedMessage message="I need extra food" handleClick={() => Add("I need extra food")}/>
                    <TableNeedMessage message="Come and clean the table" handleClick={() => Add("Come and clean the table")}/>
                </ScrollView>
           
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        display: "flex",
        flex: 1,
        flexDirection: "column",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10, // Optional: gives spacing between messages
        padding: 10,
    },
    needsText: {
        fontSize: 25,
        fontWeight: "bold",
        padding: 10,
        marginVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: "grey",
        textAlign: "center",
        lineHeight: 40,
    },
    messageBox: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
    },
    
    messageText: {
        fontSize: 16,
        fontWeight: "bold",
        padding: 10,
        borderRadius: 8,
        marginVertical: 5,
      },
    scrollView: {
        flexDirection: "row",
        alignSelf: "flex-end",
        padding: 10,
    },
});
