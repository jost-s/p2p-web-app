import { Agent, AgentId, SignalingClient, SignalingType } from "p2p-signal";

interface Connection {
  rtc: RTCPeerConnection;
  dataChannel: RTCDataChannel;
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

  static async connect(agent) {
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

  createConnectionWithAgent(agentId: AgentId) {
    const rtcConnection = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
    });
    this.listenToRtcConnectionEventsFromAgent(rtcConnection, agentId);
    const dataChannel = rtcConnection.createDataChannel(agentId);
    dataChannel.addEventListener("open", (event) => {
      console.log("datachannel opened with", agentId);
    });
    this.rtcConnections.set(agentId, {
      rtc: rtcConnection,
      dataChannel,
      open: false,
    });
    return rtcConnection;
  }

  async initiateConnectionWithAgent(agentId: AgentId) {
    const rtcConnection = this.createConnectionWithAgent(agentId);
    const offer = await rtcConnection.createOffer();
    await rtcConnection.setLocalDescription(offer);
    await this.signalingClient.sendOffer(agentId, offer);
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
        console.log("received signaling offer from", sender);
        if (!this.rtcConnections.has(sender)) {
          const rtcConnection = this.createConnectionWithAgent(sender);
          await rtcConnection.setRemoteDescription(offer);
          const answer = await rtcConnection.createAnswer();
          await rtcConnection.setLocalDescription(answer);
          const response = await this.signalingClient.sendAnswer(
            sender,
            answer
          );
          console.log("sent answer to agent", sender, "response", response);
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
        console.log("received signaling answer from", sender);
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
        console.log("received signaling ice candidate from", sender);
        const rtcConnection = this.rtcConnections.get(sender)?.rtc;
        console.log("has rtc conne", !!rtcConnection);
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
      console.log(
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
    rtcConnection.addEventListener("datachannel", (event) => {
      console.log(this.signalingClient.agent.name, "datachannel", event.type);
    });
    rtcConnection.addEventListener("icecandidate", async (event) => {
      if (event.candidate) {
        await this.signalingClient.sendIceCandidate(agentId, event.candidate);
      }
    });
  }
}
