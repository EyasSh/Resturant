import React, { useEffect, useState } from "react";
import { StyleSheet, Image, TouchableOpacity} from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import ChatLogo from "./ui/ChatLogo";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "@/Routes/NavigationTypes";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as signalR from '@microsoft/signalr';
import CurvedButton from "./ui/CurvedButton";
import { HapticTab } from "./HapticTab";
 export type TableProps = {
  tableNumber: number;
  isWindowSide: boolean;
  isOccupied: boolean;
  waiterId: string;
  userId: string;
  capacity : number;
  width: number |null | undefined;
  hub: signalR.HubConnection |null 
  onAssignUserToTable: (userId:string, tableNumber:number)=>void
  onLeaveTable: (tableNumber:number)=>Promise<void>
}

/**
 * A component that represents a table card with information and actions for a specific table.
 *
 * This component displays details about a table, such as its number, occupancy status, 
 * window side status, and capacity. It allows users to interact with the table card 
 * through touch events. 
 * 
 * - If the table is occupied, it checks if the current user is assigned to it. If not, 
 *   an alert is displayed; if yes, the user is navigated to the menu.
 * - If the table is not occupied, the current user can be assigned to it using the 
 *   provided callback function.
 * - Users can also leave the table through the "Leave" button, triggering an appropriate 
 *   callback.
 * 
 * Props:
 * - `tableNumber` (number): The number of the table.
 * - `isWindowSide` (boolean): Indicates if the table is by the window.
 * - `isOccupied` (boolean): Indicates if the table is currently occupied.
 * - `waiterId` (string): The ID of the waiter assigned to the table.
 * - `userId` (string): The ID of the user assigned to the table.
 * - `capacity` (number): The seating capacity of the table.
 * - `width` (number | null | undefined): The width of the table card.
 * - `hub` (signalR.HubConnection | null): SignalR hub connection for real-time updates.
 * - `onAssignUserToTable` (function): Callback to assign the current user to the table.
 * - `onLeaveTable` (function): Callback for the user to leave the table.
 */

export default function TableCard(props: TableProps) {
  const isOccupied = props.isOccupied;
  const isWindowSide = props.isWindowSide;
  const userId = props.userId;
  const waiterId = props.waiterId;
  const capacity = props.capacity;
  const number = props.tableNumber;
  const navigation = useNavigation<NavigationProp>();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
/**
 * Handles the press event on the table card.
 * 
 * This function checks whether the table is occupied and whether the current user is the one assigned 
 * to the table. Depending on these conditions, it alerts the user, navigates to the menu, or assigns 
 * the user to the table.
 * 
 * - If the table is occupied and the current user is not the assigned user, an alert is shown indicating 
 *   the table is already occupied.
 * - If the table is occupied and the current user is the assigned user, an alert is shown and 
 *   navigation to the menu occurs.
 * - If the table is not occupied, the current user is assigned to the table using the provided callback.
 */
useEffect(() => {
  const getUserId = async () => {
    const stringfiedUser = await AsyncStorage.getItem('user');
    const u = JSON.parse(stringfiedUser!);
    setCurrentUserId(u.id);
  }
  getUserId();
  setConnection(props.hub);
})
useEffect(() => {},[connection])
  const handlePress = async () => {
    const stringfiedUser = await AsyncStorage.getItem('user');
    const u = JSON.parse(stringfiedUser!);

    if (isOccupied && userId !== u.id) {
      alert("Table is already occupied");
      return;
    }

    if (isOccupied && userId === u.id) {
      alert("You are already assigned to this table");
      navigation.navigate('Menu');
      return;
    }

    if (!isOccupied && props.onAssignUserToTable) {
      props.onAssignUserToTable(u.id, number);
    }
  };

  const handleLeave = async () => {
    const stringfiedUser = await AsyncStorage.getItem('user');
    const u = JSON.parse(stringfiedUser!);
    if (userId === u.id && props.onLeaveTable) {
     await props.onLeaveTable(number);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <ThemedView style={[styles.container, { width: props.width }]}>
        <ThemedView style={styles.imageContainer}>
          <Image source={require("@/assets/images/table.png")} style={styles.image} />
        </ThemedView>
        <ThemedText style={styles.text}>{"Table:" + props.tableNumber}</ThemedText>
        <ThemedView style={styles.bottomInfoContainer}>
          <ThemedText style={styles.bottomInfoText}>
            {isOccupied ? "Occupied" : "Not Occupied"}
          </ThemedText>
          <ThemedText style={styles.bottomInfoText}>{isWindowSide ? "Window Side" : "Not Window Side"}</ThemedText>
          <ThemedText style={styles.bottomInfoText}>{"Capacity: " + capacity}</ThemedText>
        </ThemedView>

        
            {isOccupied && userId === currentUserId ?
            <>
              <TouchableOpacity onPress={()=>navigation.navigate("UserNeeds",{tableNumber:number,hub:connection})} style={styles.waiterImage}>
                <Image style={styles.image} source={require("@/assets/images/waiter.png")} />
              </TouchableOpacity>
              <CurvedButton
                title="Leave"
                action={async()=>await handleLeave()}
                style={{ backgroundColor: "red" }}
              />
            </>
            :null
            } 
         
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
  waiterImage:{
    marginVertical: 5,
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
