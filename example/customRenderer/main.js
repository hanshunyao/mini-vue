import { createRenderer } from '../../lib/guide-mini-vue.esm.js';
import { App } from './App.js';

console.log(PIXI);

// Create a PixiJS application.
const game = new PIXI.Application();

// Intialize the application.
await game.init({ background: '#1099bb', width: 500, height: 500 });

// Then adding the application's canvas to the DOM body.
document.body.appendChild(game.canvas);

const renderer = createRenderer({
  createElement(type) {
    if (type === 'rect') {
      const rect = new PIXI.Graphics();
      rect.beginFill(0x66CCFF);
      rect.rect(0, 0, 100, 100);
      rect.endFill();
      return rect;
    }
  },
  patchProp(el, key, val) {
    el[key] = val;
  },
  insert(el, parent) {
    parent.addChild(el);
  },
});

renderer.createApp(App).mount(game.stage);
