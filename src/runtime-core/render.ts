import { createComponentInstance, setupComponent } from './component';
import { ShapeFlags } from '../shared/index';
import { Fragment, Text } from './vnode';

export function render(vnode, container) {
  // 调用 patch
  // 后续方便递归
  console.log('调用 patch');
  patch(vnode, container);
}

function patch(vnode, container, parentComponent = null) {
  // TODO：这个地方需要是初始化还是 update
  // 现在是直接处理 初始化
  // 后续会处理 update
  const { type, shapeFlag } = vnode;
  // 这个地方使用 与的操作，与的特点是 都是1 ，结果才是 1，只要有一个是 0 ，结果就是 0
  // ShapeFlags 中的类型 在其算表示的位上 为 1 其他位都是0 ，所以 只要是 这个 虚拟节点的该位上 为1 就返回有值，如果虚拟节点这位不是 1 那整个结果都是 0
  switch (type) {
    case Text:
      processText(vnode, container);
      break;
    // 其中还有几个类型比如： static fragment comment
    case Fragment:
      processFragment(vnode, container, parentComponent);
      break;
    default:
      // 这里就基于 shapeFlag 来处理
      if (shapeFlag & ShapeFlags.ELEMENT) {
        console.log('处理 element');
        processElement(vnode, container, parentComponent);
      } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        console.log('处理 component');
        processComponent(vnode, container, parentComponent);
      }
  }
}

function processFragment(vnode: any, container: any, parentComponent) {
  // 只需要渲染 children ，然后给添加到 container 内
  // 初始化 Fragment 逻辑点
  console.log('初始化 Fragment 类型的节点');
  mountChildren(vnode.children, container, parentComponent);
}

function processText(vnode, container) {
  console.log('处理 Text 节点');
  // 初始化 Text 逻辑点
  const { children } = vnode;
  const textNode = (vnode.el = document.createTextNode(children));
  container.append(textNode);
}

function processElement(vnode: any, container: any, parentComponent) {
  // 判断是初始化还是更新
  // 现在是直接处理 初始化
  mountElement(vnode, container, parentComponent);
}

function mountElement(vnode: any, container: any, parentComponent) {
  const el = document.createElement(vnode.type);
  vnode.el = el;
  const { props, shapeFlag } = vnode;

  // 如果 children 是 string 类型
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = vnode.children;
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    // 如果 children 是 array 类型
    // 递归处理
    mountChildren(vnode.children, el, parentComponent);
  }

  const isOn = (key: string) => /^on[A-Z]/.test(key);
  for (const key in props) {
    const val = props[key];

    if (isOn(key)) {
      const event = key.slice(2).toLowerCase();
      el.addEventListener(event, val);
    } else {
      el.setAttribute(key, val);
    }
  }
  container.append(el);
}

function mountChildren(children: any[], el: any, parentComponent) {
  children.forEach((v) => {
    patch(v, el, parentComponent);
  });
}
function processComponent(vnode: any, container: any, parentComponent) {
  // TODO：这个地方需要判断 是首次挂载还是节点更新
  // 现在是直接处理 组件首次挂载
  mountComponent(vnode, container, parentComponent);
}

function mountComponent(initialVNode: any, container: any, parentComponent) {
  // 初始化组件
  console.log('初始化组件');
  // 通过虚拟节点 创建出 组件实例对象
  // 后面组件的所有属性都可以挂在到这个 实例对象上
  const instance = createComponentInstance(initialVNode, parentComponent);

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
  patch(subTree, container, instance);

  // 其上上面的操作 setupComponent 就是初始化 把 components 的信息收集到实例上
  // component 就相当于 一个箱子，调用 render 方法进行拆箱
  // 把内部需要渲染的 element 节点返回出来，之后通过 patch 挂在到对应的节点上

  // 这个地方处理完了所有的 element 节点，subTree 就是根节点
  initialVNode.el = subTree.el;
}
