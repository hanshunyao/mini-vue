/*
 * @Author: Hansy hanshunyao_hansy@163.com
 * @Date: 2025-03-08 14:42:33
 * @LastEditors: Hansy hanshunyao_hansy@163.com
 * @LastEditTime: 2025-03-09 19:11:46
 * @FilePath: \mini-vue\src\reactivity\tests\ref.spec.ts
 * @Description: ref 单元测试
 */
import { effect } from "../src/effect";
import { reactive } from "../src/reactive";
import { isRef, ref, unRef,proxyRefs } from "../src/ref";
describe("ref", () => {
  it("测试 应该是响应式数据", () => {
    const a = ref(1);
    let dummy;
    let calls = 0;
    effect(() => {
      calls++;
      dummy = a.value;
    });
    expect(calls).toBe(1);
    expect(dummy).toBe(1);
    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
    // 如果重新赋值相同的值的话，不会触发依赖
    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
  });

  it("测试 ref 传过来的 value 是对象时使用 reactive 包裹", () => {
    const a = ref({
      count: 1,
    });
    let dummy;
    effect(() => {
      dummy = a.value.count;
    });
    expect(dummy).toBe(1);
    a.value.count = 2;
    expect(dummy).toBe(2);
  });

  it("proxyRefs", () => {
    const user = {
      age: ref(10),
      name: "hansy",
    };
    // 使用 proxyRefs 属性后 后序访问属性就不用 .value 了
    const proxyUser = proxyRefs(user);
    expect(user.age.value).toBe(10);
    expect(proxyUser.age).toBe(10);
    expect(proxyUser.name).toBe("hansy");

    (proxyUser as any).age = 26;
    expect(proxyUser.age).toBe(26);
    expect(user.age.value).toBe(26);

    proxyUser.age = ref(11);
    expect(proxyUser.age).toBe(11);
    expect(user.age.value).toBe(11);
  });

  // 判断是不是 ref
  it("isRef", () => {
    const a = ref(1);
    const user = reactive({
      age: 1,
    });
    expect(isRef(a)).toBe(true);
    expect(isRef(1)).toBe(false);
    expect(isRef(user)).toBe(false);
  });

  // 如果是 ref 类型的话，那么就返回 value
  // 如果不是的话，那么就返回本身
  it("unRef", () => {
    const a = ref(1);
    expect(unRef(a)).toBe(1);
    expect(unRef(1)).toBe(1);
  });
});
