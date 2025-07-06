import * as signalR from "@microsoft/signalr";
import ip from "@/Data/Addresses";
export class Connection {
    private static hub: signalR.HubConnection | null = null;
  
    public static getHub(): signalR.HubConnection | null {
      return this.hub;
    }
  
    public static setHub(newHub: signalR.HubConnection | null): void {
      this.hub = newHub;
    }
    public static connectHub = async (id: string, privilagelevel: string, userName?: string) => {
      if(privilagelevel==="user"){
        const connection = new signalR.HubConnectionBuilder()
        .withUrl(`http://${ip.julian}:5256/hub?userid=${id}&privilagelevel=${privilagelevel}&name=${userName}`)
        .withAutomaticReconnect()   
        .build();
        await connection.start();
        this.setHub(connection);
        
      }
      else if(privilagelevel==="waiter"){
        const connection = new signalR.HubConnectionBuilder()
        .withUrl(`http://${ip.julian}:5256/hub?waiterid=${id}&privilagelevel=${privilagelevel}`)
        .withAutomaticReconnect()   
        .build();
        await connection.start();
        this.setHub(connection);
        
      }
      else{
        const connection = new signalR.HubConnectionBuilder()
        .withUrl(`http://${ip.julian}:5256/hub?ownerid=${id}&privilagelevel=${privilagelevel}`)
        .withAutomaticReconnect()   
        .build();
        await connection.start();
        this.setHub(connection);
        
      }
      return this.hub;
        

     
  
    }
  }
  