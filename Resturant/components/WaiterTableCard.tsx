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

export default function WaiterTableCard(props: WaiterTableProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [currWaiterId, setCurrWaiterId] = useState<string | null>(null)
  const [hasWaiter, setHasWaiter] = useState<boolean>(false)
  const [isWaitingTable, setIsWaitingTable] = useState<boolean>(false)

  useEffect(() => {
    const getId = async () => {
      const stored = await AsyncStorage.getItem('waiter')
      const id = stored ? JSON.parse(stored).id : null
      setCurrWaiterId(id)
      const occupied = props.waiterid != null && props.waiterid !== ''
      setHasWaiter(occupied)
      setIsWaitingTable(id !== null && id === props.waiterid)
    }
    getId()
  }, [props.waiterid])

  const isOccupiedByOther = hasWaiter && currWaiterId !== props.waiterid

  const handleWaitPress = () => {
    if (isOccupiedByOther) {
      alert('This table is occupied by another waiter')
    } else {
        if(isWaitingTable && props.leaveAction) {
            props.leaveAction()
            setIsWaitingTable(!isWaitingTable)
            return
        }
      if (props.occupyAction) {
        props.occupyAction()
        setIsWaitingTable(!isWaitingTable)
        return
      } else {
        alert('Occupy action is not implemented')
      }
    }
  }

  const waitButtonTitle = isOccupiedByOther
    ? 'Occupied'
    : isWaitingTable
    ? 'Leave Table'
    : 'Wait Table'

  const waitButtonStyle = {
    backgroundColor: isOccupiedByOther
      ? 'gray'
      : isWaitingTable
      ? '#ff3333'
      : '#4800ff',
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.waiterCardText}>Table {props.tableNumber}</ThemedText>

      <CurvedButton
        title={waitButtonTitle}
        action={handleWaitPress}
        style={waitButtonStyle}
      />

      
        {isWaitingTable && !isOccupiedByOther?
        <>
        <CurvedButton
        title="Peak Order"
        action={() => {
          if (props.peakOrderAction) props.peakOrderAction()
          else alert('Peak Order is not implemented')
        }}
        style={{ backgroundColor: '#fc9b1c' }}
      />
        <CurvedButton
        title="Peak Needs"
        action={() => navigation.navigate('PeakNeeds', { tableNumber: props.tableNumber })}
        style={{ backgroundColor: '#fc9b1c' }}
      />

      <CurvedButton
        title="Mark order as ready"
        action={() => {
          if (props.markOrderReadyAction) props.markOrderReadyAction()
          else alert('Mark Order Ready is not implemented')
        }}
        style={{ backgroundColor: '#4800ff' }}
      />
      </>:null
        }
      
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
