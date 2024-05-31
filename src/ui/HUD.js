import { BitmapText, Container, Graphics, Sprite } from "pixi.js";
import {
  COLOR_DARK_GREEN,
  COLOR_DARK_RED,
  COLOR_GREEN,
  COLOR_RED,
  COLOR_WHITE,
  FONT_HEADER,
  HEIGHT,
  WIDTH
} from "~/consts.js";
import { clamp } from "~/fw/tools.js";


export class HUD extends Container {

  #leftEnergy = 1;
  #rightEnergy = 1;

  constructor({game, ...props}) {
    super(props);

    this.game = game;

    this.hasRedPlayer = this.game.player1controller !== null;
    this.hasGreenPlayer = this.game.player2controller !== null;


    this.createHudBkg();

    this.leftBarMask = this.createLeftBar();
    this.rightBarMask = this.createRightBar();

    // this.level = this.createLevel();
    this.score = this.createScore();
  }

  setPlayer1Energy(val) {
    this.leftEnergy = val;
    if (!this.hasGreenPlayer) this.rightEnergy = val;
  }

  setPlayer2Energy(val) {
    this.rightEnergy = val;
    if (!this.hasRedPlayer) this.leftEnergy = val;
  }

  setLevel(val) {
    // this.level.text = '' + val;
  }

  setScore(val) {
    this.score.text = '' + val;
  }

  get leftEnergy() {
    return this.#leftEnergy;
  }
  set leftEnergy(val) {
    this.#leftEnergy = clamp(val, 0.0, 1.0);
    this.leftBarMask.height = Math.ceil(this.#leftEnergy * 10) * 8;
  }
  get rightEnergy() {
    return this.#rightEnergy;
  }
  set rightEnergy(val) {
    this.#rightEnergy = clamp(val, 0.0, 1.0);
    this.rightBarMask.height = Math.ceil(this.#rightEnergy * 10) * 8;
  }

  destroy(options) {
    super.destroy({children: true, ...options});
  }

  createHudBkg() {
    const leftEnergyBkg = Sprite.from('ui/energy/bkg');
    leftEnergyBkg.scale.x = -1;
    leftEnergyBkg.position.set(0, HEIGHT);
    const leftEnergyBkgColor = Sprite.from('ui/energy/bar');
    leftEnergyBkgColor.scale.x = -1;
    leftEnergyBkgColor.position.set(0, HEIGHT);
    leftEnergyBkgColor.tint = this.hasRedPlayer ? COLOR_DARK_RED : COLOR_DARK_GREEN;


    const rightEnergyBkg = Sprite.from('ui/energy/bkg');
    rightEnergyBkg.position.set(WIDTH, HEIGHT);
    const rightEnergyBkgColor = Sprite.from('ui/energy/bar');
    rightEnergyBkgColor.position.set(WIDTH, HEIGHT);
    rightEnergyBkgColor.tint = this.hasGreenPlayer ? COLOR_DARK_GREEN : COLOR_DARK_RED;

    this.addChild(leftEnergyBkg, rightEnergyBkg, leftEnergyBkgColor, rightEnergyBkgColor);
  }

  createLeftBar() {
    const bar = Sprite.from('ui/energy/bar');
    bar.scale.x = -1;
    bar.position.set(0, HEIGHT);
    bar.tint = this.hasRedPlayer ? COLOR_RED : COLOR_GREEN;
    this.addChild(bar);

    const mask = new Graphics();
    mask.position.set(1, HEIGHT - 1);
    mask.rect(0, -80, 20, 80)
    mask.fill(0xffffff);
    bar.mask = mask;
    return this.addChild(mask);
  }

  createRightBar() {
    const bar = Sprite.from('ui/energy/bar');
    bar.position.set(WIDTH, HEIGHT);
    bar.tint = this.hasGreenPlayer ? COLOR_GREEN : COLOR_RED;
    this.addChild(bar);

    const mask = new Graphics();
    mask.position.set(WIDTH - 1, HEIGHT - 1);
    mask.rect(-20, -80, 20, 80)
    mask.fill(0xffffff);
    bar.mask = mask;
    return this.addChild(mask);
  }

  createLevel() {
    const score = new BitmapText({
      text: 0,
      style: {
        ...FONT_HEADER,
        align: "left",
        fill: COLOR_WHITE
      },
      x: 3,
      y: 0
    });
    score.anchor.set(0, 0);
    return this.addChild(score);
  }

  createScore() {
    const score = new BitmapText({
      text: 0,
      style: {
        ...FONT_HEADER,
        align: "left",
        fill: COLOR_WHITE
      },
      x: WIDTH - 3,
      y: 0
    });
    score.anchor.set(1, 0);
    return this.addChild(score);
  }

}
