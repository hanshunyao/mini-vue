import { h, createTextVNode } from '../../lib/guide-mini-vue.esm.js';
import { Foo } from './Foo.js';

export const App = {
  name: 'App',
  setup() {
    return {};
  },

  render() {
    const app = h('p', {}, 'App');
    const foo = h(
      Foo,
      {},
      {
        header: ({ age }) => h('p', {}, 'header' + age),
        body: () => h('p', {}, 'body'),
        footer: () => h('p', {}, 'footer'),
        // h('p', {}, `我可以接收到 age: ${age}`),
      }
    );
    // const foo = ('Foo', {}, h('p', {}, '123'));
    return h('div', {}, [app, foo, createTextVNode('你好！')]);
  },
};
