import { describe, expect, test } from "bun:test";
import { PrivateKey } from "./privateKey";
describe("privateKey", () => {
  test("generate privateKey", () => {
    const privateKey = new PrivateKey();
    expect(privateKey.getKey()).toBeGreaterThan(0n);
    expect(privateKey.getKey()).toBeLessThan(PrivateKey.N);
  });
});
