// signature.test.ts
import { describe, expect, test } from "bun:test";
import { PrivateKey } from "./privateKey";
import { PublicKey } from "./publicKey";
import { Signature } from "./signature";
import { Signer } from "./signer";
import { Verifier } from "./vertify";

describe("Bitcoin Signature Flow", () => {
  test("complete signature flow: create, sign and verify", () => {
    const privateKey = new PrivateKey(12345n);
    const publicKey = new PublicKey(privateKey);

    const message = "David Send 1 BTC to Bob";
    const signature = Signer.sign(message, privateKey);
    const isValid = Verifier.verify(message, signature, publicKey);
    expect(isValid).toBe(true);

    const modifiedMessage = "David Send 10 BTC to Bob";

    const isValidModified = Verifier.verify(
      modifiedMessage,
      signature,
      publicKey
    );
    expect(isValidModified).toBe(false);
  });
});
