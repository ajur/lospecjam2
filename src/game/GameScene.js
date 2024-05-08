import { HEIGHT, TILESETS_SPRITESHEET, WIDTH } from '../consts';
import { Container, Ticker, Assets } from 'pixi.js';
import { PPSprite } from './PPSprite';

import { wrap } from "../tools";
import { createAnimation } from '../pixiTools';
import { Walls } from './Map';

export function createScene() {
  const c = new Container();

  // c.addChild(buildMap());

  const map = c.addChild(new Walls(WIDTH, HEIGHT / 2));
  map.y = HEIGHT / 4;

  // const s = PPSprite.from("ship/red/fwd");

  // Ticker.shared.add(() => {
  //   s.x = 16;
  //   s.y = wrap(s.y - 0.4, 0, HEIGHT);
  // });
  // c.addChild(s);
  
  
  // const a = createAnimation('effect/explosion', {autoplay: true});
  // a.x = 8;
  // a.y = 8;
  // c.addChild(a);
  
  
  return c;
}


