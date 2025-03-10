import { createComponentInstance, setupComponent } from './component';

export function render(vnode, container) {
  // 调用 patch
  // 后续方便递归
  console.log('调用 patch');
  patch(vnode, container);
}

function patch(vnode, container) {
  // TODO：这个地方需要判断 vnode 类型
  // 现在是直接处理 components 类型
  processComponent(vnode, container);
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
  setupRenderEffect(instance, container);
}
function setupRenderEffect(instance, container) {
  // subTree 就是组件的虚拟 dom 树
  const subTree = instance.render();

  // vnode -> patch
  // vnode -> element -> mountElement
  // 这个地方 要把所有的 vnode 再通过 patch 方法挂在到容器上
  patch(subTree, container);

  // 其上上面的操作 setupComponent 就是初始化 把 components 的信息收集到实例上
  // component 就相当于 一个箱子，调用 render 方法进行拆箱
  // 把内部需要渲染的 element 节点返回出来，之后通过 patch 挂在到对应的节点上
}
