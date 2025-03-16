import CurvedButton from "./ui/CurvedButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedView } from "./ThemedView";
import { NavigationProp } from '@/Routes/NavigationTypes';
import { useNavigation } from '@react-navigation/native';
type LogoutProps = {
    action:()=>void| Promise<void> | null
}
export default function LogoutButton(props:LogoutProps) {
    const navigation = useNavigation<NavigationProp>();
    const logout = async () => {
        await AsyncStorage.clear();
        if(props.action) {
            props.action();
        }
        navigation.navigate("Login");
        

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