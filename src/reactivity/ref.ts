/*
 * @Author: Hansy hanshunyao_hansy@163.com
 * @Date: 2025-03-08 14:42:33
 * @LastEditors: Hansy hanshunyao_hansy@163.com
 * @LastEditTime: 2025-03-09 21:59:37
 * @FilePath: \mini-vue\src\reactivity\ref.ts
 * @Description: ref 主逻辑
 */
import { trackEffects, triggerEffects, isTracking } from "./effect";
import { createDep } from "./dep";
import { isObject, hasChanged } from "../shared/index";
import { reactive } from "./reactive";

// 这个的 ref 和 reactive 的区别就是
// reactive 收集依赖是 根据 ReactiveEffect 触发的不同的 key 在dep 中储存的
// 而 ref 就一个 key value 所以收集依赖的时候 就把 全局变量 activeEffect 收集到 dep 里面就可以了

// 这里面 ref 的实现逻辑
// 其实 ref 就是对于单值的响应式
// 但是就无法像之前的 reactive 一样 使用 proxy 的方法完成
// 所以这里就通过对象来包裹，这里就是用的 RefImpl 类来完成
// 这个类里面有个 value 的属性 就可以绑定 set get 方法，这样的话就可以直到什么时候 依赖收集什么时候触发依赖
// 这也就是为什么 我们用 ref 的时候会有 .value 这个概念
export class RefImpl {
  private _rawValue: any;
  private _value: any;
  public dep;
  public __v_isRef = true;


  constructor(value) {
    // 如果 传进来的 value 是一个对象的话，这个 this._value 就是 proxy 代理对象了
    // 所以在 这个地方 保存一下对象原先的地址
    this._rawValue = value;
    // 看看value 是不是一个对象，如果是一个对象的话
    // 那么需要用 reactive 包裹一下
    this._value = convert(value);
    this.dep = createDep();
  }

  get value() {
    // 收集依赖
    trackRefValue(this);
    return this._value;
  }

  set value(newValue) {
    // 当新的值不等于老的值的话，
    // 那么才需要触发依赖

    // 这里需要注意的是
    // 如果 传进来的 value 是一个对象的话，这个地方要和原来的地址比 不能和代理对象比
    if (hasChanged(newValue, this._rawValue)) {
      // 更新值 
      // 和上面同理 也得重新存一下 新的原始对象的地址
      this._value = convert(newValue);
      this._rawValue = newValue;
      // 触发依赖
      triggerRefValue(this);
    }
  }
}

export function ref(value) {
  return createRef(value);
}

function convert(value) {
  // 如果是一个对象的话，那么就需要用 reactive 包裹一下
  return isObject(value) ? reactive(value) : value;
}

function createRef(value) {
  const refImpl = new RefImpl(value);

  return refImpl;
}

export function triggerRefValue(ref) {
  triggerEffects(ref.dep);
}

export function trackRefValue(ref) {
  // 这里收集依赖 和 reactive 不同，因为 reactive 有多个 key 所以在外面有个 map 存着 key 和 依赖的对应关系
  // 而 ref 只有一个 value 所以直接把 activeEffect 收集到 RefImpl 实例的 dep 里面就可以了
  if (isTracking()) {
    trackEffects(ref.dep);
  }
}

// 这个函数的目的是
// 帮助解构 ref
// 比如在 template 中使用 ref 的时候，直接使用就可以了
// 例如： const count = ref(0) -> 在 template 中使用的话 可以直接 count
// 解决方案就是通过 proxy 来对 ref 做处理
const shallowUnwrapHandlers = {
  get(target, key, receiver) {
    // 如果里面是一个 ref 类型的话，那么就返回 .value
    // 如果不是的话，那么直接返回value 就可以了
    return unRef(Reflect.get(target, key, receiver));
  },
  set(target, key, value, receiver) {
    // 如果旧的值 是一个 ref 类型的话 并且新的值 不是一个 ref 的话 就可以直接给旧的value 赋值
    // 除此之外 直接替换
    const oldValue = target[key];
    if (isRef(oldValue) && !isRef(value)) {
      return (target[key].value = value);
    } else {
      return Reflect.set(target, key, value, receiver);
    }
  },
};

// 这里没有处理 objectWithRefs 是 reactive 类型的时候
// TODO reactive 里面如果有 ref 类型的 key 的话， 那么也是不需要调用 ref.value 的
// （but 这个逻辑在 reactive 里面没有实现）
export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, shallowUnwrapHandlers);
}

// 把 ref 里面的值拿到
export function unRef(ref) {
  // 返回 ref 的值
  // 如果是 ref 类型的话，那么就返回 value
  // 如果不是的话，那么就返回本身
  return isRef(ref) ? ref.value : ref;
}

export function isRef(value) {
  // 这个地方 不像 reactive 一样， reactive 里面 有 readoly 这些词 只能分开判断
  // 而 ref 里面 只要有 一种状态，所以直接在构造函数中 就给这个 ref 加上一个 __v_isRef 属性就可以了
  // 所以 如果是 ref ，通过 refImpl 构造函数出来的对象一定有这个属性
  return !!value.__v_isRef;
}
