/*
 * @Author: hansy hanshunyao_hansy@163.com
 * @Date: 2025-03-07 15:39:01
 * @LastEditors: Hansy hanshunyao_hansy@163.com
 * @LastEditTime: 2025-03-09 22:22:11
 * @FilePath: \mini-vue\src\reactivity\computed.ts
 * @Description: computed 主逻辑
 */
import { createDep } from "./dep";
import { ReactiveEffect } from "./effect";
import { trackRefValue, triggerRefValue } from "./ref";

export class ComputedRefImpl {
  public dep: any;
  public effect: ReactiveEffect;

  private _dirty: boolean;
  private _value

  constructor(getter) {
    this._dirty = true;
    this.dep = createDep();
    // 这里将 用户传入的 fn 转变成一个 ReactiveEffect 
    // 这里 第一次 会执行 getter 后面会执行 scheduler
    // 每次 依赖的响应式数据发生变化的时候，就会执行 scheduler
    // 就会把 this._dirty 的开关打开 get 方法就可以重新获取数据了
    this.effect = new ReactiveEffect(getter, () => {
      if (this._dirty) return;
      this._dirty = true;
      triggerRefValue(this);
    });
  }

  get value() {
    // 收集依赖
    // compouted 和 ref 的收集依赖一个道理
    // 都是只有 .value 一个属性
    trackRefValue(this);
    // 这里就是缓存实现的核心
    // 当 执行过 一次 computed 的 get 操作的时候，this._dirty 会变为 false 把 重新获取数据的方法锁上
    // 当 依赖的响应式数据发生变化的时候，this._dirty 的值会变为 true 把 重新获取数据的方法解锁
  // 这样就相当于 数据没改变的时候 获取的是缓存，改变了 就重新获取数据
    if (this._dirty) {
      this._dirty = false;
      // 这里执行 run 的话，就是执行用户传入的 fn
      this._value = this.effect.run();
    }

    return this._value;
  }
}

export function computed(getter) {
  return new ComputedRefImpl(getter);
}
