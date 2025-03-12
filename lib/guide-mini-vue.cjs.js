'use strict';

const isObject = (val) => {
    return val !== null && typeof val === "object";
};
const camelizeRE = /-(\w)/g;
/**
 * @private
 * 把烤肉串命名方式转换成驼峰命名方式
 */
const camelize = (str) => {
    return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ""));
};
function hasOwn(val, key) {
    return Object.prototype.hasOwnProperty.call(val, key);
}
/**
 * @private
 * 首字母大写
 */
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
/**
 * @private
 * 添加 on 前缀，并且首字母大写
 */
const toHandlerKey = (str) => str ? `on${capitalize(str)}` : ``;
// 用来匹配 kebab-case 的情况
// 比如 onTest-event 可以匹配到 T
// 然后取到 T 在前面加一个 - 就可以
// \BT 就可以匹配到 T 前面是字母的位置
const hyphenateRE = /\B([A-Z])/g;
/**
 * @private
 */
const hyphenate = (str) => str.replace(hyphenateRE, "-$1").toLowerCase();

const publicPropertiesMap = {
    // 当用户调用 instance.proxy.$emit 时就会触发这个函数
    // i 就是 instance 的缩写 也就是组件实例对象
    $el: (i) => i.vnode.el,
    $emit: (i) => i.emit,
    $slots: (i) => i.slots,
    $props: (i) => i.props,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // 用户访问 proxy[key]
        // 这里就匹配一下看看是否有对应的 function
        // 有的话就直接调用这个 function
        const { setupState, props } = instance;
        console.log(`触发 proxy hook , key -> : ${key}`);
        if (key[0] !== '$') {
            // 说明不是访问 public api
            // 先检测访问的 key 是否存在于 setupState 中, 是的话直接返回
            if (hasOwn(setupState, key)) {
                return setupState[key];
            }
            else if (hasOwn(props, key)) {
                // 看看 key 是不是在 props 中
                // 代理是可以访问到 props 中的 key 的
                return props[key];
            }
        }
        // 看看 key 是不是在 publicPropertiesMap 中
        // 有的话就直接调用
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
    set({ _: instance }, key, value) {
        const { setupState } = instance;
        if (hasOwn(setupState, key)) {
            // 有的话 那么就直接赋值
            setupState[key] = value;
        }
        return true;
    },
};

function initProps(instance, rawProps) {
    console.log('initProps');
    // TODO
    // 应该还有 attrs 的概念
    // attrs
    // 如果组件声明了 props 的话，那么才可以进入 props 属性内
    // 不然的话是需要存储在 attrs 内
    // 这里暂时直接赋值给 instance.props 即可
    instance.props = rawProps || {};
}

function initSlots(instance, children) {
    // 把 children 存到 instance 上
    const { vnode } = instance;
    console.log('初始化 slots');
    // 前面 vnode 在 createVNode 中已经处理过了经过了位运算，这里可以筛选一下 如果是 slots 就特殊处理
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOTS_CHILDREN */) {
        normalizeObjectSlots(children, (instance.slots = {}));
    }
}
const normalizeSlotValue = (value) => {
    // 把 function 返回的值转换成 array ，这样 slot 就可以支持多个元素了
    return Array.isArray(value) ? value : [value];
};
const normalizeObjectSlots = (rawSlots, slots) => {
    for (const key in rawSlots) {
        // 这个是 父组件上的 插槽方法，找到对应的父组件插槽，把 props 传进去
        const value = rawSlots[key];
        if (typeof value === 'function') {
            // 把这个函数给到slots 对象上存起来
            // 后续在 renderSlots 中调用
            // TODO 这里没有对 value 做 normalize，
            // 默认 slots 返回的就是一个 vnode 对象
            slots[key] = (props) => normalizeSlotValue(value(props));
        }
    }
};

function emit(instance, event, ...rawArgs) {
    console.log('emit', event);
    // 1. emit 是基于 props 里面的 onXXX 的函数来进行匹配的
    // 所以我们先从 props 中看看是否有对应的 event handler
    const props = instance.props;
    // ex: event -> click 那么这里取的就是 onClick
    // 让事情变的复杂一点如果是烤肉串命名的话，需要转换成  change-page -> changePage
    // 需要得到事件名称
    let handler = props[toHandlerKey(camelize(event))];
    // 如果上面没有匹配的话 那么在检测一下 event 是不是 kebab-case 类型
    if (!handler) {
        handler = props[(toHandlerKey(hyphenate(event)))];
    }
    if (handler) {
        handler(...rawArgs);
    }
}

// 用于存储所有的 effect 对象
function createDep(effects) {
    const dep = new Set(effects);
    return dep;
}

/*
 * @Author: hansy hanshunyao_hansy@163.com
 * @Date: 2025-03-07 14:56:39
 * @LastEditors: Hansy hanshunyao_hansy@163.com
 * @LastEditTime: 2025-03-09 18:51:15
 * @FilePath: \mini-vue\src\reactivity\effect.ts
 * @Description: effect 主逻辑
 */
const targetMap = new WeakMap();
function trigger(target, type, key) {
    // 1. 先收集所有的 dep 放到 deps 里面，
    // 后面会统一处理
    let deps = [];
    // dep
    const depsMap = targetMap.get(target);
    if (!depsMap)
        return;
    // 暂时只实现了 GET 类型
    // get 类型只需要取出来就可以
    const dep = depsMap.get(key);
    // 最后收集到 deps 内
    deps.push(dep);
    const effects = [];
    deps.forEach((dep) => {
        // 这里解构 dep 得到的是 dep 内部存储的 effect
        effects.push(...dep);
    });
    // 这里把逻辑抽离出来 到 triggerEffects 中
    // reactive 需要寻找 它需要触发的对应 key 的 依赖集合列表
    // 而 ref 不需要这一步，所以 如果是 ref 调用的时候 就直接 调用 triggerEffects 就可以了
    // 而 reactive 就调用 trigger 找到对应的 set 再进行 triggerEffects
    triggerEffects(createDep(effects));
}
function triggerEffects(dep) {
    // 执行收集到的所有的 effect 的 run 方法
    for (const effect of dep) {
        if (effect.scheduler) {
            // scheduler 可以让用户自己选择调用的时机
            // 这样就可以灵活的控制调用了
            // 在 runtime-core 中，就是使用了 scheduler 实现了在 next ticker 中调用的逻辑
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}

/*
 * @Author: hansy hanshunyao_hansy@163.com
 * @Date: 2025-03-07 14:56:30
 * @LastEditors: hansy hanshunyao_hansy@163.com
 * @LastEditTime: 2025-03-12 17:00:51
 * @FilePath: \mini-vue\src\reactivity\baseHandlers.ts
 * @Description: 用于生成响应式对象的 getter 和 setter
 */
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key, receiver) {
        const isExistInReactiveMap = () => key === "__v_raw" /* ReactiveFlags.RAW */ && receiver === reactiveMap.get(target);
        const isExistInReadonlyMap = () => key === "__v_raw" /* ReactiveFlags.RAW */ && receiver === readonlyMap.get(target);
        const isExistInShallowReadonlyMap = () => key === "__v_raw" /* ReactiveFlags.RAW */ && receiver === shallowReadonlyMap.get(target);
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        else if (isExistInReactiveMap() ||
            isExistInReadonlyMap() ||
            isExistInShallowReadonlyMap()) {
            return target;
        }
        const res = Reflect.get(target, key, receiver);
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
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key) {
        // readonly 的响应式对象不可以修改值，直接抛出警告
        console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`, target);
        return true;
    },
};
const mutableHandlers = {
    get,
    set,
};
const shallowReadonlyHandlers = {
    get: shallowReadonlyGet,
    set(target, key) {
        // readonly 的响应式对象不可以修改值
        console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`, target);
        return true;
    },
};

/*
 * @Author: hansy hanshunyao_hansy@163.com
 * @Date: 2025-03-07 14:54:23
 * @LastEditors: Hansy hanshunyao_hansy@163.com
 * @LastEditTime: 2025-03-09 18:14:57
 * @FilePath: \mini-vue\src\reactivity\reactive.ts
 * @Description: reactive 主逻辑
 */
const reactiveMap = new WeakMap();
const readonlyMap = new WeakMap();
const shallowReadonlyMap = new WeakMap();
function reactive(target) {
    // createReactiveObject 提出公共方法，可以根据传入参数的不同实现 readonly 、readonly 和 shallowReadonly 功能
    return createReactiveObject(target, reactiveMap, mutableHandlers);
}
function readonly(target) {
    // 创建只读响应式对象
    return createReactiveObject(target, readonlyMap, readonlyHandlers);
}
function shallowReadonly(target) {
    // 创建 表层只读响应式对象
    return createReactiveObject(target, shallowReadonlyMap, shallowReadonlyHandlers);
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

function createComponentInstance(vnode, parent) {
    const instance = {
        vnode,
        // 这个地方 把 vnode.type 赋值给 instance.type
        // 这样后面使用的时候就不用 instance.vnode.type 了
        // 直接 instance.type 就可以了
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        parent,
        ctx: {}, // context 对象
        emit: () => { },
    };
    // 在 prod 坏境下的 ctx 只是下面简单的结构
    // 在 dev 环境下会更复杂
    instance.ctx = {
        _: instance,
    };
    // 赋值 emit
    // 这里使用 bind 把 instance 进行绑定
    // 后面用户使用的时候只需要给 event 和参数即可
    instance.emit = emit.bind(null, instance);
    return instance;
}
function setupComponent(instance) {
    const { props, children } = instance.vnode;
    // 初始化 props
    // 1. 处理 参数 props
    initProps(instance, props);
    // 2. 处理 插槽 slot
    initSlots(instance, children);
    // 3. 处理调用setup 的返回值
    // 初始化有状态的component
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    console.log("创建 proxy");
    // 这里的空对象就是一个 ctx ，为的是访问 代理的时候直接能获取到 setupState 的属性
    // 方便用户在 render 中 使用 this 就可以 访问 setup 中的属性
    instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);
    const Component = instance.type;
    // 解构出 组件中的 setup 方法
    const { setup } = Component;
    if (setup) {
        // 调用 setup 方法
        // 这里 setupResult 可能是 function 也可能是 object
        // 如果是 function 就认为是组件的 render 函数
        // 如果是 object 就把返回的对象注入到组件上下文中
        const setupContext = createSetupContext(instance);
        // 这里调用 组件中的 setup 方法 并把 props 传进去
        const setupResult = setup && setup(shallowReadonly(instance.props), setupContext);
        handleSetupResult(instance, setupResult);
    }
}
function createSetupContext(instance) {
    console.log("初始化 setup context");
    return {
        attrs: instance.attrs,
        slots: instance.slots,
        emit: instance.emit,
        expose: () => { }, // TODO 实现 expose 函数逻辑
    };
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
    const isOn = (key) => /^on[A-Z]/.test(key);
    for (const key in props) {
        const val = props[key];
        if (isOn(key)) {
            const event = key.slice(2).toLowerCase();
            el.addEventListener(event, val);
        }
        else {
            el.setAttribute(key, val);
        }
    }
    container.append(el);
}
function mountChildren(children, el) {
    children.forEach((v) => {
        if (v) {
            patch(v, el);
        }
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
        el: null,
    };
    // 基于 children 再次设置 shapeFlag
    if (Array.isArray(children)) {
        // 这里用了 或 的操作 ，或 是 都是 0 ，结果才是 0，只要有一个是 1 ，结果就是 1
        // 这两个 type 在自己 对应的位上都是 1 所以只要 和 之前的类型 或 上，结果就肯定在原有基础上 把新的位置为1
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    else if (typeof children === 'string') {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    // 这里判断一下 children 是不是 slot 如果是 slot 位运算一下，后面处理
    normalizeChildren(vnode, children);
    return vnode;
};
function normalizeChildren(vnode, children) {
    if (typeof children === "object") {
        // 暂时主要是为了标识出 slots_children 这个类型来
        // 暂时我们只有 element 类型和 component 类型的组件
        // 所以我们这里除了 element ，那么只要是 component 的话，那么children 肯定就是 slots 了
        if (vnode.shapeFlag & 1 /* ShapeFlags.ELEMENT */) ;
        else {
            // 这里就必然是 component 了,
            vnode.shapeFlag |= 16 /* ShapeFlags.SLOTS_CHILDREN */;
        }
    }
}
// 基于 type 来判断是什么类型的组件
function getShapeFlag(type) {
    return typeof type === 'string'
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
            console.log('基于根组件创建 vnode');
            // 把根组件转换成 vnode
            // 后续所有的操作都会基于 vnode 做处理
            const vnode = createVNode(rootComponent);
            console.log('调用 render，基于 vnode 进行开箱');
            render(vnode, rootContainer);
        },
    };
    return app;
}

// h 就是调用 createVNode 对于外部用户更方便使用
const h = (type, props = null, children = []) => {
    return createVNode(type, props, children);
};

/**
 * Compiler runtime helper for rendering `<slot/>`
 * 用来 render slot 的
 * 之前是把 slot 的数据都存在 instance.slots 内(可以看 componentSlot.ts)，
 * 这里就是取数据然后渲染出来的点
 * 这个是由 compiler 模块直接渲染出来的 -可以参看这个 demo https://vue-next-template-explorer.netlify.app/#%7B%22src%22%3A%22%3Cdiv%3E%5Cn%20%20%3Cslot%3E%3C%2Fslot%3E%5Cn%3C%2Fdiv%3E%22%2C%22ssr%22%3Afalse%2C%22options%22%3A%7B%22mode%22%3A%22module%22%2C%22prefixIdentifiers%22%3Afalse%2C%22optimizeImports%22%3Afalse%2C%22hoistStatic%22%3Afalse%2C%22cacheHandlers%22%3Afalse%2C%22scopeId%22%3Anull%2C%22inline%22%3Afalse%2C%22ssrCssVars%22%3A%22%7B%20color%20%7D%22%2C%22bindingMetadata%22%3A%7B%22TestComponent%22%3A%22setup-const%22%2C%22setupRef%22%3A%22setup-ref%22%2C%22setupConst%22%3A%22setup-const%22%2C%22setupLet%22%3A%22setup-let%22%2C%22setupMaybeRef%22%3A%22setup-maybe-ref%22%2C%22setupProp%22%3A%22props%22%2C%22vMySetupDir%22%3A%22setup-const%22%7D%2C%22optimizeBindings%22%3Afalse%7D%7D
 * 其最终目的就是在 render 函数中调用 renderSlot 取 instance.slots 内的数据
 * TODO 这里应该是一个返回一个 block ,但是暂时还没有支持 block ，所以这个暂时只需要返回一个 vnode 即可
 * 因为 block 的本质就是返回一个 vnode
 *
 * @private
 */
function renderSlots(slots, name, props = {}) {
    // 这个地方 slots 就是  renderSlots(this.$slots, 'body'), 中 的 this.$slots，也就是 父组件的 slots
    // name 是 子组件 插槽的 key
    // 根据子组件 的插槽 key，去 父组件 中取对应的插槽数据 创建虚拟节点并返回
    const slot = slots[name];
    console.log(`渲染插槽 slot -> ${name}`);
    if (slot) {
        // 因为 slot 是一个返回 vnode 的函数，我们只需要把这个结果返回出去即可
        // slot 就是一个函数，所以就可以把当前组件的一些数据给传出去，这个就是作用域插槽
        // 参数就是 props
        const slotContent = slot(props);
        return createVNode('div', {}, slotContent);
    }
}

exports.createApp = createApp;
exports.h = h;
exports.renderSlots = renderSlots;
