import { h } from '../../lib/guide-mini-vue.esm.js';

window.self = null;
export const App = {
  //　先不实现编译功能，先直接写一个　render 函数
  render() {
    window.self = this;
    return h(
      'div',
      { id: 'root', class: ['red', 'hard'] },
      'hi, ' + this.msg
      // [h('p', { class: 'red' }, 'hi'), h('p', { class: 'blue' }, 'mini-vue')]
    );
  },
  setup() {
    // composition API
    return {
      msg: 'mini-vue',
    };
  },
};
