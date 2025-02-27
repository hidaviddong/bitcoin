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
