import { StyleSheet } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import TableNeedMessage from "@/components/ui/TableNeedMessage";

export default function UserNeeds() {
    return (
        <ThemedView style={styles.container}>
            <TableNeedMessage message="Water" handleClick={() => alert("Water")} />
            <TableNeedMessage message="Can you please come over" handleClick={() => alert("Can you please come over")}/>
            <TableNeedMessage message="Check please" handleClick={() => alert("Check please")}/>
            <TableNeedMessage message="I need extra food" handleClick={() => alert("I need extra food")}/>
            <TableNeedMessage message="Come and clean the table" handleClick={() => alert("Come and clean the table")}/>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 10, // Optional: gives spacing between messages
        padding: 10,
    },
});
