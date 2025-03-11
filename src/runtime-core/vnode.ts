import { ShapeFlags } from "../shared/index";

// 这里后面两个参数可选
export const createVNode = function (
  type: any,
  props?: any,
  children?: string | Array<any>,
  
) {
  const vnode = {
    type,
    props,
    children,
    shapeFlag:getShapeFlag(type),
    // 初始化时 el 设置为 null，后面这个字段用于存储根节点 通过 $el 访问
    el:null
  };

   // 基于 children 再次设置 shapeFlag
   if (Array.isArray(children)) {
    // 这里用了 或 的操作 ，或 是 都是 0 ，结果才是 0，只要有一个是 1 ，结果就是 1
    // 这两个 type 在自己 对应的位上都是 1 所以只要 和 之前的类型 或 上，结果就肯定在原有基础上 把新的位置为1
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  } else if (typeof children === "string") {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
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
function getShapeFlag(type: any) {
  return typeof type === "string"
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT;
}
