/*
 * @Author: hansy hanshunyao_hansy@163.com
 * @Date: 2025-03-06 21:16:11
 * @LastEditors: Hansy hanshunyao_hansy@163.com
 * @LastEditTime: 2025-03-08 16:34:24
 * @FilePath: \mini-vue\src\reactivity\tests\effect.spec.ts
 * @Description: effect 单元测试
 */
import { reactive } from '../src/reactive';
import { effect, stop } from '../src/effect';
import { vi } from 'vitest';

describe('effect', () => {
  it('测试 effect 传入的函数 应该 立即执行一次', () => {
    const fnSpy = vi.fn(() => {});
    effect(fnSpy);
    expect(fnSpy).toHaveBeenCalledTimes(1);
  });

  it('测试 effect 观察属性', () => {
    let dummy;
    const counter = reactive({ num: 0 });
    effect(() => (dummy = counter.num));

    expect(dummy).toBe(0);
    counter.num = 11;
    expect(dummy).toBe(11);
  });

  it('测试 effect 观察多个属性', () => {
    let dummy;
    const counter = reactive({ num1: 0, num2: 0 });
    effect(() => (dummy = counter.num1 + counter.num1 + counter.num2));

    expect(dummy).toBe(0);
    counter.num1 = counter.num2 = 7;
    expect(dummy).toBe(21);
  });
  it('测试 effect 触发多个依赖', () => {
    let dummy1, dummy2;
    const counter = reactive({ num: 0 });
    effect(() => (dummy1 = counter.num));
    effect(() => (dummy2 = counter.num));

    expect(dummy1).toBe(0);
    expect(dummy2).toBe(0);
    counter.num++;
    expect(dummy1).toBe(1);
    expect(dummy2).toBe(1);
  });

  it('测试 effect 观察嵌套属性', () => {
    let dummy;
    const counter = reactive({ nested: { num: 0 } });
    effect(() => (dummy = counter.nested.num));

    expect(dummy).toBe(0);
    counter.nested.num = 11;
    expect(dummy).toBe(11);
  });

  it('测试 effect 嵌套调用', () => {
    let dummy;
    const counter = reactive({ num: 0 });
    effect(() => (dummy = getNum()));

    function getNum() {
      return counter.num;
    }

    expect(dummy).toBe(0);
    counter.num = 11;
    expect(dummy).toBe(11);
  });
  // vue3 中的 scheduler 单元测试原版
  // scheduler 参数的作用：
  // 1. 通过 effect 第一个参数 fn ，第二个参数给定option 对象中的scheduler : fn2
  // 2. effect 创建的时候（第一次执行）的时候，会执行 fn1
  // 3. 当响应式对象 set update 的时候，而是执行 fn2
  // 4. 当执行 effect 返回的 runner 函数的时候，会执行 fn1
  it('scheduler', () => {
    let dummy;
    let run: any;
    const scheduler = vi.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });
    // 在传入 fn 之后还传入了第二个参数
    // 第二个对象是一个 option 对象
    // option.scheduler 是一个函数
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      { scheduler }
    );
    // scheduler 一开始不会被调用
    expect(scheduler).not.toHaveBeenCalled();
    // effect 中的第一个参数 fn 会被调用
    expect(dummy).toBe(1);
    // 响应式对象 obj.foo 的值发生变化
    obj.foo++;
    // fn 不会被调用
    // 而是调用了 scheduler
    expect(scheduler).toHaveBeenCalledTimes(1);
    expect(dummy).toBe(1);
    // 当执行 effect 返回的函数时
    run();
    // fn 会被调用
    // scheduler 不调用
    expect(dummy).toBe(2);
  });

  it('stop', () => {
    let dummy;
    const obj = reactive({ prop: 1 });
    // effect 返回一个 runner 函数
    const runner = effect(() => {
      dummy = obj.prop;
    });
    obj.prop = 2;
    expect(dummy).toBe(2);
    // 调用 effect 模块中的 stop 方法，停止依赖的触发
    stop(runner);
    // 案例1：直接重新复制，案例通过
    // obj.prop = 3;
    // 案例2：使用 ++ 操作，案例不通过，因为 ++ 操作是先取值，再赋值
    // 取值的时候，会触发 get 操作，get 操作会触发 track 函数
    // 所以会把 effect 函数再次收集起来，之前就白删除了
    obj.prop++;
    // 这个地方 函数就没有被 触发
    expect(dummy).toBe(2);

    // 重新运行 runner 函数
    runner();
    // 函数再次触发
    expect(dummy).toBe(3);
  });

  it('events: onStop', () => {
    const onStop = vi.fn();

    // 创建 effect 的时候，传入第二个参数 option 对象的 onStop 属性
    // option.onStop 是一个函数
    const runner = effect(() => {}, {
      onStop,
    });

    //　当调用 stop 的时候，onStop 会被执行一次，也就是 stop 函数的回调函数
    stop(runner);
    expect(onStop).toHaveBeenCalled();
  });
});
