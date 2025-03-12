import { h } from '../../lib/guide-mini-vue.esm.js';
import { foo } from './Foo.js';

window.self = null;
export const App = {
  name: 'App',
  //　先不实现编译功能，先直接写一个　render 函数
  render() {
    window.self = this;
    return h(
      'div',
      {
        id: 'root',
        class: ['red', 'hard'],
        onClick: () => console.log('click'),
      },
      [h('div', {}, 'hi, ' + this.msg), h(foo, { count: 1 })]
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
