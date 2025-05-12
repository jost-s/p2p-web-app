import { SignalingClient } from "p2p-signal";
import type { Agent, ResponseGetAllAgents } from "p2p-signal";

let signalingClient: SignalingClient;
let getAllAgentsPolling: number;

const announce = async (agent: Agent) => {
  const response = await signalingClient.announce(agent);
  console.log("announced", response);
  const allAgents = await signalingClient.getAllAgents();
  console.log("all agents", allAgents);
};

const getAllAgents = async () => {
  const allAgents = await signalingClient.getAllAgents();
  const agentList = document.querySelector("ul#agent-list");
  if (agentList && agentList instanceof HTMLUListElement) {
    agentList.textContent = "";
    allAgents.forEach((agent) => {
      const listItem = document.createElement("li");
      listItem.textContent = agent.id;
      agentList.appendChild(listItem);
    });
  }
};

const main = async () => {
  const agentInfoJson = localStorage.getItem("agentInfo");
  if (agentInfoJson) {
    signalingClient = await SignalingClient.connect(
      new URL("ws://localhost:9000")
    );

    getAllAgents();
    getAllAgentsPolling = window.setInterval(getAllAgents, 5000);

    const agentInfo = JSON.parse(agentInfoJson);
    try {
      const response = await announce(agentInfo);
    } catch (error) {
      console.log("Error announcing", error);
    }
  } else {
    console.log("AgentInfo not found in local storage, redirecting...");
    window.location.href = "index.html";
  }
};

main();
