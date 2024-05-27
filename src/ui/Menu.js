import { BitmapText, Container } from "pixi.js";
import msg from "~/fw/msg.js";
import { createAnimation } from "~/fw/pixiTools.js";
import { COLORS, FONT_BIG } from "~/consts.js";

const MENU_ITEM_COLOR = COLORS[15];
const MENU_ITEM_SELECTED = COLORS[14];

export class Menu extends Container {
  constructor(entriesSpec, hasFocus) {
    super();
    this.entriesSpec = entriesSpec;
    this.entries = this.createEntries(entriesSpec);
    this.selector = this.createSelector();
    this._selected = 1;
    this.selected = 0;

    this.hasFocus = hasFocus;

    msg.on("keydown", this.keyDown, this);
  }

  destroy(options) {
    msg.off("keydown", this.keyDown, this);
    super.destroy(options);
  }

  createEntries(entriesSpec) {
    const entries = entriesSpec.map(this.createEntry);
    this.addChild(...entries);
    return entries;
  }

  createSelector() {
    return this.addChild(createAnimation("ui/selector", {speed: 0.1}));
  }

  get selected() {
    return this._selected;
  }

  set selected(value) {
    if (value >= 0 && value < this.entries.length && value !== this._selected) {
      this.entries[this._selected].style.fill = MENU_ITEM_COLOR;
      this._selected = value;
      const next = this.entries[value];
      next.style.fill = MENU_ITEM_SELECTED;
      this.selector.x = next.x - 8;
      this.selector.y = next.y + 7;
    }
  }

  keyDown(key) {
    if (!this.hasFocus) return;

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
    }
  }

  execAction() {
    const {label, action, context} = this.entriesSpec[this.selected];
    console.log("Menu exec", label);
    action.call(context ?? null);
  }

  createEntry({label}, idx) {
    const text = new BitmapText({
      text: label,
      style: {
        ...FONT_BIG,
        fill: MENU_ITEM_COLOR,
      },
    });
    text.x = -Math.floor(text.width / 2);
    text.y = idx * 16;
    return text;
  }
}
