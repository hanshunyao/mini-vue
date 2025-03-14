import { h } from '../../lib/guide-mini-vue.esm.js';

export const App = {
  name: 'App',
  setup() {
    // composition API
    return {
      x: 100,
      y: 100,
    };
  },
  render() {
    return h('rect', { x: this.x, y: this.y });
  },
};
