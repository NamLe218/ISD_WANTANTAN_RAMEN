import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="toast"></div></body></html>', { url: 'http://localhost:3000' });
global.window = dom.window;
global.document = dom.window.document;
import('./app.js').then(() => console.log('Success')).catch(e => console.error(e));
