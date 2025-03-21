import { getCurrentInstance } from "./component";

export function provide(key, value) {
  // 获取 执行 setup 前存的 全局变量 这个是当前组件的 instance 实例
  const currentInstance = getCurrentInstance();

  if (currentInstance) {
    // 获取当前组件的 provides
    let { provides } = currentInstance;
    // 获取当前组件的父级组件的 provides
    const parentProvides = currentInstance.parent?.provides;

    // 这里要解决一个问题
    // 当父级 key 和 爷爷级别的 key 重复的时候，对于子组件来讲，需要取最近的父级别组件的值
    // 那这里的解决方案就是利用原型链来解决
    // provides 初始化的时候是在 createComponent 时处理的，当时是直接把 parent.provides 赋值给组件的 provides 的
    // 所以，如果说这里发现 provides 和 parentProvides 相等的话，那么就说明是第一次做 provide(对于当前组件来讲)
    // 我们就可以把 parent.provides 作为 currentInstance.provides 的原型重新赋值
    // 至于为什么不在 createComponent 的时候做这个处理，可能的好处是在这里初始化的话，是有个懒执行的效果（优化点，只有需要的时候在初始化）
    if (parentProvides === provides) {
      // 这个地方借用了原型链的特性，如果 改写了 子的实现 是不会改写父的方法的
      // 如果子上没有这个方法，会去父上找
      provides = currentInstance.provides = Object.create(parentProvides);
    }

    // 赋值
    provides[key] = value;
  }
}

export function inject(key, defaultValue) {
  const currentInstance = getCurrentInstance();
  if (currentInstance) {
    const provides = currentInstance.parent?.provides;

    // 如果找到值了就返回值
    // 如果没找到就看有没有传默认值，传了就返回默认值
    if (key in provides) {
      return provides[key];
    } else if (defaultValue) {
      // 如果是函数就执行函数 返回函数返回值
      // 否则就直接返回
      if (typeof defaultValue === "function") {
        return defaultValue();
      }
      return defaultValue;
    }
  }
}
