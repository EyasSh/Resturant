import React, { useState } from "react";
import { StyleSheet, Image, TouchableOpacity} from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import ChatLogo from "./ui/ChatLogo";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "@/Routes/NavigationTypes";
import AsyncStorage from "@react-native-async-storage/async-storage";
 export type TableProps = {
  tableNumber: number;
  isWindowSide: boolean;
  isOccupied: boolean;
  waiterId: string;
  userId: string;
  capacity : number;
  width: number |null | undefined;

}

export default function TableCard(props:TableProps) {
  const [isOccupied, setIsOccupied] = useState(props.isOccupied);
  const [isWindowSide, setIsWindowSide] = useState(props.isWindowSide);
  const [userId, setUserId] = useState<string>(props.userId);
  const [waiterId, setWaiterId] = useState<string>(props.waiterId);
  const [capacity, setCapacity] = useState<number>(props.capacity);
  const [number, setNumber] = useState<number>(props.tableNumber);
  const navigation = useNavigation<NavigationProp>();
  const handlePress = async() => {
    const stringfiedUser = await AsyncStorage.getItem('user');
    const u = JSON.parse(stringfiedUser!);
    if(isOccupied &&  u &&userId !== u.id){
      alert("Table is already occupied");
      return
    }
    setUserId(u.id);
    setIsOccupied(!isOccupied);
    navigation.navigate('Menu');
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <ThemedView style={[styles.container,{width:props.width}]}>
        
        <ThemedView style={styles.imageContainer}>
          <Image source={require("@/assets/images/table.png")} style={styles.image} />
        </ThemedView>
        <ThemedText style={styles.text}>{"Table:"+props.tableNumber}</ThemedText>
        <ThemedView style={styles.bottomInfoContainer}>
            <ThemedText style={styles.bottomInfoText}>
              {isOccupied ? "Occupied" : "Not Occupied"}
            </ThemedText>
          <ThemedText style={styles.bottomInfoText}>{isWindowSide ? "Window Side" : "Not Window Side"}</ThemedText>
          <ThemedText style={styles.bottomInfoText}>{"Capacity: "+capacity}</ThemedText>
          <ThemedView style={styles.bottomTableFunctions}>
          <TouchableOpacity onPress={()=>alert("image pressed")}>
            <Image style={styles.image} source={require("@/assets/images/waiter.png")} />
            
          </TouchableOpacity>
          <TouchableOpacity >
            <Image style={styles.image} source={require("@/assets/images/dining.png")} />
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
  message:{
    position: 'absolute',
    top: -20,
    right: -16.5,
    width:'28%',
    height: '18%',
    backgroundColor: 'rgb(0, 177, 0)',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    borderRadius: 10,
    backgroundColor: 'transparent',
    marginBottom: 10,
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
    gap: 10,
  },
  bottomInfoText: {
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'transparent',
  },
  bottomTableFunctions:{
    
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: 'auto',
    backgroundColor: 'transparent',
    gap: 40,
  },
 

});
