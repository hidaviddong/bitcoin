import { describe, expect, test } from "bun:test";
import Point from "./point";
import FieldElement from "./fieldElement";

describe("Point", () => {
  // prime = 223,223可以用8位二进制表示（2⁸ = 256 > 223）,是一个 8 位的椭圆曲线
  const a = new FieldElement(0, 223);
  const b = new FieldElement(7, 223);
  test("(170,142) + (60,139)", () => {
    // 创建点
    const x1 = new FieldElement(170, 223);
    const y1 = new FieldElement(142, 223);
    const x2 = new FieldElement(60, 223);
    const y2 = new FieldElement(139, 223);

    const p1 = new Point(x1, y1, a, b);
    const p2 = new Point(x2, y2, a, b);

    // 计算点加法
    const p3 = p1.add(p2);

    // 预期结果 - 这个结果需要通过计算得到
    // 1. 计算斜率 s = (y2-y1)/(x2-x1) = (139-142)/(60-170) mod 223
    // 2. 计算 x3 = s² - x1 - x2 mod 223
    // 3. 计算 y3 = s(x1-x3) - y1 mod 223

    // 根据计算，结果应该是 (220,181)
    expect(p3.getX()?.getNum()).toBe(220);
    expect(p3.getY()?.getNum()).toBe(181);

    // 验证结果点确实在曲线上
    const x3 = p3.getX();
    const y3 = p3.getY();
    if (x3 && y3) {
      const left = y3.pow(2);
      const right = x3.pow(3).add(b);
      expect(left.eq(right)).toBe(true);
    }
  });
  test("2*(47,71)=(36,111), 3*(47,71)=(15,137)", () => {
    //  给定基点 P 和标量 s，计算 s·P 很容易（如代码所示）
    //  但给定基点 P 和结果点 s·P，找出标量 s 是计算上困难的
    //  这种单向性质被称为"椭圆曲线离散对数问题"，是椭圆曲线密码学（ECC）安全性的基础。

    /**
     * 用户选择随机数 s 作为私钥，计算 s·P 作为公钥（P是公共参数）
     * 即使攻击者知道公钥 s·P，也无法有效计算出私钥 s
     */
    const x1 = new FieldElement(47, 223);
    const y1 = new FieldElement(71, 223);
    const p1 = new Point(x1, y1, a, b);
    const p2 = p1.add(p1);
    expect(p2.getX()?.getNum()).toBe(36);
    expect(p2.getY()?.getNum()).toBe(111);

    const p3 = p2.add(p1);
    expect(p3.getX()?.getNum()).toBe(15);
    expect(p3.getY()?.getNum()).toBe(137);
  });
});
