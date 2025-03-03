import { useState, useEffect } from "react";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { StyleSheet} from "react-native";
import axios from "axios";
import ip from "@/Data/Addresses";
import AsyncStorage from "@react-native-async-storage/async-storage";
import router from "expo-router";

export default function RemoveTable() {
    return (
        <ThemedView>
            <ThemedText>RemoveTable</ThemedText>
        </ThemedView>
    );
}