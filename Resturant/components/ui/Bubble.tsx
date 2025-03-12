import { Message } from "@/Types/Message";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StyleSheet, View, Text } from "react-native";

export default function Bubble(props: Message) {
    const [sender, setSender] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(props.message);

    useEffect(() => {
        const getUid = async () => {
            const u = await AsyncStorage.getItem("user");
            if (u) {
                const user = JSON.parse(u);
                setSender(user?.id);
            }
        };

        getUid();
    }, []);

    const isSentByUser = sender === props.senderId;

    return (
        <View style={[styles.container, { justifyContent: isSentByUser ? 'flex-end' : 'flex-start' }]}>
            <Text style={[isSentByUser ? styles.messageSent : styles.messageReceived]}>
                {message}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
        paddingHorizontal: 10,
    },
    messageSent: {
        backgroundColor: '#007AFF', // iOS blue for sent messages
        alignSelf: 'flex-end',
        padding: 10,
        borderRadius: 15,
        borderTopRightRadius: 0,
        maxWidth: '70%',
        color: 'white',
        marginRight: 10,
        fontSize:17,
    },
    messageReceived: {
        backgroundColor: '#E5E5EA', // iOS gray for received messages
        alignSelf: 'flex-start',
        padding: 10,
        borderRadius: 15,
        borderTopLeftRadius: 0,
        maxWidth: '70%',
        color: 'black',
        marginLeft: 10,
        fontSize:17,
    },
    text: {
        fontSize: 16,
    },
});
