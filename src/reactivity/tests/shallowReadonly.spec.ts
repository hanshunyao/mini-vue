/*
 * @Author: hansy hanshunyao_hansy@163.com
 * @Date: 2025-03-07 16:32:05
 * @LastEditors: hansy hanshunyao_hansy@163.com
 * @LastEditTime: 2025-03-07 21:53:18
 * @FilePath: \mini-vue\src\reactivity\tests\shallowReadonly.spec.ts
 * @Description: shallowReadonly 单元测试
 */
import { isReactive, isReadonly, readonly, shallowReadonly } from "../reactive";

describe("shallowReadonly", () => {
  test("should not make non-reactive properties reactive", () => {
    const props = shallowReadonly({ n: { foo: 1 } });
    expect(isReactive(props.n)).toBe(false);
  });
  test("should differentiate from normal readonly calls", async () => {
    const original = { foo: {} };
    const shallowProxy = shallowReadonly(original);
    const reactiveProxy = readonly(original);
    expect(shallowProxy).not.toBe(reactiveProxy);
    expect(isReadonly(shallowProxy.foo)).toBe(false);
    expect(isReadonly(reactiveProxy.foo)).toBe(true);
  });
});
