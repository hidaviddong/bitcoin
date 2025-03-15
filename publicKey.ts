// publicKey.ts
import { PrivateKey } from "./privateKey";
import { Secp256k1Point } from "./point";

export class PublicKey {
  private point: Secp256k1Point;

  constructor(privateKey: PrivateKey) {
    // 使用私钥和生成点 G 计算公钥点
    const G = Secp256k1Point.G();
    this.point = G.rmul(privateKey.getKey());
  }

  getPoint(): Secp256k1Point {
    return this.point;
  }

  // 获取非压缩格式的公钥（04 + x坐标 + y坐标）
  toHex(): string {
    if (this.point.getX() === null || this.point.getY() === null) {
      throw new Error("Cannot convert infinity point to public key format");
    }

    // 非压缩格式前缀是 04
    const prefix = "04";

    // 将 x 和 y 坐标转换为 32 字节的十六进制字符串
    const x = this.point.getX()!.getNum();
    const y = this.point.getY()!.getNum();

    const xHex = x.toString(16).padStart(64, "0");
    const yHex = y.toString(16).padStart(64, "0");

    return "0x" + prefix + xHex + yHex;
  }

  toString(): string {
    return `PublicKey: ${this.toHex()}`;
  }
}
