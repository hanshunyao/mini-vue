import { h } from '../../lib/guide-mini-vue.esm.js';

export const foo = {
  setup(props) {
    console.log(props);
    // 测试 props
    // 1. props 是只读的
    // 2. props 在 setup 中能读取
    // 3. props 在 render 中能读取
    props.count++;
    console.log(props);
  },
  render() {
    return h('div', {}, 'foo: ' + this.count);
  },
};
