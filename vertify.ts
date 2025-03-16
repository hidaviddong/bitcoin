import { PublicKey } from "./publicKey";
import { Signature } from "./signature";
import { Secp256k1Point } from "./point";
import { Signer } from "./signer";
import { N } from "./utils";

export class Verifier {
  // 验证签名
  static verify(
    message: string,
    signature: Signature,
    publicKey: PublicKey
  ): boolean {
    // 1. 获取签名的r和s
    const r = signature.getR();
    const s = signature.getS();

    // 3. 检查r和s是否在[1, N-1]范围内
    if (r <= 0n || r >= N || s <= 0n || s >= N) {
      return false;
    }

    // 4. 计算消息哈希
    const z = Signer.hash(message);

    // 5. 计算s的模逆元
    const sInv = Signer.modInverse(s, N);

    // 6. 计算u和v
    const u = (z * sInv) % N;
    const v = (r * sInv) % N;

    // 7. 计算点R' = u*G + v*P
    const G = Secp256k1Point.G();
    const P = publicKey.getPoint();

    const uG = G.rmul(u);
    const vP = P.rmul(v);
    const R = uG.add(vP);

    // 8. 检查R是否是无穷远点
    if (R.getX() === null) {
      return false;
    }

    // 9. 验证R的x坐标模N等于r
    return R.getX()!.getNum() % N === r;
  }
}
