import {
  type Agent,
  AgentId,
  SignalingClient,
  SignalingType,
} from "p2p-signal";

interface Connection {
  rtc: RTCPeerConnection;
  dataChannel: RTCDataChannel;
  open: boolean;
}

let signalingClient: SignalingClient;
let getAllAgentsPolling: number;
const rtcConnections = new Map<AgentId, Connection>();

const announce = async () => {
  await signalingClient.announce();
  const allAgents = await signalingClient.getAllAgents();
  console.log("all agents", allAgents);
};

const getAllAgents = async () => {
  const allAgents = await signalingClient.getAllAgents();
  const agentList = document.querySelector("ul#agent-list");
  if (agentList && agentList instanceof HTMLUListElement) {
    agentList.textContent = "";
    allAgents
      .filter((agent) => agent.id !== signalingClient.agent.id)
      .forEach((agent) => {
        const listItem = document.createElement("li");
        const clientLabel = document.createElement("label");
        clientLabel.textContent = `Name: ${agent.name} ID: ${agent.id}`;
        listItem.appendChild(clientLabel);
        if (!rtcConnections.has(agent.id)) {
          const connectButton = document.createElement("button");
          connectButton.textContent = "Connect";
          connectButton.addEventListener("click", async (_event) => {
            console.log("connect button clicked", agent.id);
            if (!rtcConnections.has(agent.id)) {
              const rtcConnection = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
              });
              listenToRtcConnectionEventsFromAgent(rtcConnection, agent.id);
              const dataChannel = rtcConnection.createDataChannel(agent.id);
              dataChannel.addEventListener("open", (event) => {
                console.log("datachannel opened with", agent.id);
              });
              rtcConnections.set(agent.id, {
                rtc: rtcConnection,
                dataChannel,
                open: false,
              });
              const offer = await rtcConnection.createOffer();
              await rtcConnection.setLocalDescription(offer);
              const response = await signalingClient.sendOffer(agent.id, offer);
              console.log("sent offer to", agent.id, "response", response);
            }
          });
          listItem.appendChild(connectButton);
        }
        agentList.appendChild(listItem);
      });
  }
};

const listenToRtcConnectionEventsFromAgent = (
  rtcConnection: RTCPeerConnection,
  agentId: AgentId
) => {
  rtcConnection.addEventListener("connectionstatechange", (event) => {
    console.log(
      signalingClient.agent.name,
      "connectionstatechanged",
      event.type,
      rtcConnection.connectionState
    );
  });
  rtcConnection.addEventListener("datachannel", (event) => {
    console.log(signalingClient.agent.name, "datachannel", event.type);
    const conn = rtcConnections.get(agentId);
    if (conn) {
      conn.open = true;
    }
  });
  rtcConnection.addEventListener("icegatheringstatechange", (event) => {
    console.log(
      signalingClient.agent.name,
      "icegatheringstatechange",
      rtcConnection.iceConnectionState,
      rtcConnection.iceGatheringState
    );
  });
  rtcConnection.addEventListener("icecandidate", async (event) => {
    console.log(
      signalingClient.agent.name,
      "icecandidate",
      event.type,
      "has candidate",
      !!event.candidate
    );
    if (event.candidate) {
      await signalingClient.sendIceCandidate(agentId, event.candidate);
    }
  });
};

const main = async () => {
  const agentInfoJson = localStorage.getItem("agent");
  if (agentInfoJson) {
    const agent: Agent = JSON.parse(agentInfoJson);

    const agentNameInput = document.querySelector("input#agent-name");
    if (agentNameInput instanceof HTMLInputElement) {
      agentNameInput.value = agent.name;
    }
    const agentIdInput = document.querySelector("input#agent-id");
    if (agentIdInput instanceof HTMLInputElement) {
      agentIdInput.value = agent.id;
    }

    signalingClient = await SignalingClient.connect(
      new URL("ws://localhost:9000"),
      agent
    );
    signalingClient.addSignalingListener(
      SignalingType.Offer,
      async (signalingMessage) => {
        if (signalingMessage.signaling.type !== SignalingType.Offer) {
          console.error("Received an answer as an offer", signalingMessage);
          return;
        }
        const { sender, offer } = signalingMessage.signaling.data;
        console.log("received signaling offer from", sender);
        if (!rtcConnections.has(sender)) {
          const rtcConnection = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
          });
          listenToRtcConnectionEventsFromAgent(rtcConnection, sender);
          const dataChannel = rtcConnection.createDataChannel(sender);
          dataChannel.addEventListener("open", (event) => {
            console.log("datahannel opened with", sender);
          });
          rtcConnections.set(sender, {
            rtc: rtcConnection,
            dataChannel,
            open: false,
          });
          await rtcConnection.setRemoteDescription(offer);
          const answer = await rtcConnection.createAnswer();
          await rtcConnection.setLocalDescription(answer);
          const response = await signalingClient.sendAnswer(sender, answer);
          console.log("sent answer to agent", sender, "response", response);
        }
      }
    );
    signalingClient.addSignalingListener(
      SignalingType.Answer,
      async (signalingMessage) => {
        if (signalingMessage.signaling.type !== SignalingType.Answer) {
          console.error("Received an offer as an answer", signalingMessage);
          return;
        }
        const { sender, answer } = signalingMessage.signaling.data;
        console.log("received signaling answer from", sender);
        const rtcConnection = rtcConnections.get(sender)?.rtc;
        if (!rtcConnection) {
          console.error("Received an answer without an offer from", sender);
          return;
        }
        await rtcConnection.setRemoteDescription(answer);
      }
    );
    signalingClient.addSignalingListener(
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
        const rtcConnection = rtcConnections.get(sender)?.rtc;
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

    getAllAgents();
    getAllAgentsPolling = window.setInterval(getAllAgents, 5000);

    try {
      await announce();
    } catch (error) {
      console.error("Error announcing", error);
    }
  } else {
    console.log("AgentInfo not found in local storage, redirecting...");
    window.location.href = "index.html";
  }
};

main();
