import msg from "./msg";


const KEYS = ['select', 'start', 'primary', 'secondary', 'up', 'down', 'left', 'right'];
const KEYMAP_WSAD = ['KeyQ', 'KeyE', 'KeyF', 'KeyG', 'KeyW', 'KeyS', 'KeyA', 'KeyD'];
const KEYMAP_ARROWS = ['Backspace', 'Enter', 'Period', 'Comma', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
const KEYMAP_STANDARD_GAMEPAD = [8, 9, 0, 1, 12, 13, 14, 15]; // https://w3c.github.io/gamepad/#remapping


export const controllers = [];


export const anyController = new Proxy(controllers, {
  get(target, prop) {
    if (KEYS.includes(prop)) {
      return target.some(t => t[prop]);
    }
  }
});


export function initInput() {
  controllers.push(new KeyboardController('arrows', KEYMAP_ARROWS));
  controllers.push(new KeyboardController('wsad', KEYMAP_WSAD));

  waitForGamepads();
}


export class Controller {
  constructor(id) {
    this.id = id;
    this.state = Object.fromEntries(KEYS.map(k => [k, false]));
  }
  get up() { return this.state.up; }
  get down() { return this.state.down; }
  get left() { return this.state.left; }
  get right() { return this.state.right; }
  get select() { return this.state.select; }
  get start() { return this.state.start; }
  get primary() { return this.state.primary; }
  get secondary() { return this.state.secondary; }
}


class KeyboardController extends Controller {
  constructor(name, keyMap) {
    super('KBD_' + name);
    this.mapKey = new Map(keyMap.map((k, idx) => [k, KEYS[idx]]));

    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  onKeyDown(evt) {
    const key = evt.code;
    if (this.mapKey.has(key)) {
      const mapped = this.mapKey.get(key);
      this.state[mapped] = true;
      msg.emit('keydown', mapped, this);

      evt.preventDefault();
      evt.stopImmediatePropagation();
    }
  }

  onKeyUp(evt) {
    const key = evt.code;
    if (this.mapKey.has(key)) {
      const mapped = this.mapKey.get(key);
      this.state[mapped] = false;
    }
  }
}


class GamepadController extends Controller {
  constructor(idx, keyMap) {
    super('GAMEPAD_' + idx);
    this.idx = idx;
    this.keyMap = keyMap

    this.updateState = this._updateState.bind(this);
    requestAnimationFrame(this.updateState);
  }

  reconnect() {
    console.log(`Gampad ${this.idx} reconnected`);
    requestAnimationFrame(this.updateState);
  }

  _updateState() {
    if (this.idx >= 0) {
      const gp = navigator.getGamepads()[this.idx];

      if (gp) {
        for (let i = 0; i < KEYS.length; ++i) {
          const button = gp.buttons[this.keyMap[i]];
          const key = KEYS[i];
          const prev = this.state[key];
          const next = button?.pressed;
          this.state[key] = next;
          if (next && !prev) {
            msg.emit('keydown', key, this);
          }
        }
        requestAnimationFrame(this.updateState);
      } else {
        console.error('Gamepad disconnected', this.idx, gp);
      }
    }
  }
}


function waitForGamepads() {
  window.addEventListener("gamepadconnected", (evt) => {
    const idx = evt.gamepad.index;
    const mapping = evt.gamepad.mapping;
    console.log('Connected controller', idx, mapping);
    const prev = controllers.find(c => c?.idx === idx);
    if (prev) {
      console.log('Controller known, reconnecting');
      prev.reconnect();
    }
    else if (mapping !== 'standard') {
      console.warn('Unknown controller mapping');
    }
    else {
      controllers.push(new GamepadController(idx, KEYMAP_STANDARD_GAMEPAD));
    }
  })
}
