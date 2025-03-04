import React from "react";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { StyleSheet, Image, TouchableOpacity } from "react-native";
import { router } from "expo-router";



function Main() {
    return (
        <ThemedView style={styles.container}>
            <ThemedText style={styles.header}>Terminals</ThemedText>
            <TouchableOpacity onPress={() =>router.push('./(waiter)/WaiterLogin')} style={styles.staffBox}>
                <Image source={require("@/assets/images/chef.png")} style={styles.image} />
                <ThemedText>Chef/Waiter</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('./(owner)/OwnerLogin')} style={styles.staffBox}>
                <Image style={styles.image} source={require("@/assets/images/owner.png")} />
                <ThemedText>Owner</ThemedText>
            </TouchableOpacity>
        </ThemedView>
    );
}
const styles = StyleSheet.create({
    container:{
        flex:1,
        height:'auto',
        width:'auto',
        display:'flex',
        flexDirection:'column',
        alignItems:'center',
        justifyContent:'center',
        padding:10,
        paddingHorizontal:50,
        gap:20
    },
    header:{
        fontSize:24,
        fontWeight:'bold'
    },
    staffBox:{
        display:'flex',
        flexDirection:'column',
        alignItems:'center',
        justifyContent:'center',
        width:200,
        height:200,
        margin:10,
        borderColor:"grey",
        borderWidth:1,
        borderRadius:5,
        padding:10
    },
    image: {
        width: 100,
        height: 100,
        borderRadius: 10,
        resizeMode: 'cover',
      },
});
export default Main;