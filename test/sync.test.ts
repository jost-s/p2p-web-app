import { assert, test } from "vitest";
import { P2PItem } from "../src/item.js";
import { SyncMessageType } from "../src/sync.js";
import { P2PMessage, P2PMessageType } from "../src/transport.js";
import { sleep } from "./util.js";

interface TestItem extends P2PItem {
  content: string;
}

const makeItem = (content: string, timestamp: number): TestItem => ({
  content,
  timestamp,
  computeHash: () => content,
});

class P2PTestConnection {
  remote: P2PTestConnection;
  items: Map<string, P2PItem>;

  constructor() {
    this.items = new Map();
  }

  setRemote(remote: P2PTestConnection) {
    this.remote = remote;
  }

  onMessage(message: P2PMessage) {
    if (message.type === P2PMessageType.Sync) {
      if (message.data.type === SyncMessageType.Initiate) {
        const { last_sync } = message.data.data;
        const allItems = Array.from(this.items.values());
        const items = last_sync
          ? allItems.filter((item) => item.timestamp > last_sync)
          : allItems;
        const response: P2PMessage = {
          type: P2PMessageType.Sync,
          data: {
            type: SyncMessageType.Respond,
            data: {
              last_sync: performance.now(),
              items,
            },
          },
        };
        this.send(response);
      } else if (message.data.type === SyncMessageType.Respond) {
        const items = message.data.data.items;
        items.forEach((item) => {
          const hash = item.computeHash();
          if (!this.items.has(hash)) {
            this.items.set(hash, item);
          }
        });
      }
    }
  }

  async send(message: P2PMessage) {
    console.log("sending message", message);
    this.remote.onMessage(message);
  }
}

test("Sync with a peer", async () => {
  const alice = new P2PTestConnection();
  const bob = new P2PTestConnection();
  alice.setRemote(bob);
  bob.setRemote(alice);

  const testItem = makeItem("test", 0);
  bob.items = new Map([[testItem.computeHash(), testItem]]);
  assert.deepEqual(alice.items, new Map());

  await alice.send({
    type: P2PMessageType.Sync,
    data: { type: SyncMessageType.Initiate, data: { last_sync: null } },
  });

  const now = performance.now();
  const timeout = 100;
  while (performance.now() - now <= timeout) {
    if (alice.items.size === 1) {
      break;
    }
    await sleep(10);
  }
  if (performance.now() - now > timeout) {
    assert.fail("timed out");
  }
});

test("Last sync timestamp is respected", async () => {
  const alice = new P2PTestConnection();
  const bob = new P2PTestConnection();
  alice.setRemote(bob);
  bob.setRemote(alice);

  const last_sync = performance.now() - 100;
  const includedItem = makeItem("include", last_sync + 10);
  const excludedItem = makeItem("exclude", last_sync - 10);
  bob.items = new Map([
    [includedItem.computeHash(), includedItem],
    [excludedItem.computeHash(), excludedItem],
  ]);
  assert.deepEqual(alice.items, new Map());

  await alice.send({
    type: P2PMessageType.Sync,
    data: { type: SyncMessageType.Initiate, data: { last_sync } },
  });

  await sleep(100);

  assert.deepEqual(
    alice.items,
    new Map([[includedItem.computeHash(), includedItem]])
  );
});

test("Duplicate items are filtered", async () => {
  const alice = new P2PTestConnection();
  const bob = new P2PTestConnection();
  alice.setRemote(bob);
  bob.setRemote(alice);

  const existingItem = makeItem("existing", 0);
  const newItem = makeItem("new", 0);
  bob.items = new Map([
    [existingItem.computeHash(), existingItem],
    [newItem.computeHash(), newItem],
  ]);
  alice.items = new Map([[existingItem.computeHash(), existingItem]]);

  await alice.send({
    type: P2PMessageType.Sync,
    data: { type: SyncMessageType.Initiate, data: { last_sync: null } },
  });

  await sleep(100);

  assert(alice.items.size === 2);
  assert.deepEqual(
    alice.items,
    new Map([
      [existingItem.computeHash(), existingItem],
      [newItem.computeHash(), newItem],
    ])
  );
});
