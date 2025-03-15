export class Signature {
  constructor(private r: bigint, private s: bigint) {}

  getR(): bigint {
    return this.r;
  }

  getS(): bigint {
    return this.s;
  }

  toString(): string {
    return `Signature(r=${this.r.toString(16)}, s=${this.s.toString(16)})`;
  }
}
