// src/Data/Hub.ts (or wherever your connectHub lives)
import * as signalR from "@microsoft/signalr";
import ip from "@/Data/Addresses";

export class Connection {
  private static hub: signalR.HubConnection | null = null;

  /**
   * Sets the active hub connection.
   * @param conn The active hub connection.
   */
  public static setHub(conn: signalR.HubConnection) {
    this.hub = conn;
  }

  /**
   * Gets the active hub connection.
   * @returns The active hub connection.
   */
  public static getHub() {
    return this.hub;
  }

  public static connectHub = async (
    id: string,
    privilagelevel: "user" | "waiter" | "owner",
    userName?: string
  ): Promise<signalR.HubConnection | null> => {
    // build the correct query string
    let qs: string;
    if (privilagelevel === "user") {
      qs = `userid=${id}&privilagelevel=${privilagelevel}&name=${encodeURIComponent(
        userName ?? ""
      )}`;
    } else if (privilagelevel === "waiter") {
      qs = `waiterid=${id}&privilagelevel=${privilagelevel}`;
    } else {
      qs = `ownerid=${id}&privilagelevel=${privilagelevel}`;
    }

    const hubUrl = `http://${ip.julian}:5256/hub?${qs}`;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        // force raw WebSockets (skip negotiate) and override Origin
        transport: signalR.HttpTransportType.WebSockets,
        skipNegotiation: true,
        headers: {
          // this must be a valid HTTP(S) origin, not a ws:// URL
          Origin: `http://${ip.julian}:19006`,
        },
      })
      .withAutomaticReconnect()
      .build();

    try {
      await connection.start();
      this.setHub(connection);
      return connection;
    } catch (err) {
      console.error("SignalR connection failed:", err);
      return null;
    }
  };
}
