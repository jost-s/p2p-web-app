import { type Agent } from "p2p-signaling";
import { P2PClient } from "p2p-client";

let p2pClient: P2PClient;
let getAllAgentsPolling: number;

const renderAgentList = async () => {
  const allAgents = await p2pClient.getAllAgents();
  const agentList = document.querySelector("ul#agent-list");
  if (agentList && agentList instanceof HTMLUListElement) {
    agentList.textContent = "";
    allAgents
      .filter((agent) => agent.id !== p2pClient.agent.id)
      .forEach((agent) => {
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

    const url = new URL(
      "wss://websocket-hibernation-server.jost-schulte.workers.dev/"
    );
    p2pClient = await P2PClient.connect(url, agent);

    try {
      await p2pClient.announce();
      await renderAgentList();
      getAllAgentsPolling = window.setInterval(renderAgentList, 5000);
    } catch (error) {
      console.error("Error announcing", error);
    }
  } else {
    console.log("AgentInfo not found in local storage, redirecting...");
    window.location.href = "index.html";
  }
};

main();
