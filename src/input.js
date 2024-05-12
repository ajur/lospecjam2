import msg from "./msg";

export const inputState = {
  up: false,
  down: false,
  left: false,
  right: false,
  primary: false,
  secondary: false
};

export const initInput = () => {
  setupKeys();
};

function setupKeys() {
  window.addEventListener("keydown", (evt) => {
    let gameKey = false;
    switch (evt.code) {
      case "KeyW":
      case "ArrowUp":
        inputState.up = true;
        msg.emit("inputUp");
        gameKey = true;
        break;
      case "KeyS":
      case "ArrowDown":
        inputState.down = true;
        msg.emit("inputDown");
        gameKey = true;
        break;
      case "KeyA":
      case "ArrowLeft":
        inputState.left = true;
        msg.emit("inputLeft");
        gameKey = true;
        break;
      case "KeyD":
      case "ArrowRight":
        inputState.right = true;
        msg.emit("inputRight");
        gameKey = true;
        break;
      case "KeyF":
      case "KeyZ":
        inputState.primary = true;
        msg.emit("inputPrimary");
        gameKey = true;
        break;
      case "KeyT":
      case "KeyX":
        inputState.secondary = true;
        msg.emit("inputSecondary");
        gameKey = true;
        break;
      case "Escape":
      case "KeyQ":
      case "KeyP":
        msg.emit("inputSelect");
        gameKey = true;
        break;
      case "Enter":
      case "KeyE":
        msg.emit("inputStart");
        gameKey = true;
        break;
    }
    if (gameKey) {
      evt.preventDefault();
      evt.stopImmediatePropagation();
    }
    // console.log("keydown", evt.code, evt);
  });

  window.addEventListener("keyup", (evt) => {
    switch (evt.code) {
      case "KeyW":
      case "ArrowUp":
        inputState.up = false;
        break;
      case "KeyS":
      case "ArrowDown":
        inputState.down = false;
        break;
      case "KeyA":
      case "ArrowLeft":
        inputState.left = false;
        break;
      case "KeyD":
      case "ArrowRight":
        inputState.right = false;
        break;
      case "KeyF":
      case "KeyZ":
        inputState.primary = false;
        break;
      case "KeyT":
      case "KeyX":
        inputState.secondary = false;
        break;
    }
  });
}
