import { Container, Sprite, Texture, Ticker } from 'pixi.js';
import gsap from 'gsap';

import { addDebugPane } from '~/fw/debug';
import { HEIGHT } from '~/consts';
import { createAnimation } from '~/fw/pixiTools';
import { clamp } from '~/fw/tools';
import msg from "~/fw/msg.js";
import { Projectile } from "~/game/Projectile.js";
import { ColliderRect } from "~/game/ColliderRect.js";


export const RED_SHIP = 'red';
export const GREEN_SHIP = 'green';

const COLLIDERS = {
  [RED_SHIP]: [
    [new ColliderRect(-1, -6, 2, 3, "nose"), new ColliderRect(-2, -3, 4, 10, "hull"), new ColliderRect(-5, 2, 3, 5, "leftWing"), new ColliderRect(2, 2, 3, 5, "rightWing")],
    [new ColliderRect(-1, -6, 2, 3, "nose"), new ColliderRect(-2, -3, 4, 10, "hull"), new ColliderRect(-7, 2, 5, 5, "leftWing"), new ColliderRect(2, 2, 5, 5, "rightWing")],
    [new ColliderRect(-1, -6, 2, 3, "nose"), new ColliderRect(-2, -3, 4, 10, "hull"), new ColliderRect(-5, 2, 3, 5, "leftWing"), new ColliderRect(2, 2, 3, 5, "rightWing")],
  ],
  [GREEN_SHIP]: [
    [new ColliderRect(-1, -6, 2, 3, "nose"), new ColliderRect(-2, -3, 4, 10, "hull"), new ColliderRect(-6, 1, 4, 5, "leftWing"), new ColliderRect(2, 1, 4, 5, "rightWing")],
    [new ColliderRect(-1, -6, 2, 3, "nose"), new ColliderRect(-2, -3, 4, 10, "hull"), new ColliderRect(-7, 1, 5, 5, "leftWing"), new ColliderRect(2, 1, 5, 5, "rightWing")],
    [new ColliderRect(-1, -6, 2, 3, "nose"), new ColliderRect(-2, -3, 4, 10, "hull"), new ColliderRect(-6, 1, 4, 5, "leftWing"), new ColliderRect(2, 1, 4, 5, "rightWing")],
  ]
};
const SHIP_PROJECTILE = {
  [RED_SHIP]: "laser",
  [GREEN_SHIP]: "bullet"
};


export class PlayerShip extends Container {

  #hasShield = false;
  #moveTween;
  #autoShotTimer = 0;
  #energy = 1;

  constructor({type, controller, lanes, freeMovement, addProjectile, onEnergyChanged}) {
    super();

    this.freeMovement = freeMovement;

    this.currentLane = 0;
    this.lanes = lanes;
    this.laneChangeDelay = 0;

    this.shipType = type;
    this.controller = controller;

    this.shipTextures = [
      Texture.from(`ship/${this.shipType}/left`),
      Texture.from(`ship/${this.shipType}/fwd`),
      Texture.from(`ship/${this.shipType}/right`)
    ];
    this.shieldTextures = [
      Texture.from(`ship/${this.shipType}/shield/left`),
      Texture.from(`ship/${this.shipType}/shield/fwd`),
      Texture.from(`ship/${this.shipType}/shield/right`)
    ];
    this.currentTexture = 1;

    this.shieldSpr = this.addChild(Sprite.from(this.shipTextures[this.currentTexture]));
    this.shieldSpr.visible = this.#hasShield;
    this.spr = this.addChild(Sprite.from(this.shipTextures[this.currentTexture]));

    this.colliders = COLLIDERS[this.shipType];

    this.moveSpeed = 0.05;
    this.vx = 0;
    this.vy = 0;
    this.vDamp = 0.97;

    this.registerShot = addProjectile;
    this.autoShotDelay = 500; // ms
    this.shotVelocity = 3.5;  // px / update
    this.shootType = SHIP_PROJECTILE[type];

    this.onEnergyChanged = onEnergyChanged;
    this.energyLossConstant = 0.00001;
    this.energyLossYMovement = 0.001;
    this.energyLossShoot = 0.01;

    this.acceptInput = false;

    msg.on('pause', this.onPause, this);
    msg.on('resume', this.onResume, this);

    Ticker.shared.add(this.onTickerUpdate, this);

    this.removeDebugPane = addDebugPane('Ship ' + this.shipType, (pane) => {
      pane.expanded = false;
      pane.addBinding(this, 'moveSpeed', { min: 0.001, max: 0.2, step: 0.001 });
      pane.addBinding(this, 'vDamp', { min: 0.9, max: 1, step: 0.001 });
      // pane.addBinding(this, 'hasShield');
      // pane.addBinding(this.shieldSpr, 'tint', {view: 'color'});
      pane.addBinding(this, 'autoShotDelay', {min: 0, max: 2000, step: 1});
      pane.addBinding(this, 'shotVelocity', {min: 0.1, max: 10, step: 0.001});

      pane.addBinding(this, 'energy', {readonly: true});
      pane.addBinding(this, 'energyLossConstant', {min: 0.000, max: 0.001, step: 0.00001});
      pane.addBinding(this, 'energyLossYMovement', {min: 0.001, max: 0.1, step: 0.001});
      pane.addBinding(this, 'energyLossShoot', {min: 0.001, max: 0.1, step: 0.001});
    });
  }

  destroy(options) {
    Ticker.shared.remove(this.onTickerUpdate, this);
    msg.off('pause', this.onPause, this);
    msg.off('resume', this.onResume, this);
    gsap.killTweensOf(this);
    this.removeDebugPane();
    super.destroy(options);
  }

  get energy() {
    return this.#energy;
  }
  set energy(val) {
    this.#energy = clamp(val, 0, 1);
    this.onEnergyChanged(this.#energy);
    if (this.acceptInput && this.#energy === 0) {
      this.acceptInput = false;
    }
  }

  get hasShield() {
    return this.#hasShield;
  }
  set hasShield(val) {
    this.#hasShield = !!val;
    this.shieldSpr.visible = this.#hasShield;
  }

  #setTexture(val) {
    this.currentTexture = val;
    this.shieldSpr.texture = this.shieldTextures[val];
    this.spr.texture = this.shipTextures[val];
  }

  getColliders() {
    return this.colliders[this.currentTexture].map(c => c.offsetFrom(this));
  }

  deploy({x, yStart, currentLane}) {
    this.x = x;
    this.currentLane = currentLane;
    this.y = yStart;
    const yTarget = this.lanes[currentLane];
    gsap.to(this, {y: yTarget, duration: 1, onComplete: () => {
      this.acceptInput = true;
    }});
  }

  crash(part) {
    console.log(this.shipType + ' crashed on part', part.name);
    this.acceptInput = false;
    gsap.killTweensOf(this);
    this.shieldSpr.visible = false;
    this.spr.visible = false;
    this.addChild(createAnimation('effect/explosion', {loop: false, autoplay: true, speed: 0.1}));
  }

  withdraw() {
    this.acceptInput = false;
    Ticker.shared.remove(this.onTickerUpdate, this);
    this.#setTexture(1);
    gsap.killTweensOf(this);
    gsap.to(this, {y: HEIGHT + 10, duration: 1, ease: "back.in"});
  }

  shoot() {
    this.registerShot(new Projectile({
      kind: this.shootType,
      x: this.x,
      y: this.y,
      vx: 0,
      vy: -this.shotVelocity,
      shooter: this
    }));
  }

  onTickerUpdate({deltaTime, deltaMS}) {
    let ax = 0;
    let ay = 0;
    let totalEnergyLoss = this.energyLossConstant;
    if (this.acceptInput) {
      if (this.controller.up) ay -= 1;
      if (this.controller.down) ay += 1;
      if (this.controller.left) ax -= 1;
      if (this.controller.right) ax += 1;

      this.#setTexture(1 + Math.sign(ax));

      this.vx += ax * this.moveSpeed;
      this.vy += ay * this.moveSpeed;

      if (this.controller.primary) {
        this.#autoShotTimer -= deltaMS;
        if (this.#autoShotTimer < 0) {
          this.shoot();
          this.#autoShotTimer = this.autoShotDelay;
          totalEnergyLoss += this.energyLossShoot;
        }
      } else {
        this.#autoShotTimer = 0
      }
    }

    this.x += this.vx * deltaTime;

    if (this.freeMovement) {
      this.y = clamp(this.y + this.vy * deltaTime, 10, HEIGHT - 10);
      totalEnergyLoss += this.energyLossYMovement * Math.abs(this.vy) * deltaTime;
    } else if (this.laneChangeDelay > 0) {
      this.laneChangeDelay = this.ay === 0 ? 0 : (this.laneChangeDelay - deltaMS);
    } else if (ay !== 0 && this.laneChangeDelay <= 0) {
      const nextLane = clamp(this.currentLane + ay, 0, this.lanes.length - 1);
      if (nextLane !== this.currentLane) {
        totalEnergyLoss += this.energyLossYMovement * Math.abs(this.lanes[nextLane] - this.lanes[this.currentLane]);
        this.currentLane = nextLane;
        gsap.killTweensOf(this);
        this.#moveTween = gsap.to(this, {
          y: this.lanes[nextLane], ease: "power2.inOut", duration: 0.5,
          onComplete: () => this.#moveTween = null
        });
        this.laneChangeDelay = 300;
      }
    }

    this.energy -= totalEnergyLoss;

    this.vx *= this.vDamp;
    this.vy *= this.vDamp;
  }

  onPause() {
    Ticker.shared.remove(this.onTickerUpdate, this);
    if (this.#moveTween) {
      this.#moveTween.pause();
    }
  }

  onResume() {
    Ticker.shared.add(this.onTickerUpdate, this);
    if (this.#moveTween) {
      this.#moveTween.play();
    }
  }
}
