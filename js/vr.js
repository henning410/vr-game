export function createImmersiveButton(renderer, onEnter, onLeave) {
  renderer.xr.enabled = true;

  let currentSession = null,
    grabbed = false,
    fired = false,
    touching = false;

  const leftDevice = 0;
  const rightDevice = 1;
  const deviceID = leftDevice;

  let hand_controller = renderer.xr.getController(deviceID);
  let controller = new THREE.Group();
  controller.matrixAutoUpdate = false;

  const grabTrigger = 0;
  const fireTrigger = 1;
  const touchTrigger = 2;

  function updateXR() {
    // takes some frames until session is valid
    if (currentSession === null || currentSession.inputSources === undefined || currentSession.inputSources.length == 0) {
      return null;
    }
    // controller.position.set(0, 1, -0.5);
    controller.matrix.compose(hand_controller.position, hand_controller.quaternion, controller.scale);

    let gp = currentSession.inputSources[deviceID].gamepad;

    for (let b = 0; b < gp.buttons.length; ++b) {
      if (gp.buttons[b].pressed !== undefined && gp.buttons[b].pressed === true) {
        console.log(`src[${deviceID}][${b}] pressed`);
      }
    }

    return {
      controller,
      grabbed: gp.buttons[grabTrigger].pressed,
      touching: gp.buttons[touchTrigger].pressed,
      fired: gp.buttons[fireTrigger].pressed,
      no_devices: currentSession.inputSources.length,
    };
  } // updateXR

  const sessionInitOptions = {
    optionalFeatures: ["local-floor", "bounded-floor"],
  };

  function onSessionStarted(session) {
    session.addEventListener("end", onSessionEnded);
    renderer.xr.setSession(session);
    button.textContent = "EXIT VR";
    currentSession = session;
    onEnter(currentSession);
  }

  function onSessionEnded(/*event*/) {
    currentSession.removeEventListener("end", onSessionEnded);
    button.textContent = "ENTER VR";
    currentSession = null;
    onLeave();
  }

  let button;
  function showEnterVR() {
    button.style.display = "";
    button.style.cursor = "pointer";
    button.style.left = "calc(50% - 50px)";
    button.style.width = "100px";
    button.textContent = "ENTER VR";

    button.onmouseenter = function () {
      button.style.opacity = "1.0";
    };
    button.onmouseleave = function () {
      button.style.opacity = "0.5";
    };

    button.onclick = function () {
      if (currentSession === null) {
        navigator.xr.requestSession("immersive-vr", sessionInitOptions).then(onSessionStarted);
      } else {
        currentSession.end();
      }
    };
  }

  function disableButton() {
    button.style.display = "";
    button.style.cursor = "auto";
    button.style.left = "calc(50% - 75px)";
    button.style.width = "150px";
    button.onmouseenter = null;
    button.onmouseleave = null;
    button.onclick = null;
  }

  function showWebXRNotFound() {
    disableButton();
    button.textContent = "VR NOT SUPPORTED";
  }

  function stylizeElement(element) {
    element.style.position = "absolute";
    element.style.bottom = "20px";
    element.style.padding = "12px 6px";
    element.style.border = "1px solid #000000";
    element.style.borderRadius = "4px";
    element.style.background = "rgba(0,0,0,0.1)";
    element.style.color = "red";
    element.style.font = "normal 13px sans-serif";
    element.style.textAlign = "center";
    element.style.opacity = "0.5";
    element.style.outline = "none";
    element.style.zIndex = "999";
  }

  if ("xr" in navigator) {
    button = document.createElement("button");
    button.style.display = "none";
    stylizeElement(button);
    navigator.xr.isSessionSupported("immersive-vr").then(function (supported) {
      if (supported) {
        showEnterVR();
      } else {
        showWebXRNotFound();
      }
    });
  } else {
    button = document.createElement("a");
    button.href = "https://webvr.info";
    button.innerHTML = "WEBVR NOT SUPPORTED";
    button.style.left = "calc(50% - 90px)";
    button.style.width = "180px";
    button.style.textDecoration = "none";
    stylizeElement(button);
  }

  return { button, updateXR };
}
