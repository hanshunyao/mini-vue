export const App = {
  //　先不实现编译功能，先直接写一个　render 函数

  render() {
    return h('div', 'hi, ' + this.msg);
  },

  setup() {
    // composition API
    return {
      msg: 'mini-vue',
    };
  },
};
