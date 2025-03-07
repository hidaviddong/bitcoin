import { describe, expect, test } from "bun:test";
import Point from "./point";
import FieldElement from "./fieldElement";

describe("Point", () => {
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
});
