import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import CurvedButton from '@/components/ui/CurvedButton';
import { WaiterTableProps } from '@/Types/WaiterTableProps';

/**
 * A table card for waiters.
 *
 * This component displays a table number, occupation status, and a main button that
 * allows a waiter to wait a table if it is free or leave a table if they are
 * currently waiting it. If the waiter is waiting the table, they will also see
 * additional actions to peak at the customer's needs or order, or to mark the order
 * as ready.
 *
 * @param {WaiterTableProps} props - The properties for this component:
 *   - `tableNumber`: The number of the table.
 *   - `waiterid`: The id of the waiter currently waiting the table, if any.
 *   - `isOccupied`: Whether the table is occupied by a customer.
 *   - `userName`: The username of the waiter currently waiting the table.
 *   - `occupyAction`: An action to wait the table.
 *   - `leaveAction`: An action to leave the table.
 *   - `peakOrderAction`: An action to peak at the customer's order.
 *   - `peakNeedAction`: An action to peak at the customer's needs.
 *   - `markOrderReadyAction`: An action to mark the order as ready.
 */
export default function WaiterTableCard(props: WaiterTableProps) {
  const { tableNumber, waiterid, isOccupied, userName } = props;

  // Only thing we need locally: *current waiter id* for comparison
  const [currWaiterId, setCurrWaiterId] = useState<string | null>(null);

  useEffect(() => {
/**
 * Retrieves the current waiter's ID from AsyncStorage and updates the component's state.
 *
 * @async
 * @returns {Promise<void>} A promise that resolves when the waiter ID is successfully fetched and updated in the state.
 *
 * @remarks
 * This function accesses AsyncStorage to obtain the stored waiter object, parses it to extract the waiter's ID, and sets the state with the retrieved ID. If no waiter object is found, the state is updated with null.
 */

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

  /**
   * Handles the main button action for the WaiterTableCard component.
   *
   * If the table is free, waits the table by calling the occupyAction
   * prop. If the table is being waited by the current waiter, leaves the
   * table by calling the leaveAction prop. If someone else is waiting, does
   * nothing.
   */
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
