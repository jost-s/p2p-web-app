import { Agent, AgentId, SignalingClient, SignalingType } from "p2p-signal";
import { P2PConnection, Transport } from "./transport.js";

interface Connection {
  rtc: RTCPeerConnection;
  // transport: Transport | null;
  dataChannel: RTCDataChannel | null;
  open: boolean;
}

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

export class P2PClient {
  readonly agent: Agent;

  private readonly rtcConnections: Map<AgentId, Connection>;
  private readonly signalingClient: SignalingClient;

  constructor(signalingClient: SignalingClient, agent: Agent) {
    this.agent = agent;
    this.rtcConnections = new Map();
    this.signalingClient = signalingClient;
  }

  static async connect(agent: Agent) {
    const signalingClient = await SignalingClient.connect(
      new URL("ws://localhost:9000"),
      agent
    );
    const p2pClient = new P2PClient(signalingClient, agent);
    p2pClient.listenToSignalingEvents();

    return p2pClient;
  }

  announce() {
    return this.signalingClient.announce();
  }

  getAllAgents() {
    return this.signalingClient.getAllAgents();
  }

  getConnectionWithAgent(agentId: AgentId) {
    return this.rtcConnections.get(agentId);
  }

  async initiateConnectionWithAgent(agentId: AgentId) {
    const rtcConnection = this.createConnectionForAgent(agentId);

    const dataChannel = rtcConnection.createDataChannel(agentId);
    dataChannel.addEventListener("open", async (event) => {
      console.info("datachannel opened with", agentId);
      this.rtcConnections.set(agentId, {
        rtc: rtcConnection,
        dataChannel,
        open: true,
      });
      this.sync(dataChannel);
    });
    const offer = await rtcConnection.createOffer();
    await rtcConnection.setLocalDescription(offer);
    await this.signalingClient.sendOffer(agentId, offer);
  }

  private createConnectionForAgent(agentId: AgentId) {
    const rtcConnection = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
    });
    this.listenToRtcConnectionEventsFromAgent(rtcConnection, agentId);

    this.rtcConnections.set(agentId, {
      rtc: rtcConnection,
      dataChannel: null,
      open: false,
    });
    return rtcConnection;
  }

  private async sync(dataChannel: RTCDataChannel) {
    dataChannel.addEventListener("message", async (event) => {
      console.log("incoming message", event.data);
    });
    dataChannel.send("init sync");
  }

  private async listenForSyncMessages(dataChannel: RTCDataChannel) {
    dataChannel.addEventListener("message", async (event) => {
      console.log("incoming message", event.data);
      if (event.data === "init sync") {
        dataChannel.send("alright, here's what's new");
      }
    });
  }

  private listenToSignalingEvents() {
    this.signalingClient.addSignalingListener(
      SignalingType.Offer,
      async (signalingMessage) => {
        if (signalingMessage.signaling.type !== SignalingType.Offer) {
          console.error("Received an answer as an offer", signalingMessage);
          return;
        }
        const { sender, offer } = signalingMessage.signaling.data;
        console.info("received signaling offer from", sender);
        if (!this.rtcConnections.has(sender)) {
          const rtcConnection = this.createConnectionForAgent(sender);

          rtcConnection.addEventListener("datachannel", (event) => {
            console.debug("datachannel opened with", sender);
            const dataChannel = event.channel;
            this.rtcConnections.set(sender, {
              rtc: rtcConnection,
              dataChannel,
              open: true,
            });
            this.listenForSyncMessages(dataChannel);
          });

          await rtcConnection.setRemoteDescription(offer);
          const answer = await rtcConnection.createAnswer();
          await rtcConnection.setLocalDescription(answer);
          const response = await this.signalingClient.sendAnswer(
            sender,
            answer
          );
          console.debug("sent answer to agent", sender, "response", response);
        }
      }
    );
    this.signalingClient.addSignalingListener(
      SignalingType.Answer,
      async (signalingMessage) => {
        if (signalingMessage.signaling.type !== SignalingType.Answer) {
          console.error("Received an offer as an answer", signalingMessage);
          return;
        }
        const { sender, answer } = signalingMessage.signaling.data;
        console.debug("received signaling answer from", sender);
        const rtcConnection = this.rtcConnections.get(sender)?.rtc;
        if (!rtcConnection) {
          console.error("Received an answer without an offer from", sender);
          return;
        }
        await rtcConnection.setRemoteDescription(answer);
      }
    );
    this.signalingClient.addSignalingListener(
      SignalingType.IceCandidate,
      async (signalingMessage) => {
        if (signalingMessage.signaling.type !== SignalingType.IceCandidate) {
          console.error(
            "Received an ICE candidate as something else",
            signalingMessage
          );
          return;
        }
        const { sender, iceCandidate } = signalingMessage.signaling.data;
        console.debug("received signaling ice candidate from", sender);
        const rtcConnection = this.rtcConnections.get(sender)?.rtc;
        if (!rtcConnection) {
          console.error(
            "Received an ICE candidate without offer or answer from",
            sender
          );
          return;
        }
        await rtcConnection.addIceCandidate(iceCandidate);
      }
    );
  }

  private listenToRtcConnectionEventsFromAgent(
    rtcConnection: RTCPeerConnection,
    agentId: AgentId
  ) {
    rtcConnection.addEventListener("connectionstatechange", (event) => {
      console.debug(
        this.signalingClient.agent.name,
        "connectionstatechanged",
        event.type,
        rtcConnection.connectionState
      );
      const conn = this.rtcConnections.get(agentId);
      if (conn) {
        if (rtcConnection.connectionState === "connected") {
          conn.open = true;
        } else if (rtcConnection.connectionState === "disconnected") {
          conn.open = false;
        }
      }
    });
    rtcConnection.addEventListener("icecandidate", async (event) => {
      if (event.candidate) {
        await this.signalingClient.sendIceCandidate(agentId, event.candidate);
      }
    });
  }
}
