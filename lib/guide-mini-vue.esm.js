const publicPropertiesMap = {
    // 当用户调用 instance.proxy.$emit 时就会触发这个函数
    // i 就是 instance 的缩写 也就是组件实例对象
    $el: (i) => i.vnode.el,
};
const PublicInstanceProxyHandlers = {
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
    const { shapeFlag } = vnode;
    // 这个地方使用 与的操作，与的特点是 都是1 ，结果才是 1，只要有一个是 0 ，结果就是 0
    // ShapeFlags 中的类型 在其算表示的位上 为 1 其他位都是0 ，所以 只要是 这个 虚拟节点的该位上 为1 就返回有值，如果虚拟节点这位不是 1 那整个结果都是 0
    if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
        // 处理 element 类型
        processElement(vnode, container);
    }
    else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
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
    const { props, shapeFlag } = vnode;
    // 如果 children 是 string 类型
    if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        el.textContent = vnode.children;
    }
    else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
        // 如果 children 是 array 类型
        // 递归处理
        mountChildren(vnode.children, el);
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
function mountComponent(initialVNode, container) {
    // 初始化组件
    console.log('初始化组件');
    // 通过虚拟节点 创建出 组件实例对象
    // 后面组件的所有属性都可以挂在到这个 实例对象上
    const instance = createComponentInstance(initialVNode, container);
    // 处理组件的 setup
    // setupComponent 处理3件事
    // 1. 处理 参数 props
    // 2. 处理 插槽 slot
    // 3. 处理 执行 setup 返回的值 挂载到实例上，并确保 组件有 render方法
    setupComponent(instance);
    // 在 setupComponent 中处理完 setup 并确认 render 函数存在后
    // 该调用 render 函数来生成 虚拟 dom 树
    setupRenderEffect(instance, initialVNode, container);
}
function setupRenderEffect(instance, initialVNode, container) {
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
    initialVNode.el = subTree.el;
}

// 这里后面两个参数可选
const createVNode = function (type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapeFlag: getShapeFlag(type),
        // 初始化时 el 设置为 null，后面这个字段用于存储根节点 通过 $el 访问
        el: null
    };
    // 基于 children 再次设置 shapeFlag
    if (Array.isArray(children)) {
        // 这里用了 或 的操作 ，或 是 都是 0 ，结果才是 0，只要有一个是 1 ，结果就是 1
        // 这两个 type 在自己 对应的位上都是 1 所以只要 和 之前的类型 或 上，结果就肯定在原有基础上 把新的位置为1
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    else if (typeof children === "string") {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    // normalizeChildren(vnode, children);
    return vnode;
};
// export function normalizeChildren(vnode, children) {
//   if (typeof children === "object") {
//     // 暂时主要是为了标识出 slots_children 这个类型来
//     // 暂时我们只有 element 类型和 component 类型的组件
//     // 所以我们这里除了 element ，那么只要是 component 的话，那么children 肯定就是 slots 了
//     if (vnode.shapeFlag & ShapeFlags.ELEMENT) {
//       // 如果是 element 类型的话，那么 children 肯定不是 slots
//     } else {
//       // 这里就必然是 component 了,
//       vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN;
//     }
//   }
// }
// 基于 type 来判断是什么类型的组件
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1 /* ShapeFlags.ELEMENT */
        : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

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
