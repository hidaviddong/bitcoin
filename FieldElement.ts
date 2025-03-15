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

    // 对指数取模，根据费马小定理
    let n = exponent % (this.prime - 1);
    let result = 1;
    let base = this.num;

    while (n > 0) {
      if (n & 1) {
        // 如果n是奇数
        result = (result * base) % this.prime;
      }
      base = (base * base) % this.prime;
      n = Math.floor(n / 2); // 将n除以2
    }

    return new FieldElement(result, this.prime);
  }
  // 利用费马小定理公式：a/b = a⋅b^(p–2)
  truediv(other: FieldElement) {
    this.checkSameField(other.getPrime());
    const exponent = this.prime - 2;
    return this.mul(other.pow(exponent));
  }
}

// 创建一个专门用于 secp256k1 的 BigInt 版本的 FieldElement 类

export class Secp256k1FieldElement {
  private num: bigint;
  private static readonly PRIME: bigint = 2n ** 256n - 2n ** 32n - 977n; // secp256k1 素数

  constructor(num: bigint) {
    if (num >= Secp256k1FieldElement.PRIME || num < 0n) {
      throw new Error(
        `Num ${num} not in field range 0 to ${Secp256k1FieldElement.PRIME}`
      );
    }
    this.num = num;
  }

  getNum(): bigint {
    return this.num;
  }

  getPrime(): bigint {
    return Secp256k1FieldElement.PRIME;
  }

  eq(other: Secp256k1FieldElement): boolean {
    return this.num === other.getNum();
  }

  ne(other: Secp256k1FieldElement): boolean {
    return !this.eq(other);
  }

  add(other: Secp256k1FieldElement): Secp256k1FieldElement {
    const new_num = (this.num + other.getNum()) % Secp256k1FieldElement.PRIME;
    return new Secp256k1FieldElement(new_num);
  }

  sub(other: Secp256k1FieldElement): Secp256k1FieldElement {
    let result = (this.num - other.getNum()) % Secp256k1FieldElement.PRIME;
    if (result < 0n) {
      result += Secp256k1FieldElement.PRIME;
    }
    return new Secp256k1FieldElement(result);
  }

  mul(other: Secp256k1FieldElement): Secp256k1FieldElement {
    const product = (this.num * other.getNum()) % Secp256k1FieldElement.PRIME;
    return new Secp256k1FieldElement(product);
  }

  pow(exponent: bigint | number): Secp256k1FieldElement {
    const expBig = BigInt(exponent);

    if (expBig < 0n) {
      // 使用费马小定理: a^(-n) = (a^(-1))^n = (a^(p-2))^n
      return this.pow(Secp256k1FieldElement.PRIME - 2n).pow(-expBig);
    }

    // 对指数取模，根据费马小定理
    let n = expBig % (Secp256k1FieldElement.PRIME - 1n);
    let result = 1n;
    let base = this.num;

    while (n > 0n) {
      if (n & 1n) {
        // 如果n是奇数
        result = (result * base) % Secp256k1FieldElement.PRIME;
      }
      base = (base * base) % Secp256k1FieldElement.PRIME;
      n = n / 2n; // BigInt 除法会自动向下取整
    }

    return new Secp256k1FieldElement(result);
  }

  // 利用费马小定理公式：a/b = a⋅b^(p–2)
  truediv(other: Secp256k1FieldElement): Secp256k1FieldElement {
    const exponent = Secp256k1FieldElement.PRIME - 2n;
    return this.mul(other.pow(exponent));
  }
}
