// 组件的类型
export const enum ShapeFlags {
    // 最后要渲染的 element 类型
    ELEMENT = 1, // 0001
    // 组件类型
    STATEFUL_COMPONENT = 1 << 1, // 0010
    // vnode 的 children 为 string 类型
    TEXT_CHILDREN = 1 << 2, // 0100
    // vnode 的 children 为数组类型
    ARRAY_CHILDREN = 1 << 3, // 1000
    // vnode 的 children 为 slots 类型
    SLOTS_CHILDREN = 1 << 4 // 10000
  }
  