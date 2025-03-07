import CurvedButton from "./ui/CurvedButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { ThemedView } from "./ThemedView";
type LogoutProps = {
    action:()=>void| Promise<void> | null
}
export default function LogoutButton(props:LogoutProps) {
    const logout = async () => {
        await AsyncStorage.clear();
        if(props.action) {
            props.action();
        }
        router.dismissTo("/(login)");
        

    }

    return (
        <ThemedView style={{position:"relative",alignSelf:"center", width:"auto",height:"auto"}}>
            <CurvedButton 
                title="Logout" 
                action={async()=>await logout()} 
                style={{backgroundColor:"red"}} 
            />
        </ThemedView>
    )
}