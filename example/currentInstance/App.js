import { h, getCurrentInstance } from '../../lib/guide-mini-vue.esm.js';
import { foo } from './Foo.js';

export const App = {
  name: 'App',
  render() {
    return h('div', {}, [h('p', {}, 'currentInstance demo'), h(foo)]);
  },
  setup() {
    const instance = getCurrentInstance();
    console.log('App:', instance);
  },
};
