//  Copyright Henning Weise
//  20.06.2021

import { keyboard, mouse } from "./keyboard_mouse.js";
import { create_scene, create_geometry, create_ShootableBox, create_MoveableBox, create_Intro } from "./scene.js";
import { create_laser, create_stretch_line } from "./laser.js";
import { createImmersiveButton } from "./vr.js";
import { billboard } from "./billboard.js";

window.onload = function () {
  /////////////////////////////////////////////////
  /// Scene
  let { scene, camera, renderer } = create_scene();
  let { cursor, world } = create_geometry(scene);

  // add billboard as head-up-display - attached to the camera
  let bill = billboard(camera);

  // load background music
  const listener = new THREE.AudioListener();
  camera.add(listener);
  const music = new THREE.Audio(listener);
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load("./js/sounds/Destiny_Of_The_Chosen.mp3", function (buffer) {
    music.setBuffer(buffer);
    music.setLoop(true);
    music.setVolume(0.2);
  });

  // load loose sound
  const listener2 = new THREE.AudioListener();
  camera.add(listener2);
  const gameOver = new THREE.Audio(listener2);
  const audioLoader2 = new THREE.AudioLoader();
  audioLoader2.load("./js/sounds/gameOver.wav", function (buffer) {
    gameOver.setBuffer(buffer);
    gameOver.setVolume(0.2);
    gameOver.setLoop(false);
  });

  // load hit sound
  const listener3 = new THREE.AudioListener();
  camera.add(listener3);
  const hitSound = new THREE.Audio(listener3);
  const audioLoader3 = new THREE.AudioLoader();
  audioLoader3.load("./js/sounds/gettingHit.mp3", function (buffer) {
    hitSound.setBuffer(buffer);
    hitSound.setVolume(0.7);
    hitSound.setLoop(false);
  });

  // load lazer sound
  const listener4 = new THREE.AudioListener();
  const lazerSound = new THREE.PositionalAudio(listener4);
  const audioLoader4 = new THREE.AudioLoader();
  audioLoader4.load("./js/sounds/lazer.mp3", function (buffer) {
    lazerSound.setBuffer(buffer);
    lazerSound.setVolume(0.7);
    lazerSound.setLoop(false);
  });

  /// Interaction
  let grabbed = false,
    flying = false;
  let add_keyboard_function = keyboard();
  add_keyboard_function(" ", (down) => {
    console.log("Space is", down);
    grabbed = down;
  });

  add_keyboard_function("f", (down) => {
    console.log("Flying is", down);
    flying = down;
  });

  mouse(cursor);

  /// VR-Integration
  function onEnter(currentSession) {
    // cursor.matrix is set in update
    cursor.matrixAutoUpdate = false;
  }
  function onLeave() {
    // cursor.position/rotation is set in Mouse
    cursor.matrixAutoUpdate = true;
  }
  //create VR Button and add it to the scene
  let { button, updateXR } = createImmersiveButton(renderer, onEnter, onLeave);
  document.body.appendChild(renderer.domElement);
  document.body.appendChild(button);

  /////////////////////////////////////////////////
  /// Grabbing
  let inverse = new THREE.Matrix4(),
    inverseWorld = new THREE.Matrix4(),
    direction = new THREE.Vector3(),
    currentMatrix,
    initialGrabbed,
    validGrabMatrix = false,
    validFlyInverse = false,
    validNavInverse = false;

  // for matrix de-composition
  let position = new THREE.Vector3();
  let quaternion = new THREE.Quaternion();
  let delta = new THREE.Quaternion();
  let scale = new THREE.Vector3();
  //variables we need for the game
  let hitObject;
  let timeCounter;
  let score;
  let lifes;
  let difficulty;
  let wave;
  let shootableBoxArray;
  let moveableBoxArray;
  let gameOverSound;
  let pause = false;
  let play = false;
  let gameisOver = false;
  let objectCounter;

  //call init method when loading the page
  init();

  //create shootable box for intro
  let { shootableBox } = create_ShootableBox(scene);
  shootableBox.position.set(3, 1.6, -5);
  scene.add(shootableBox);
  shootableBoxArray.push(shootableBox);
  //create moveable box for intro
  let { moveableBox } = create_MoveableBox(world);
  moveableBox.position.set(-3, 1.5, -5);
  moveableBoxArray.push(moveableBox);
  //create playbutton and Intro text
  let { playButton, textGroup } = create_Intro(scene);
  var box = new THREE.Box3().setFromObject(playButton);
  console.log(box.min, box.max, box.getSize());

  /// Selection
  let line = create_stretch_line(scene);
  let laser = create_laser(cursor, line, [moveableBox, shootableBox, playButton]);

  /// Rendering
  function render(time) {
    cursor.updateMatrix();

    // update the cursor and get the button states
    // updateXR returns null, if there is no VR session
    let vr = updateXR();
    if (vr !== null) {
      cursor.matrix.copy(vr.controller.matrix);
      grabbed = vr.grabbed;
      // Quest or Go?
      if (vr.no_devices > 1) {
        flying = vr.fired;
      } else {
        flying = vr.touching;
      }
    }

    // if flying - no laser ray
    if (flying) {
      if (validFlyInverse) {
        currentMatrix = inverse.clone();
        currentMatrix.premultiply(cursor.matrix);
        currentMatrix.decompose(position, quaternion, scale);
        delta.identity();
        delta.rotateTowards(quaternion, -0.001);

        if (vr !== null) {
          cursor.matrix.decompose(position, quaternion, scale);
          direction.set(0, 0, 1);
          direction.applyQuaternion(quaternion);
          position = direction.multiplyScalar(0.01);
        } else {
          position = position.multiplyScalar(-0.01);
        }
        currentMatrix.compose(position, delta, scale);
        world.matrix.premultiply(currentMatrix);
      } else {
        inverse.copy(cursor.matrix).invert();
        validFlyInverse = true;
      }
    } else {
      validFlyInverse = false;
      if (!grabbed) {
        hitObject = laser.update();
      } else {
        laser.ray();
      }
    }

    if (hitObject && grabbed) {
      if (validGrabMatrix) {
        currentMatrix = initialGrabbed.clone(); //
        currentMatrix.premultiply(cursor.matrix); // Cn
        currentMatrix.premultiply(inverseWorld); // W-1
        hitObject.matrix.copy(currentMatrix); // On LKS des zu bewegenden Obj.
      } else {
        inverseWorld.copy(world.matrix).invert();
        inverse.copy(cursor.matrix).invert(); // Ci-1
        initialGrabbed = hitObject.matrix.clone(); // Oi
        initialGrabbed.premultiply(world.matrix); // W
        initialGrabbed.premultiply(inverse); // Ci-1 * Oi
        validGrabMatrix = true;

        if (hitObject.name == "moveableBox") {
          //when grabbed object is moveable box we change state of matrixAutoUpdate to make sure we can move it
          hitObject.matrixAutoUpdate = false;
        } else if (hitObject.name == "shootableBox") {
          //when grabbed object is shootable box we remove it from the laser & from the scene & from the array and increase score
          laser.removeFromArray(hitObject);
          scene.remove(hitObject);
          const index = shootableBoxArray.indexOf(hitObject);
          shootableBoxArray.splice(index, 1);
          lazerSound.play();
          score += 1;
        } else if (hitObject.name == "button") {
          //when grabbed object is button we have to start/restart the game, so we remove all objects from the scene and start music and load init
          gameisOver = false;
          play = true;
          laser.removeFromArray(hitObject);
          scene.remove(hitObject);
          clearAllObjects();
          scene.remove(textGroup);
          music.play();
          init();
        }
      }
    } else {
      if (validGrabMatrix) {
        validGrabMatrix = false;
        //iterate over all moveable boxes and check which box was grabbed to change state of matrixAutoUpdate
        for (let i = 0; i < moveableBoxArray.length; i++) {
          if (!moveableBoxArray[i].matrixAutoUpdate) {
            moveableBoxArray[i].matrix.decompose(moveableBoxArray[i].position, moveableBoxArray[i].rotation, moveableBoxArray[i].scale);
            moveableBoxArray[i].matrixAutoUpdate = true;
          }
        }
      }
    }

    if (grabbed && !hitObject) {
      if (validNavInverse) {
        currentMatrix = initialGrabbed.clone();
        currentMatrix.premultiply(cursor.matrix);
        world.matrix.copy(currentMatrix);
      } else {
        inverse.copy(cursor.matrix).invert(); // Ci-1
        initialGrabbed = world.matrix.clone(); // W
        initialGrabbed.premultiply(inverse); // Ci-1 * Wi
        validNavInverse = true;
      }
    } else {
      validNavInverse = false;
    }

    //check if playing is true
    if (play) {
      bill.draw_canvas(score, lifes, wave);
      //create moveable boxes with random pos and add it to the world and array
      if (timeCounter == 10 && lifes > 0) {
        createMoveableBox();
      }

      //create shootable Boxes with random pos and add it to scene and array
      if (timeCounter % difficulty == 0 && lifes > 0) {
        createShootableBox();
        if (difficulty > 2 && wave < 5) {
          difficulty -= 1;
        } else if (wave >= 5) {
          objectCounter += 1;
        }
      }

      //when lifes equal 0 game is over
      if (lifes <= 0) {
        gameisOver = true;
        play = false;
      }

      //handle movemenent of all boxes
      handleShootableBoxes();
      handleMoveableBoxes();

      //logic for wave system
      if (timeCounter == 100) {
        timeCounter = 0;
      } else {
        timeCounter += 1;
      }

      //logic for wave with increasing difficulty
      if (difficulty < 70 && wave == 1) {
        wave += 1;
        pause = true;
        play = false;
      } else if (difficulty < 65 && wave == 2) {
        wave += 1;
        pause = true;
        play = false;
      } else if (difficulty < 50 && wave == 3) {
        wave += 1;
        pause = true;
        play = false;
      } else if (difficulty < 35 && wave == 4) {
        wave += 1;
        pause = true;
        play = false;
      } else if (objectCounter == 25 && wave == 5) {
        wave += 1;
        pause = true;
        play = false;
        objectCounter = 0;
        difficulty -= 5;
      } else if (objectCounter == 25 && wave == 6) {
        wave += 1;
        pause = true;
        play = false;
        objectCounter = 0;
        difficulty -= 5;
      } else if (objectCounter == 25 && wave == 7) {
        wave += 1;
        pause = true;
        play = false;
        objectCounter = 0;
        difficulty -= 2;
      } else if (objectCounter == 30 && wave == 8) {
        wave += 1;
        pause = true;
        play = false;
        objectCounter = 0;
        difficulty -= 1;
      } else if (objectCounter == 35 && wave >= 9) {
        wave += 1;
        pause = true;
        play = false;
        objectCounter = 0;
        difficulty -= 1;
      }
    } else if (gameisOver) {
      //when gamme is over we stop the music and play 1 time the game over sound and draw play Button
      music.stop();
      clearAllObjects();
      if (!gameOverSound) {
        gameOver.play();
        gameOverSound = true;
      }
      bill.drawGameOver(score, wave);
      laser.addToArray(playButton);
      scene.add(playButton);
    } else if (pause) {
      //when pause is true we draw our wave Text, clear all Objects and resume with game after 3 seconds
      bill.drawWaveText(wave, lifes);
      clearAllObjects();
      setTimeout(() => {
        pause = false;
        play = true;
      }, 5000);
    }

    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(render);

  //with this method we calculate the line's unit vector to let the bullets move at the same speed
  function getLineNormal(currentX, currentZ, goalX, goalZ) {
    //get the line vector
    const vx = goalX - currentX;
    const vy = goalZ - currentZ;
    //get the line length
    const len = Math.hypot(vx, vy);
    //if the line has length
    if (len > 0) {
      //calculate normal vector
      return { x: vx / len, y: vy / len };
    }
    return { x: 0, y: 0 };
  }

  //function to load the game
  function init() {
    timeCounter = 0;
    score = 0;
    lifes = 10;
    difficulty = 80;
    wave = 1;
    objectCounter = 0;
    shootableBoxArray = [];
    moveableBoxArray = [];
    gameOverSound = false;
  }

  //function to create a moveable box, add it to the scene and also the laser
  function createMoveableBox() {
    let { moveableBox } = create_MoveableBox(world);
    let randomX = Math.floor(Math.random() * 10) - 5; //create random x position
    moveableBox.position.set(randomX, 1.5, -10);
    moveableBoxArray.push(moveableBox);
    laser.addToArray(moveableBox);
  }

  //function to create a shootable box, add it to the scene and also to the laser
  function createShootableBox() {
    let { shootableBox } = create_ShootableBox(scene);
    let randomX = Math.floor(Math.random() * 10) - 5; //create random x position
    shootableBox.position.y = 1.5;
    shootableBox.position.z = -10;
    shootableBox.position.x = randomX;
    scene.add(shootableBox);
    laser.addToArray(shootableBox);
    shootableBoxArray.push(shootableBox);
    shootableBox.add(lazerSound);
    timeCounter = 1;
  }

  //function to handle movable boxes
  function handleMoveableBoxes() {
    //iterate over all moveable boxes
    for (let i = 0; i < moveableBoxArray.length; i++) {
      if (moveableBoxArray[i].position.z >= -0.6 && (moveableBoxArray[i].position.y > 2 || moveableBoxArray[i].position.y < 1)) {
        //check if the box doesn't hit the camera
        laser.removeFromArray(moveableBoxArray[i]);
        world.remove(moveableBoxArray[i]);
        moveableBoxArray.splice(i, 1);
      } else if (moveableBoxArray[i].position.z >= -0.6) {
        //when box hits the camera we play sound and reduce life
        laser.removeFromArray(moveableBoxArray[i]);
        world.remove(moveableBoxArray[i]);
        moveableBoxArray.splice(i, 1);
        hitSound.play();
        lifes -= 1;
      } else if (moveableBoxArray[i].matrixAutoUpdate) {
        //we need this else if here to make sure, we just move the objects that ar enot grabbed. Calculate the line to move and move each box
        let lineVec = getLineNormal(moveableBoxArray[i].position.x, moveableBoxArray[i].position.z, 0, 0);
        moveableBoxArray[i].position.z += lineVec.y * 0.2;
        moveableBoxArray[i].position.x += lineVec.x * 0.2;
      }
    }
  }

  //function to handle shootable boxes
  function handleShootableBoxes() {
    //iterate over all shootable boxes
    for (let i = 0; i < shootableBoxArray.length; i++) {
      //move every box with calculated line vector
      let lineVec = getLineNormal(shootableBoxArray[i].position.x, shootableBoxArray[i].position.z, 0, 0);
      shootableBoxArray[i].position.z += lineVec.y * 0.2;
      shootableBoxArray[i].position.x += lineVec.x * 0.2;
      //when box hits user camera, delete it from scene and also from array and play sound
      if (shootableBoxArray[i].position.z >= -0.6) {
        laser.removeFromArray(shootableBoxArray[i]);
        scene.remove(shootableBoxArray[i]);
        shootableBoxArray.splice(i, 1);
        hitSound.play();
        lifes -= 1;
      }
    }
  }

  //function to remove all objects from the szene
  function clearAllObjects() {
    //iterate over all moveable boxes
    for (let i = 0; i < moveableBoxArray.length; i++) {
      laser.removeFromArray(moveableBoxArray[i]);
      world.remove(moveableBoxArray[i]);
      moveableBoxArray.splice(i, 1);
    }
    //iterate over all shootable boxes
    for (let i = 0; i < shootableBoxArray.length; i++) {
      laser.removeFromArray(shootableBoxArray[i]);
      scene.remove(shootableBoxArray[i]);
      shootableBoxArray.splice(i, 1);
    }
  }
};
