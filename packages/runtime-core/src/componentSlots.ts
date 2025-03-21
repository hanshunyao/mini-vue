import { ShapeFlags } from '@mini-vue/shared';
export function initSlots(instance, children) {
  // 把 children 存到 instance 上
  const { vnode } = instance;
  console.log('初始化 slots');
  // 前面 vnode 在 createVNode 中已经处理过了经过了位运算，这里可以筛选一下 如果是 slots 就特殊处理
  if (vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
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
