import { BitmapText, Container } from "pixi.js";
import { COLORS, FONT_BIG, FONT_HEADER, WIDTH } from "~/consts.js";
import { createAnimation } from "~/fw/pixiTools.js";
import { addDebugPane } from "~/fw/debug.js";
import msg from "~/fw/msg.js";


export class MainMenu extends Container {
    constructor(game) {
        super();

        this.header = this.addChild(new BitmapText({
            text: 'Space Raid', style: FONT_HEADER
        }));
        this.header.x = Math.floor(WIDTH / 2 - this.header.width / 2);
        this.header.y = 64;

        this.menu = this.addChild(new Menu([
            {label: 'New Game', action: () => game.newGame()},
            {label: 'Scoreboard', action: () => {}},
            {label: 'Settings', action: () => {}},
            {label: 'About', action: () => {}},
        ]));
        this.menu.x = Math.floor(WIDTH / 2);
        this.menu.y = 96;

        this.removeDebugPane = addDebugPane('MainMenu', (pane) => {
            pane.expanded = false;
            pane.addBinding(this.header.style, 'fill', {view: 'list', options: Object.fromEntries(COLORS.map(c=>[c,c]))});
        });
    }

    destroy(options) {
        this.removeDebugPane();
        super.destroy(options);
    }
}


const MENU_ITEM_COLOR = COLORS[15];
const MENU_ITEM_SELECTED = COLORS[14];


class Menu extends Container {
    constructor(entriesSpec) {
        super();
        this.entriesSpec = entriesSpec;
        this.entries = this.createEntries(entriesSpec);
        this.selector = this.createSelector();
        this._selected = 1;
        this.selected = 0;

        msg.on('keydown', this.keyDown, this);
    }

    destroy(options) {
        msg.off('keydown', this.keyDown, this);
        super.destroy(options);
    }

    createEntries(entriesSpec) {
        const entries = entriesSpec.map(this.createEntry);
        this.addChild(...entries);
        return entries;
    }

    createSelector() {
        return this.addChild(createAnimation('ui/selector', {speed: 0.1}))
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
        switch(key) {
            case 'up':
                --this.selected;
                break;
            case 'down':
                ++this.selected;
                break;
            case 'primary':
            case 'start':
                this.execAction();
        }
    }

    execAction() {
        const {label, action, context} = this.entriesSpec[this.selected];
        console.log('Menu exec', label);
        action.call(context ?? null);
    }

    createEntry({label}, idx) {
        const text = new BitmapText({text: label, style: {
            ...FONT_BIG,
            fill: MENU_ITEM_COLOR
        }})
        text.x = - Math.floor(text.width / 2);
        text.y = idx * 16;
        return text;
    }
}
