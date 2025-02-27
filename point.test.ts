import { describe, expect, test } from "bun:test";
import Point from "./Point";
import FieldElement from "./FieldElement";

describe("Point", () => {
  const a = new FieldElement(0, 223);
  const b = new FieldElement(7, 223);
  const x = new FieldElement(192, 223);
  const y = new FieldElement(105, 223);
  const p = new Point(x, y, a, b);
  test("happy path", () => {
    expect(p.getA().getNum()).toBe(0);
  });
});
