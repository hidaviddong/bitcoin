import FieldElement from "./fieldElement";

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
  // 创建新实例的辅助方法
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
