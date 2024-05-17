import { Container, Ticker, Sprite, Texture, Rectangle, Graphics } from 'pixi.js';
import gsap from 'gsap';

import { addDebugPane } from '~/fw/debug';
import { HEIGHT } from '~/consts';
import { createAnimation } from '~/fw/pixiTools';
import { clamp } from '~/fw/tools';


const RED_SHIP = 'red';
const GREEN_SHIP = 'green';
const BLUE_SHIP = 'blue';

const COLLIDERS = {
  [RED_SHIP]: [
    [new Rectangle(-1, -6, 2, 3), new Rectangle(-2, -3, 4, 10), new Rectangle(-5, 2, 3, 5), new Rectangle(2, 2, 3, 5)],
    [new Rectangle(-1, -6, 2, 3), new Rectangle(-2, -3, 4, 10), new Rectangle(-7, 2, 5, 5), new Rectangle(2, 2, 5, 5)],
    [new Rectangle(-1, -6, 2, 3), new Rectangle(-2, -3, 4, 10), new Rectangle(-5, 2, 3, 5), new Rectangle(2, 2, 3, 5)],
  ],
  [GREEN_SHIP]: [
    [new Rectangle(-1, -6, 2, 3), new Rectangle(-2, -3, 4, 10), new Rectangle(-6, 1, 4, 5), new Rectangle(2, 1, 4, 5)],
    [new Rectangle(-1, -6, 2, 3), new Rectangle(-2, -3, 4, 10), new Rectangle(-7, 1, 5, 5), new Rectangle(2, 1, 5, 5)],
    [new Rectangle(-1, -6, 2, 3), new Rectangle(-2, -3, 4, 10), new Rectangle(-6, 1, 4, 5), new Rectangle(2, 1, 4, 5)],
  ],
  [BLUE_SHIP]: [
    [new Rectangle(-1, -6, 2, 3), new Rectangle(-2, -3, 4, 10), new Rectangle(-6, 1, 4, 5), new Rectangle(2, 1, 4, 5)],
    [new Rectangle(-1, -6, 2, 3), new Rectangle(-2, -3, 4, 10), new Rectangle(-7, 1, 5, 5), new Rectangle(2, 1, 5, 5)],
    [new Rectangle(-1, -6, 2, 3), new Rectangle(-2, -3, 4, 10), new Rectangle(-6, 1, 4, 5), new Rectangle(2, 1, 4, 5)],
  ]
}


export class PlayerShip extends Container {

  static playerOne(controller) {
    return new PlayerShip(RED_SHIP, controller);
  }
  static playerTwo(controller) {
    return new PlayerShip(GREEN_SHIP, controller);
  }

  constructor(type, controller) {
    super();
    this.__x = this.position.x;
    this.__y = this.position.y;

    this.shipType = type;
    this.controller = controller;

    this.shipTextures = [
      Texture.from(`ship/${this.shipType}/left`),
      Texture.from(`ship/${this.shipType}/fwd`),
      Texture.from(`ship/${this.shipType}/right`)
    ];
    this.currentTexture = 1;

    this.spr = this.addChild(Sprite.from(this.shipTextures[this.currentTexture]));

    this.colliders = COLLIDERS[this.shipType];
    this.partNames = ["nose", "hull", "leftWing", "rightWing"];

    this.moveSpeed = 0.05;
    this.vx = 0;
    this.vy = 0;
    this.vDamp = 0.97;

    this.acceptInput = true;
    Ticker.shared.add(this.onTickerUpdate, this);

    this.removeDebugPane = addDebugPane('Ship ' + this.shipType, (pane) => {
      pane.expanded = false;
      pane.addBinding(this, 'moveSpeed', { min: 0.001, max: 0.2, step: 0.001 });
      pane.addBinding(this, 'vDamp', { min: 0.9, max: 1, step: 0.001 });
    });
  }

  destroy(options) {
    Ticker.shared.remove(this.onTickerUpdate, this);
    this.removeDebugPane();
    super.destroy(options);
  }

  get x() {
    return this.__x;
  }
  set x(value) {
    this.__x = value;
    this._position.x = Math.round(value);
  }
  get y() {
    return this.__y;
  }
  set y(value) {
    this.__y = value;
    this._position.y = Math.round(value);
  }

  getColliders() {
    const {x, y} = this.position;
    return this.colliders[this.currentTexture].map((c, idx) => {
      const r = c.clone();
      r.x += x;
      r.y += y;
      r.partName = this.partNames[idx];
      return r;
    })
  }

  crash(part) {
    console.log(this.shipType + ' crashed on part', part.partName);
    this.acceptInput = false;

    this.spr.visible = false;
    this.addChild(createAnimation('effect/explosion', {loop: false, autoplay: true, speed: 0.1}));
  }
e
  fallback() {
    this.acceptInput = false;
    Ticker.shared.remove(this.onTickerUpdate, this);
    this.currentTexture = 1;
    this.spr.texture = this.shipTextures[this.currentTexture];
    gsap.to(this, {y: HEIGHT + 10, duration: 1, ease: "back.in"});
  }

  onTickerUpdate({deltaTime}) {

    let ax = 0;
    let ay = 0;
    if (this.acceptInput) {
      if (this.controller.up) ay -= 1;
      if (this.controller.down) ay += 1;
      if (this.controller.left) ax -= 1;
      if (this.controller.right) ax += 1;

      this.currentTexture = Math.sign(ax) + 1;
      this.spr.texture = this.shipTextures[this.currentTexture];

      this.vx += ax * this.moveSpeed;
      this.vy += ay * this.moveSpeed;
    }

    this.x += this.vx * deltaTime;
    this.y = clamp(this.y + this.vy * deltaTime, 10, HEIGHT - 10);

    this.vx *= this.vDamp;
    this.vy *= this.vDamp;
  }


}
