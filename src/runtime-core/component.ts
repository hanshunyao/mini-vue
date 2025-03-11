import { PublicInstanceProxyHandlers } from './componentPublicInstance';

export function createComponentInstance(vnode, parent) {
  const instance = {
    vnode,
    // 这个地方 把 vnode.type 赋值给 instance.type
    // 这样后面使用的时候就不用 instance.vnode.type 了
    // 直接 instance.type 就可以了
    type: vnode.type,
    setupState: {},
    parent,
  };

  return instance;
}

export function setupComponent(instance) {
  const { props, children } = instance.vnode;

  // 初始化 props
  // TODO： 后续实现 初始化 props 和 slots
  // 1. 处理 参数 props
  // initProps();
  // 2. 处理 插槽 slot
  // initSlots();

  // 3. 处理调用setup 的返回值
  // 初始化有状态的component
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: any) {
  // 这里的空对象就是一个 ctx ，为的是访问 代理的时候直接能获取到 setupState 的属性
  // 方便用户在 render 中 使用 this 就可以 访问 setup 中的属性
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);

  const Component = instance.type;
  // 解构出 组件中的 setup 方法
  const { setup } = Component;
  if (setup) {
    // 调用 setup 方法
    // 这里 setupResult 可能是 function 也可能是 object
    // 如果是 function 就认为是组件的 render 函数
    // 如果是 object 就把返回的对象注入到组件上下文中

    let setupResult = setup();

    handleSetupResult(instance, setupResult);
  }
}
function handleSetupResult(instance: any, setupResult: any) {
  // TODO：这个地方需要判断 是 function 还是 object
  // 这里先处理 Object的
  if (typeof setupResult === 'object') {
    // 把 setupResult 注入到组件实例上
    instance.setupState = setupResult;
  }

  // 这里保证组件的 render 函数一定存在
  finishComponentSetup(instance);
}

function finishComponentSetup(instance: any) {
  const Component = instance.type;
  // TODO：处理后续 如果组件上没有 render 函数的情况

  if (Component.render) {
    instance.render = Component.render;
  }
}
