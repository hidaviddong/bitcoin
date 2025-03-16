import { Secp256k1Point } from "./point";
import type { PrivateKey } from "./privateKey";
import { Signature } from "./signature";
import { generateRandomKey, N } from "./utils";

/**
 * 签名时：
	1.	我们选择随机数 k
	2.	计算点 R = k×G，并取其 x 坐标作为 r
	3.	计算 s = (z + r×privateKey) / k
验证时：
	1.	计算 u = z/s 和 v = r/s
	2.	计算 R' = u×G + v×publicKey
这两个 R 为什么相等？
数学证明：
	•	我们知道 publicKey = privateKey×G
	•	代入公式：R' = u×G + v×publicKey = (z/s)×G + (r/s)×(privateKey×G)
	•	整理：R' = (z/s + r×privateKey/s)×G = ((z + r×privateKey)/s)×G
	•	回想 s = (z + r×privateKey)/k，所以 (z + r×privateKey)/s = k
	•	因此：R' = k×G = R
所以 R' 的 x 坐标必然等于 r（即 R 的 x 坐标）。
这证明了签名者确实知道私钥，因为只有知道私钥的人才能创建出使等式成立的 r 和 s 值。

 */
export class Signer {
  static hash(message: string): bigint {
    const hasher = new Bun.CryptoHasher("sha256");
    const firstHash = hasher.update(message).digest();
    const secondHash = hasher.update(firstHash).digest("hex");
    return BigInt("0x" + secondHash);
  }
  static modInverse(a: bigint, n: bigint): bigint {
    // 扩展欧几里得算法
    let t = 0n;
    let newT = 1n;
    let r = n;
    let newR = a;

    while (newR !== 0n) {
      const quotient = r / newR;
      [t, newT] = [newT, t - quotient * newT];
      [r, newR] = [newR, r - quotient * newR];
    }

    if (r > 1n) {
      throw new Error("a is not invertible");
    }
    if (t < 0n) {
      t += n;
    }
    return t;
  }

  // 签名消息
  static sign(message: string, privateKey: PrivateKey): Signature {
    // 1. 计算消息哈希
    const z = this.hash(message);

    // 2. 生成随机数k
    const k = generateRandomKey();
    // 3. 计算点R = k*G
    const G = Secp256k1Point.G();
    const R = G.rmul(k);

    // 4. 计算r (R的x坐标)
    const r = R.getX()!.getNum() % N;
    if (r === 0n) {
      // 如果r为0，重新生成k
      return this.sign(message, privateKey);
    }

    // 5. 计算s = (z + r*privateKey) / k
    const s = (this.modInverse(k, N) * (z + r * privateKey.getKey())) % N;
    if (s === 0n) {
      // 如果s为0，重新生成k
      return this.sign(message, privateKey);
    }

    // 6. 创建签名
    return new Signature(r, s);
  }
}
