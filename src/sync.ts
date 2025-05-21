import { P2PItem } from "./item.js";
import { Transport } from "./transport.js";

export enum SyncMessageType {
  Initiate = "sync_initiate",
  Respond = "sync_respond",
}

export interface SyncMessageInitiate {
  type: SyncMessageType.Initiate;
  data: {
    last_sync: number | null;
  };
}

export interface SyncMessageRespond {
  type: SyncMessageType.Respond;
  data: {
    last_sync: number;
    items: P2PItem[];
  };
}

export type SyncMessage = SyncMessageInitiate | SyncMessageRespond;

class Sync {
  private transport: Transport;

  constructor(transport: Transport) {
    this.transport = transport;
  }
}
