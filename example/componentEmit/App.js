import { h } from '../../lib/guide-mini-vue.esm.js';
import { foo } from './Foo.js';

export const App = {
  name: 'App',
  render() {
    return h('div', {}, [
      h('div', {}, 'App'),
      h(foo, {
        onAdd() {
          console.log('on-add');
        },
      }),
    ]);
  },
  setup() {
    return {};
  },
};
