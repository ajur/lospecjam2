import { Assets } from "pixi.js";


const sounds = {};

export const playSound = (sound) => {
  if (sounds[sound]) {
    return sounds[sound].play();
  }
}

export function initAudio() {
  const soundsData = Assets.get('sounds.json');

  for (const [sound, data] of Object.entries(soundsData)) {
    sounds[sound] = sfxr.toAudio(data);
  }
}
