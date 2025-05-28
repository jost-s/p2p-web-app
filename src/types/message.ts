export enum P2PMessageType {
  InitiateSync = "initiate_sync",
}

export interface P2PMessage {
  type: P2PMessageType.InitiateSync;
  last_sync: Date | null;
}
