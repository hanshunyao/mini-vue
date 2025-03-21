/*
 * @Author: hansy hanshunyao_hansy@163.com
 * @Date: 2025-03-07 16:32:05
 * @LastEditors: Hansy hanshunyao_hansy@163.com
 * @LastEditTime: 2025-03-09 18:13:40
 * @FilePath: \mini-vue\src\reactivity\tests\shallowReadonly.spec.ts
 * @Description: shallowReadonly 单元测试
 */
import { isReactive, isReadonly, readonly, shallowReadonly } from "../src/reactive";

describe("shallowReadonly", () => {
  test("测试 表层为响应式对象 内层嵌套不是响应式对象", () => {
    const props = shallowReadonly({ n: { foo: 1 } });
    expect(isReactive(props.n)).toBe(false);
  });
  test("测试 shallowReadonly 不影响普通 readonly的逻辑", async () => {
    const original = { foo: {} };
    const shallowProxy = shallowReadonly(original);
    const reactiveProxy = readonly(original);
    expect(shallowProxy).not.toBe(reactiveProxy);
    expect(isReadonly(shallowProxy.foo)).toBe(false);
    expect(isReadonly(reactiveProxy.foo)).toBe(true);
  });
});
