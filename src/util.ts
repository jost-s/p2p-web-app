import { Hash, P2PItem } from "p2p-client";
import { AgentId } from "p2p-signaling";
import { Items } from "./types/item.js";
import { P2PMessage, P2PMessageType } from "./types/message.js";
import { Storage } from "./types/storage.js";

export const computeHash = (item: P2PItem) => {
  return (
    item.timestamp +
    item.author +
    item.content.substring(item.content.length - 4)
  );
};

export const makeItem = (author: AgentId, content: string): P2PItem => ({
  author,
  timestamp: Date.now(),
  content,
});

export const storeItems = (items: Items, storage: Storage) => {
  const itemArray = [...items].map(([_, item]) => item);
  const itemArrayJson = JSON.stringify(itemArray);
  storage.setItem("items", itemArrayJson);
};

export const restoreItems = (storage: Storage): Items => {
  const itemArrayJson = storage.getItem("items");
  if (itemArrayJson) {
    const itemArray: P2PItem[] = JSON.parse(itemArrayJson);
    const items: [Hash, P2PItem][] = itemArray.map((item) => [
      computeHash(item),
      item,
    ]);
    return new Map(items);
  }
  return new Map();
};

export const encodeP2pMessage = (message: P2PMessage) =>
  JSON.stringify(message);

export const decodeP2pMessage = (message: any) => {
  const decodedMessage: P2PMessage = JSON.parse(message.toString());
  if (
    typeof decodedMessage === "object" &&
    decodedMessage !== null &&
    "type" in decodedMessage &&
    Object.values(P2PMessageType).some((type) => decodedMessage.type === type)
  ) {
    return decodedMessage;
  }
  throw new Error(`Unknown message format: ${formatError(decodedMessage)}`);
};

export const formatError = (object: object) => JSON.stringify(object, null, 2);
