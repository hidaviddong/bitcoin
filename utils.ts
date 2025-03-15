import * as crypto from "crypto";

// secp256k1 的 N (曲线阶)
export const N: bigint =
  0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;

/**
 *
 * @description 生成32字节（256位）的随机数
 */

export function generateRandomKey(): bigint {
  const randomBytes = crypto.randomBytes(32);
  let privateKey = 0n;
  for (const byte of randomBytes) {
    privateKey = (privateKey << 8n) | BigInt(byte);
  }
  privateKey = (privateKey % (N - 1n)) + 1n;
  return privateKey;
}
