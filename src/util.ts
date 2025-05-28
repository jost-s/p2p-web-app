import { P2PMessage, P2PMessageType } from "./types/message.js";

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
