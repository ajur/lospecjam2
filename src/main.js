import './fw/hello.js'
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
  await app.init({ preference: "webgl", background: '#000', width: WIDTH, height: HEIGHT, antialias: false, roundPixels: true });

  const appElem = document.querySelector('#app') ?? document.body;
  appElem.appendChild(app.canvas);

  if (isDebugOn) {
    initDebug(app);
  }

  await preloader.loadAssets();

  const game = new Game(app);
  initInput();
  game.gotoMainMenu();

  const onWindowResize = () => {
    const {innerWidth, innerHeight, devicePixelRatio} = window;
    const scale = Math.max(1, Math.min(
      Math.floor(innerWidth * devicePixelRatio / WIDTH),
      Math.floor(innerHeight * devicePixelRatio / HEIGHT)
    )) / devicePixelRatio;

    app.renderer.canvas.style.width = `${WIDTH * scale}px`;
  };

  window.addEventListener('resize', onWindowResize);
  onWindowResize();
})();
