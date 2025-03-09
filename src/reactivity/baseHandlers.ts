/*
 * @Author: hansy hanshunyao_hansy@163.com
 * @Date: 2025-03-07 14:56:30
 * @LastEditors: Hansy hanshunyao_hansy@163.com
 * @LastEditTime: 2025-03-09 18:17:35
 * @FilePath: \mini-vue\src\reactivity\baseHandlers.ts
 * @Description: 用于生成响应式对象的 getter 和 setter
 */
import { track, trigger } from "./effect";
import {
  reactive,
  ReactiveFlags,
  reactiveMap,
  readonly,
  readonlyMap,
  shallowReadonlyMap,
} from "./reactive";
import { isObject } from "@mini-vue/shared";

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);

function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    const isExistInReactiveMap = () =>
      key === ReactiveFlags.RAW && receiver === reactiveMap.get(target);

    const isExistInReadonlyMap = () =>
      key === ReactiveFlags.RAW && receiver === readonlyMap.get(target);

    const isExistInShallowReadonlyMap = () =>
      key === ReactiveFlags.RAW && receiver === shallowReadonlyMap.get(target);

    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    } else if (
      isExistInReactiveMap() ||
      isExistInReadonlyMap() ||
      isExistInShallowReadonlyMap()
    ) {
      return target;
    }

    const res = Reflect.get(target, key, receiver);

    // readonly 不会触发 set 操作，所以也不用进行依赖收集
    if (!isReadonly) {
      // 在触发 get 的时候进行依赖收集
      track(target, "get", key);
    }

    // 浅层的 readonly 内部对象不是响应式对象 不需要递归，直接返回
    if (shallow) {
      return res;
    }

    if (isObject(res)) {
      // 如果说这个 res 值是一个对象的话，那么我们需要把获取到的 res 也转换成 reactive
      // 把内部所有的是 object 的值都用 reactive 包裹，变成响应式对象
      // res 等于 target[key]
      // 如果 target 是只读的，那么 res 也应该是只读的
      return isReadonly ? readonly(res) : reactive(res);
    }

    return res;
  };
}

function createSetter() {
  return function set(target, key, value, receiver) {
    const result = Reflect.set(target, key, value, receiver);

    // 在触发 set 的时候进行触发依赖
    trigger(target, "set", key);

    return result;
  };
}

export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key) {
    // readonly 的响应式对象不可以修改值，直接抛出警告
    console.warn(
      `Set operation on key "${String(key)}" failed: target is readonly.`,
      target
    );
    return true;
  },
};

export const mutableHandlers = {
  get,
  set,
};

export const shallowReadonlyHandlers = {
  get: shallowReadonlyGet,
  set(target, key) {
    // readonly 的响应式对象不可以修改值
    console.warn(
      `Set operation on key "${String(key)}" failed: target is readonly.`,
      target
    );
    return true;
  },
};
