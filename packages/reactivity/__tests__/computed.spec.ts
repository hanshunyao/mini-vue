/*
 * @Author: hansy hanshunyao_hansy@163.com
 * @Date: 2025-03-07 16:32:05
 * @LastEditors: Hansy hanshunyao_hansy@163.com
 * @LastEditTime: 2025-03-09 22:11:12
 * @FilePath: \mini-vue\src\reactivity\tests\computed.spec.ts
 * @Description: computed 单元测试
 */
import { computed } from "../src/computed";
import { reactive } from "../src/reactive";
import {vi} from 'vitest'

describe("computed", () => {
  it("happy path", () => {
    const value = reactive({
      foo: 1,
    });

    const getter = computed(() => {
      return value.foo;
    });

    value.foo = 2;
    expect(getter.value).toBe(2);
  });

  it("测试 computed 应该被懒执行", () => {
    const value = reactive({
      foo: 1,
    });
    const getter = vi.fn(() => {
      return value.foo;
    });
    const cValue = computed(getter);

    // 如果没有调用 cValue.value 的话，那么 getter 就不会被调用
    expect(getter).not.toHaveBeenCalled();
    // 调用 cValue.value 的时候，getter 才会被调用
    expect(cValue.value).toBe(1);
    expect(getter).toHaveBeenCalledTimes(1);

    // get value 不应该被调用2次
    cValue.value;
    expect(getter).toHaveBeenCalledTimes(1);

    // should not compute until needed
    value.foo = 2;
    expect(getter).toHaveBeenCalledTimes(1);

    // 获取值的时候 重新执行
    expect(cValue.value).toBe(2);
    expect(getter).toHaveBeenCalledTimes(2);

    // should not compute again
    cValue.value;
    expect(getter).toHaveBeenCalledTimes(2);
  });
});
