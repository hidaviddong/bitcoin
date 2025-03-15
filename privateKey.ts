import * as crypto from "crypto";
import { generateRandomKey, N } from "./utils";

export class PrivateKey {
  private key: bigint;
  constructor(key?: bigint) {
    if (key !== undefined) {
      // 如果提供了私钥，验证它是否在有效范围内
      if (key <= 0n || key >= N) {
        throw new Error("Private key must be in range [1, N-1]");
      }
      this.key = key;
    } else {
      // 生成随机私钥
      this.key = generateRandomKey();
    }
  }
  public getKey(): bigint {
    return this.key;
  }
  public toHex(): string {
    return "0x" + this.key.toString(16).padStart(64, "0");
  }
  // 将私钥转换为WIF格式
  public toWIF(): string {
    // 1. 将私钥转换为32字节的Buffer
    const keyHex = this.key.toString(16).padStart(64, "0");
    const keyBuffer = Buffer.from(keyHex, "hex");

    // 2. 添加版本前缀 (0x80为主网，0xEF为测试网)
    const versionByte = 0x80;
    let extendedKey = Buffer.concat([Buffer.from([versionByte]), keyBuffer]);

    // 4. 计算双重SHA-256哈希的前4个字节作为校验和
    const firstSHA = crypto.createHash("sha256").update(extendedKey).digest();
    const secondSHA = crypto.createHash("sha256").update(firstSHA).digest();
    const checksum = secondSHA.slice(0, 4);

    // 5. 将校验和附加到扩展密钥后面
    const keyWithChecksum = Buffer.concat([extendedKey, checksum]);

    // 6. 使用Base58编码
    return this.base58Encode(keyWithChecksum);
  }

  // Base58编码实现
  private base58Encode(buffer: Buffer): string {
    const ALPHABET =
      "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

    // 计算前导零的数量
    let zeros = 0;
    for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
      zeros++;
    }

    // 转换为Base58
    let value = 0n;
    for (const byte of buffer) {
      value = value * 256n + BigInt(byte);
    }

    let result = "";
    while (value > 0n) {
      const remainder = Number(value % 58n);
      value = value / 58n;
      result = ALPHABET[remainder] + result;
    }

    // 添加前导1对应前导0
    return "1".repeat(zeros) + result;
  }
}
