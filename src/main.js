// import './hello.js'
import './style.css'

import { Application } from 'pixi.js';

import preloader from './preloader.js';
import { initDebug, isDebugOn } from './debug';
import { createScene } from './game/GameScene.js';
import { WIDTH } from './consts.js';
import { HEIGHT } from './consts.js';
import { initInput } from './input.js';
import msg from './msg.js';

if (!isDebugOn) {
  preloader.show();
}

let app;

(async () => {
  app = new Application();
  const preference = new URLSearchParams(window.location.search).get('preference');
  await app.init({ preference: preference || "webgpu", background: '#000', width: WIDTH, height: HEIGHT, antialias: false });

  const appElem = document.querySelector('#app') ?? document.body;
  appElem.appendChild(app.canvas);

  if (isDebugOn) {
    initDebug(app);
  }
  initInput();

  await preloader.loadAssets();

  const scene = createScene();
  app.stage.addChild(scene);

  window.addEventListener('resize', onWindowResize);
  onWindowResize();
})();


function onWindowResize() {
  const {innerWidth, innerHeight} = window;
  console.log(innerWidth, innerHeight);
  
  const scale = Math.min(Math.floor(innerWidth / WIDTH), Math.floor(innerHeight / HEIGHT));
  console.log(scale)

  app.renderer.canvas.style.transform = `scale(${scale})`
}
