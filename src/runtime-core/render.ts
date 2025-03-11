import { createComponentInstance, setupComponent } from './component';
import { isObject } from '../shared/index';
export function render(vnode, container) {
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
  } else if (isObject(vnode.type)) {
    // 处理 component 类型
    processComponent(vnode, container);
  }
}

function processElement(vnode: any, container: any) {
  // 判断是初始化还是更新
  // 现在是直接处理 初始化
  mountElement(vnode, container);
}

function mountElement(vnode: any, container: any) {
  const el = document.createElement(vnode.type);
  vnode.el = el;
  const { children, props } = vnode;

  // 如果 children 是 string 类型
  if (typeof children === 'string') {
    el.textContent = children;
  } else if (Array.isArray(children)) {
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

function mountChildren(children: any[], el: any) {
  children.forEach((v) => {
    patch(v, el);
  });
}
function processComponent(vnode: any, container: any) {
  // TODO：这个地方需要判断 是首次挂载还是节点更新
  // 现在是直接处理 组件首次挂载
  mountComponent(vnode, container);
}

function mountComponent(vnode: any, container: any) {
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
