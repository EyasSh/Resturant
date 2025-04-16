import * as signalR from "@microsoft/signalr";
import ip from "@/Data/Addresses";
export class Connection {
    private static hub: signalR.HubConnection | null = null;
  
    public static getHub(): signalR.HubConnection | null {
      return this.hub;
    }
  
    public static setHub(newHub: signalR.HubConnection): void {
      this.hub = newHub;
    }
    public static connectHub = async (id: string, privilagelevel: string) => {
        const connection = new signalR.HubConnectionBuilder()
        .withUrl(`http://${ip.julian}:5256/hub?userid=${id}&privilagelevel=${privilagelevel}`)
        .withAutomaticReconnect()   
        .build();
        await connection.start();

        this.setHub(connection);
        return connection;
  
    }
  }
  