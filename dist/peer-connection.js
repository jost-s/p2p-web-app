(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // ../p2p-signaling/node_modules/ws/browser.js
  var require_browser = __commonJS({
    "../p2p-signaling/node_modules/ws/browser.js"(exports, module) {
      "use strict";
      module.exports = function() {
        throw new Error(
          "ws does not work in the browser. Browser clients must use the native WebSocket object"
        );
      };
    }
  });

  // ../p2p-signaling/lib/types/message/request.js
  var RequestType;
  (function(RequestType2) {
    RequestType2["Announce"] = "request_announce";
    RequestType2["GetAllAgents"] = "request_get_all_agents";
    RequestType2["SendOffer"] = "request_send_offer";
    RequestType2["SendAnswer"] = "request_send_answer";
    RequestType2["SendIceCandidate"] = "request_send_ice_candidate";
  })(RequestType || (RequestType = {}));

  // ../p2p-signaling/lib/types/message/response.js
  var ResponseType;
  (function(ResponseType2) {
    ResponseType2["Announce"] = "response_announce";
    ResponseType2["GetAllAgents"] = "response_get_all_agents";
    ResponseType2["SendOffer"] = "response_send_offer";
    ResponseType2["SendAnswer"] = "response_send_answer";
    ResponseType2["SendIceCandidate"] = "response_send_ice_candidate";
    ResponseType2["Error"] = "response_error";
  })(ResponseType || (ResponseType = {}));

  // ../p2p-signaling/lib/types/message/signaling.js
  var SignalingType;
  (function(SignalingType2) {
    SignalingType2["Offer"] = "signaling_offer";
    SignalingType2["Answer"] = "signaling_answer";
    SignalingType2["IceCandidate"] = "signaling_ice_candidate";
  })(SignalingType || (SignalingType = {}));

  // ../p2p-signaling/lib/types/message/index.js
  var MessageType;
  (function(MessageType2) {
    MessageType2["Request"] = "request";
    MessageType2["Response"] = "response";
    MessageType2["Signaling"] = "signaling";
  })(MessageType || (MessageType = {}));

  // ../p2p-signaling/lib/util.js
  var encodeRequestMessage = (message) => JSON.stringify(message);
  var decodeMessage = (message) => {
    const decodedMessage = JSON.parse(message.toString());
    if (typeof decodedMessage === "object" && decodedMessage !== null && "type" in decodedMessage) {
      return decodedMessage;
    }
    throw new Error(`Unknown message format: ${formatError(decodedMessage)}`);
  };
  var formatError = (object) => JSON.stringify(object, null, 2);

  // ../p2p-signaling/lib/client.js
  var SignalingClient = class _SignalingClient {
    constructor(ws, agent) {
      this.messageListener = (event) => {
        let message;
        try {
          message = decodeMessage(event.data);
        } catch (error) {
          console.error(error);
          return;
        }
        if (message.type === MessageType.Response) {
          console.log("Incoming response", message);
          this.handleResponse(message);
        } else if (message.type === MessageType.Signaling) {
          console.log("Incoming signaling", message);
          this.handleSignaling(message);
        } else {
          console.error("Incoming message of unknown format:", formatError(message));
        }
      };
      this.webSocket = ws;
      this.webSocket.addEventListener("message", this.messageListener);
      this.agent = agent;
      this.requestIndex = 0;
      this.requests = /* @__PURE__ */ new Map();
      this.signalingListeners = /* @__PURE__ */ new Map();
    }
    static async connect(url, agent) {
      return new Promise((resolve, reject) => {
        const webSocket = new WebSocket(url);
        const connectionErrorHandler = (event) => {
          console.log("Error connecting signaling client:", event);
          reject(event);
        };
        webSocket.addEventListener("open", () => {
          webSocket.removeEventListener("error", connectionErrorHandler);
          console.log("Signaling client connected to", webSocket.url);
          const signalingClient = new _SignalingClient(webSocket, agent);
          resolve(signalingClient);
        }, { once: true });
        webSocket.addEventListener("error", connectionErrorHandler, {
          once: true
        });
      });
    }
    handleResponse(message) {
      const pendingRequest = this.requests.get(message.id);
      if (pendingRequest) {
        pendingRequest.resolve(message.response);
        this.requests.delete(message.id);
      } else {
        console.error(`Received response to an unknown request: ${formatError(message)}`);
      }
    }
    handleSignaling(message) {
      const signalingListener = this.signalingListeners.get(message.signaling.type);
      if (signalingListener) {
        signalingListener(message);
      }
    }
    request(request) {
      const requestMessage = {
        type: MessageType.Request,
        id: this.requestIndex,
        request
      };
      return new Promise((resolve, reject) => {
        if (this.webSocket.readyState !== this.webSocket.OPEN) {
          return reject("WebSocket not open");
        }
        this.webSocket.send(encodeRequestMessage(requestMessage));
        this.requests.set(this.requestIndex, { resolve, reject });
        this.requestIndex++;
      });
    }
    async announce() {
      const request = {
        type: RequestType.Announce,
        data: this.agent
      };
      const response = await this.request(request);
      if (response.type === ResponseType.Announce && response.data === null) {
        return Promise.resolve(response.data);
      } else {
        return Promise.reject(`Received unexpected response: ${formatError(response)}`);
      }
    }
    async getAllAgents() {
      const request = {
        type: RequestType.GetAllAgents,
        data: null
      };
      const response = await this.request(request);
      if (response.type === ResponseType.GetAllAgents && Array.isArray(response.data)) {
        return Promise.resolve(response.data);
      } else {
        return Promise.reject("Received unexpected response");
      }
    }
    addSignalingListener(type, listener) {
      this.signalingListeners.set(type, listener);
    }
    async sendOffer(receiver, offer) {
      const request = {
        type: RequestType.SendOffer,
        data: {
          type: SignalingType.Offer,
          data: {
            sender: this.agent.id,
            receiver,
            offer
          }
        }
      };
      const response = await this.request(request);
      if (response.type === ResponseType.SendOffer && response.data === null) {
        return Promise.resolve(response.data);
      } else {
        return Promise.reject("Received unexpected response");
      }
    }
    async sendAnswer(receiver, answer) {
      const request = {
        type: RequestType.SendAnswer,
        data: {
          type: SignalingType.Answer,
          data: {
            sender: this.agent.id,
            receiver,
            answer
          }
        }
      };
      const response = await this.request(request);
      if (response.type === ResponseType.SendAnswer && response.data === null) {
        return Promise.resolve(response.data);
      } else {
        return Promise.reject("Received unexpected response");
      }
    }
    async sendIceCandidate(receiver, iceCandidate) {
      const request = {
        type: RequestType.SendIceCandidate,
        data: {
          type: SignalingType.IceCandidate,
          data: {
            sender: this.agent.id,
            receiver,
            iceCandidate
          }
        }
      };
      const response = await this.request(request);
      if (response.type === ResponseType.SendIceCandidate && response.data === null) {
        return Promise.resolve(response.data);
      } else {
        return Promise.reject("Received unexpected response");
      }
    }
    async close() {
      return new Promise((resolve) => {
        this.webSocket.addEventListener("close", (event) => {
          console.log("Signaling client closed:", event.code, event.reason);
          resolve();
        }, { once: true });
        this.webSocket.close();
      });
    }
  };

  // ../p2p-signaling/lib/server.js
  var import_ws = __toESM(require_browser(), 1);

  // ../p2p-client/lib/p2p-client.js
  var ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];
  var P2PClient = class _P2PClient {
    constructor(signalingClient, agent) {
      this.agent = agent;
      this.rtcConnections = /* @__PURE__ */ new Map();
      this.signalingClient = signalingClient;
    }
    static async connect(agent) {
      const signalingClient = await SignalingClient.connect(new URL("ws://localhost:9000"), agent);
      const p2pClient2 = new _P2PClient(signalingClient, agent);
      p2pClient2.listenToSignalingEvents();
      return p2pClient2;
    }
    announce() {
      return this.signalingClient.announce();
    }
    getAllAgents() {
      return this.signalingClient.getAllAgents();
    }
    getConnectionWithAgent(agentId) {
      return this.rtcConnections.get(agentId);
    }
    async initiateConnectionWithAgent(agentId) {
      const rtcConnection = this.createConnectionForAgent(agentId);
      const dataChannel = rtcConnection.createDataChannel(agentId);
      dataChannel.addEventListener("open", async (event) => {
        console.info("datachannel opened with", agentId);
        this.rtcConnections.set(agentId, {
          rtc: rtcConnection,
          dataChannel,
          open: true
        });
        this.sync(dataChannel);
      });
      const offer = await rtcConnection.createOffer();
      await rtcConnection.setLocalDescription(offer);
      await this.signalingClient.sendOffer(agentId, offer);
    }
    createConnectionForAgent(agentId) {
      const rtcConnection = new RTCPeerConnection({
        iceServers: ICE_SERVERS
      });
      this.listenToRtcConnectionEventsFromAgent(rtcConnection, agentId);
      this.rtcConnections.set(agentId, {
        rtc: rtcConnection,
        dataChannel: null,
        open: false
      });
      return rtcConnection;
    }
    async sync(dataChannel) {
      dataChannel.addEventListener("message", async (event) => {
        console.log("incoming message", event.data);
      });
      dataChannel.send("init sync");
    }
    async listenForSyncMessages(dataChannel) {
      dataChannel.addEventListener("message", async (event) => {
        console.log("incoming message", event.data);
        if (event.data === "init sync") {
          dataChannel.send("alright, here's what's new");
        }
      });
    }
    listenToSignalingEvents() {
      this.signalingClient.addSignalingListener(SignalingType.Offer, async (signalingMessage) => {
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
              open: true
            });
            this.listenForSyncMessages(dataChannel);
          });
          await rtcConnection.setRemoteDescription(offer);
          const answer = await rtcConnection.createAnswer();
          await rtcConnection.setLocalDescription(answer);
          const response = await this.signalingClient.sendAnswer(sender, answer);
          console.debug("sent answer to agent", sender, "response", response);
        }
      });
      this.signalingClient.addSignalingListener(SignalingType.Answer, async (signalingMessage) => {
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
      });
      this.signalingClient.addSignalingListener(SignalingType.IceCandidate, async (signalingMessage) => {
        if (signalingMessage.signaling.type !== SignalingType.IceCandidate) {
          console.error("Received an ICE candidate as something else", signalingMessage);
          return;
        }
        const { sender, iceCandidate } = signalingMessage.signaling.data;
        console.debug("received signaling ice candidate from", sender);
        const rtcConnection = this.rtcConnections.get(sender)?.rtc;
        if (!rtcConnection) {
          console.error("Received an ICE candidate without offer or answer from", sender);
          return;
        }
        await rtcConnection.addIceCandidate(iceCandidate);
      });
    }
    listenToRtcConnectionEventsFromAgent(rtcConnection, agentId) {
      rtcConnection.addEventListener("connectionstatechange", (event) => {
        console.debug(this.signalingClient.agent.name, "connectionstatechanged", event.type, rtcConnection.connectionState);
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
  };

  // src/peer-connection.ts
  var p2pClient;
  var getAllAgentsPolling;
  var renderAgentList = async () => {
    const allAgents = await p2pClient.getAllAgents();
    const agentList = document.querySelector("ul#agent-list");
    if (agentList && agentList instanceof HTMLUListElement) {
      agentList.textContent = "";
      allAgents.filter((agent) => agent.id !== p2pClient.agent.id).forEach((agent) => {
        const listItem = document.createElement("li");
        const clientLabel = document.createElement("label");
        clientLabel.textContent = `Name: ${agent.name} ID: ${agent.id}`;
        listItem.appendChild(clientLabel);
        const conn = p2pClient.getConnectionWithAgent(agent.id);
        if (conn) {
          if (conn.open) {
            const connectedIndicator = document.createElement("div");
            connectedIndicator.classList.add("green-circle");
            listItem.appendChild(connectedIndicator);
          }
        } else {
          const connectButton = document.createElement("button");
          connectButton.textContent = "Connect";
          connectButton.addEventListener("click", async (_event) => {
            console.log("connect button clicked", agent.id);
            await p2pClient.initiateConnectionWithAgent(agent.id);
          });
          listItem.appendChild(connectButton);
        }
        agentList.appendChild(listItem);
      });
    }
  };
  var main = async () => {
    const agentInfoJson = localStorage.getItem("agent");
    if (agentInfoJson) {
      const agent = JSON.parse(agentInfoJson);
      const agentNameInput = document.querySelector("input#agent-name");
      if (agentNameInput instanceof HTMLInputElement) {
        agentNameInput.value = agent.name;
      }
      const agentIdInput = document.querySelector("input#agent-id");
      if (agentIdInput instanceof HTMLInputElement) {
        agentIdInput.value = agent.id;
      }
      p2pClient = await P2PClient.connect(agent);
      try {
        await p2pClient.announce();
        await renderAgentList();
        getAllAgentsPolling = window.setInterval(renderAgentList, 5e3);
      } catch (error) {
        console.error("Error announcing", error);
      }
    } else {
      console.log("AgentInfo not found in local storage, redirecting...");
      window.location.href = "index.html";
    }
  };
  main();
})();
