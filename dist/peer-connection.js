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

  // ../p2p-client/node_modules/@roamhq/wrtc/lib/browser.js
  var require_browser2 = __commonJS({
    "../p2p-client/node_modules/@roamhq/wrtc/lib/browser.js"(exports) {
      "use strict";
      exports.MediaStream = window.MediaStream;
      exports.MediaStreamTrack = window.MediaStreamTrack;
      exports.RTCDataChannel = window.RTCDataChannel;
      exports.RTCDataChannelEvent = window.RTCDataChannelEvent;
      exports.RTCDtlsTransport = window.RTCDtlsTransport;
      exports.RTCIceCandidate = window.RTCIceCandidate;
      exports.RTCIceTransport = window.RTCIceTransport;
      exports.RTCPeerConnection = window.RTCPeerConnection;
      exports.RTCPeerConnectionIceEvent = window.RTCPeerConnectionIceEvent;
      exports.RTCRtpReceiver = window.RTCRtpReceiver;
      exports.RTCRtpSender = window.RTCRtpSender;
      exports.RTCRtpTransceiver = window.RTCRtpTransceiver;
      exports.RTCSctpTransport = window.RTCSctpTransport;
      exports.RTCSessionDescription = window.RTCSessionDescription;
      exports.getUserMedia = window.getUserMedia;
      exports.mediaDevices = navigator.mediaDevices;
    }
  });

  // ../p2p-client/lib/types/message.js
  var P2PMessageType;
  (function(P2PMessageType3) {
    P2PMessageType3["Push"] = "p2p_push";
    P2PMessageType3["Fetch"] = "p2p_fetch";
  })(P2PMessageType || (P2PMessageType = {}));

  // ../p2p-client/lib/types/fetch.js
  var FetchMessageType;
  (function(FetchMessageType2) {
    FetchMessageType2["Request"] = "fetch_initiate";
    FetchMessageType2["Respond"] = "fetch_respond";
  })(FetchMessageType || (FetchMessageType = {}));

  // ../p2p-client/lib/util.js
  var computeHash = (item) => item.author + item.timestamp + item.content;

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
  var EXPIRY_MS = 1e3 * 30;
  var SignalingClient = class _SignalingClient {
    constructor(ws, agent) {
      this.messageListener = (event) => {
        let message;
        try {
          message = decodeMessage(event.data);
        } catch (error) {
          console.error(error);
          console.error(event.data);
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
      this.agent.expiry = Date.now() + EXPIRY_MS;
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
  var MAX_EXPIRY_MS = 1e3 * 60 * 5;

  // ../p2p-client/lib/connection.js
  var Peer = class {
    constructor(transport) {
      this.transport = transport;
    }
    push(items) {
      const message = {
        type: P2PMessageType.Push,
        data: { items }
      };
      this.transport.send(message);
    }
  };

  // ../p2p-client/lib/transport.js
  var encodeP2pMessage = (message) => JSON.stringify(message);
  var decodeP2pMessage = (message) => JSON.parse(message);
  var P2PTransport = class {
    constructor(dataChannel) {
      this.dataChannel = dataChannel;
    }
    setMessageListener(callback) {
      this.dataChannel.addEventListener("message", (event) => {
        const message = event.data;
        callback(message);
      });
    }
    send(message) {
      const encodedMessage = JSON.stringify(message);
      this.dataChannel.send(encodedMessage);
    }
  };

  // ../p2p-client/lib/p2p-client.js
  var ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];
  var P2PClient = class _P2PClient {
    constructor(signalingClient, agent) {
      this.agent = agent;
      this.signalingClient = signalingClient;
      this.p2pMessageListeners = /* @__PURE__ */ new Map();
      this.rtcConnections = /* @__PURE__ */ new Map();
      this.items = /* @__PURE__ */ new Map();
    }
    static async connect(url, agent) {
      const signalingClient = await SignalingClient.connect(url, agent);
      const p2pClient2 = new _P2PClient(signalingClient, agent);
      p2pClient2.listenToSignalingEvents();
      return p2pClient2;
    }
    async announce() {
      return this.signalingClient.announce();
    }
    async getAllPeers() {
      const allAgents = await this.signalingClient.getAllAgents();
      const peers = allAgents.filter((agent) => agent.id !== this.agent.id);
      return peers;
    }
    setP2pMessageListener(type, listener) {
      this.p2pMessageListeners.set(type, listener);
    }
    async pushToAgent(agentId, items) {
      let existingConnection = this.rtcConnections.get(agentId);
      if (!existingConnection) {
        existingConnection = await this.createConnectionForAgent(agentId);
      }
      let dataChannel = existingConnection.dataChannel;
      if (!dataChannel) {
        dataChannel = await existingConnection.rtc.createDataChannel(agentId);
        existingConnection.dataChannel = dataChannel;
      }
      const dataChannelOpened = new Promise((resolve, reject) => {
        dataChannel.addEventListener("open", (event) => {
          console.info("datachannel opened with", agentId);
          const conn = this.rtcConnections.get(agentId);
          if (conn) {
            conn.open = true;
          }
          resolve();
        });
        dataChannel.addEventListener("error", (event) => {
          console.info("error when opening datachannel with agent", agentId, event.error);
          const conn = this.rtcConnections.get(agentId);
          if (conn) {
            conn.dataChannel = null;
          }
          reject(event.error);
        });
      });
      const offer = await existingConnection.rtc.createOffer();
      await existingConnection.rtc.setLocalDescription(offer);
      await this.signalingClient.sendOffer(agentId, offer);
      await dataChannelOpened;
      dataChannel.addEventListener("close", (event) => {
        console.info("datachannel closed with", agentId);
        const conn = this.rtcConnections.get(agentId);
        if (conn) {
          conn.dataChannel = null;
          conn.open = false;
        }
      });
      const transport = new P2PTransport(dataChannel);
      const connection = new Peer(transport);
      connection.push(items);
      await new Promise((resolve) => setTimeout(resolve, 100));
      dataChannel.close();
      existingConnection.rtc.close();
      this.rtcConnections.delete(agentId);
    }
    async createConnectionForAgent(agentId) {
      let rtcConnection;
      if (globalThis.RTCPeerConnection) {
        rtcConnection = new globalThis.RTCPeerConnection({
          iceServers: ICE_SERVERS
        });
      } else {
        const wrtc = await Promise.resolve().then(() => __toESM(require_browser2(), 1));
        rtcConnection = new wrtc.RTCPeerConnection({ iceServers: ICE_SERVERS });
      }
      const connection = {
        rtc: rtcConnection,
        dataChannel: null,
        open: false
      };
      this.rtcConnections.set(agentId, connection);
      this.listenToRtcConnectionEventsFromAgent(rtcConnection, agentId);
      return connection;
    }
    listenForP2pMessage(dataChannel) {
      dataChannel.addEventListener("message", (event) => {
        const message = decodeP2pMessage(event.data);
        console.log("received p2p message", message);
        if (message.type === P2PMessageType.Push) {
          const items = message.data.items;
          items.forEach((item) => {
            const hash = computeHash(item);
            if (!this.items.has(hash)) {
              this.items.set(hash, item);
            }
          });
        } else if (message.type === P2PMessageType.Fetch) {
          if (message.data.type === FetchMessageType.Request) {
            const { lastSync } = message.data.data;
            const allItems = Array.from(this.items.values());
            const items = lastSync ? allItems.filter((item) => item.timestamp > lastSync) : allItems;
            const response = {
              type: P2PMessageType.Fetch,
              data: {
                type: FetchMessageType.Respond,
                data: {
                  lastSync: performance.now(),
                  items
                }
              }
            };
            dataChannel.send(encodeP2pMessage(response));
          } else if (message.data.type === FetchMessageType.Respond) {
            const items = message.data.data.items;
            items.forEach((item) => {
              const hash = computeHash(item);
              if (!this.items.has(hash)) {
                this.items.set(hash, item);
              }
            });
          } else {
            console.error("Unknown Sync message type", message);
          }
        } else {
          console.error("Unknown Sync message", message);
        }
        const listener = this.p2pMessageListeners.get(message.type);
        if (listener) {
          listener(message);
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
          const connection = await this.createConnectionForAgent(sender);
          connection.rtc.addEventListener("datachannel", (event) => {
            console.debug("datachannel opened with", sender);
            const dataChannel = event.channel;
            this.listenForP2pMessage(dataChannel);
            dataChannel.addEventListener("close", (event2) => {
              console.debug("datachannel closed with", sender);
              const conn2 = this.rtcConnections.get(sender);
              if (conn2) {
                conn2.dataChannel = null;
                conn2.open = false;
              }
            });
            const conn = this.rtcConnections.get(sender);
            if (conn) {
              conn.dataChannel = dataChannel;
              conn.open = true;
            }
          });
          await connection.rtc.setRemoteDescription(offer);
          const answer = await connection.rtc.createAnswer();
          await connection.rtc.setLocalDescription(answer);
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
        if (rtcConnection.connectionState === "disconnected" || rtcConnection.connectionState === "closed") {
          this.rtcConnections.delete(agentId);
        }
      });
      rtcConnection.addEventListener("icecandidate", async (event) => {
        if (event.candidate) {
          await this.signalingClient.sendIceCandidate(agentId, event.candidate);
        }
      });
    }
  };

  // src/util.ts
  var computeHash2 = (item) => {
    return item.timestamp + item.author + item.content.substring(item.content.length - 4);
  };
  var makeItem = (author, content) => ({
    author,
    timestamp: Date.now(),
    content
  });
  var storeItems = (items, storage) => {
    const itemArray = [...items].map(([_, item]) => item);
    const itemArrayJson = JSON.stringify(itemArray);
    storage.setItem("items", itemArrayJson);
  };
  var restoreItems = (storage) => {
    const itemArrayJson = storage.getItem("items");
    if (itemArrayJson) {
      const itemArray = JSON.parse(itemArrayJson);
      const items = itemArray.map((item) => [
        computeHash2(item),
        item
      ]);
      return new Map(items);
    }
    return /* @__PURE__ */ new Map();
  };

  // src/peer-connection.ts
  var AGENT_EXPIRY_MS = 1e3 * 30;
  var p2pClient;
  var renderAgentList = async () => {
    const peers = await p2pClient.getAllPeers();
    const agentList = document.querySelector("ul#agent-list");
    if (peers.length > 0 && agentList instanceof HTMLUListElement) {
      agentList.textContent = "";
      peers.forEach((agent) => {
        const listItem = document.createElement("li");
        const clientLabel = document.createElement("label");
        clientLabel.textContent = `Name: ${agent.name} ID: ${agent.id}`;
        listItem.appendChild(clientLabel);
        agentList.appendChild(listItem);
      });
    }
  };
  var onMessagePublish = async (event) => {
    event.preventDefault();
    const messageInput = document.querySelector(
      "form[name='new-message'] > input"
    );
    if (messageInput instanceof HTMLInputElement) {
      if (messageInput.value) {
        const item = makeItem(p2pClient.agent.id, messageInput.value);
        console.log("new message published", item);
        p2pClient.items.set(computeHash2(item), item);
        storeItems(p2pClient.items, localStorage);
        messageInput.value = "";
        renderMessageList();
        const peers = await p2pClient.getAllPeers();
        await Promise.all(
          peers.map((peer) => p2pClient.pushToAgent(peer.id, [item]))
        );
      }
    }
  };
  var onIncomingPushMessage = (message) => {
    if (message.type === P2PMessageType.Push) {
      console.debug("incoming push message", message);
      storeItems(p2pClient.items, localStorage);
      renderMessageList();
    }
  };
  var onIncomingFetchMessage = (message) => {
    if (message.type === P2PMessageType.Fetch) {
      if (message.data.type === FetchMessageType.Respond) {
        storeItems(p2pClient.items, localStorage);
        renderMessageList();
      }
    }
  };
  var renderMessageList = async () => {
    const messageList = document.querySelector("ul#message-list");
    if (p2pClient.items.size > 0 && messageList instanceof HTMLUListElement) {
      messageList.textContent = "";
      const itemsSorted = [...p2pClient.items].map(([_, item]) => item).sort((a, b) => b.timestamp - a.timestamp);
      itemsSorted.forEach((message) => {
        const listItem = document.createElement("li");
        const clientLabel = document.createElement("label");
        clientLabel.textContent = `When: ${message.timestamp} | From: ${message.author} | Content: ${message.content}`;
        listItem.appendChild(clientLabel);
        messageList.appendChild(listItem);
      });
    }
  };
  var main = async () => {
    const agentInfoJson = localStorage.getItem("agent");
    if (agentInfoJson) {
      const newMessageForm = document.querySelector("form[name='new-message']");
      if (newMessageForm instanceof HTMLFormElement) {
        newMessageForm.addEventListener("submit", onMessagePublish);
      }
      const agent = JSON.parse(agentInfoJson);
      agent.expiry = Date.now() + AGENT_EXPIRY_MS;
      const agentNameInput = document.querySelector("input#agent-name");
      if (agentNameInput instanceof HTMLInputElement) {
        agentNameInput.value = agent.name;
      }
      const agentIdInput = document.querySelector("input#agent-id");
      if (agentIdInput instanceof HTMLInputElement) {
        agentIdInput.value = agent.id;
      }
      const url = new URL("wss://p2p-signaling-server.jost-schulte.workers.dev/");
      p2pClient = await P2PClient.connect(url, agent);
      p2pClient.setP2pMessageListener(P2PMessageType.Push, onIncomingPushMessage);
      p2pClient.setP2pMessageListener(
        P2PMessageType.Fetch,
        onIncomingFetchMessage
      );
      p2pClient.items = restoreItems(localStorage);
      renderMessageList();
      try {
        await p2pClient.announce();
        window.setInterval(p2pClient.announce.bind(p2pClient), 1e4);
        await renderAgentList();
        window.setInterval(renderAgentList, 5e3);
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
