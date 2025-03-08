/*
 * @Author: hansy hanshunyao_hansy@163.com
 * @Date: 2025-03-07 14:50:42
 * @LastEditors: hansy hanshunyao_hansy@163.com
 * @LastEditTime: 2025-03-07 21:52:27
 * @FilePath: \mini-vue\src\reactivity\tests\reactive.spec.ts
 * @Description: 单元测试 reactive
 */
import { reactive, isReactive, toRaw, reactiveMap } from '../reactive';
describe('reactive', () => {
  test('happy path', () => {
    const original = { foo: 1 };
    // 创建一个响应式对象
    const observed = reactive(original);
    // 返回的响应式对象得是代理，不能是原对象本身
    expect(observed).not.toBe(original);
    // 返回的响应式对象是否是响应式类型
    expect(isReactive(observed)).toBe(true);
    // 原对象不应该被修改成响应式对象
    expect(isReactive(original)).toBe(false);
    // 调用了 basehandleer 里面的 get 方法，获取到1
    expect(observed.foo).toBe(1);
    expect('foo' in observed).toBe(true);
    expect(Object.keys(observed)).toEqual(['foo']);
  });

  test('nested reactives', () => {
    const original = {
      nested: {
        foo: 1,
      },
      array: [{ bar: 2 }],
    };
    const observed = reactive(original);
    expect(isReactive(observed.nested)).toBe(true);
    expect(isReactive(observed.array)).toBe(true);
    expect(isReactive(observed.array[0])).toBe(true);
  });

  test('toRaw', () => {
    const original = { foo: 1 };
    const observed = reactive(original);
    expect(toRaw(observed)).toBe(original);
    expect(toRaw(original)).toBe(original);
  });
});
