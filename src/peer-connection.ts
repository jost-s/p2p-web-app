import {
  FetchMessageType,
  P2PClient,
  P2PMessage,
  P2PMessageType,
} from "p2p-client";
import { type Agent } from "p2p-signaling";
import { computeHash, makeItem, restoreItems, storeItems } from "./util.js";

const AGENT_EXPIRY_MS = 1000 * 30;

let p2pClient: P2PClient;

const renderAgentList = async () => {
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

const onMessagePublish = async (event: SubmitEvent) => {
  event.preventDefault();
  const messageInput = document.querySelector(
    "form[name='new-message'] > input"
  );
  if (messageInput instanceof HTMLInputElement) {
    if (messageInput.value) {
      const item = makeItem(p2pClient.agent.id, messageInput.value);
      console.log("new message published", item);

      // Add to item map and store in storage.
      p2pClient.items.set(computeHash(item), item);
      storeItems(p2pClient.items, localStorage);

      messageInput.value = "";
      renderMessageList();

      // Push to available peers.
      const peers = await p2pClient.getAllPeers();
      await Promise.all(
        peers.map((peer) => p2pClient.pushToAgent(peer.id, [item]))
      );
    }
  }
};

const onIncomingPushMessage = (message: P2PMessage) => {
  if (message.type === P2PMessageType.Push) {
    console.debug("incoming push message", message);
    storeItems(p2pClient.items, localStorage);
    renderMessageList();
  }
};

const onIncomingFetchMessage = (message: P2PMessage) => {
  if (message.type === P2PMessageType.Fetch) {
    if (message.data.type === FetchMessageType.Respond) {
      storeItems(p2pClient.items, localStorage);
      renderMessageList();
    }
  }
};

const renderMessageList = async () => {
  const messageList = document.querySelector("ul#message-list");
  if (p2pClient.items.size > 0 && messageList instanceof HTMLUListElement) {
    messageList.textContent = "";
    const itemsSorted = [...p2pClient.items]
      .map(([_, item]) => item)
      .sort((a, b) => b.timestamp - a.timestamp);
    itemsSorted.forEach((message) => {
      const listItem = document.createElement("li");
      const clientLabel = document.createElement("label");
      clientLabel.textContent = `When: ${message.timestamp} | From: ${message.author} | Content: ${message.content}`;
      listItem.appendChild(clientLabel);
      messageList.appendChild(listItem);
    });
  }
};

const main = async () => {
  const agentInfoJson = localStorage.getItem("agent");
  if (agentInfoJson) {
    // Register new message callback.
    const newMessageForm = document.querySelector("form[name='new-message']");
    if (newMessageForm instanceof HTMLFormElement) {
      newMessageForm.addEventListener("submit", onMessagePublish);
    }

    // Connect client to signaling service.
    const agent: Agent = JSON.parse(agentInfoJson);
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
    // const url = new URL("ws://localhost:8787/");
    p2pClient = await P2PClient.connect(url, agent);
    p2pClient.setP2pMessageListener(P2PMessageType.Push, onIncomingPushMessage);
    p2pClient.setP2pMessageListener(
      P2PMessageType.Fetch,
      onIncomingFetchMessage
    );

    // Get messages from local storage.
    p2pClient.items = restoreItems(localStorage);
    renderMessageList();

    try {
      // Announce agent every 10 seconds.
      await p2pClient.announce();
      window.setInterval(p2pClient.announce.bind(p2pClient), 10_000);

      // Get all agents every 5 seconds.
      await renderAgentList();
      window.setInterval(renderAgentList, 5000);
    } catch (error) {
      console.error("Error announcing", error);
    }
  } else {
    console.log("AgentInfo not found in local storage, redirecting...");
    window.location.href = "index.html";
  }
};

main();
