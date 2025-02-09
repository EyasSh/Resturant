import React, { useState } from "react";
import { StyleSheet, Image, TouchableOpacity, View } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { useRouter } from 'expo-router';
import CurvedButton from "./ui/CurvedButton";
import ChatLogo from "./ui/ChatLogo";
export default function TableCard() {
  const [isOccupied, setIsOccupied] = useState(false);
  const router = useRouter();
  const handlePress = () => {
    if(isOccupied){
      alert("Table is already occupied");
      return
    }
    setIsOccupied(!isOccupied);
    router.push('../(Menu)/Menu');
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <ThemedView style={styles.container}>
        <TouchableOpacity style={styles.message}  onPress={() =>alert("message pressed")}>
          <ChatLogo />
        </TouchableOpacity>
        <ThemedView style={styles.imageContainer}>
          <Image source={require("@/assets/images/table.png")} style={styles.image} />
        </ThemedView>
        <ThemedText style={styles.text}>Table 1</ThemedText>
        <ThemedView style={styles.bottomInfoContainer}>
          <ThemedText style={styles.bottomInfoText}>
            Status: {isOccupied ? "Occupied" : "Not Occupied"}
          </ThemedText>
          <ThemedText style={styles.bottomInfoText}>Window Side Table</ThemedText>
          <ThemedView style={styles.bottomTableFunctions}>
          <TouchableOpacity style={styles.touchop} onPress={()=>alert("image pressed")}>
          <Image style={styles.image} source={require("@/assets/images/waiter.png")} />
          <ThemedText style={styles.bottomInfoText}> Call Waiter</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.touchop}>
          <Image style={styles.image} source={require("@/assets/images/dining.png")} />
          <ThemedText style={styles.bottomInfoText}>Meal status</ThemedText>
          </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 230,
    padding: 10,
    borderRadius: 10,
    borderColor:"grey",
    borderWidth: 1,
    marginVertical: 10,
    backgroundColor: 'transparent',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  imageContainer: {
    borderRadius: 10,
    backgroundColor: 'transparent',
    marginBottom: 10,
  },
  message:{
    position: 'absolute',
    top: -20,
    right: -16.5,
    width:'19%',
    height: '19%',
    backgroundColor: 'rgb(0, 177, 0)',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  bottomInfoContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    backgroundColor: 'transparent',
  },
  bottomInfoText: {
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'transparent',
  },
  touchop:{
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  bottomTableFunctions:{
    
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 200,
    backgroundColor: 'transparent',
    gap: 10,
  }
});
