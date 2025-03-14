import { createRenderer } from '../runtime-core/index';
import { isOn } from '../shared/index';
function createElement(type) {
  console.log('CreateElement', type);
  const element = document.createElement(type);
  return element;
}

function setElementText(el, text) {
  console.log('SetElementText', el, text);
  el.textContent = text;
}

function patchProp(el, key, preValue, nextValue) {
  // preValue 之前的值
  // 为了之后 update 做准备的值
  // nextValue 当前的值
  console.log(`PatchProp 设置属性:${key} 值:${nextValue}`);
  console.log(`key: ${key} 之前的值是:${preValue}`);

  if (isOn(key)) {
    // 添加事件处理函数的时候需要注意一下
    // 1. 添加的和删除的必须是一个函数，不然的话 删除不掉
    //    那么就需要把之前 add 的函数给存起来，后面删除的时候需要用到
    // 2. nextValue 有可能是匿名函数，当对比发现不一样的时候也可以通过缓存的机制来避免注册多次
    // 存储所有的事件函数
    const invokers = el._vei || (el._vei = {});
    const existingInvoker = invokers[key];
    if (nextValue && existingInvoker) {
      // patch
      // 直接修改函数的值即可
      existingInvoker.value = nextValue;
    } else {
      const eventName = key.slice(2).toLowerCase();
      if (nextValue) {
        const invoker = (invokers[key] = nextValue);
        el.addEventListener(eventName, invoker);
      } else {
        el.removeEventListener(eventName, existingInvoker);
        invokers[key] = undefined;
      }
    }
  } else {
    if (nextValue === null || nextValue === '') {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, nextValue);
    }
  }
}

function insert(child, parent) {
  console.log('Insert');
  parent.append(child)
}

const renderer:any = createRenderer({
  createElement,
  patchProp,
  insert,
  setElementText,
});


// 这个地方 runtime-dom 是基于 runtime-core 中的 createApp 方法，但是 createApp 中需要的 render 函数 又在 createRenderer 函数主 生成
// 所以这个地方 直接 把 createApp 功能 也放在 一个 createAppAPI 中返回，在 createRenderer 中 调用 createAppAPI 生成 createApp 方法
// 然后把 createApp 方法 挂载到 renderer 函数上，这里 就直接调用
export const createApp = (...args) => {
  // 这里的 renderer 是使用默认 options 生成的 dom 渲染器下的 createApp 方法
  // 如果想要自定义，可以直接在 外部调用 createRenderer 方法传入自定义option生成自定义的渲染函数
  return renderer.createApp(...args);
};
export * from '../runtime-core/index';
