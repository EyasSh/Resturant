import ip from "@/Data/Addresses";
import { useEffect, useState } from "react";
import { StyleSheet, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Message } from "@/Types/Message";
import { ThemedView } from "@/components/ThemedView";
import Bubble from "@/components/ui/Bubble";
import ThemedInput from "@/components/ThemedInput";
import CurvedButton from "@/components/ui/CurvedButton";

export default function Chat() {
    const [msgs, setMsgs] = useState<Message[]>([]);
    const [uid, setUid] = useState<string | null>(null);
    const [msg, setMsg] = useState<string>("");
    const id = "67bca367fa0830cccc9e040d"; // Your User ID

    // Fetch user ID from AsyncStorage when the component mounts
    useEffect(() => {
        const getUserId = async () => {
            const storedUser = await AsyncStorage.getItem("user");
            if (storedUser) {
                const user = JSON.parse(storedUser);
                setUid(user?.id);
            }
        };

        getUserId();
    }, []);

    useEffect(() => {
    }, [msgs]); // Ensures re-render when msgs updates

    // Function to send a message
    const sendMsg = () => {
        if (!msg.trim()) return; // Prevent sending empty messages

        const newMessage: Message = {
            message: msg,
            senderId: id, // Current user
            recipientId: "123", // Hardcoded for now, should be dynamic
            fromStorageObj: "user",
        };

        setMsgs(prevMsgs => {
            const updatedMsgs = [...prevMsgs, newMessage];
            console.log("Updated messages:", updatedMsgs);
            return updatedMsgs;
        });

        setMsg(""); // Clear input after sending
    };

    return (
        <ThemedView style={styles.container}>
            {/* Messages Display */}
            <ScrollView style={{ flex: 1 }}>
                {msgs.length > 0 &&
                    msgs.map((msg, index) => (
                        <Bubble key={`${msg.senderId}-${msg.recipientId}-${index}`} {...msg} />
                    ))}
            </ScrollView>

            {/* Input and Send Button */}
            <ThemedView style={styles.messageRow}>
            <ThemedInput
                action={text => setMsg(text)}
                type="text"
                placeholder="Send a message"
                value={msg}
            />
            <CurvedButton
                title="Send"
                action={sendMsg}
                style={[styles.button, { backgroundColor: "rgb(72, 0, 255)" }]}
            />
            </ThemedView>
            
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop:50,
        paddingBottom:30,
    },
    messageRow: {
        flexDirection: "row",
        alignItems: "flex-start",  // Ensures vertical alignment
        justifyContent: "flex-start",
        width: "80%",  // Ensures it spans full width
        paddingVertical: 10, // Ensures better spacing
    },
  
    button: {
        width: 70, // Fixed width for the send button
        height: 40, // Ensures the button has a proper height
        padding: 10,
    }
});
