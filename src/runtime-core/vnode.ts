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
  };
  return vnode;
};
