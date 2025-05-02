import ip from '../Data/Addresses'
import { useEffect, useState } from 'react'
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

export default function WaiterTableCard(props: WaiterTableProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [currWaiterId, setCurrWaiterId] = useState<string | null>(null)
  const [waiterId, setWaiterId] = useState<string | undefined>("")

  useEffect(() => {
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
  }, [props.waiterid, currWaiterId])


  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.waiterCardText}>Table {props.tableNumber}</ThemedText>
            <CurvedButton 
                title="Wait Table" 
                action={() => {
                    if (props.occupyAction) props.occupyAction();
                    else alert("Waiting Table is not implemented");
                }}
                style={{backgroundColor:"#4800ff"}}
            />
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
