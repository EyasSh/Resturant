import { Platform, ToastAndroid } from "react-native";

export default function ShowMessageOnPlat(message: string) {
    if (Platform.OS === "android") {
        ToastAndroid.show(message, ToastAndroid.CENTER);
    } else if (Platform.OS === "ios") {
        // Handle iOS-specific logic here if needed
        alert(message); // For example, you can use alert for iOS
    }
}