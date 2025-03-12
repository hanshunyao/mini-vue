import { h, renderSlots } from '../../lib/guide-mini-vue.esm.js';
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
      renderSlots(this.$slots, 'header',{age}),
      renderSlots(this.$slots, 'body'),
      renderSlots(this.$slots, 'footer'),
    ]);
  },
};
