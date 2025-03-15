import { describe, expect, test } from "bun:test";
import { PublicKey } from "./publicKey";
import { PrivateKey } from "./privateKey";
describe("publicKey", () => {
  test("generate publicKey should not be null", () => {
    const privateKey = new PrivateKey();
    const publicKey = new PublicKey(privateKey);
    expect(publicKey.getPoint().getX()).not.toBeNull();
    expect(publicKey.getPoint().getY()).not.toBeNull();
  });
  test("generate publicKey should equal to G if privateKey is 1n", () => {
    const privateKey = new PrivateKey(1n);
    const publicKey = new PublicKey(privateKey);
    expect(publicKey.getPoint().getX()?.getNum()).toBe(
      0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n
    );
    expect(publicKey.getPoint().getY()?.getNum()).toBe(
      0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n
    );
  });
});
