// import './hello.js'
import './style.css'

import { Application } from 'pixi.js';

import preloader from './fw/preloader.js';
import { initDebug, isDebugOn } from './fw/debug';
import { HEIGHT, WIDTH } from './consts.js';
import { Game } from "~/Game.js";
import { initInput } from "~/fw/input.js";

if (!isDebugOn) {
  preloader.show();
}

(async () => {
  const app = new Application();
  await app.init({ preference: "webgpu", background: '#000', width: WIDTH, height: HEIGHT, antialias: false });

  const appElem = document.querySelector('#app') ?? document.body;
  appElem.appendChild(app.canvas);

  if (isDebugOn) {
    initDebug(app);
  }

  await preloader.loadAssets();

  const game = new Game(app);
  initInput();
  game.mainMenu();

  const onWindowResize = () => {
    const {innerWidth, innerHeight} = window;
    const scale = Math.min(Math.floor(innerWidth / WIDTH), Math.floor(innerHeight / HEIGHT));

    app.renderer.canvas.style.transform = `scale(${scale})`
  };

  window.addEventListener('resize', onWindowResize);
  onWindowResize();
})();
