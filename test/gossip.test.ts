import { test } from "vitest";
import { GossipRound, P2PMessage, Transport } from "../gossip";

class P2PTestConnection implements Transport {
  onMessage(message: P2PMessage) {
    console.log("test deal");
    console.log("incoming message", message);
  }

  async send(message: P2PMessage) {
    console.log("test deal");
    console.log("sending message", message);
  }
}

test("Initiate a gossip session with a peer", async () => {
  console.log("gossiping now");
  const alice = new P2PTestConnection();
  const bob = new P2PTestConnection();

//   await alice.send("hallo");
const gossipRound()
});
