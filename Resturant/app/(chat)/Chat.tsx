import ip from "@/Data/Addresses";
import { useEffect, useState } from "react";
import { StyleSheet, ScrollView, TouchableHighlight } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Message } from "@/Types/Message";
import { ThemedView } from "@/components/ThemedView";
import Bubble from "@/components/ui/Bubble";
import ThemedInput from "@/components/ThemedInput";
import CurvedButton from "@/components/ui/CurvedButton";
import {Image} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ChatProps } from "@/Types/ChatProps";
import {router} from 'expo-router';

export default function Chat(props:ChatProps | any) {
    const [msgs, setMsgs] = useState<Message[]>([]);
    const [uid, setUid] = useState<string | null>(props.uid??"");
    const [wid, setWid] = useState<string | null>(props.wid??"");
    const isOccupied = props.isOccupied;
    const setOccupied = props.setter;
    const [msg, setMsg] = useState<string>("");
    const id = "67bca367fa0830cccc9e040d"; // Your User ID
    const [isOpen, setIsOpen] = useState<boolean>(false);

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
            return updatedMsgs;
        });

        setMsg(""); // Clear input after sending
    };
    const leaveTable = () => {
        alert("Leaving table..."); // Replace with actual logic
        setIsOpen(false); // Close dropdown after clicking
        setOccupied(false); // Call the setter to update state
        router.dismissTo("/(tabs)/Home")
    };

    return (
        <ThemedView style={styles.container}>
            <ThemedView 
                style={styles.dottedOptions} 
                // Prevents full overlay
        >   
            <ThemedText style={styles.upperbarText}>Chat for your table</ThemedText>
            <TouchableHighlight style={styles.dottedContent} underlayColor="rgba(0, 0, 0, 0.1)"
            onPress={() => { setIsOpen(!isOpen) }}
            >
                <Image source={require("@/assets/images/menu-dots.png")} style={styles.image} />
            </TouchableHighlight>
        </ThemedView>
         {/* Dropdown Menu */}
         {isOpen && (
                    <ThemedView style={styles.dropdown}>
                        <TouchableHighlight
                            underlayColor="rgba(0, 0, 0, 0.1)"
                            style={styles.dropdownItem}
                            onPress={leaveTable}
                        >
                            <ThemedText style={styles.dropdownText}>Leave Table</ThemedText>
                        </TouchableHighlight>
                    </ThemedView>
                )}
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
        paddingTop:30,
        paddingBottom:30,
    },
    messageRow: {
        flexDirection: "row",
        alignItems: "flex-start",  // Ensures vertical alignment
        justifyContent: "flex-start",
        width: "80%",  // Ensures it spans full width
        paddingVertical: 10, // Ensures better spacing
    },
    upperbarText: {
        fontWeight: "bold",
        fontSize: 20,
    },
    button: {
        width: 70, // Fixed width for the send button
        height: 40, // Ensures the button has a proper height
        padding: 10,
    },


        dottedOptions: {
            display: "flex",
            flexDirection: "row",
            alignSelf: "flex-end",
            justifyContent: "space-between",
            paddingVertical: 15,
            paddingHorizontal: 16,
            borderRadius: 5,
            width: "100%",
            height: 50,
        },
        dottedContent: {
            flexDirection: "row",
            alignItems: "center", // Ensure vertical alignment
            justifyContent: "space-between",
        },
        image: {
            height: 40,
            width: 40,
            marginLeft: 8, // Add spacing between text and image
        },

        dropdown: {
            position: "absolute",
            top: 70, // Adjusted to appear below the menu icon
            right: 20,
            borderRadius: 5,
            paddingVertical: 10,
            paddingHorizontal: 15,
            zIndex: 10,
            shadowColor: "#351fff",
            shadowOffset: { width: 5, height: 5 },
            shadowOpacity: 1,
            shadowRadius: 4,
            elevation: 20,
        },
        dropdownItem: {
            paddingVertical: 10,
        },
        dropdownText: {
            fontSize: 16,
            fontWeight: "500",
        },
});
