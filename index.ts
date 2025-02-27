function isPrime(prime: number) {
  if (prime <= 1) return false;
  if (prime === 2) return true;
  if (prime % 2 === 0) return false;

  const sqrt = Math.sqrt(prime);
  for (let i = 3; i <= sqrt; i += 2) {
    if (prime % i === 0) return false;
  }
  return true;
}

export default class FieldElement {
  private num: number;
  private prime: number;
  constructor(num: number, prime: number) {
    if (!isPrime(prime)) {
      throw new Error(`${prime} is not a prime number`);
    }
    if (num >= prime || num < 0) {
      throw new Error(`Num ${num} not in field range 0 to ${prime}`);
    }
    this.num = num;
    this.prime = prime;
  }
  getNum() {
    return this.num;
  }
  getPrime() {
    return this.prime;
  }

  private checkSameField(otherPrime: number) {
    if (this.prime !== otherPrime) {
      throw new Error("Cannot operate on elements in different fields");
    }
  }

  eq(other: FieldElement) {
    this.checkSameField(other.prime);
    return this.num === other.getNum();
  }
  ne(other: FieldElement): boolean {
    this.checkSameField(other.prime);
    return !this.eq(other);
  }
  add(other: FieldElement) {
    this.checkSameField(other.prime);
    const new_num = (this.num + other.getNum()) % this.prime;
    return new FieldElement(new_num, this.prime);
  }
  sub(other: FieldElement) {
    this.checkSameField(other.prime);
    const otherNegativeNum = -1 * other.getNum();
    let modNumber = otherNegativeNum % other.getPrime();
    if (modNumber < 0) {
      modNumber += other.getPrime();
    }
    return this.add(new FieldElement(modNumber, this.prime));
  }
  mul(other: FieldElement) {
    this.checkSameField(other.getPrime());
    const product = this.num * other.getNum();
    return new FieldElement(product % this.prime, this.prime);
  }
  pow(exponent: number): FieldElement {
    if (exponent < 0) {
      // 使用费马小定理: a^(-n) = (a^(-1))^n = (a^(p-2))^n
      return this.pow(this.prime - 2).pow(-exponent);
    }
    const product = this.num ** exponent;
    return new FieldElement(product % this.prime, this.prime);
  }
  // 利用费马小定理公式：a/b = a⋅b^(p–2)
  truediv(other: FieldElement) {
    this.checkSameField(other.getPrime());
    const exponent = this.prime - 2;
    return this.mul(other.pow(exponent));
  }
}

// const a = new FieldElement(7, 19);
// const b = new FieldElement(5, 19);
// console.log(a.truediv(b).getNum() === 9);
// console.log(a.pow(-2).getNum());

// 椭圆曲线 y^2 = x^3 + ax + b
class Point {
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

// 3/6 = 0.5
// const p1 = new Point(2, 5, 5, 7);
// const p2 = new Point(-1, -1, 5, 7);
// const p3 = new Point(-1, 1, 5, 7);
// console.log(p1.add(p2)); // P1 != P2
// console.log(p3.add(p3)); // P1 = P2

const a = new FieldElement(0, 223);
const b = new FieldElement(7, 223);
const x = new FieldElement(192, 223);
const y = new FieldElement(105, 223);
const p = new Point(x, y, a, b);

console.log(p.toString());
