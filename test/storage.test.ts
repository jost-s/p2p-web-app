import { test, assert } from "vitest";
import { makeItem, restoreItems, storeItems } from "../src/util.js";
import { computeHash, Items } from "../src/types/item.js";
import { Storage } from "../src/types/storage.js";

class TestStorage implements Storage {
  private readonly store: Map<string, string>;

  constructor() {
    this.store = new Map();
  }

  getItem(key: string) {
    const value = this.store.get(key);
    return value ?? null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

test("Can store and restore items", () => {
  const alice = "alice";
  const bob = "bob";
  const item1 = makeItem(alice, "test-message");
  const item2 = makeItem(bob, "test-message-bob");
  const items: Items = new Map([
    [computeHash(item1), item1],
    [computeHash(item2), item2],
  ]);

  const storage = new TestStorage();
  storeItems(items, storage);

  const restoredItems = restoreItems(storage);
  assert.deepEqual(restoredItems, items);
});
