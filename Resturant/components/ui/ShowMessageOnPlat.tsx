import { Platform, ToastAndroid } from "react-native";

/**
 * Displays a message using platform-specific methods.
 *
 * On Android, it uses ToastAndroid to show the message.
 * On iOS, it displays an alert.
 *
 * @param {string} message - The message to display.
 */
export default function ShowMessageOnPlat(message: string) {
    if (Platform.OS === "android") {
        ToastAndroid.show(message, ToastAndroid.CENTER);
    } else if (Platform.OS === "ios") {
        // Handle iOS-specific logic here if needed
        alert(message); // For example, you can use alert for iOS
    }
}