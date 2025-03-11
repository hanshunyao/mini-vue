function createComponentInstance(vnode, parent) {
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
function setupComponent(instance) {
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
function setupStatefulComponent(instance) {
    const Component = instance.type;
    // 这里的空对象就是一个 ctx ，为的是访问 代理的时候直接能获取到 setupState 的属性
    // 方便用户在 render 中 使用 this 就可以 访问 setup 中的属性
    instance.proxy = new Proxy({}, {
        get(target, key) {
            const { setupState } = instance;
            // 这里 看要获取的值在不在 setupState 中，在就返回
            if (key in setupState) {
                return setupState[key];
            }
            if (key === '$el') {
                return instance.vnode.el;
            }
        },
    });
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
function handleSetupResult(instance, setupResult) {
    // TODO：这个地方需要判断 是 function 还是 object
    // 这里先处理 Object的
    if (typeof setupResult === 'object') {
        // 把 setupResult 注入到组件实例上
        instance.setupState = setupResult;
    }
    // 这里保证组件的 render 函数一定存在
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    // TODO：处理后续 如果组件上没有 render 函数的情况
    if (Component.render) {
        instance.render = Component.render;
    }
}

const isObject = (val) => {
    return val !== null && typeof val === "object";
};

function render(vnode, container) {
    // 调用 patch
    // 后续方便递归
    console.log('调用 patch');
    patch(vnode, container);
}
function patch(vnode, container) {
    // TODO：这个地方需要是初始化还是 update
    // 现在是直接处理 初始化
    // 后续会处理 update
    if (typeof vnode.type === 'string') {
        // 处理 element 类型
        processElement(vnode, container);
    }
    else if (isObject(vnode.type)) {
        // 处理 component 类型
        processComponent(vnode, container);
    }
}
function processElement(vnode, container) {
    // 判断是初始化还是更新
    // 现在是直接处理 初始化
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    const el = document.createElement(vnode.type);
    vnode.el = el;
    const { children, props } = vnode;
    // 如果 children 是 string 类型
    if (typeof children === 'string') {
        el.textContent = children;
    }
    else if (Array.isArray(children)) {
        // 如果 children 是 array 类型
        // 递归处理
        mountChildren(children, el);
    }
    for (const key in props) {
        const val = props[key];
        el.setAttribute(key, val);
    }
    container.append(el);
}
function mountChildren(children, el) {
    children.forEach((v) => {
        patch(v, el);
    });
}
function processComponent(vnode, container) {
    // TODO：这个地方需要判断 是首次挂载还是节点更新
    // 现在是直接处理 组件首次挂载
    mountComponent(vnode, container);
}
function mountComponent(vnode, container) {
    // 初始化组件
    console.log('初始化组件');
    // 通过虚拟节点 创建出 组件实例对象
    // 后面组件的所有属性都可以挂在到这个 实例对象上
    const instance = createComponentInstance(vnode, container);
    // 处理组件的 setup
    // setupComponent 处理3件事
    // 1. 处理 参数 props
    // 2. 处理 插槽 slot
    // 3. 处理 执行 setup 返回的值 挂载到实例上，并确保 组件有 render方法
    setupComponent(instance);
    // 在 setupComponent 中处理完 setup 并确认 render 函数存在后
    // 该调用 render 函数来生成 虚拟 dom 树
    setupRenderEffect(instance, vnode, container);
}
function setupRenderEffect(instance, vnode, container) {
    const { proxy } = instance;
    // subTree 就是组件的虚拟 dom 树
    // 这里 render 绑定一下 this 指向，指到 初始化时候的代理上
    const subTree = instance.render.call(proxy);
    // vnode -> patch
    // vnode -> element -> mountElement
    // 这个地方 要把所有的 vnode 再通过 patch 方法挂在到容器上
    patch(subTree, container);
    // 其上上面的操作 setupComponent 就是初始化 把 components 的信息收集到实例上
    // component 就相当于 一个箱子，调用 render 方法进行拆箱
    // 把内部需要渲染的 element 节点返回出来，之后通过 patch 挂在到对应的节点上
    // 这个地方处理完了所有的 element 节点，subTree 就是根节点
    vnode.el = subTree.el;
}

// 这里后面两个参数可选
const createVNode = function (type, props, children) {
    const vnode = {
        type,
        props,
        children,
        // 初始化时 el 设置为 null，后面这个字段用于存储根节点 通过 $el 访问
        el: null
    };
    return vnode;
};

// 这里 调用 createdApp 传入 根组件
// 然后返回一个 app 对象
function createApp(rootComponent) {
    // 返回的对象中 有着 mount 方法用于挂载根节点
    // 这里的 rootContainer 就是根节点
    const app = {
        _component: rootComponent,
        mount(rootContainer) {
            console.log("基于根组件创建 vnode");
            // 把根组件转换成 vnode
            // 后续所有的操作都会基于 vnode 做处理
            const vnode = createVNode(rootComponent);
            console.log("调用 render，基于 vnode 进行开箱");
            render(vnode, rootContainer);
        },
    };
    return app;
}

// h 就是调用 createVNode 对于外部用户更方便使用
const h = (type, props = null, children = []) => {
    return createVNode(type, props, children);
};

export { createApp, h };
