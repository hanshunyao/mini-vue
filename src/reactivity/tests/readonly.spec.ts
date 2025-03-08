/*
 * @Author: hansy hanshunyao_hansy@163.com
 * @Date: 2025-03-07 16:32:05
 * @LastEditors: hansy hanshunyao_hansy@163.com
 * @LastEditTime: 2025-03-07 22:20:52
 * @FilePath: \mini-vue\src\reactivity\tests\readonly.spec.ts
 * @Description: readonly 单元测试
 */
import { isProxy, isReactive, isReadonly, readonly } from "../reactive";

describe("readonly", () => {
  it("测试 值不应该被改写", () => {
    const original = { foo: 1, bar: { baz: 2 } };
    const wrapped = readonly(original);
    expect(wrapped).not.toBe(original);
    expect(isProxy(wrapped)).toBe(true);
    expect(isReactive(wrapped)).toBe(false);
    expect(isReadonly(wrapped)).toBe(true);
    expect(isReactive(original)).toBe(false);
    expect(isReadonly(original)).toBe(false);
    expect(isReactive(wrapped.bar)).toBe(false);
    expect(isReadonly(wrapped.bar)).toBe(true);
    expect(isReactive(original.bar)).toBe(false);
    expect(isReadonly(original.bar)).toBe(false);
    // get
    expect(wrapped.foo).toBe(1);
  });
});
