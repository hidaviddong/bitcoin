import { describe, expect, test } from "bun:test";
import FieldElement from "./fieldElement";

describe("FieldElement", () => {
  const a = new FieldElement(7, 19);
  const b = new FieldElement(5, 19);
  test("truediv", () => {
    expect(a.truediv(b).getNum()).toBe(9);
  });
});
