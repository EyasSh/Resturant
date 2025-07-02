import ip from '../Data/Addresses'
import { use, useEffect, useState } from 'react'
import { ThemedView } from './ThemedView'
import { ThemedText } from './ThemedText'
import { StyleSheet, Image } from 'react-native'
import CurvedButton from '@/components/ui/CurvedButton'
import { WaiterTableProps } from '@/Types/WaiterTableProps'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/Routes/NavigationTypes';
import AsyncStorage from '@react-native-async-storage/async-storage'
import {Connection} from '@/Data/Hub'
import { TableProps } from './TableCard'

/**
 * A component representing a table card for a waiter.
 * The component displays a title, a button to wait the table, and if the waiter is waiting the table, a button to leave the table.
 * If the waiter is waiting the table, the component also displays 3 buttons: "Peak Needs", "Peak Order", and "Mark Order as ready"
 * Props:
 * - tableNumber: the number of the table
 * - waiterid: the id of the waiter waiting the table
 * - occupyAction: a function to be called when the waiter wants to wait the table
 * - leaveAction: a function to be called when the waiter wants to leave the table
 * - peakNeedAction: a function to be called when the waiter wants to view the needs of the table
 * - peakOrderAction: a function to be called when the waiter wants to view the order of the table
 * - markOrderReadyAction: a function to be called when the waiter wants to mark the order as ready
 * - setter: a function to be called when the waiter wants to update the state of the tables
 */
export default function WaiterTableCard(props: WaiterTableProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [currWaiterId, setCurrWaiterId] = useState<string | null>(null)
  const [waiterId, setWaiterId] = useState<string | null |undefined>("")
  const [buttonText, setButtonText] = useState<string>("")
  const hub = Connection.getHub()

  useEffect(() => {
/**
 * Retrieves the current waiter ID from AsyncStorage and updates the component's state.
 * If no waiter ID is found in AsyncStorage, an alert is displayed.
 * Sets the current waiter ID and updates the waiter ID from props.
 * This function is executed asynchronously.
 */
    const getId = async () => {
      const stored = await AsyncStorage.getItem('waiter')
      const id = stored ? JSON.parse(stored).id : null
      if(!id) {
        alert('No waiter id found')
        return
      }
      setCurrWaiterId(id)
      setWaiterId(props.waiterid)
      
    }
    getId()
  }, [props.waiterid])
  useEffect(() => {
    if (currWaiterId !== "" && waiterId === "") {
      setButtonText("Wait Table")
    } else if (currWaiterId === waiterId) {
      setButtonText("Leave Table")
    } else {
      setButtonText("Table being waited")
    }
  }, [currWaiterId, waiterId])
  
useEffect(() => {},[buttonText])

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.waiterCardText}>Table {props.tableNumber}</ThemedText>
      <ThemedText> {props.isOccupied? "Occupied" :"Free"}</ThemedText>
            <CurvedButton 
                title={buttonText}
                action={() => {
                    if (buttonText==="Wait Table" && props.occupyAction) {
                      props.occupyAction(); 
                      setWaiterId(currWaiterId);

                    }
                    else if(buttonText==="Leave Table" && props.leaveAction) {
                      props.leaveAction(); setWaiterId("")
                      hub?.on("ReceiveWaiterLeaveMessage",(tables:TableProps[]) => {
                        if (props.setter) props.setter(tables.map((t) => ({
                          tableNumber: t.tableNumber,
                          waiterid: t.waiterId
                        })))
                      })
                    }
                    else alert("Table is being waited");
                }}
                style={buttonText==="Wait Table"? {backgroundColor:"#4800ff"}:{ backgroundColor:"#ff0a00"}}
            />
            {currWaiterId && waiterId && currWaiterId===waiterId && buttonText==="Leave Table" ? 
            <>
               <CurvedButton
               title='Peak Needs'
               action={() => {
                 if (props.peakNeedAction) props.peakNeedAction();
                 else alert("Peak Needs is not implemented");
               }}
               style={{backgroundColor:"#fc9b1c"}}
              />
             <CurvedButton 
                 title="Peak Order" 
                 action={() => {
                     if (props.peakOrderAction) props.peakOrderAction();
                     else alert("Peak Order is not implemented");
                 }}
                 
                 style={{backgroundColor:"#fc9b1c"}}
             />
             
             <CurvedButton
                 title='Mark order as ready'
 
                 action={() => {
                     if (props.markOrderReadyAction) props.markOrderReadyAction();
                     else alert("Mark Order Ready is not implemented");
                 }}
                 style={{backgroundColor:"#4800ff"}} 
             />
             </>
            :null}  
            
      
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    padding: 20,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 10,
    margin: 10,
    minHeight: 240,
    minWidth: '50%',
  },
  waiterCardText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
})
