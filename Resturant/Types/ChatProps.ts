export type ChatProps = {
    uid: string
    wid: string
    hubConnection: signalR.HubConnection
    isOccupied: boolean
    setter:(value: React.SetStateAction<boolean>)=>void
}