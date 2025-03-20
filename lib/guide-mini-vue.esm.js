const toDisplayString = (val) => {
    return String(val);
};

const isObject = (val) => {
    return val !== null && typeof val === "object";
};
const isString = (val) => typeof val === "string";
const camelizeRE = /-(\w)/g;
/**
 * @private
 * 把烤肉串命名方式转换成驼峰命名方式
 */
const camelize = (str) => {
    return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ""));
};
const extend = Object.assign;
// 必须是 on+一个大写字母的格式开头
const isOn = (key) => /^on[A-Z]/.test(key);
function hasChanged(value, oldValue) {
    return !Object.is(value, oldValue);
}
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

// 这里后面两个参数可选
const createVNode = function (type, props, children) {
    // 注意 type 有可能是 string 也有可能是对象
    // 如果是对象的话，那么就是用户设置的 options
    // type 为 string 的时候
    // createVNode("div")
    // type 为组件对象的时候
    // createVNode(App)
    const vnode = {
        // 初始化时 el 设置为 null，后面这个字段用于存储根节点 通过 $el 访问
        el: null,
        component: null,
        key: props === null || props === void 0 ? void 0 : props.key,
        type,
        props: props || {},
        children,
        shapeFlag: getShapeFlag(type),
    };
    // 基于 children 再次设置 shapeFlag
    if (Array.isArray(children)) {
        // 这里用了 或 的操作 ，或 是 都是 0 ，结果才是 0，只要有一个是 1 ，结果就是 1
        // 这两个 type 在自己 对应的位上都是 1 所以只要 和 之前的类型 或 上，结果就肯定在原有基础上 把新的位置为1
        vnode.shapeFlag |= 16 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    else if (typeof children === 'string') {
        vnode.shapeFlag |= 8 /* ShapeFlags.TEXT_CHILDREN */;
    }
    // 这里判断一下 children 是不是 slot 如果是 slot 位运算一下，后面处理
    normalizeChildren(vnode, children);
    return vnode;
};
function normalizeChildren(vnode, children) {
    if (typeof children === 'object') {
        // 暂时主要是为了标识出 slots_children 这个类型来
        // 暂时我们只有 element 类型和 component 类型的组件
        // 所以我们这里除了 element ，那么只要是 component 的话，那么children 肯定就是 slots 了
        if (vnode.shapeFlag & 1 /* ShapeFlags.ELEMENT */) ;
        else {
            // 这里就必然是 component 了,
            vnode.shapeFlag |= 32 /* ShapeFlags.SLOTS_CHILDREN */;
        }
    }
}
// 用 symbol 作为唯一标识
const Text = Symbol('Text');
const Fragment = Symbol('Fragment');
function createTextVNode(text = ' ') {
    return createVNode(Text, {}, text);
}
// 标准化 vnode 的格式
// 其目的是为了让 child 支持多种格式
function normalizeVNode(child) {
    // 暂时只支持处理 child 为 string 和 number 的情况
    if (typeof child === 'string' || typeof child === 'number') {
        return createVNode(Text, null, String(child));
    }
    else {
        return child;
    }
}
// 基于 type 来判断是什么类型的组件
function getShapeFlag(type) {
    return typeof type === 'string'
        ? 1 /* ShapeFlags.ELEMENT */
        : 4 /* ShapeFlags.STATEFUL_COMPONENT */;
}

// h 就是调用 createVNode 对于外部用户更方便使用
const h = (type, props = null, children = []) => {
    return createVNode(type, props, children);
};

function createAppAPI(render) {
    // 这里 调用 createdApp 传入 根组件
    // 然后返回一个 app 对象
    return function createApp(rootComponent) {
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
    };
}

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
    if (vnode.shapeFlag & 32 /* ShapeFlags.SLOTS_CHILDREN */) {
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
            // 后续在 renderSlot 中调用
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
        handler = props[toHandlerKey(hyphenate(event))];
    }
    if (handler) {
        handler(...rawArgs);
    }
}

const publicPropertiesMap = {
    // 当用户调用 instance.proxy.$emit 时就会触发这个函数
    // i 就是 instance 的缩写 也就是组件实例对象
    $el: (i) => i.vnode.el,
    $emit: (i) => i.emit,
    $slots: (i) => i.slots,
    $props: (i) => i.props,
};
// todo 需要让用户可以直接在 render 函数内直接使用 this 来触发 proxy
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
let activeEffect = void 0;
// 用于判断是否要执行依赖收集
// 只有在 effect 函数执行的时候，才会执行依赖收集
// 其他情况都不会执行依赖收集
let shouldTrack = false;
const targetMap = new WeakMap();
// 用于依赖收集
class ReactiveEffect {
    // fn 是用户传入的函数
    // scheduler 可选
    // trigger 执行时 如果有 scheduler 就执行 effect 的 scheduler
    // 如果没有 就执行 effect.run
    constructor(fn, scheduler) {
        this.fn = fn;
        this.scheduler = scheduler;
        // 默认状态 true , 当调用 stop 后变为 false 后续再次调用stop 跳过遍历逻辑 节省效率
        this.active = true;
        //　反向收集 依赖 , deps 里面装的是 所有该实例依赖的所有响应式对象
        this.deps = [];
        console.log('创建 ReactiveEffect 对象');
    }
    run() {
        console.log('run');
        // 判断 这个函数 有没有被 stop
        if (!this.active) {
            // 如果被 stop 了，执行函数 返回函数 但是不收集依赖
            return this.fn();
        }
        // 如果 effect 是 active 状态的时候 标记开始收集依赖
        shouldTrack = true;
        // 执行的时候给全局的 activeEffect 赋值
        // 利用全局属性来获取当前的 effect
        activeEffect = this;
        // 执行用户传入的 fn
        console.log('执行用户传入的 fn');
        // 这个地方执行 用户传来的函数 会触发 get =》 track 操作进行收集依赖
        const result = this.fn();
        // 收集依赖后 关闭依赖收集的标签
        shouldTrack = false;
        // 清空 activeEffect 全局变量
        activeEffect = undefined;
        return result;
    }
    stop() {
        if (this.active) {
            // 如果第一次执行 stop 后 active 就 false 了
            // 这是为了防止重复的调用，执行 stop 逻辑
            cleanupEffect(this);
            // 如果传入了 option.onStop 就在 stop 后执行函数
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    // 找到所有依赖这个 effect 的响应式对象
    // 从这些响应式对象里面把 effect 给删除掉
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
function effect(fn, options = {}) {
    // 这个地方使用了面向对象的思想，将函数抽象成一个类
    // 给每个类 都带有一个 run 方法
    // 在执行 run 方法的时候进行依赖收集
    const _effect = new ReactiveEffect(fn);
    // 把用户传过来的值合并到 _effect 对象上去
    // 优点是 后续不管 options 有多少个属性，都可以合并到 _effect 对象上
    // 缺点就是不是显式的，看代码的时候并不知道有什么属性
    // 这个地方 参考 @vue/shared 把公共方法提取到了 shared 中，其实封装的就是 Object.assign
    extend(_effect, options);
    _effect.run();
    // 把 _effect.run 这个方法返回
    // 让用户可以自行选择调用的时机（调用 fn）
    const runner = _effect.run.bind(_effect);
    // 把 _effect 对象挂载到 runner 上
    // 这样 调用 stop 的时候就可以通过 runner 上面的 effect.stop 方法实现
    runner.effect = _effect;
    return runner;
}
function stop(runner) {
    runner.effect.stop();
}
function track(target, type, key) {
    if (!isTracking()) {
        return;
    }
    console.log(`触发 track -> target: ${target} type:${type} key:${key}`);
    // 先基于 对象 找到对应的 map
    // 这个 map 是所有的依赖数据
    // 如果是第一次的话，那么就需要初始化
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        // 初始化 depsMap 的逻辑
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    // 通过 对象 改变的 key 来查询 所有的依赖 effect
    // 这里 查出来的 dep 是一个 set 来确保 依赖不会被重复收集
    let dep = depsMap.get(key);
    if (!dep) {
        dep = createDep();
        depsMap.set(key, dep);
    }
    // 这里把逻辑抽离出来 到 trackEffects 中
    // reactive 需要寻找 它对应 key 的 依赖集合列表
    // 而 ref 不需要这一步，所以 如果是 ref 调用的时候 就直接 调用 trackEffects 就可以了
    // 而 reactive 就调用 track 找到对应的 set 再进行 trackEffects
    trackEffects(dep);
}
function trackEffects(dep) {
    // 传进来的 dep 是 该 key 之前所对应的 effect 列表
    // 要把新收集到的 effct 加入到 dep 中
    // 这里是一个优化点
    // 先看看这个依赖是不是已经收集了，
    // 已经收集的话，那么就不需要在收集一次了
    // 可能会影响 code path change 的情况
    // 需要每次都 cleanupEffect
    // shouldTrack = !dep.has(activeEffect!);
    // 这里是一个 反向收集依赖
    // dep 里面 里面存的是 依赖这个响应式对象的 所有 effct
    // 同时 也把这个 响应式对象 回传到 effct 里面进行存储
    // 这个 effect.deps 里面存的是 所有依赖这个 effect 的响应式对象
    if (!dep.has(activeEffect)) {
        dep.add(activeEffect);
        activeEffect.deps.push(dep);
    }
}
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
function isTracking() {
    // 只有在 effect 函数执行的时候，才会执行依赖收集
    // 这个地方使用 shouldTrack 这个变量来控制是否执行依赖收集
    // 第一点是 如果 effect被 stop 了或者是 响应式对象使用了 ++ 操作（++操作可以拆分出2步 1步是set 1步是get）
    // 第二点是 如果 响应式对象 没有依赖 只是调用了 get 方法，这个时候 get 会触发依赖收集，所以 activerEffect 本来就应该是没有值的 就跳过依赖收集
    return shouldTrack && activeEffect !== undefined;
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
function isProxy(value) {
    // 只要 是 reactive 或者 readonly 都是 proxy 对象
    return isReactive(value) || isReadonly(value);
}
function isReactive(value) {
    // 只要是 proxy 的话，那么会触发 get 操作
    // 出发get操作就会触发 createGetter 里面的判断
    // createGetter 里面增加了判断，如果 get 操作获取的 key 是当前value 查询的 的key
    // 就会返回 创建 getter 的时候 传入的 isReadonly 的非值，如果不是 readonly 就证明是 reactive
    // 如果这个地方不是 proxy 直接就会返回 false
    return !!value["__v_isReactive" /* ReactiveFlags.IS_REACTIVE */];
}
function isReadonly(value) {
    // 与上面 isReactive 逻辑一样
    // 这里面获取了特定的 key 值，如果 value 是 proxy 的话，就会触发 get
    // 就会触发 createGetter 里面的判断，返回 创建 getter 时的 readonly的值
    // 如果不是 proxy 直接就会返回 false
    return !!value["__v_isReadonly" /* ReactiveFlags.IS_READONLY */];
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

/*
 * @Author: Hansy hanshunyao_hansy@163.com
 * @Date: 2025-03-08 14:42:33
 * @LastEditors: Hansy hanshunyao_hansy@163.com
 * @LastEditTime: 2025-03-09 21:59:37
 * @FilePath: \mini-vue\src\reactivity\ref.ts
 * @Description: ref 主逻辑
 */
// 这个的 ref 和 reactive 的区别就是
// reactive 收集依赖是 根据 ReactiveEffect 触发的不同的 key 在dep 中储存的
// 而 ref 就一个 key value 所以收集依赖的时候 就把 全局变量 activeEffect 收集到 dep 里面就可以了
// 这里面 ref 的实现逻辑
// 其实 ref 就是对于单值的响应式
// 但是就无法像之前的 reactive 一样 使用 proxy 的方法完成
// 所以这里就通过对象来包裹，这里就是用的 RefImpl 类来完成
// 这个类里面有个 value 的属性 就可以绑定 set get 方法，这样的话就可以直到什么时候 依赖收集什么时候触发依赖
// 这也就是为什么 我们用 ref 的时候会有 .value 这个概念
class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
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
function ref(value) {
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
function triggerRefValue(ref) {
    triggerEffects(ref.dep);
}
function trackRefValue(ref) {
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
        }
        else {
            return Reflect.set(target, key, value, receiver);
        }
    },
};
// 这里没有处理 objectWithRefs 是 reactive 类型的时候
// TODO reactive 里面如果有 ref 类型的 key 的话， 那么也是不需要调用 ref.value 的
// （but 这个逻辑在 reactive 里面没有实现）
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, shallowUnwrapHandlers);
}
// 把 ref 里面的值拿到
function unRef(ref) {
    // 返回 ref 的值
    // 如果是 ref 类型的话，那么就返回 value
    // 如果不是的话，那么就返回本身
    return isRef(ref) ? ref.value : ref;
}
function isRef(value) {
    // 这个地方 不像 reactive 一样， reactive 里面 有 readoly 这些词 只能分开判断
    // 而 ref 里面 只要有 一种状态，所以直接在构造函数中 就给这个 ref 加上一个 __v_isRef 属性就可以了
    // 所以 如果是 ref ，通过 refImpl 构造函数出来的对象一定有这个属性
    return !!value.__v_isRef;
}

/*
 * @Author: hansy hanshunyao_hansy@163.com
 * @Date: 2025-03-07 15:39:01
 * @LastEditors: Hansy hanshunyao_hansy@163.com
 * @LastEditTime: 2025-03-09 22:22:11
 * @FilePath: \mini-vue\src\reactivity\computed.ts
 * @Description: computed 主逻辑
 */
class ComputedRefImpl {
    constructor(getter) {
        this._dirty = true;
        this.dep = createDep();
        // 这里将 用户传入的 fn 转变成一个 ReactiveEffect 
        // 这里 第一次 会执行 getter 后面会执行 scheduler
        // 每次 依赖的响应式数据发生变化的时候，就会执行 scheduler
        // 就会把 this._dirty 的开关打开 get 方法就可以重新获取数据了
        this.effect = new ReactiveEffect(getter, () => {
            if (this._dirty)
                return;
            this._dirty = true;
            triggerRefValue(this);
        });
    }
    get value() {
        // 收集依赖
        // compouted 和 ref 的收集依赖一个道理
        // 都是只有 .value 一个属性
        trackRefValue(this);
        // 这里就是缓存实现的核心
        // 当 执行过 一次 computed 的 get 操作的时候，this._dirty 会变为 false 把 重新获取数据的方法锁上
        // 当 依赖的响应式数据发生变化的时候，this._dirty 的值会变为 true 把 重新获取数据的方法解锁
        // 这样就相当于 数据没改变的时候 获取的是缓存，改变了 就重新获取数据
        if (this._dirty) {
            this._dirty = false;
            // 这里执行 run 的话，就是执行用户传入的 fn
            this._value = this.effect.run();
        }
        return this._value;
    }
}
function computed(getter) {
    return new ComputedRefImpl(getter);
}

function createComponentInstance(vnode, parent) {
    const instance = {
        // 这个地方 把 vnode.type 赋值给 instance.type
        // 这样后面使用的时候就不用 instance.vnode.type 了
        // 直接 instance.type 就可以了
        type: vnode.type,
        vnode,
        next: null, // 需要更新的 vnode，用于更新 component 类型的组件
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
    // 源码里面有两种类型的 component
    // 一种是基于 options 创建的
    // 还有一种是 function 的
    // 这里处理的是 options 创建的
    // 叫做 stateful 类型
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
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
        const setupResult = setup && setup(shallowReadonly(instance.props), setupContext);
        // 这里调用完 setup 方法后，就把全局变量的值清空
        setCurrentInstance(null);
        // 3. 处理 setupResult
        handleSetupResult(instance, setupResult);
    }
    else {
        finishComponentSetup(instance);
    }
}
function createSetupContext(instance) {
    console.log('初始化 setup context');
    return {
        attrs: instance.attrs,
        slots: instance.slots,
        emit: instance.emit,
        expose: () => { }, // TODO 实现 expose 函数逻辑
    };
}
function handleSetupResult(instance, setupResult) {
    // setup 返回值不一样的话，会有不同的处理
    // 1. 看看 setupResult 是个什么
    if (typeof setupResult === 'function') {
        // 如果返回的是 function 的话，那么绑定到 render 上
        // 认为是 render 逻辑
        // setup(){ return ()=>(h("div")) }
        instance.render = setupResult;
    }
    else if (typeof setupResult === 'object') {
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
function finishComponentSetup(instance) {
    // 给 instance 设置 render
    // 先取到用户设置的 component options
    const Component = instance.type;
    if (!instance.render) {
        // 这里的 compile 是编译器，将模板渲染为 render 函数
        // 如果 compile 有值 并且当组件没有 render 函数
        // 那么就需要把 template 编译成 render 函数
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
let currentInstance = {};
// 这个接口暴露给用户，用户可以在 setup 中获取组件实例 instance
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    // 这个地方 把 赋值操作提取出来了，为的是 以后如果想看 这个变量的赋值情况，就在这个地方打上断点就可以方便调试
    // 这个地方也起到了中间层的作用，如果后面多处调用了 赋值操作，如果没有抽象出来方法的话，不好找寻是哪出赋值的
    // 这样把这个提取出来后，只需要在这里打上断点就可以通过 event 事件栈来看到是谁调用的
    currentInstance = instance;
}
let compile;
function registerRuntimeCompiler(_compile) {
    // 把 compile 挂在到全局变量
    compile = _compile;
}

function provide(key, value) {
    var _a;
    // 获取 执行 setup 前存的 全局变量 这个是当前组件的 instance 实例
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        // 获取当前组件的 provides
        let { provides } = currentInstance;
        // 获取当前组件的父级组件的 provides
        const parentProvides = (_a = currentInstance.parent) === null || _a === void 0 ? void 0 : _a.provides;
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
function inject(key, defaultValue) {
    var _a;
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const provides = (_a = currentInstance.parent) === null || _a === void 0 ? void 0 : _a.provides;
        // 如果找到值了就返回值
        // 如果没找到就看有没有传默认值，传了就返回默认值
        if (key in provides) {
            return provides[key];
        }
        else if (defaultValue) {
            // 如果是函数就执行函数 返回函数返回值
            // 否则就直接返回
            if (typeof defaultValue === "function") {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

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
function renderSlot(slots, name, props = {}) {
    // 这个地方 slots 就是  renderSlot(this.$slots, 'body'), 中 的 this.$slots，也就是 父组件的 slots
    // name 是 子组件 插槽的 key
    // 根据子组件 的插槽 key，去 父组件 中取对应的插槽数据 创建虚拟节点并返回
    const slot = slots[name];
    console.log(`渲染插槽 slot -> ${name}`);
    if (slot) {
        // 因为 slot 是一个返回 vnode 的函数，我们只需要把这个结果返回出去即可
        // slot 就是一个函数，所以就可以把当前组件的一些数据给传出去，这个就是作用域插槽
        // 参数就是 props
        const slotContent = slot(props);
        // 这个 Fragment 是一个特殊标识， 在 patch 的时候 有判断， 如果 遇到这个表示，就挂载它的 children 即可
        // Fragment 用的是 使用 symbol
        return createVNode(Fragment, {}, slotContent);
    }
}

const queue = [];
const activePreFlushCbs = [];
const p = Promise.resolve();
let isFlushPending = false;
function nextTick(fn) {
    return fn ? p.then(fn) : p;
}
function queueJob(job) {
    if (!queue.includes(job)) {
        queue.push(job);
        // 执行所有的 job
        queueFlush();
    }
}
function queueFlush() {
    // 如果同时触发了两个组件的更新的话
    // 这里就会触发两次 then （微任务逻辑）
    // 但是着是没有必要的
    // 我们只需要触发一次即可处理完所有的 job 调用
    // 所以需要判断一下 如果已经触发过 nextTick 了
    // 那么后面就不需要再次触发一次 nextTick 逻辑了
    if (isFlushPending)
        return;
    isFlushPending = true;
    nextTick(flushJobs);
}
function flushJobs() {
    isFlushPending = false;
    // 先执行 pre 类型的 job
    // 所以这里执行的job 是在渲染前的
    // 也就意味着执行这里的 job 的时候 页面还没有渲染
    flushPreFlushCbs();
    // 这里是执行 queueJob 的
    // 比如 render 渲染就是属于这个类型的 job
    let job;
    while ((job = queue.shift())) {
        if (job) {
            job();
        }
    }
}
function flushPreFlushCbs() {
    // 执行所有的 pre 类型的 job
    for (let i = 0; i < activePreFlushCbs.length; i++) {
        activePreFlushCbs[i]();
    }
}

function shouldUpdateComponent(prevVNode, nextVNode) {
    const { props: prevProps } = prevVNode;
    const { props: nextProps } = nextVNode;
    //   const emits = component!.emitsOptions;
    // 这里主要是检测组件的 props
    // 核心：只要是 props 发生改变了，那么这个 component 就需要更新
    // 1. props 没有变化，那么不需要更新组件 就只更新 element 就可以了
    if (prevProps === nextProps) {
        return false;
    }
    // 如果之前没有 props，那么就需要看看现在有没有 props 了
    // 所以这里基于 nextProps 的值来决定是否更新
    if (!prevProps) {
        return !!nextProps;
    }
    // 之前有值，现在没值，那么肯定需要更新
    if (!nextProps) {
        return true;
    }
    // 以上都是比较明显的可以知道 props 是否是变化的
    // 在 hasPropsChanged 会做更细致的对比检测
    return hasPropsChanged(prevProps, nextProps);
}
function hasPropsChanged(prevProps, nextProps) {
    // 依次对比每一个 props.key
    // 提前对比一下 length ，length 不一致肯定是需要更新的
    const nextKeys = Object.keys(nextProps);
    if (nextKeys.length !== Object.keys(prevProps).length) {
        return true;
    }
    // 只要现在的 prop 和之前的 prop 不一样那么就需要更新
    for (let i = 0; i < nextKeys.length; i++) {
        const key = nextKeys[i];
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}

function createRenderer(options) {
    const { createElement: hostCreateElement, setElementText: hostSetElementText, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setText: hostSetText, createText: hostCreateText, } = options;
    function render(vnode, container) {
        // 调用 patch
        // 后续方便递归
        console.log('调用 patch');
        // 初始化 第一次 没有 n1 也就是没有 上次的节点，只有 n2 新节点
        patch(null, vnode, container);
    }
    function patch(n1, n2, container = null, anchor = null, parentComponent = null) {
        // TODO：这个地方需要是初始化还是 update
        // 现在是直接处理 初始化
        // 后续会处理 update
        // 基于 n2 的类型来判断
        // 因为 n2 是新的 vnode
        const { type, shapeFlag } = n2;
        // 这个地方使用 与的操作，与的特点是 都是1 ，结果才是 1，只要有一个是 0 ，结果就是 0
        // ShapeFlags 中的类型 在其算表示的位上 为 1 其他位都是0 ，所以 只要是 这个 虚拟节点的该位上 为1 就返回有值，如果虚拟节点这位不是 1 那整个结果都是 0
        switch (type) {
            case Text:
                processText(n1, n2, container);
                break;
            // 其中还有几个类型比如： static fragment comment
            case Fragment:
                processFragment(n1, n2, container);
                break;
            default:
                // 这里就基于 shapeFlag 来处理
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    console.log('处理 element');
                    processElement(n1, n2, container, anchor, parentComponent);
                }
                else if (shapeFlag & 4 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    console.log('处理 component');
                    processComponent(n1, n2, container, parentComponent);
                }
        }
    }
    function processFragment(n1, n2, container) {
        // 只需要渲染 children ，然后给添加到 container 内
        if (!n1) {
            // 初始化 Fragment 逻辑点
            console.log('初始化 Fragment 类型的节点');
            mountChildren(n2.children, container);
        }
    }
    function processText(n1, n2, container) {
        console.log('处理 Text 节点');
        if (n1 === null) {
            // n1 是 null 说明是 init 的阶段
            // 基于 createText 创建出 text 节点，然后使用 insert 添加到 el 内
            console.log('初始化 Text 类型的节点');
            hostInsert((n2.el = hostCreateText(n2.children)), container);
        }
        else {
            // update
            // 先对比一下 updated 之后的内容是否和之前的不一样
            // 在不一样的时候才需要 update text
            // 这里抽离出来的接口是 setText
            // 注意，这里一定要记得把 n1.el 赋值给 n2.el, 不然后续是找不到值的
            const el = (n2.el = n1.el);
            if (n2.children !== n1.children) {
                console.log('更新 Text 类型的节点');
                hostSetText(el, n2.children);
            }
        }
    }
    function processElement(n1, n2, container, anchor, parentComponent) {
        if (!n1) {
            // 初始化挂载 element
            mountElement(n2, container, anchor);
        }
        else {
            // 更新 element 元素
            updateElement(n1, n2, container, anchor, parentComponent);
        }
    }
    function updateElement(n1, n2, container, anchor, parentComponent) {
        const oldProps = (n1 && n1.props) || {};
        const newProps = n2.props || {};
        // 应该更新 element
        console.log('应该更新 element');
        console.log('旧的 vnode', n1);
        console.log('新的 vnode', n2);
        // 需要把 el 挂载到新的 vnode
        const el = (n2.el = n1.el);
        // 对比 props
        patchProps(el, oldProps, newProps);
        // 对比 children
        patchChildren(n1, n2, el, anchor, parentComponent);
    }
    function patchProps(el, oldProps, newProps) {
        // 对比 props 有以下几种情况
        // 1. oldProps 有，newProps 也有，但是 val 值变更了
        // 例如下面的情况
        // 之前: oldProps.id = 1 ，更新后：newProps.id = 2
        // key 存在 oldProps 里 也存在 newProps 内
        // 以 newProps 作为基准
        for (const key in newProps) {
            const prevProp = oldProps[key];
            const nextProp = newProps[key];
            if (prevProp !== nextProp) {
                // 对比属性
                // 需要交给 host 来更新 key
                // hostPatchProp 中还处理了一种情况，如果 nextProp 是 null 的话
                // 那么就需要把之前的属性给删除掉 removeAttribute
                // 如果不为空 就 setAttribute
                hostPatchProp(el, key, prevProp, nextProp);
            }
        }
        // 2. oldProps 有，而 newProps 没有了
        // 之前： {id:1,tId:2}  更新后： {id:1}
        // 这种情况下我们就应该以 oldProps 作为基准，因为在 newProps 里面是没有的 tId 的
        // 还需要注意一点，如果这个 key 在 newProps 里面已经存在了，说明已经处理过了，就不要在处理了
        for (const key in oldProps) {
            const prevProp = oldProps[key];
            const nextProp = null;
            if (!(key in newProps)) {
                // 这里是以 oldProps 为基准来遍历，
                // 而且得到的值是 newProps 内没有的
                // 所以交给 host 更新的时候，把新的值设置为 null 就触发了里面的判断 removeAttribute
                hostPatchProp(el, key, prevProp, nextProp);
            }
        }
    }
    function patchChildren(n1, n2, container, anchor, parentComponent) {
        const { shapeFlag: prevShapeFlag, children: c1 } = n1;
        const { shapeFlag, children: c2 } = n2;
        // 如果 n2 的 children 是 text 类型的话
        // 就看看和之前的 n1 的 children 是不是一样的
        // 如果不一样的话直接重新设置一下 text 即可
        if (shapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
            if (c2 !== c1) {
                console.log('类型为 text_children, 当前需要更新');
                hostSetElementText(container, c2);
            }
        }
        else {
            // 看看之前的是不是 text
            if (prevShapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
                // 先清空
                // 然后在把新的 children 给 mount 生成 element
                hostSetElementText(container, '');
                mountChildren(c2, container);
            }
            else {
                // array diff array
                // 如果之前是 array_children
                // 现在还是 array_children 的话
                // 那么就需要对比两个 children
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentAnchor, parentComponent) {
        // i 就是左指针，对比两个 children 从左往右
        // e1 就是旧的 array 右指针
        // e2 就是新的 array 右指针
        let i = 0;
        const l2 = c2.length;
        let e1 = c1.length - 1;
        let e2 = l2 - 1;
        const isSameVNodeType = (n1, n2) => {
            return n1.type === n2.type && n1.key === n2.key;
        };
        // 此处是左端对比
        // i 不能超过两个右指针的位置
        // 不然会出现空指针
        while (i <= e1 && i <= e2) {
            const prevChild = c1[i];
            const nextChild = c2[i];
            if (!isSameVNodeType(prevChild, nextChild)) {
                // 当新旧两个 child 元素不相等了 退出循环
                console.log('两个 child 不相等(从左往右比对)');
                console.log(`prevChild:${prevChild}`);
                console.log(`nextChild:${nextChild}`);
                break;
            }
            // 如果两个 child 一直相等 指针往后移
            // 同时递归的去对比 child 里面的属性和 children
            // i 右移
            console.log('两个 child 相等，接下来对比这两个 child 节点(从左往右比对)');
            patch(prevChild, nextChild, container, parentAnchor, parentComponent);
            i++;
        }
        // 此处是右端对比
        // e1 和 e2 一起右移
        // 不能超过 i 的位置，不然会出现空指针
        // 也大于等于 0
        while (i <= e1 && i <= e2) {
            // 从右向左取值
            const prevChild = c1[e1];
            const nextChild = c2[e2];
            // 当新旧两个 child 元素不相等了 退出循环
            if (!isSameVNodeType(prevChild, nextChild)) {
                console.log('两个 child 不相等(从右往左比对)');
                console.log(`prevChild:${prevChild}`);
                console.log(`nextChild:${nextChild}`);
                break;
            }
            // 如果两个 child 一直相等 指针往后移
            // 同时递归的去对比 child 里面的属性和 children
            // e1 e2 左移
            console.log('两个 child 相等，接下来对比这两个 child 节点(从右往左比对)');
            patch(prevChild, nextChild, container, parentAnchor, parentComponent);
            e1--;
            e2--;
        }
        if (i > e1 && i <= e2) {
            // 如果是这种情况的话就说明 e2 也就是新节点的数量大于旧节点的数量
            // 也就是说新增了 vnode
            // 应该循环 c2
            // 锚点的计算：新的节点有可能需要添加到尾部，也可能添加到头部，所以需要指定添加的问题
            // 要添加的位置是当前的位置(e2 开始)+1
            // 因为对于往左侧添加的话，应该获取到 c2 的第一个元素
            // 所以我们需要从 e2 + 1 取到锚点的位置
            const nextPos = e2 + 1;
            // 这个地方判断 新的节点是多在 旧的左侧还是右侧
            // 如果是在左侧的话，那么锚点就是 c2 的第一个元素
            // 如果是在右侧的话，那么锚点就是 parentAnchor
            const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor;
            while (i <= e2) {
                console.log(`需要新创建一个 vnode: ${c2[i].key}`);
                patch(null, c2[i], container, anchor, parentComponent);
                i++;
            }
        }
        else if (i > e2 && i <= e1) {
            // 这种情况的话说明新节点的数量是小于旧节点的数量的
            // 那么我们就需要把多余的节点删除
            while (i <= e1) {
                console.log(`需要删除当前的 vnode: ${c1[i].key}`);
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            // 左右两边都比对完了，然后剩下的就是中间部位顺序变动的
            // 例如下面的情况
            // a,b,[c,d,e],f,g
            // a,b,[e,c,d],f,g
            let s1 = i;
            let s2 = i;
            const keyToNewIndexMap = new Map();
            let moved = false;
            let maxNewIndexSoFar = 0;
            // 先把 key 和 newIndex 绑定好，方便后续基于 key 找到 newIndex
            // 时间复杂度是 O(1)
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            // 需要处理新节点的数量
            const toBePatched = e2 - s2 + 1;
            let patched = 0;
            // 初始化 从新的index映射为老的index
            // 创建数组的时候给定数组的长度，这个是性能最快的写法
            const newIndexToOldIndexMap = new Array(toBePatched);
            // 初始化为 0 , 后面处理的时候 如果发现是 0 的话，那么就说明新值在老的里面不存在
            for (let i = 0; i < toBePatched; i++)
                newIndexToOldIndexMap[i] = 0;
            // 遍历老节点
            // 1. 需要找出老节点有，而新节点没有的 -> 需要把这个节点删除掉
            // 2. 新老节点都有的，—> 需要 patch
            for (i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                // 优化点
                // 如果老的节点大于新节点的数量的话，那么这里在处理老节点的时候就直接删除即可
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                let newIndex;
                if (prevChild.key != null) {
                    // 这里就可以通过key快速的查找了， 看看在新的里面这个节点存在不存在
                    // 时间复杂度O(1)
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    // 如果没key 的话，那么只能是遍历所有的新节点来确定当前节点存在不存在了
                    // 时间复杂度O(n)
                    for (let j = s2; j <= e2; j++) {
                        if (isSameVNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                // 因为有可能 nextIndex 的值为0（0也是正常值）
                // 所以需要通过值是不是 undefined 或者 null 来判断
                if (newIndex === undefined) {
                    // 当前节点的key 不存在于 newChildren 中，需要把当前节点给删除掉
                    hostRemove(prevChild.el);
                }
                else {
                    // 新老节点都存在
                    console.log('新老节点都存在');
                    // 把新节点的索引和老的节点的索引建立映射关系
                    // i + 1 是因为 i 有可能是0 (0 的话会被认为新节点在老的节点中不存在)
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    // 来确定中间的节点是不是需要移动
                    // 新的 newIndex 如果一直是升序的话，那么就说明没有移动
                    // 所以我们可以记录最后一个节点在新的里面的索引，然后看看是不是升序
                    // 不是升序的话，我们就可以确定节点移动过了
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    patch(prevChild, c2[newIndex], container, null, parentComponent);
                    patched++;
                }
            }
            // 利用最长递增子序列来优化移动逻辑
            // 因为元素是升序的话，那么这些元素就是不需要移动的
            // 而我们就可以通过最长递增子序列来获取到升序的列表
            // 在移动的时候我们去对比这个列表，如果对比上的话，就说明当前元素不需要移动
            // 通过 moved 来进行优化，如果没有移动过的话 那么就不需要执行算法
            // getSequence 返回的是 newIndexToOldIndexMap 的索引值
            // 所以后面我们可以直接遍历索引值来处理，也就是直接使用 toBePatched 即可
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            let j = increasingNewIndexSequence.length - 1;
            // 遍历新节点
            // 1. 需要找出老节点没有，而新节点有的 -> 需要把这个节点创建
            // 2. 最后需要移动一下位置，比如 [c,d,e] -> [e,c,d]
            // 这里倒循环是因为在 insert 的时候，需要保证锚点是处理完的节点（也就是已经确定位置了）
            // 因为 insert 逻辑是使用的 insertBefore()
            for (let i = toBePatched - 1; i >= 0; i--) {
                // 确定当前要处理的节点索引
                const nextIndex = s2 + i;
                const nextChild = c2[nextIndex];
                // 锚点等于当前节点索引+1
                // 也就是当前节点的后面一个节点(又因为是倒遍历，所以锚点是位置确定的节点)
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : parentAnchor;
                if (newIndexToOldIndexMap[i] === 0) {
                    // 说明新节点在老的里面不存在
                    // 需要创建
                    patch(null, nextChild, container, anchor, parentComponent);
                }
                else if (moved) {
                    // 需要移动
                    // 1. j 已经没有了 说明剩下的都需要移动了
                    // 2. 最长子序列里面的值和当前的值匹配不上， 说明当前元素需要移动
                    if (j < 0 || increasingNewIndexSequence[j] !== i) {
                        // 移动的话使用 insert 即可
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        // 这里就是命中了  index 和 最长递增子序列的值
                        // 所以可以移动指针了
                        j--;
                    }
                }
            }
        }
    }
    function mountElement(vnode, container, anchor) {
        const { shapeFlag, props } = vnode;
        // 1. 先创建 element
        // 基于可扩展的渲染 api
        const el = (vnode.el = hostCreateElement(vnode.type));
        // 支持单子组件和多子组件的创建
        if (shapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
            // 举个栗子
            // render(){
            //     return h("div",{},"test")
            // }
            // 这里 children 就是 test ，只需要渲染一下就完事了
            console.log(`处理文本:${vnode.children}`);
            hostSetElementText(el, vnode.children);
        }
        else if (shapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
            // 举个栗子
            // render(){
            // Hello 是个 component
            //     return h("div",{},[h("p"),h(Hello)])
            // }
            // 这里 children 就是个数组了，就需要依次调用 patch 递归来处理
            mountChildren(vnode.children, el);
        }
        // 处理 props
        if (props) {
            for (const key in props) {
                // todo
                // 需要过滤掉vue自身用的key
                // 比如生命周期相关的 key: beforeMount、mounted
                const nextVal = props[key];
                hostPatchProp(el, key, null, nextVal);
            }
        }
        // todo
        // 触发 beforeMount() 钩子
        console.log('vnodeHook  -> onVnodeBeforeMount');
        console.log('DirectiveHook  -> beforeMount');
        console.log('transition  -> beforeEnter');
        // 插入
        hostInsert(el, container, anchor);
        // todo
        // 触发 mounted() 钩子
        console.log('vnodeHook  -> onVnodeMounted');
        console.log('DirectiveHook  -> mounted');
        console.log('transition  -> enter');
    }
    function mountChildren(children, container) {
        children.forEach((VNodeChild) => {
            // todo
            // 这里应该需要处理一下 vnodeChild
            // 因为有可能不是 vnode 类型
            console.log('mountChildren:', VNodeChild);
            patch(null, VNodeChild, container);
        });
    }
    function processComponent(n1, n2, container, parentComponent) {
        // 如果 n1 没有值的话，那么就是 mount
        if (!n1) {
            // 初始化 component
            mountComponent(n2, container, parentComponent);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    // 组件的更新
    function updateComponent(n1, n2, container) {
        console.log('更新组件', n1, n2);
        // 更新组件实例引用
        const instance = (n2.component = n1.component);
        // 先看看这个组件是否应该更新
        if (shouldUpdateComponent(n1, n2)) {
            console.log(`组件需要更新: ${instance}`);
            // 那么 next 就是新的 vnode 了（也就是 n2）
            instance.next = n2;
            // 这里的 update 是在 setupRenderEffect 里面初始化的，update 函数除了当内部的响应式对象发生改变的时候会调用
            // 还可以直接主动的调用(这是属于 effect 的特性)
            // 调用 update 再次更新调用 patch 逻辑
            // 在update 中调用的 next 就变成了 n2了
            // ps：可以详细的看看 update 中 next 的应用
            // TODO 需要在 update 中处理支持 next 的逻辑
            instance.update();
        }
        else {
            console.log(`组件不需要更新: ${instance}`);
            // 不需要更新的话，那么只需要覆盖下面的属性即可
            n2.component = n1.component;
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    function mountComponent(initialVNode, container, parentComponent) {
        // 初始化组件
        console.log('初始化组件');
        // 1. 先创建一个 component instance
        // 通过虚拟节点 创建出 组件实例对象
        // 后面组件的所有属性都可以挂在到这个 实例对象上
        const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent));
        console.log(`创建组件实例:${instance.type.name}`);
        // 2. 给 instance 加工加工
        // 处理组件的 setup
        // setupComponent 处理3件事
        // (1)处理 参数 props
        // (2)处理 插槽 slot
        // (3)处理 执行 setup 返回的值 挂载到实例上，并确保 组件有 render方法
        setupComponent(instance);
        // 在 setupComponent 中处理完 setup 并确认 render 函数存在后
        // 该调用 render 函数来生成 虚拟 dom 树
        setupRenderEffect(instance, initialVNode, container);
    }
    function setupRenderEffect(instance, initialVNode, container) {
        // 调用 render
        // 应该传入 ctx 也就是 proxy
        // ctx 可以选择暴露给用户的 api
        // 源代码里面是调用的 renderComponentRoot 函数
        // 这里为了简化直接调用 render
        // obj.name  = "111"
        // obj.name = "2222"
        // 从哪里做一些事
        // 收集数据改变之后要做的事 (函数)
        // 依赖收集   effect 函数
        // 触发依赖
        function componentUpdateFn() {
            if (!instance.isMounted) {
                // 组件初始化的时候会执行这里
                // 为什么要在这里调用 render 函数呢
                // 是因为在 effect 内调用 render 才能触发依赖收集
                // 等到后面响应式的值变更后会再次触发这个函数
                console.log(`${instance.type.name}:调用 render,获取 subTree`);
                const proxyToUse = instance.proxy;
                // 可在 render 函数中通过 this 来使用 proxy
                const subTree = (instance.subTree = normalizeVNode(instance.render.call(proxyToUse, proxyToUse)));
                console.log('subTree', subTree);
                // todo
                console.log(`${instance.type.name}:触发 beforeMount hook`);
                console.log(`${instance.type.name}:触发 onVnodeBeforeMount hook`);
                // 这里基于 subTree 再次调用 patch
                // 基于 render 返回的 vnode ，再次进行渲染
                // 这里我把这个行为隐喻成开箱
                // 一个组件就是一个箱子
                // 里面有可能是 element （也就是可以直接渲染的）
                // 也有可能还是 component
                // 这里就是递归的开箱
                // 而 subTree 就是当前的这个箱子（组件）装的东西
                // 箱子（组件）只是个概念，它实际是不需要渲染的
                // 要渲染的是箱子里面的 subTree
                patch(null, subTree, container, null, instance);
                // 把 root element 赋值给 组件的vnode.el ，为后续调用 $el 的时候获取值
                initialVNode.el = subTree.el;
                console.log(`${instance.type.name}:触发 mounted hook`);
                instance.isMounted = true;
            }
            else {
                // 响应式的值变更后会从这里执行逻辑
                // 主要就是拿到新的 vnode ，然后和之前的 vnode 进行对比
                console.log(`${instance.type.name}:调用更新逻辑`);
                // 拿到最新的 subTree
                const { next, vnode } = instance;
                // 如果有 next 的话， 说明需要更新组件的数据（props，slots 等）
                // 先更新组件的数据，然后更新完成后，在继续对比当前组件的子元素
                if (next) {
                    // 问题是 next 和 vnode 的区别是什么
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const proxyToUse = instance.proxy;
                const nextTree = normalizeVNode(instance.render.call(proxyToUse, proxyToUse));
                // 替换之前的 subTree
                const prevTree = instance.subTree;
                instance.subTree = nextTree;
                // 触发 beforeUpdated hook
                console.log(`${instance.type.name}:触发 beforeUpdated hook`);
                console.log(`${instance.type.name}:触发 onVnodeBeforeUpdate hook`);
                // 用旧的 vnode 和新的 vnode 交给 patch 来处理
                patch(prevTree, nextTree, prevTree.el, null, instance);
                // 触发 updated hook
                console.log(`${instance.type.name}:触发 updated hook`);
                console.log(`${instance.type.name}:触发 onVnodeUpdated hook`);
            }
        }
        // 在 vue3.2 版本里面是使用的 new ReactiveEffect
        // 至于为什么不直接用 effect ，是因为需要一个 scope  参数来收集所有的 effect
        // 而 effect 这个函数是对外的 api ，是不可以轻易改变参数的，所以会使用  new ReactiveEffect
        // 因为 ReactiveEffect 是内部对象，加一个参数是无所谓的
        // 后面如果要实现 scope 的逻辑的时候 需要改过来
        // 现在就先算了
        instance.update = effect(componentUpdateFn, {
            scheduler: () => {
                // 把 effect 推到微任务的时候在执行
                // queueJob(effect);
                queueJob(instance.update);
            },
        });
    }
    function updateComponentPreRender(instance, nextVNode) {
        // 更新 nextVNode 的组件实例
        // 现在 instance.vnode 是组件实例更新前的
        // 所以之前的 props 就是基于 instance.vnode.props 来获取
        // 接着需要更新 vnode ，方便下一次更新的时候获取到正确的值
        nextVNode.component = instance;
        // TODO 后面更新 props 的时候需要对比
        // const prevProps = instance.vnode.props;
        instance.vnode = nextVNode;
        instance.next = null;
        const { props } = nextVNode;
        console.log('更新组件的 props', props);
        instance.props = props;
        console.log('更新组件的 slots');
        // TODO 更新组件的 slots
        // 需要重置 vnode
    }
    return {
        render,
        createApp: createAppAPI(render),
    };
}
// 获取 数组最长递增子序列
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

// 源码里面这些接口是由 runtime-dom 来实现
// 这里先简单实现
// 后面也修改成和源码一样的实现
function createElement(type) {
    console.log("CreateElement", type);
    const element = document.createElement(type);
    return element;
}
function createText(text) {
    return document.createTextNode(text);
}
function setText(node, text) {
    node.nodeValue = text;
}
function setElementText(el, text) {
    console.log("SetElementText", el, text);
    el.textContent = text;
}
function patchProp(el, key, preValue, nextValue) {
    // preValue 之前的值
    // 为了之后 update 做准备的值
    // nextValue 当前的值
    console.log(`PatchProp 设置属性:${key} 值:${nextValue}`);
    console.log(`key: ${key} 之前的值是:${preValue}`);
    if (isOn(key)) {
        // 添加事件处理函数的时候需要注意一下
        // 1. 添加的和删除的必须是一个函数，不然的话 删除不掉
        //    那么就需要把之前 add 的函数给存起来，后面删除的时候需要用到
        // 2. nextValue 有可能是匿名函数，当对比发现不一样的时候也可以通过缓存的机制来避免注册多次
        // 存储所有的事件函数
        const invokers = el._vei || (el._vei = {});
        const existingInvoker = invokers[key];
        if (nextValue && existingInvoker) {
            // patch
            // 直接修改函数的值即可
            existingInvoker.value = nextValue;
        }
        else {
            const eventName = key.slice(2).toLowerCase();
            if (nextValue) {
                const invoker = (invokers[key] = nextValue);
                el.addEventListener(eventName, invoker);
            }
            else {
                el.removeEventListener(eventName, existingInvoker);
                invokers[key] = undefined;
            }
        }
    }
    else {
        if (nextValue === null || nextValue === "") {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextValue);
        }
    }
}
function insert(child, parent, anchor = null) {
    console.log("Insert");
    parent.insertBefore(child, anchor);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
let renderer;
function ensureRenderer() {
    // 如果 renderer 有值的话，那么以后都不会初始化了
    return (renderer ||
        (renderer = createRenderer({
            createElement,
            createText,
            setText,
            setElementText,
            patchProp,
            insert,
            remove,
        })));
}
const createApp = (...args) => {
    return ensureRenderer().createApp(...args);
};

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    computed: computed,
    createApp: createApp,
    createAppAPI: createAppAPI,
    createElementVNode: createVNode,
    createRenderer: createRenderer,
    createTextVNode: createTextVNode,
    effect: effect,
    getCurrentInstance: getCurrentInstance,
    h: h,
    inject: inject,
    isProxy: isProxy,
    isReactive: isReactive,
    isReadonly: isReadonly,
    isRef: isRef,
    provide: provide,
    proxyRefs: proxyRefs,
    reactive: reactive,
    readonly: readonly,
    ref: ref,
    registerRuntimeCompiler: registerRuntimeCompiler,
    renderSlot: renderSlot,
    shallowReadonly: shallowReadonly,
    stop: stop,
    toDisplayString: toDisplayString,
    unRef: unRef
});

const TO_DISPLAY_STRING = Symbol(`toDisplayString`);
const CREATE_ELEMENT_VNODE = Symbol("createElementVNode");
const helperNameMap = {
    [TO_DISPLAY_STRING]: "toDisplayString",
    [CREATE_ELEMENT_VNODE]: "createElementVNode"
};

function generate(ast, options = {}) {
    // 先生成 context
    const context = createCodegenContext(ast, options);
    const { push, mode } = context;
    // 1. 先生成 preambleContext
    if (mode === "module") {
        genModulePreamble(ast, context);
    }
    else {
        genFunctionPreamble(ast, context);
    }
    const functionName = "render";
    const args = ["_ctx"];
    // _ctx,aaa,bbb,ccc
    // 需要把 args 处理成 上面的 string
    const signature = args.join(", ");
    push(`function ${functionName}(${signature}) {`);
    // 这里需要生成具体的代码内容
    // 开始生成 vnode tree 的表达式
    push("return ");
    genNode(ast.codegenNode, context);
    push("}");
    return {
        code: context.code,
    };
}
function genFunctionPreamble(ast, context) {
    const { runtimeGlobalName, push, newline } = context;
    const VueBinging = runtimeGlobalName;
    const aliasHelper = (s) => `${helperNameMap[s]} : _${helperNameMap[s]}`;
    if (ast.helpers.length > 0) {
        push(`
        const { ${ast.helpers.map(aliasHelper).join(", ")}} = ${VueBinging} 

      `);
    }
    newline();
    push(`return `);
}
function genNode(node, context) {
    // 生成代码的规则就是读取 node ，然后基于不同的 node 来生成对应的代码块
    // 然后就是把代码快给拼接到一起就可以了
    switch (node.type) {
        case 2 /* NodeTypes.INTERPOLATION */:
            genInterpolation(node, context);
            break;
        case 3 /* NodeTypes.SIMPLE_EXPRESSION */:
            genExpression(node, context);
            break;
        case 4 /* NodeTypes.ELEMENT */:
            genElement(node, context);
            break;
        case 5 /* NodeTypes.COMPOUND_EXPRESSION */:
            genCompoundExpression(node, context);
            break;
        case 0 /* NodeTypes.TEXT */:
            genText(node, context);
            break;
    }
}
function genCompoundExpression(node, context) {
    const { push } = context;
    for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(child, context);
        }
    }
}
function genText(node, context) {
    // Implement
    const { push } = context;
    push(`'${node.content}'`);
}
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, props, children } = node;
    push(`${helper(CREATE_ELEMENT_VNODE)}(`);
    genNodeList(genNullableArgs([tag, props, children]), context);
    push(`)`);
}
function genNodeList(nodes, context) {
    const { push } = context;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (isString(node)) {
            push(`${node}`);
        }
        else {
            genNode(node, context);
        }
        // node 和 node 之间需要加上 逗号(,)
        // 但是最后一个不需要 "div", [props], [children]
        if (i < nodes.length - 1) {
            push(", ");
        }
    }
}
function genNullableArgs(args) {
    // 把末尾为null 的都删除掉
    // vue3源码中，后面可能会包含 patchFlag、dynamicProps 等编译优化的信息
    // 而这些信息有可能是不存在的，所以在这边的时候需要删除掉
    let i = args.length;
    // 这里 i-- 用的还是特别的巧妙的
    // 当为0 的时候自然就退出循环了
    while (i--) {
        if (args[i] != null)
            break;
    }
    // 把为 falsy 的值都替换成 "null"
    return args.slice(0, i + 1).map((arg) => arg || "null");
}
function genExpression(node, context) {
    context.push(node.content, node);
}
function genInterpolation(node, context) {
    const { push, helper } = context;
    push(`${helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(")");
}
function genModulePreamble(ast, context) {
    // preamble 就是 import 语句
    const { push, newline, runtimeModuleName } = context;
    if (ast.helpers.length) {
        // 比如 ast.helpers 里面有个 [toDisplayString]
        // 那么生成之后就是 import { toDisplayString as _toDisplayString } from "vue"
        const code = `import {${ast.helpers
            .map((s) => `${helperNameMap[s]} as _${helperNameMap[s]}`)
            .join(", ")} } from ${JSON.stringify(runtimeModuleName)}`;
        push(code);
    }
    newline();
    push(`export `);
}
function createCodegenContext(ast, { runtimeModuleName = "vue", runtimeGlobalName = "Vue", mode = "function" }) {
    const context = {
        code: "",
        mode,
        runtimeModuleName,
        runtimeGlobalName,
        helper(key) {
            return `_${helperNameMap[key]}`;
        },
        push(code) {
            context.code += code;
        },
        newline() {
            // 换新行
            // TODO 需要额外处理缩进
            context.code += "\n";
        },
    };
    return context;
}

function baseParse(content) {
    const context = createParserContext(content);
    return createRoot(parseChildren(context, []));
}
function createParserContext(content) {
    console.log("创建 paserContext");
    return {
        source: content,
    };
}
function parseChildren(context, ancestors) {
    console.log("开始解析 children");
    const nodes = [];
    while (!isEnd(context, ancestors)) {
        let node;
        const s = context.source;
        if (startsWith(s, "{{")) {
            // 看看如果是 {{ 开头的话，那么就是一个插值， 那么去解析他
            node = parseInterpolation(context);
        }
        else if (s[0] === "<") {
            if (s[1] === "/") {
                // 这里属于 edge case 可以不用关心
                // 处理结束标签
                if (/[a-z]/i.test(s[2])) {
                    // 匹配 </div>
                    // 需要改变 context.source 的值 -> 也就是需要移动光标
                    parseTag(context, 1 /* TagType.End */);
                    // 结束标签就以为这都已经处理完了，所以就可以跳出本次循环了
                    continue;
                }
            }
            else if (/[a-z]/i.test(s[1])) {
                node = parseElement(context, ancestors);
            }
        }
        if (!node) {
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
function isEnd(context, ancestors) {
    // 检测标签的节点
    // 如果是结束标签的话，需要看看之前有没有开始标签，如果有的话，那么也应该结束
    // 这里的一个 edge case 是 <div><span></div>
    // 像这种情况下，其实就应该报错
    const s = context.source;
    if (context.source.startsWith("</")) {
        // 从后面往前面查
        // 因为便签如果存在的话 应该是 ancestors 最后一个元素
        for (let i = ancestors.length - 1; i >= 0; --i) {
            if (startsWithEndTagOpen(s, ancestors[i].tag)) {
                return true;
            }
        }
    }
    // 看看 context.source 还有没有值
    return !context.source;
}
function parseElement(context, ancestors) {
    // 应该如何解析 tag 呢
    // <div></div>
    // 先解析开始 tag
    const element = parseTag(context, 0 /* TagType.Start */);
    ancestors.push(element);
    const children = parseChildren(context, ancestors);
    ancestors.pop();
    // 解析 end tag 是为了检测语法是不是正确的
    // 检测是不是和 start tag 一致
    if (startsWithEndTagOpen(context.source, element.tag)) {
        parseTag(context, 1 /* TagType.End */);
    }
    else {
        throw new Error(`缺失结束标签：${element.tag}`);
    }
    element.children = children;
    return element;
}
function startsWithEndTagOpen(source, tag) {
    // 1. 头部 是不是以  </ 开头的
    // 2. 看看是不是和 tag 一样
    return (startsWith(source, "</") &&
        source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase());
}
function parseTag(context, type) {
    // 发现如果不是 > 的话，那么就把字符都收集起来 ->div
    // 正则
    const match = /^<\/?([a-z][^\r\n\t\f />]*)/i.exec(context.source);
    const tag = match[1];
    // 移动光标
    // <div
    advanceBy(context, match[0].length);
    // 暂时不处理 selfClose 标签的情况 ，所以可以直接 advanceBy 1个坐标 <  的下一个就是 >
    advanceBy(context, 1);
    if (type === 1 /* TagType.End */)
        return;
    let tagType = 0 /* ElementTypes.ELEMENT */;
    return {
        type: 4 /* NodeTypes.ELEMENT */,
        tag,
        tagType,
    };
}
function parseInterpolation(context) {
    // 1. 先获取到结束的index
    // 2. 通过 closeIndex - startIndex 获取到内容的长度 contextLength
    // 3. 通过 slice 截取内容
    // }} 是插值的关闭
    // 优化点是从 {{ 后面搜索即可
    const openDelimiter = "{{";
    const closeDelimiter = "}}";
    const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
    // TODO closeIndex -1 需要报错的
    // 让代码前进2个长度，可以把 {{ 干掉
    advanceBy(context, 2);
    const rawContentLength = closeIndex - openDelimiter.length;
    const rawContent = context.source.slice(0, rawContentLength);
    const preTrimContent = parseTextData(context, rawContent.length);
    const content = preTrimContent.trim();
    // 最后在让代码前进2个长度，可以把 }} 干掉
    advanceBy(context, closeDelimiter.length);
    return {
        type: 2 /* NodeTypes.INTERPOLATION */,
        content: {
            type: 3 /* NodeTypes.SIMPLE_EXPRESSION */,
            content,
        },
    };
}
function parseText(context) {
    console.log("解析 text", context);
    // endIndex 应该看看有没有对应的 <
    // 比如 hello</div>
    // 像这种情况下 endIndex 就应该是在 o 这里
    // {
    const endTokens = ["<", "{{"];
    let endIndex = context.source.length;
    for (let i = 0; i < endTokens.length; i++) {
        const index = context.source.indexOf(endTokens[i]);
        // endIndex > index 是需要要 endIndex 尽可能的小
        // 比如说：
        // hi, {{123}} <div></div>
        // 那么这里就应该停到 {{ 这里，而不是停到 <div 这里
        if (index !== -1 && endIndex > index) {
            endIndex = index;
        }
    }
    const content = parseTextData(context, endIndex);
    return {
        type: 0 /* NodeTypes.TEXT */,
        content,
    };
}
function parseTextData(context, length) {
    console.log("解析 textData");
    // 1. 直接返回 context.source
    // 从 length 切的话，是为了可以获取到 text 的值（需要用一个范围来确定）
    const rawText = context.source.slice(0, length);
    // 2. 移动光标
    advanceBy(context, length);
    return rawText;
}
function advanceBy(context, numberOfCharacters) {
    console.log("推进代码", context, numberOfCharacters);
    context.source = context.source.slice(numberOfCharacters);
}
function createRoot(children) {
    return {
        type: 1 /* NodeTypes.ROOT */,
        children,
        helpers: [],
    };
}
function startsWith(source, searchString) {
    return source.startsWith(searchString);
}

function transform(root, options = {}) {
    // 1. 创建 context
    const context = createTransformContext(root, options);
    // 2. 遍历 node
    traverseNode(root, context);
    createRootCodegen(root);
    root.helpers.push(...context.helpers.keys());
}
function traverseNode(node, context) {
    const type = node.type;
    // 遍历调用所有的 nodeTransforms
    // 把 node 给到 transform
    // 用户可以对 node 做处理
    const nodeTransforms = context.nodeTransforms;
    const exitFns = [];
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
        const onExit = transform(node, context);
        if (onExit) {
            exitFns.push(onExit);
        }
    }
    switch (type) {
        case 2 /* NodeTypes.INTERPOLATION */:
            // 插值的点，在于后续生成 render 代码的时候是获取变量的值
            context.helper(TO_DISPLAY_STRING);
            break;
        case 1 /* NodeTypes.ROOT */:
        case 4 /* NodeTypes.ELEMENT */:
            traverseChildren(node, context);
            break;
    }
    let i = exitFns.length;
    // i-- 这个很巧妙
    // 使用 while 是要比 for 快 (可以使用 https://jsbench.me/ 来测试一下)
    while (i--) {
        exitFns[i]();
    }
}
function traverseChildren(parent, context) {
    // node.children
    parent.children.forEach((node) => {
        // TODO 需要设置 context 的值
        traverseNode(node, context);
    });
}
function createTransformContext(root, options) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper(name) {
            // 这里会收集调用的次数
            // 收集次数是为了给删除做处理的， （当只有 count 为0 的时候才需要真的删除掉）
            // helpers 数据会在后续生成代码的时候用到
            const count = context.helpers.get(name) || 0;
            context.helpers.set(name, count + 1);
        },
    };
    return context;
}
function createRootCodegen(root, context) {
    const { children } = root;
    // 只支持有一个根节点
    // 并且还是一个 single text node
    const child = children[0];
    // 如果是 element 类型的话 ， 那么我们需要把它的 codegenNode 赋值给 root
    // root 其实是个空的什么数据都没有的节点
    // 所以这里需要额外的处理 codegenNode
    // codegenNode 的目的是专门为了 codegen 准备的  为的就是和 ast 的 node 分离开
    if (child.type === 4 /* NodeTypes.ELEMENT */ && child.codegenNode) {
        const codegenNode = child.codegenNode;
        root.codegenNode = codegenNode;
    }
    else {
        root.codegenNode = child;
    }
}

function transformExpression(node) {
    if (node.type === 2 /* NodeTypes.INTERPOLATION */) {
        node.content = processExpression(node.content);
    }
}
function processExpression(node) {
    node.content = `_ctx.${node.content}`;
    return node;
}

function createVNodeCall(context, tag, props, children) {
    if (context) {
        context.helper(CREATE_ELEMENT_VNODE);
    }
    return {
        // TODO vue3 里面这里的 type 是 VNODE_CALL
        // 是为了 block 而 mini-vue 里面没有实现 block 
        // 所以创建的是 Element 类型就够用了
        type: 4 /* NodeTypes.ELEMENT */,
        tag,
        props,
        children,
    };
}

function transformElement(node, context) {
    if (node.type === 4 /* NodeTypes.ELEMENT */) {
        return () => {
            // 没有实现 block  所以这里直接创建 element
            // TODO
            // 需要把之前的 props 和 children 等一系列的数据都处理
            const vnodeTag = `'${node.tag}'`;
            // TODO props 暂时不支持
            const vnodeProps = null;
            let vnodeChildren = null;
            if (node.children.length > 0) {
                if (node.children.length === 1) {
                    // 只有一个孩子节点 ，那么当生成 render 函数的时候就不用 [] 包裹
                    const child = node.children[0];
                    vnodeChildren = child;
                }
            }
            // 创建一个新的 node 用于 codegen 的时候使用
            node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        };
    }
}

function isText(node) {
    return node.type === 2 /* NodeTypes.INTERPOLATION */ || node.type === 0 /* NodeTypes.TEXT */;
}

function transformText(node, context) {
    if (node.type === 4 /* NodeTypes.ELEMENT */) {
        // 在 exit 的时期执行
        // 下面的逻辑会改变 ast 树
        // 有些逻辑是需要在改变之前做处理的
        return () => {
            // hi,{{msg}}
            // 上面的模块会生成2个节点，一个是 text 一个是 interpolation 的话
            // 生成的 render 函数应该为 "hi," + _toDisplayString(_ctx.msg)
            // 这里面就会涉及到添加一个 “+” 操作符
            // 那这里的逻辑就是处理它
            // 检测下一个节点是不是 text 类型，如果是的话， 那么会创建一个 COMPOUND 类型
            // COMPOUND 类型把 2个 text || interpolation 包裹（相当于是父级容器）
            const children = node.children;
            let currentContainer;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isText(child)) {
                    // 看看下一个节点是不是 text 类
                    for (let j = i + 1; j < children.length; j++) {
                        const next = children[j];
                        if (isText(next)) {
                            // currentContainer 的目的是把相邻的节点都放到一个 容器内
                            if (!currentContainer) {
                                currentContainer = children[i] = {
                                    type: 5 /* NodeTypes.COMPOUND_EXPRESSION */,
                                    loc: child.loc,
                                    children: [child],
                                };
                            }
                            currentContainer.children.push(` + `, next);
                            // 把当前的节点放到容器内, 然后删除掉j
                            children.splice(j, 1);
                            // 因为把 j 删除了，所以这里就少了一个元素，那么 j 需要 --
                            j--;
                        }
                        else {
                            currentContainer = undefined;
                            break;
                        }
                    }
                }
            }
        };
    }
}

function baseCompile(template, options) {
    // 1. 先把 template 也就是字符串 parse 成 ast
    const ast = baseParse(template);
    // 2. 给 ast 加点料（- -#）
    transform(ast, Object.assign(options, {
        nodeTransforms: [transformElement, transformText, transformExpression],
    }));
    // 3. 生成 render 函数代码
    return generate(ast);
}

// mini-vue 出口
function compileToFunction(template, options = {}) {
    const { code } = baseCompile(template, options);
    // 调用 compile 得到的代码在给封装到函数内，
    // 这里会依赖 runtimeDom 的一些函数，所以在这里通过参数的形式注入进去
    const render = new Function("Vue", code)(runtimeDom);
    return render;
}
registerRuntimeCompiler(compileToFunction);

export { computed, createApp, createAppAPI, createVNode as createElementVNode, createRenderer, createTextVNode, effect, getCurrentInstance, h, inject, isProxy, isReactive, isReadonly, isRef, provide, proxyRefs, reactive, readonly, ref, registerRuntimeCompiler, renderSlot, shallowReadonly, stop, toDisplayString, unRef };
