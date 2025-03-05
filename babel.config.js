/*
 * @Author: hansy hanshunyao_hansy@163.com
 * @Date: 2025-03-05 11:31:09
 * @LastEditors: hansy hanshunyao_hansy@163.com
 * @LastEditTime: 2025-03-05 14:21:22
 * @FilePath: \mini-vue\babel.config.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
  ],
};
