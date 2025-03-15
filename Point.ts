import FieldElement, { Secp256k1FieldElement } from "./fieldElement";
import { N } from "./utils";

export default class Point {
  private x: FieldElement | null;
  private y: FieldElement | null;
  private a: FieldElement;
  private b: FieldElement;

  constructor(
    x: FieldElement | null,
    y: FieldElement | null,
    a: FieldElement,
    b: FieldElement
  ) {
    this.x = x;
    this.y = y;
    this.a = a;
    this.b = b;

    // 处理无穷远点
    if (x === null && y === null) {
      return;
    }

    // 验证点是否在曲线上
    if (x !== null && y !== null) {
      // y^2 = x^3 + ax + b
      const left = y.pow(2);
      const right = x.pow(3).add(a.mul(x)).add(b);
      if (!left.eq(right)) {
        throw new Error(`(${x.getNum()}, ${y.getNum()}) 不在曲线上`);
      }
    }
  }

  getX(): FieldElement | null {
    return this.x;
  }

  getY(): FieldElement | null {
    return this.y;
  }

  getA(): FieldElement {
    return this.a;
  }

  getB(): FieldElement {
    return this.b;
  }

  eq(other: Point): boolean {
    return (
      (this.x === null && other.getX() === null) ||
      (this.x !== null &&
        other.getX() !== null &&
        this.y !== null &&
        other.getY() !== null &&
        this.x.eq(other.getX()!) &&
        this.y.eq(other.getY()!) &&
        this.a.eq(other.getA()) &&
        this.b.eq(other.getB()))
    );
  }

  neq(other: Point): boolean {
    return !this.eq(other);
  }

  add(other: Point): this {
    if (!this.a.eq(other.getA()) || !this.b.eq(other.getB())) {
      throw new Error(`点不在同一条曲线上`);
    }

    // 处理无穷远点的情况
    if (this.x === null) {
      return this.newInstance(other.getX(), other.getY(), this.a, this.b);
    }
    if (other.getX() === null) {
      return this.newInstance(this.x, this.y, this.a, this.b);
    }

    // 如果 x 坐标相同但 y 坐标相反，返回无穷远点
    if (
      this.x.eq(other.getX()!) &&
      this.y !== null &&
      other.getY() !== null &&
      !this.y.eq(other.getY()!)
    ) {
      return this.newInstance(null, null, this.a, this.b);
    }

    // 如果是同一个点，使用切线公式
    if (this.eq(other)) {
      // 如果 y = 0，返回无穷远点
      if (this.y !== null && this.y.getNum() === 0) {
        return this.newInstance(null, null, this.a, this.b);
      }

      // s = (3x1^2 + a) / (2y1)
      const prime = this.x.getPrime();
      const three = new FieldElement(3, prime);
      const two = new FieldElement(2, prime);

      const numerator = this.x.pow(2).mul(three).add(this.a);
      const denominator = this.y!.mul(two);
      const s = numerator.truediv(denominator);

      // x3 = s^2 - 2x1
      const x3 = s.pow(2).sub(this.x.mul(two));

      // y3 = s(x1 - x3) - y1
      const y3 = s.mul(this.x.sub(x3)).sub(this.y!);

      return this.newInstance(x3, y3, this.a, this.b);
    } else {
      // 不同点相加，使用割线公式
      // s = (y2 - y1) / (x2 - x1)

      const s = other.getY()!.sub(this.y!).truediv(other.getX()!.sub(this.x));
      // x3 = s^2 - x1 - x2
      const x3 = s.pow(2).sub(this.x).sub(other.getX()!);

      // y3 = s(x1 - x3) - y1
      const y3 = s.mul(this.x.sub(x3)).sub(this.y!);

      return this.newInstance(x3, y3, this.a, this.b);
    }
  }

  // 二进制展开利用了一个数学事实：任何整数都可以表示为2的幂的和。
  // 例如，13 的二进制表示是 1101，这意味着：
  // 13 = 2³ × 1 + 2² × 1 + 2¹ × 0 + 2⁰ × 1 = 8 + 4 + 0 + 1
  // 所以 13 × P = 8P + 4P + 0P + 1P
  rmul(coefficient: number): this {
    if (coefficient === 0) {
      return this.newInstance(null, null, this.a, this.b);
    }
    if (coefficient === 1) {
      return this;
    }

    let result = this.newInstance(null, null, this.a, this.b);
    let current = this;
    let coef = coefficient;

    while (coef > 0) {
      if (coef & 1) {
        result = result.add(current);
      }
      current = current.add(current);
      coef = coef >> 1;
    }

    return result;
  }

  protected newInstance(
    x: FieldElement | null,
    y: FieldElement | null,
    a: FieldElement,
    b: FieldElement
  ): this {
    return new Point(x, y, a, b) as this;
  }
  toString(): string {
    if (this.x === null) {
      return "Point(∞)";
    }
    return `Point(${this.x.getNum()}, ${this.y!.getNum()})_${this.a.getNum()}_${this.b.getNum()} FieldF${this.x.getPrime()}`;
  }
}

export class Secp256k1Point {
  private x: Secp256k1FieldElement | null;
  private y: Secp256k1FieldElement | null;
  private static readonly A: bigint = 0n; // secp256k1 的 a 参数为 0
  private static readonly B: bigint = 7n; // secp256k1 的 b 参数为 7

  // 曲线参数预先定义为静态常量
  private static readonly a = new Secp256k1FieldElement(Secp256k1Point.A);
  private static readonly b = new Secp256k1FieldElement(Secp256k1Point.B);

  // secp256k1 的 N (曲线阶)
  constructor(
    x: Secp256k1FieldElement | null,
    y: Secp256k1FieldElement | null
  ) {
    // 处理无穷远点
    if (x === null && y === null) {
      this.x = null;
      this.y = null;
      return;
    }

    // 转换输入参数为 Secp256k1FieldElement
    this.x = x;
    this.y = y;

    // 验证点是否在曲线上
    // y^2 = x^3 + ax + b
    const left = this.y!.pow(2);
    const right = this.x!.pow(3)
      .add(Secp256k1Point.a.mul(this.x!))
      .add(Secp256k1Point.b);

    if (!left.eq(right)) {
      throw new Error(
        `(${this.x!.getNum()}, ${this.y!.getNum()}) 不在 secp256k1 曲线上`
      );
    }
  }

  getX(): Secp256k1FieldElement | null {
    return this.x;
  }

  getY(): Secp256k1FieldElement | null {
    return this.y;
  }

  eq(other: Secp256k1Point): boolean {
    return (
      (this.x === null && other.getX() === null) ||
      (this.x !== null &&
        other.getX() !== null &&
        this.y !== null &&
        other.getY() !== null &&
        this.x.eq(other.getX()!) &&
        this.y.eq(other.getY()!))
    );
  }

  neq(other: Secp256k1Point): boolean {
    return !this.eq(other);
  }

  add(other: Secp256k1Point): Secp256k1Point {
    // 处理无穷远点的情况
    if (this.x === null) {
      return other;
    }
    if (other.getX() === null) {
      return this;
    }

    // 如果 x 坐标相同但 y 坐标相反，返回无穷远点
    if (
      this.x.eq(other.getX()!) &&
      this.y !== null &&
      other.getY() !== null &&
      !this.y.eq(other.getY()!)
    ) {
      return new Secp256k1Point(null, null);
    }

    // 如果是同一个点，使用切线公式
    if (this.eq(other)) {
      // 如果 y = 0，返回无穷远点
      if (this.y!.getNum() === 0n) {
        return new Secp256k1Point(null, null);
      }

      // s = (3x1^2 + a) / (2y1)
      const three = new Secp256k1FieldElement(3n);
      const two = new Secp256k1FieldElement(2n);

      const numerator = this.x.pow(2).mul(three).add(Secp256k1Point.a);
      const denominator = this.y!.mul(two);
      const s = numerator.truediv(denominator);

      // x3 = s^2 - 2x1
      const x3 = s.pow(2).sub(this.x.mul(two));

      // y3 = s(x1 - x3) - y1
      const y3 = s.mul(this.x.sub(x3)).sub(this.y!);

      return new Secp256k1Point(x3, y3);
    } else {
      // 不同点相加，使用割线公式
      // s = (y2 - y1) / (x2 - x1)
      const s = other.getY()!.sub(this.y!).truediv(other.getX()!.sub(this.x));

      // x3 = s^2 - x1 - x2
      const x3 = s.pow(2).sub(this.x).sub(other.getX()!);

      // y3 = s(x1 - x3) - y1
      const y3 = s.mul(this.x.sub(x3)).sub(this.y!);

      return new Secp256k1Point(x3, y3);
    }
  }

  rmul(coefficient: bigint): Secp256k1Point {
    // 对 N 取模，因为 N 是曲线的阶
    const coefMod = coefficient % N;
    if (coefMod === 0n) {
      return new Secp256k1Point(null, null);
    }
    if (coefMod === 1n) {
      return this;
    }

    let result = new Secp256k1Point(null, null);
    let current = this;
    let coef = coefMod;

    while (coef > 0n) {
      if (coef & 1n) {
        result = result.add(current);
      }
      current = current.add(current) as typeof current;
      coef = coef >> 1n;
    }

    return result;
  }

  toString(): string {
    if (this.x === null) {
      return "Secp256k1Point(∞)";
    }
    return `Secp256k1Point(${this.x.getNum()}, ${this.y!.getNum()})`;
  }

  // 静态方法，返回 secp256k1 的生成点 G
  static G(): Secp256k1Point {
    const gx =
      0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n;
    const gy =
      0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n;
    return new Secp256k1Point(
      new Secp256k1FieldElement(gx),
      new Secp256k1FieldElement(gy)
    );
  }
}
