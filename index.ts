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

const a = new FieldElement(7, 19);
const b = new FieldElement(5, 19);
console.log(a.truediv(b).getNum() === 9);
console.log(a.pow(-2).getNum());

// 椭圆曲线 y^2 = x^3 + ax + b
class Point {
  private x: number;
  private y: number;
  private a: number;
  private b: number;
  constructor(x: number, y: number, a: number, b: number) {
    this.x = x;
    this.y = y;
    this.a = a;
    this.b = b;
    if (this.y ** 2 !== this.x ** 3 + a * x + b) {
      throw new Error(`(${x}, ${y}) is not on the curve`);
    }
  }
  eq(other: Point) {
    return (
      this.x === other.x &&
      this.y === other.y &&
      this.a === other.a &&
      this.b === other.b
    );
  }
  neq(other: Point) {
    return !this.eq(other);
  }
  add(other: Point) {
    if (other.a !== this.a || other.b !== this.b) {
      throw new Error(`Points ${this}, ${other} are not on the same curve`);
    }
    if (!isFinite(other.x) || !isFinite(other.y)) {
      return new Point(this.x, this.y, this.a, this.b);
    }

    if (this.x + other.x === 0 && this.y + other.y === 0) {
      return new Point(Infinity, Infinity, this.a, this.b);
    }
    if (this.eq(other)) {
      // 因为P1 = P2,所以需要通过求导来得到斜率。 P1 = (x1,y1), P3 = (x3,y3), P1 + P1 = P3, s = (3x1^2 + a)/(2y1), x3 = s^2 – 2x1, y3 = s(x1 – x3) – y1
      const slope = (3 * this.x ** 2 + this.a) / (2 * this.y);
      const x3 = slope ** 2 - 2 * this.x;
      const y3 = slope * (this.x - x3) - this.y;
      return new Point(x3, y3, this.a, this.b);
    } else {
      // P1 != P2,可以直接计算得到斜率: P1 = (x1,y1), P2 = (x2,y2), P3 = (x3,y3); P1 + P2 = P3, s = (y2 – y1)/(x2 – x1); x3 = s^2– x1 – x2, y3 = s(x1 – x3) – y1
      if (this.y === 0) {
        return new Point(Infinity, Infinity, this.a, this.b);
      }
      const slope = (other.y - this.y) / (other.x - this.x);
      const x3 = slope ** 2 - this.x - other.x;
      const y3 = slope * (this.x - x3) - this.y;
      return new Point(x3, y3, this.a, this.b);
    }
  }
}
// 3/6 = 0.5
const p1 = new Point(2, 5, 5, 7);
const p2 = new Point(-1, -1, 5, 7);
const p3 = new Point(-1, 1, 5, 7);
console.log(p1.add(p2)); // P1 != P2
console.log(p3.add(p3)); // P1 = P2
