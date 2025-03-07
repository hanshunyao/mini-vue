/*
 * @Author: hansy hanshunyao_hansy@163.com
 * @Date: 2025-03-07 14:56:39
 * @LastEditors: hansy hanshunyao_hansy@163.com
 * @LastEditTime: 2025-03-07 22:19:20
 * @FilePath: \mini-vue\src\reactivity\effect.ts
 * @Description: effect 逻辑
 */
import { createDep } from './dep';
import { extend } from '@mini-vue/shared';

let activeEffect = void 0;
let shouldTrack = false;
const targetMap = new WeakMap();

// 用于依赖收集
export class ReactiveEffect {
  // 默认状态 true , 当调用 stop 后变为 false 后续再次调用stop 跳过遍历逻辑 节省效率
  active = true;
  //　反向收集 依赖 , deps 里面装的是 所有依赖该实例的响应式对象
  deps = [];
  // effect 第二个参数 options.onStop
  // 用于在 stop 后的回调函数
  public onStop?: () => void;
  // fn 是用户传入的函数
  // scheduler 可选
  // trigger 执行时 如果有 scheduler 就执行 effect 的 scheduler
  // 如果没有 就执行 effect.run
  constructor(public fn, public scheduler?) {
    console.log('创建 ReactiveEffect 对象');
  }

  run() {
    console.log('run');
    // 运行 run 的时候，可以控制 要不要执行后续收集依赖的一步
    // 目前来看的话，只要执行了 fn 那么就默认执行了收集依赖
    // 这里就需要控制了

    // 是不是收集依赖的变量

    // 执行 fn  但是不收集依赖
    if (!this.active) {
      return this.fn();
    }

    // 执行 fn  收集依赖
    // 可以开始收集依赖了
    shouldTrack = true;

    // 执行的时候给全局的 activeEffect 赋值
    // 利用全局属性来获取当前的 effect
    activeEffect = this as any;
    // 执行用户传入的 fn
    console.log('执行用户传入的 fn');
    const result = this.fn();
    // 重置
    shouldTrack = false;
    activeEffect = undefined;

    return result;
  }

  stop() {
    if (this.active) {
      // 如果第一次执行 stop 后 active 就 false 了
      // 这是为了防止重复的调用，执行 stop 逻辑
      cleanupEffect(this);
      // 如果传入了 option.onStop 就在 stop 后执行函数
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}

function cleanupEffect(effect) {
  // 找到所有依赖这个 effect 的响应式对象
  // 从这些响应式对象里面把 effect 给删除掉
  effect.deps.forEach((dep) => {
    dep.delete(effect);
  });

  effect.deps.length = 0;
}

export function effect(fn, options = {}) {
  // 这个地方使用了面向对象的思想，将函数抽象成一个类
  // 给每个类 都带有一个 run 方法
  // 在执行 run 方法的时候进行依赖收集
  const _effect = new ReactiveEffect(fn);

  // 把用户传过来的值合并到 _effect 对象上去
  // 优点是 后续不管 options 有多少个属性，都可以合并到 _effect 对象上
  // 缺点就是不是显式的，看代码的时候并不知道有什么属性
  // 这个地方 参考 @vue/shared 把公共方法提取到了 shared 中，其实封装的就是 Object.assign
  extend(_effect, options);
  _effect.run();

  // 把 _effect.run 这个方法返回
  // 让用户可以自行选择调用的时机（调用 fn）
  const runner: any = _effect.run.bind(_effect);
  // 把 _effect 对象挂载到 runner 上
  // 这样 调用 stop 的时候就可以通过 runner 上面的 effect.stop 方法实现
  runner.effect = _effect;
  return runner;
}

export function stop(runner) {
  runner.effect.stop();
}

export function track(target, type, key) {
  if (!isTracking()) {
    return;
  }
  console.log(`触发 track -> target: ${target} type:${type} key:${key}`);
  // 先基于 对象 找到对应的 map
  // 这个 map 是所有的依赖数据
  // 如果是第一次的话，那么就需要初始化
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    // 初始化 depsMap 的逻辑
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  // 通过 对象 改变的 key 来查询 所有的依赖 effect
  // 这里 查出来的 dep 是一个 set 来确保 依赖不会被重复收集
  let dep = depsMap.get(key);

  if (!dep) {
    dep = createDep();
    depsMap.set(key, dep);
  }

  trackEffects(dep);
}

export function trackEffects(dep) {
  // 传进来的 dep 是 该 key 之前所对应的 effect 列表
  // 要把新收集到的 effct 加入到 dep 中

  // 这里是一个优化点
  // 先看看这个依赖是不是已经收集了，
  // 已经收集的话，那么就不需要在收集一次了
  // 可能会影响 code path change 的情况
  // 需要每次都 cleanupEffect
  // shouldTrack = !dep.has(activeEffect!);
  // 这里是一个 反向收集依赖
  // dep 里面 里面存的是 依赖这个响应式对象的 所有 effct
  // 同时 也把这个 响应式对象 回传到 effct 里面进行存储
  // 这个 effect.deps 里面存的是 所有依赖这个 effect 的响应式对象
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    (activeEffect as any).deps.push(dep);
  }
}

export function trigger(target, type, key) {
  // 1. 先收集所有的 dep 放到 deps 里面，
  // 后面会统一处理
  let deps: Array<any> = [];
  // dep

  const depsMap = targetMap.get(target);

  if (!depsMap) return;

  // 暂时只实现了 GET 类型
  // get 类型只需要取出来就可以
  const dep = depsMap.get(key);

  // 最后收集到 deps 内
  deps.push(dep);

  const effects: Array<any> = [];
  deps.forEach((dep) => {
    // 这里解构 dep 得到的是 dep 内部存储的 effect
    effects.push(...dep);
  });
  // 这里的目的是只有一个 dep ，这个dep 里面包含所有的 effect
  // 这里的目前应该是为了 triggerEffects 这个函数的复用
  triggerEffects(createDep(effects));
}

export function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}

export function triggerEffects(dep) {
  // 执行收集到的所有的 effect 的 run 方法
  for (const effect of dep) {
    if (effect.scheduler) {
      // scheduler 可以让用户自己选择调用的时机
      // 这样就可以灵活的控制调用了
      // 在 runtime-core 中，就是使用了 scheduler 实现了在 next ticker 中调用的逻辑
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}
