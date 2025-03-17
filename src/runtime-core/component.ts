import { initProps } from './componentProps';
import { initSlots } from './componentSlots';
import { emit } from './componentEmits';
import { PublicInstanceProxyHandlers } from './componentPublicInstance';
import { proxyRefs, shallowReadonly } from 'src/reactivity';

export function createComponentInstance(vnode, parent) {
  const instance = {
    // 这个地方 把 vnode.type 赋值给 instance.type
    // 这样后面使用的时候就不用 instance.vnode.type 了
    // 直接 instance.type 就可以了
    type: vnode.type,
    vnode,
    // 获取 parent 的 provides 作为当前组件的初始化值 这样就可以继承 parent.provides 的属性了
    provides: parent ? parent.provides : {},
    proxy: null,
    // 组件的 attrs
    attrs: {},
    isMounted: false, // 是否首次挂载（初始化）
    props: {},
    slots: {},
    parent,
    ctx: {}, // context 对象
    setupState: {}, // 存储 setup 的返回值
    emit: () => {},
  };

  // 在 prod 坏境下的 ctx 只是下面简单的结构
  // 在 dev 环境下会更复杂
  instance.ctx = {
    _: instance,
  };

  // 赋值 emit
  // 这里使用 bind 把 instance 进行绑定
  // 后面用户使用的时候只需要给 event 和参数即可
  instance.emit = emit.bind(null, instance) as any;

  return instance;
}

export function setupComponent(instance) {
  const { props, children } = instance.vnode;
  // 初始化 props
  // 1. 处理 参数 props
  initProps(instance, props);
  // 2. 处理 插槽 slot
  initSlots(instance, children);
  // 3. 处理调用setup 的返回值
  // 初始化有状态的component
  // 源码里面有两种类型的 component
  // 一种是基于 options 创建的
  // 还有一种是 function 的
  // 这里处理的是 options 创建的
  // 叫做 stateful 类型
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: any) {
  console.log('创建 proxy');
  // 1. 先创建代理 proxy
  // 这里的空对象就是一个 ctx ，为的是访问 代理的时候直接能获取到 setupState 的属性
  // 方便用户在 render 中 使用 this 就可以 访问 setup 中的属性
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);

  const Component = instance.type;
  // 2. 调用 setup
  const { setup } = Component;
  if (setup) {
    // 调用 setup 方法
    // 这里 setupResult 可能是 function 也可能是 object
    // 如果是 function 就认为是组件的 render 函数
    // 如果是 object 就把返回的对象注入到组件上下文中

    // 设置当前 currentInstance 的值
    // 必须要在调用 setup 之前
    // 这个地方在 调用 getCurrentInstance 之前就把值保存到全局变量中
    setCurrentInstance(instance);
    const setupContext = createSetupContext(instance);
    // 这里调用 组件中的 setup 方法 并把 props 传进去
    // 这里就 可能调用了 getCurrentInstance 方法，正好上面赋值好了，这里就可以动态的拿到这个组件的实例对象
    // 这样就确保了 在不同的组件 setup 中 调用都可以拿到对应的 实例对象
    // 真实的处理场景里面应该是只在 dev 环境才会把 props 设置为只读的
    const setupResult =
      setup && setup(shallowReadonly(instance.props), setupContext);
    // 这里调用完 setup 方法后，就把全局变量的值清空
    setCurrentInstance(null);
    // 3. 处理 setupResult
    handleSetupResult(instance, setupResult);
  } else {
    finishComponentSetup(instance);
  }
}

function createSetupContext(instance) {
  console.log('初始化 setup context');
  return {
    attrs: instance.attrs,
    slots: instance.slots,
    emit: instance.emit,
    expose: () => {}, // TODO 实现 expose 函数逻辑
  };
}

function handleSetupResult(instance: any, setupResult: any) {
  // setup 返回值不一样的话，会有不同的处理
  // 1. 看看 setupResult 是个什么
  if (typeof setupResult === 'function') {
    // 如果返回的是 function 的话，那么绑定到 render 上
    // 认为是 render 逻辑
    // setup(){ return ()=>(h("div")) }
    instance.render = setupResult;
  } else if (typeof setupResult === 'object') {
    // 返回的是一个对象的话
    // 先存到 setupState 上
    // 先使用 @vue/reactivity 里面的 proxyRefs
    // 后面我们自己构建
    // proxyRefs 的作用就是把 setupResult 对象做一层代理
    // 方便用户直接访问 ref 类型的值
    // 比如 setupResult 里面有个 count 是个 ref 类型的对象，用户使用的时候就可以直接使用 count 了，而不需要在 count.value
    // 这里也就是官网里面说到的自动结构 Ref 类型
    instance.setupState = proxyRefs(setupResult);
  }
  finishComponentSetup(instance);
}

function finishComponentSetup(instance: any) {
  // 给 instance 设置 render

  // 先取到用户设置的 component options
  const Component = instance.type;

  if (!instance.render) {
    // 如果 compile 有值 并且当组件没有 render 函数，那么就需要把 template 编译成 render 函数
    if (compile && !Component.render) {
      if (Component.template) {
        // 这里就是 runtime 模块和 compile 模块结合点
        const template = Component.template;
        Component.render = compile(template);
      }
    }

    instance.render = Component.render;
  }
}

let currentInstance = null;
// 这个接口暴露给用户，用户可以在 setup 中获取组件实例 instance
export function getCurrentInstance(): any {
  return currentInstance;
}

export function setCurrentInstance(instance) {
  // 这个地方 把 赋值操作提取出来了，为的是 以后如果想看 这个变量的赋值情况，就在这个地方打上断点就可以方便调试
  // 这个地方也起到了中间层的作用，如果后面多处调用了 赋值操作，如果没有抽象出来方法的话，不好找寻是哪出赋值的
  // 这样把这个提取出来后，只需要在这里打上断点就可以通过 event 事件栈来看到是谁调用的
  currentInstance = instance;
}

let compile;
export function registerRuntimeCompiler(_compile) {
  compile = _compile;
}
