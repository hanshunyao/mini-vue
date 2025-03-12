import { render } from './render';
import { createVNode } from './vnode';

// 这里 调用 createdApp 传入 根组件
// 然后返回一个 app 对象
export function createApp(rootComponent) {
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
