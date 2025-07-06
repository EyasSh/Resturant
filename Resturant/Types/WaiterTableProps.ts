import { TableProps } from '@/components/TableCard'
import * as signalR from '@microsoft/signalr'
/**
 * Props for the WaiterTable component
 * using the type the waiter can perform actions such as 
 * viewing a customer's order, marking an order as ready,
 *  and assigning a table to a customer
 */
export type WaiterTableProps = {
    tableNumber: number
    waiterid?: string
    waitername?: string 
    occupyAction?: ()=>void
    leaveAction?: ()=>void
    peakOrderAction?: ()=>void
    peakNeedAction?: ()=>void
    markOrderReadyAction?: ()=>void
    setter?:React.Dispatch<React.SetStateAction<WaiterTableProps[]>>
    hub? : signalR.HubConnection | null
    isOccupied?: boolean
    userName?: string

}