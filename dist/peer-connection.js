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

  // ../p2p-signal/node_modules/ws/browser.js
  var require_browser = __commonJS({
    "../p2p-signal/node_modules/ws/browser.js"(exports, module) {
      "use strict";
      module.exports = function() {
        throw new Error(
          "ws does not work in the browser. Browser clients must use the native WebSocket object"
        );
      };
    }
  });

  // ../p2p-signal/lib/types/message/request.js
  var RequestType;
  (function(RequestType2) {
    RequestType2["Announce"] = "request_announce";
    RequestType2["GetAllAgents"] = "request_get_all_agents";
    RequestType2["SendOffer"] = "request_send_offer";
    RequestType2["SendAnswer"] = "request_send_answer";
    RequestType2["SendIceCandidate"] = "request_send_ice_candidate";
  })(RequestType || (RequestType = {}));

  // ../p2p-signal/lib/types/message/response.js
  var ResponseType;
  (function(ResponseType2) {
    ResponseType2["Announce"] = "response_announce";
    ResponseType2["GetAllAgents"] = "response_get_all_agents";
    ResponseType2["SendOffer"] = "response_send_offer";
    ResponseType2["SendAnswer"] = "response_send_answer";
    ResponseType2["SendIceCandidate"] = "response_send_ice_candidate";
    ResponseType2["Error"] = "response_error";
  })(ResponseType || (ResponseType = {}));

  // ../p2p-signal/lib/types/message/signaling.js
  var SignalingType;
  (function(SignalingType2) {
    SignalingType2["Offer"] = "signaling_offer";
    SignalingType2["Answer"] = "signaling_answer";
    SignalingType2["IceCandidate"] = "signaling_ice_candidate";
  })(SignalingType || (SignalingType = {}));

  // ../p2p-signal/lib/types/message/index.js
  var MessageType;
  (function(MessageType2) {
    MessageType2["Request"] = "request";
    MessageType2["Response"] = "response";
    MessageType2["Signaling"] = "signaling";
  })(MessageType || (MessageType = {}));

  // ../p2p-signal/lib/util.js
  var encodeRequestMessage = (message) => JSON.stringify(message);
  var decodeMessage = (message) => {
    const decodedMessage = JSON.parse(message.toString());
    if (typeof decodedMessage === "object" && decodedMessage !== null && "type" in decodedMessage) {
      return decodedMessage;
    }
    throw new Error(`Unknown message format: ${formatError(decodedMessage)}`);
  };
  var formatError = (object) => JSON.stringify(object, null, 2);

  // ../p2p-signal/lib/client.js
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
          const signalingClient2 = new _SignalingClient(webSocket, agent);
          resolve(signalingClient2);
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

  // ../p2p-signal/lib/server.js
  var import_ws = __toESM(require_browser(), 1);

  // peer-connection.ts
  var signalingClient;
  var getAllAgentsPolling;
  var rtcConnections = /* @__PURE__ */ new Map();
  var announce = async () => {
    await signalingClient.announce();
    const allAgents = await signalingClient.getAllAgents();
    console.log("all agents", allAgents);
  };
  var getAllAgents = async () => {
    const allAgents = await signalingClient.getAllAgents();
    const agentList = document.querySelector("ul#agent-list");
    if (agentList && agentList instanceof HTMLUListElement) {
      agentList.textContent = "";
      allAgents.filter((agent) => agent.id !== signalingClient.agent.id).forEach((agent) => {
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
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
              });
              listenToRtcConnectionEventsFromAgent(rtcConnection, agent.id);
              const dataChannel = rtcConnection.createDataChannel(agent.id);
              dataChannel.addEventListener("open", (event) => {
                console.log("datachannel opened with", agent.id);
              });
              rtcConnections.set(agent.id, {
                rtc: rtcConnection,
                dataChannel,
                open: false
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
  var listenToRtcConnectionEventsFromAgent = (rtcConnection, agentId) => {
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
              iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
            });
            listenToRtcConnectionEventsFromAgent(rtcConnection, sender);
            const dataChannel = rtcConnection.createDataChannel(sender);
            dataChannel.addEventListener("open", (event) => {
              console.log("datahannel opened with", sender);
            });
            rtcConnections.set(sender, {
              rtc: rtcConnection,
              dataChannel,
              open: false
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
      getAllAgentsPolling = window.setInterval(getAllAgents, 5e3);
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
})();
