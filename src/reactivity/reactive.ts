/*
 * @Author: hansy hanshunyao_hansy@163.com
 * @Date: 2025-03-07 14:54:23
 * @LastEditors: Hansy hanshunyao_hansy@163.com
 * @LastEditTime: 2025-03-09 18:14:57
 * @FilePath: \mini-vue\src\reactivity\reactive.ts
 * @Description: reactive 主逻辑
 */
import {
  mutableHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers,
} from './baseHandlers';

export const reactiveMap = new WeakMap();
export const readonlyMap = new WeakMap();
export const shallowReadonlyMap = new WeakMap();

// 用于判断对象的类型，这个地方提出来，提成常数类型 方便后序更改
// 判断 isProxy
// 判断 isReactive
// 判断 isReadonly
// 判断 isRaw
export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
  RAW = '__v_raw',
}

export function reactive(target) {
  // createReactiveObject 提出公共方法，可以根据传入参数的不同实现 readonly 、readonly 和 shallowReadonly 功能
  return createReactiveObject(target, reactiveMap, mutableHandlers);
}

export function readonly(target) {
  // 创建只读响应式对象
  return createReactiveObject(target, readonlyMap, readonlyHandlers);
}

export function shallowReadonly(target) {
  // 创建 表层只读响应式对象
  return createReactiveObject(
    target,
    shallowReadonlyMap,
    shallowReadonlyHandlers
  );
}

export function isProxy(value) {
  // 只要 是 reactive 或者 readonly 都是 proxy 对象
  return isReactive(value) || isReadonly(value);
}

export function isReactive(value) {
  // 只要是 proxy 的话，那么会触发 get 操作
  // 出发get操作就会触发 createGetter 里面的判断
  // createGetter 里面增加了判断，如果 get 操作获取的 key 是当前value 查询的 的key
  // 就会返回 创建 getter 的时候 传入的 isReadonly 的非值，如果不是 readonly 就证明是 reactive
  // 如果这个地方不是 proxy 直接就会返回 false
  return !!value[ReactiveFlags.IS_REACTIVE];
}

export function isReadonly(value) {
  // 与上面 isReactive 逻辑一样
  // 这里面获取了特定的 key 值，如果 value 是 proxy 的话，就会触发 get
  // 就会触发 createGetter 里面的判断，返回 创建 getter 时的 readonly的值
  // 如果不是 proxy 直接就会返回 false
  return !!value[ReactiveFlags.IS_READONLY];
}

export function toRaw(value) {
  // 如果 value 是 proxy 的话 ,那么直接返回就可以了
  // 因为会触发 createGetter 内的逻辑
  // 如果 value 是普通对象的话，
  // 我们就应该返回普通对象
  // 只要不是 proxy ，只要是得到了 undefined 的话，那么就一定是普通对象
  if (!value[ReactiveFlags.RAW]) {
    return value;
  }

  return value[ReactiveFlags.RAW];
}

function createReactiveObject(target, proxyMap, baseHandlers) {
  // 核心就是 proxy
  // 目的是可以侦听到用户 get 或者 set 的动作

  // 如果命中的话就直接返回就好了
  // 使用缓存做的优化点
  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }

  const proxy = new Proxy(target, baseHandlers);

  // 把创建好的 proxy 给存起来
  proxyMap.set(target, proxy);
  return proxy;
}
