export type ChatProps = {
    uid: string
    wid: string
    hubConnection: signalR.HubConnection
    isOccupied: boolean
    setter:(value: boolean)=>void
}