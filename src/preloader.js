import { gsap } from "gsap";
import { Assets } from "pixi.js";
import msg from "./msg";

let onProgress;
let onLoaded;

function show() {
  const preloaderDiv = document.querySelector('#preloader');
  const footerDiv = preloaderDiv.querySelector(".preloader-footer");
  const logoPath = preloaderDiv.querySelector("svg path");

  const logoPathLength = logoPath.getTotalLength();
  logoPath.style.strokeDasharray = `${logoPathLength} ${logoPathLength}`;
  logoPath.style.strokeDashoffset = `${logoPathLength}`;
  logoPath.style.strokeOpacity = '1.0';

  gsap.to(logoPath.style, {duration: 1, strokeDashoffset: 0, ease: 'power2.inOut'});

  onProgress = (progress) => {
    footerDiv.style.width = `${progress * 100}%`;
  }

  onLoaded = () => {
    const preloaderClicked = () => {
      gsap.to(preloaderDiv, {duration: 0.3, top: '-100%', onComplete: preloaderRevealed});
    }

    const preloaderRevealed = () => {
      gsap.killTweensOf(logoPath.style);
      preloaderDiv.remove();
      msg.emit("preloader/closed");
    }

    footerDiv.innerHTML = '<span class="blink">ready</div>'
    preloaderDiv.addEventListener('pointerdown', preloaderClicked, {once: true});
  }
}

async function loadAssets() {
  const manifestFile = await fetch(import.meta.env.BASE_URL + '/assets/manifest.json');
  const manifest = await manifestFile.json();

  await Assets.init({ manifest, basePath: 'assets' });
  const bundle = await Assets.loadBundle('default', onProgress);
  msg.emit("preloader/loaded");

  if (onLoaded) {
    onLoaded();
  } else {
    setTimeout(() => {
      document.querySelector('#preloader').remove();
      msg.emit("preloader/closed");
    }, 1);
  }
}

export default {
  show,
  loadAssets
};
