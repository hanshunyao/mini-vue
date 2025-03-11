// 这里后面两个参数可选
export const createVNode = function (
  type: any,
  props?: any,
  children?: string | Array<any>
) {
  const vnode = {
    type,
    props,
    children,
    // 初始化时 el 设置为 null，后面这个字段用于存储根节点 通过 $el 访问
    el:null
  };
  return vnode;
};
