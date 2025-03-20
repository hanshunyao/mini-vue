import { h, renderSlot } from '../../lib/guide-mini-vue.esm.js';
export const Foo = {
  name: 'foo',
  setup() {
    return {};
  },
  render() {
    const foo = h('p', {}, 'foo');
    console.log(this.$slots);
    const age = 18;
    return h('div', {}, [
      foo,
      renderSlot(this.$slots, 'header',{age}),
      renderSlot(this.$slots, 'body'),
      renderSlot(this.$slots, 'footer'),
    ]);
  },
};
