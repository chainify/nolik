import { action, observable } from 'mobx';
import { keyPair } from '@waves/ts-lib-crypto';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { API_HOST } = publicRuntimeConfig;

class AppStore {
  stores = null;
  constructor(stores) {
    this.stores = stores;
  }

  @action
  sleep(time) {
    return new Promise(resolve => setTimeout(resolve, time));
  }

  @action
  generateRandom(length) {
    const chars =
      '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < length; i += 1)
      result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  }

  @action
  clipboardTextarea(text) {
    const id = 'clipboard-textarea-hidden-id';
    let existsTextarea = document.getElementById(id);

    if (!existsTextarea) {
      const textarea = document.createElement('textarea');
      textarea.id = id;
      // Place in top-left corner of screen regardless of scroll position.
      textarea.style.position = 'fixed';
      textarea.style.top = 0;
      textarea.style.left = 0;

      // Ensure it has a small width and height. Setting to 1px / 1em
      // doesn't work as this gives a negative w/h on some browsers.
      textarea.style.width = '1px';
      textarea.style.height = '1px';

      // We don't need padding, reducing the size if it does flash render.
      textarea.style.padding = 0;

      // Clean up any borders.
      textarea.style.border = 'none';
      textarea.style.outline = 'none';
      textarea.style.boxShadow = 'none';

      // Avoid flash of white box if rendered for any reason.
      textarea.style.background = 'transparent';
      document.querySelector('body').appendChild(textarea);
      existsTextarea = document.getElementById(id);
    }

    existsTextarea.value = text;
    existsTextarea.select();

    try {
      document.execCommand('copy');
      existsTextarea.parentNode.removeChild(existsTextarea);
    } catch (err) {
      // console.log('Unable to copy.');
    }
  }
}

export default AppStore;
