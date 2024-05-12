import { Container, Ticker, Sprite, Texture, Bounds, Rectangle } from 'pixi.js';
import { addDebugPane } from '../debug';
import { inputState } from '../input';
import { HEIGHT } from '../consts';
import { createAnimation } from '../pixiTools';
import { clamp } from '../tools';


export class PlayerShip extends Container {
  constructor() {
    super();
    this.__x = this.position.x;
    this.__y = this.position.y;
    
    this.shipTextures = [
      Texture.from('ship/red/left'),
      Texture.from('ship/red/fwd'),
      Texture.from('ship/red/right')
    ];
    this.currentTexture = 1;
    
    this.spr = this.addChild(Sprite.from(this.shipTextures[this.currentTexture]));

    this.colliders = [
      [new Rectangle(-1, -6, 2, 3), new Rectangle(-2, -3, 4, 10), new Rectangle(-5, 2, 3, 5), new Rectangle(2, 2, 3, 5)],
      [new Rectangle(-1, -6, 2, 3), new Rectangle(-2, -3, 4, 10), new Rectangle(-7, 2, 5, 5), new Rectangle(2, 2, 5, 5)],
      [new Rectangle(-1, -6, 2, 3), new Rectangle(-2, -3, 4, 10), new Rectangle(-5, 2, 3, 5), new Rectangle(2, 2, 3, 5)],
    ];
    this.partNames = ["nose", "hull", "leftWing", "rightWing"];

    this.moveSpeed = 0.05;
    this.vx = 0;
    this.vy = 0;
    this.vDamp = 0.97;

    this.acceptInput = true;
    Ticker.shared.add(this.onTickerUpdate, this);

    addDebugPane('Ship', (pane) => {
      pane.expanded = false;
      pane.addBinding(this, 'moveSpeed', { min: 0.001, max: 0.2, step: 0.001 });
      pane.addBinding(this, 'vDamp', { min: 0.9, max: 1, step: 0.001 });
    });
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
    console.log('crashed on part', part.partName);
    this.acceptInput = false;

    this.spr.visible = false;
    this.addChild(createAnimation('effect/explosion', {loop: false, autoplay: true, speed: 0.1}));
  }

  onTickerUpdate({deltaTime}) {
    
    let ax = 0;
    let ay = 0;
    if (this.acceptInput) {
      if (inputState.up) ay -= 1;
      if (inputState.down) ay += 1;
      if (inputState.left) ax -= 1;
      if (inputState.right) ax += 1;

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
