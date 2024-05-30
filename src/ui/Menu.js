import { BitmapText, Container, Graphics } from "pixi.js";
import msg from "~/fw/msg.js";
import { createAnimation } from "~/fw/pixiTools.js";
import { COLOR_BLACK, COLOR_GRAY, COLOR_STEEL_BLUE, COLOR_WHITE, FONT_BIG, FONT_HEADER } from "~/consts.js";

const MENU_ITEM_COLOR = COLOR_GRAY;
const MENU_ITEM_SELECTED = COLOR_WHITE;
const BKG_PADDING = 6;
const BKG_COLOR = COLOR_BLACK;
const BKG_FRAME_COLOR = COLOR_STEEL_BLUE;

export class Menu extends Container {
  constructor({title, game, entriesSpec = [], isSubMenu = true, background = false, innerText, delayInput = 0}) {
    super();

    if (innerText) {
      innerText.x = -Math.floor(innerText.width / 2);
      innerText.y = 0;
      this.innerText = this.addChild(innerText);
    }
    if (isSubMenu) {
      entriesSpec.push({ label: "Back", action: () => this.game.gotoMainMenu(true) },)
    }
    this.entriesSpec = entriesSpec;
    this.entries = this.createEntries(entriesSpec);
    this.selector = this.createSelector();
    this._selected = -1;
    this.selected = 0;
    this.title = this.createTitle(title);
    this.isSubMenu = isSubMenu;

    this.game = game;

    if (background) this.createBackground();

    setTimeout(() => {
      msg.on("keydown", this.keyDown, this);
    }, delayInput);

  }

  destroy(options) {
    msg.off("keydown", this.keyDown, this);
    super.destroy(options);
  }

  get selected() {
    return this._selected;
  }

  set selected(value) {
    if (value >= 0 && value < this.entries.length && value !== this._selected) {
      if (this._selected >= 0) {
        this.entries[this._selected].style.fill = MENU_ITEM_COLOR;
      }
      this._selected = value;
      const next = this.entries[value];
      next.style.fill = MENU_ITEM_SELECTED;
      this.selector.x = next.x - 8;
      this.selector.y = next.y + 7;
    }
  }

  keyDown(key) {
    if (this.game.inTransition) return;
    if (key === "select" && !this.isSubMenu) return;

    switch (key) {
      case "up":
        --this.selected;
        break;
      case "down":
        ++this.selected;
        break;
      case "primary":
      case "start":
        this.execAction();
        break;
      case "select":
      case "secondary":
        this.game.gotoMainMenu(true);
        break;
    }
  }

  execAction() {
    const {label, action, context} = this.entriesSpec[this.selected];
    console.log("Menu exec", label);
    action.call(context ?? null);
  }

  createTitle(title) {
    const header = new BitmapText({
      text: title,
      style: FONT_HEADER,
    });
    header.x = -Math.floor(header.width / 2);
    header.y = -header.height * 2;
    return this.addChild(header);
  }

  createEntries(entriesSpec) {
    const entries = entriesSpec.map(this.createEntry.bind(this));
    this.addChild(...entries);
    return entries;
  }

  createEntry({label}, idx) {
    const offset = this.innerText ? this.innerText.height + 12 : 0;
    const text = new BitmapText({
      text: label,
      style: {
        ...FONT_BIG,
        fill: MENU_ITEM_COLOR,
      },
    });
    text.x = -Math.floor(text.width / 2);
    text.y = offset + idx * 16;
    return text;
  }

  createSelector() {
    return this.addChild(createAnimation("ui/selector", {speed: 0.1}));
  }

  createBackground() {
    const bounds = this.getLocalBounds();
    bounds.width = Math.abs(bounds.left) * 2;
    const bb = bounds.pad(BKG_PADDING);
    const bf = bb.clone().pad(2);
    const bkg = new Graphics();
    bkg.rect(bf.x, bf.y, bf.width, bf.height);
    bkg.fill(BKG_FRAME_COLOR);
    bkg.rect(bb.x, bb.y, bb.width, bb.height);
    bkg.fill(BKG_COLOR);
    this.addChildAt(bkg, 0);
  }

}
