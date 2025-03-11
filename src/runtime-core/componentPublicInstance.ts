const publicPropertiesMap = {
  // 当用户调用 instance.proxy.$emit 时就会触发这个函数
  // i 就是 instance 的缩写 也就是组件实例对象
  $el: (i) => i.vnode.el,
};

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    // 用户访问 proxy[key]
    // 这里就匹配一下看看是否有对应的 function
    // 有的话就直接调用这个 function
    const { setupState } = instance;

    if (key in setupState) {
      return setupState[key];
    }

    // 看看 key 是不是在 publicPropertiesMap 中
    // 有的话就直接调用
    const publicGetter = publicPropertiesMap[key];

    if (publicGetter) {
      return publicGetter(instance);
    }
  },
};
