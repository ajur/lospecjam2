import { gsap } from 'gsap';
import { Pane } from "tweakpane";
import * as PIXI from 'pixi.js';
import msg from './msg';

/**
 * @type {Pane}
 * @private
 */
let _debugPane = null;

export const isDebugOn = location.search.indexOf('debug') > 0 || import.meta.env.DEV;

export function initDebug(app) {
    createDebugPane();

    const global = globalThis;

    console.log('Available globals (for debugging):')
    console.log('- PIXI - for some fun.. and dev tools')
    global.PIXI = PIXI;
    console.log('- gsap - wiggle wiggle')
    global.gsap = gsap;

    console.log('- APP - like the whole game scene and stuff')
    global.APP = app;
    global.__PIXI_APP__ = app;
    console.log('- PANE - tweakpane, until I replace it with something custom')
    global.PANE = _debugPane;
}


export function addDebugPane(title, addCb, context = null) {
    if (isDebugOn && _debugPane) {
        const f = _debugPane.addFolder({title});
        addCb.call(context, f);
        return () => _debugPane.remove(f);
    }
    return () => {};
}

function createDebugPane() {

    const pane = new Pane({title: "Dev tools"});
    pane.hidden = true;

    msg.once("preloader/closed", () => { pane.hidden = false; });

    pane.addBinding(PIXI.Ticker.shared, 'FPS', {
        readonly: true,
    });

    _debugPane = pane;
}
