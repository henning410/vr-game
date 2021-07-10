// pad numbers
function pad(num, size) {
  let s = num + "";
  while (s.length < size) s = "0" + s;
  return s;
}

// useful to show floats
function padf(num, size) {
  let s = num.toFixed(1);
  while (s.length < size) s = " " + s;
  return s;
}

const canvasSize = 428; // Resolution of Texture
const canvasWidth = 2;
const canvashHeight = 0.42; // small height - change here if you want to see more

export function billboard(parent) {
  let that = {};
  let canvas = document.createElement("canvas");
  let context = canvas.getContext("2d");
  canvas.width = canvasSize * canvasWidth;
  canvas.height = canvasSize * canvashHeight;

  // a plane with a canvas texture
  let material = new THREE.MeshBasicMaterial({
    color: 0x42f5c5,
    transparent: true,
    opacity: 1.0,
  });
  material.map = new THREE.CanvasTexture(canvas);
  let mesh = new THREE.Mesh(new THREE.PlaneGeometry(canvasWidth, canvashHeight, 1, 1), material);

  // position relative to parent! <-- adjusted for camera as head-up-display
  mesh.position.set(0.5, 0.2, -1);
  parent.add(mesh);

  // font parameters
  const fontSize = 8;
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.font = fontSize + "pt Monospace";
  context.strokeStyle = "white";
  let needsUpdate = false;
  let lines = [];

  // add a line of text
  let counter = 0;
  that.addLine = function () {
    needsUpdate = true;
  };

  that.clear = function () {
    lines = [];
    needsUpdate = true;
  };

  // draw the canvas, only if necessary -> then update the material, too!
  that.draw_canvas = function (score, lifes, wave) {
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.globalAlpha = 1.0;
    context.fillStyle = "green";
    context.fillRect(0, 0, 140, 120);

    context.fillStyle = "black";
    context.font = "30px Arial";
    context.fillText("Score: " + score, 0, 25);
    context.fillText("Lifes: " + lifes, 0, 60);
    context.fillText("Wave: " + wave, 0, 95);
    material.map.needsUpdate = true;
    material.needsUpdate = true;
  };

  that.drawGameOver = function (score, wave) {
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.globalAlpha = 1.0;
    context.fillStyle = "green";
    context.fillRect(0, 0, 500, 1600);

    context.fillStyle = "black";
    context.font = "30px Arial";
    context.fillText("Game Over ", 190, 50);
    context.fillText("Du hast bis Welle " + wave + " durchgehalten", 30, 110);
    context.fillText("Score: " + score, 200, 150);
    material.map.needsUpdate = true;
    material.needsUpdate = true;
  };

  that.drawWaveText = function (wave, life) {
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.globalAlpha = 1.0;
    context.fillStyle = "green";
    context.fillRect(0, 0, 500, 2500);

    context.fillStyle = "black";
    context.font = "30px Arial";
    context.fillText("Welle " + wave + " kommt!", 150, 80);
    context.fillText("Du hast noch " + life + " Leben!", 110, 150);
    material.map.needsUpdate = true;
    material.needsUpdate = true;
  };

  return that;
}
