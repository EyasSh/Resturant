import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import CurvedButton from '@/components/ui/CurvedButton';
import { WaiterTableProps } from '@/Types/WaiterTableProps';

export default function WaiterTableCard(props: WaiterTableProps) {
  const { tableNumber, waiterid, isOccupied, userName } = props;

  // Only thing we need locally: *current waiter id* for comparison
  const [currWaiterId, setCurrWaiterId] = useState<string | null>(null);

  useEffect(() => {
    const getId = async () => {
      const stored = await AsyncStorage.getItem('waiter');
      const id = stored ? JSON.parse(stored).id : null;
      setCurrWaiterId(id);
    };
    getId();
  }, []);

  // Derive everything from props + currWaiterId (no extra local mirrors)
  const isFree = !waiterid;                         // no one waiting this table
  const isSelf = !!currWaiterId && waiterid === currWaiterId;

  let mainButtonText = 'Table being waited';
  if (isFree) mainButtonText = 'Wait Table';
  else if (isSelf) mainButtonText = 'Leave Table';

  const mainButtonAction = () => {
    if (isFree) {
      // Wait table
      props.occupyAction?.();
    } else if (isSelf) {
      // Leave table
      props.leaveAction?.();
    } else {
      // Someone else is waiting
      // no-op or toast – keep as is to match your UX
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.waiterCardText}>Table {tableNumber}</ThemedText>
      <ThemedText style={styles.waiterCardText}>
        {isOccupied ? `Occupied by ${userName ?? 'guest'}` : 'Free'}
      </ThemedText>

      <CurvedButton
        title={mainButtonText}
        action={mainButtonAction}
        style={isFree ? { backgroundColor: '#4800ff' } : isSelf ? { backgroundColor: '#ff0a00' } : undefined}
      />

      {/* Only show the extra actions if *you* are the waiter for this table */}
      {isSelf ? (
        <>
          <CurvedButton
            title="Peak Needs"
            action={() => props.peakNeedAction?.()}
            style={{ backgroundColor: '#fc9b1c' }}
          />
          <CurvedButton
            title="Peak Order"
            action={() => props.peakOrderAction?.()}
            style={{ backgroundColor: '#fc9b1c' }}
          />
          <CurvedButton
            title="Mark order as ready"
            action={() => props.markOrderReadyAction?.()}
            style={{ backgroundColor: '#4800ff' }}
          />
        </>
      ) : null}
    </ThemedView>
  );
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
});
