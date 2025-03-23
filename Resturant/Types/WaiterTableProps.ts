import * as signalR from '@microsoft/signalr'
export type WaiterTableProps = {
    tableNumber: number
    waiterid?: string
    waitername?: string 
    occupyAction?: ()=>void
    peakOrderAction?: ()=>void
    markOrderReadyAction?: ()=>void
    hub? : signalR.HubConnection | null

}