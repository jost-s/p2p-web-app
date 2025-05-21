export interface P2PMessage {}

export interface Transport {
  onMessage: (message: P2PMessage) => void;
  send: (message: P2PMessage) => Promise<void>;
}

export class P2PConnection implements Transport {
  constructor() {}

  onMessage(message: P2PMessage) {
    console.log("real deal");
  }

  async send(message: P2PMessage) {
    console.log("real deal sending message");
  }
}

export class GossipRound {
  transport: Transport;

  constructor(transport: Transport) {
    this.transport = transport;
  }

  initiate() {
    console.log("initiating gossip round");
    this.transport.send("sending message to my man");
  }
}
