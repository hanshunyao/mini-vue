import { createVNode } from './vnode';
// h 就是调用 createVNode 对于外部用户更方便使用
export const h = (
  type: any,
  props: any = null,
  children: string | Array<any> = []
) => {
  return createVNode(type, props, children);
};
