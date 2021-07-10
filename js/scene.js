/////////////////////////////////////////////////
/// BASIC SETUP: scene, camera, renderer
//Background Model

const path = "./js/models/SwedishRoyalCastle/";
const format = ".jpg";
const urls = [path + "posx" + format, path + "negx" + format, path + "posy" + format, path + "negy" + format, path + "posz" + format, path + "negz" + format];
const reflectionCube = new THREE.CubeTextureLoader().load(urls);
const refractionCube = new THREE.CubeTextureLoader().load(urls);
refractionCube.mapping = THREE.CubeRefractionMapping;

export function create_scene() {
  let scene = new THREE.Scene();

  //Camera
  let camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 2000);
  scene.add(camera);

  //Background cubemap
  scene.background = reflectionCube;
  scene.receiveShadow = true;

  //lights
  const ambient = new THREE.AmbientLight(0xffffff);
  scene.add(ambient);
  let pointLight = new THREE.PointLight(0xffffff, 2);
  scene.add(pointLight);

  //Rendering
  let renderer = new THREE.WebGLRenderer({
    antialias: false,
  });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  return { scene, camera, renderer };
}

/////////////////////////////////////////////////
/// GEOMETRY OBJECTS

export function create_geometry(scene) {
  // navigation
  let world = new THREE.Group();
  world.matrixAutoUpdate = true;
  scene.add(world);

  let cursor = new THREE.Group();
  scene.add(cursor);

  /// create Gun
  let mod;
  let loader1 = new THREE.GLTFLoader();
  loader1.load(
    "./js/models/gun/scene.gltf",
    function (gltf) {
      mod = gltf.scene;
      cursor.add(mod);
      gltf.scene.scale.set(0.005, 0.005, 0.005);
      gltf.scene.position.y = -0.01;
      gltf.scene.position.x = +0.025;
      //   gltf.scene.position.z = -0.5;
      gltf.scene.rotation.x = Math.PI / 12;
      gltf.scene.rotation.y = Math.PI + 0.2;
      //   gltf.scene.rotation.z = 80;
      gltf.scene.updateMatrix();
      //   scene.add(mod);
    },
    function (xhr) {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    function (error) {
      console.log("error occured");
    }
  );

  cursor.rotation.x = Math.PI / 2;
  cursor.position.y = 1;
  cursor.updateMatrix();

  return { cursor, world };
}

//create moveable box
export function create_MoveableBox(world) {
  const loader = new THREE.TextureLoader();
  const cubeMaterial1 = new THREE.MeshLambertMaterial({
    color: 0xf70000,
    envMap: reflectionCube,
  });
  let moveableBox = new THREE.Mesh(new THREE.SphereGeometry(0.3, 50, 50, 0, Math.PI * 2, 0, Math.PI * 2), cubeMaterial1);
  moveableBox.castShadow = true;
  moveableBox.position.set(0, 1.5, -10);
  moveableBox.name = "moveableBox";
  world.add(moveableBox);

  return { moveableBox };
}

//create shootable box
export function create_ShootableBox(scene) {
  const loader = new THREE.TextureLoader();

  //create Shootable Box
  const cubeMaterial1 = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    envMap: reflectionCube,
  });
  let shootableBox = new THREE.Mesh(new THREE.SphereGeometry(0.3, 50, 50, 0, Math.PI * 2, 0, Math.PI * 2), cubeMaterial1);
  shootableBox.castShadow = true;
  // shootableBox.position.set(0, 1.5, -10);
  shootableBox.name = "shootableBox";
  // scene.add(shootableBox);

  return { shootableBox };
}

export function create_Intro(scene) {
  var playButton = dcText("Play", 4, 4, 50, 0xfffff, 0x0000ff);
  playButton.ctx.lineWidth = 3;
  playButton.ctx.strokeStyle = "white";
  playButton.ctx.strokeRect(3, 3, playButton.wPxAll - 6, playButton.hPxAll - 6);
  playButton.position.set(0, -10, -30);
  playButton.name = "button";
  scene.add(playButton);

  var textGroup = new THREE.Group();
  var text = dcText("Tutorial", 2, 2, 50, 0x000000, 0xcccccc);
  text.position.set(0, 14, -50);
  textGroup.add(text);
  var text1 = dcText("In mehreren Wellen fliegen Kanonenkugeln auf dich zu.", 2, 2, 50, 0x000000, 0xcccccc);
  text1.position.set(0, 10, -50);
  textGroup.add(text1);
  var text2 = dcText("Trifft dich eine Kugel verlierst du ein Leben.", 2, 2, 50, 0x000000, 0xcccccc);
  text2.position.set(0, 8, -50);
  textGroup.add(text2);
  var text3 = dcText("Die silbernen Kugeln kannst du mit einem Klick abschießen.", 2, 2, 50, 0x000000, 0xcccccc);
  text3.position.set(0, 6, -50);
  textGroup.add(text3);
  var text4 = dcText("Die roten Kugeln musst du nach oben oder unten wegschleudern, ", 2, 2, 50, 0x000000, 0xcccccc);
  text4.position.set(0, 4, -50);
  textGroup.add(text4);
  var text5 = dcText("halte dazu den Trigger gedrückt", 2, 2, 50, 0x000000, 0xcccccc);
  text5.position.set(0, 2, -50);
  textGroup.add(text5);
  var text6 = dcText("Hier unten sind zwei Kugeln zum Testen.", 2, 2, 50, 0x000000, 0xcccccc);
  text6.position.set(0, 0, -50);
  textGroup.add(text6);
  scene.add(textGroup);

  return { playButton, textGroup };
}

function dcText(txt, hWorldTxt, hWorldAll, hPxTxt, fgcolor, bgcolor) {
  var geometry;
  // the routine
  // txt is the text.
  // hWorldTxt is world height of text in the plane.
  // hWorldAll is world height of whole rectangle containing the text.
  // hPxTxt is px height of text in the texture canvas; larger gives sharper text.
  // The plane and texture canvas are created wide enough to hold the text.
  // And wider if hWorldAll/hWorldTxt > 1 which indicates padding is desired.
  var kPxToWorld = hWorldTxt / hPxTxt; // Px to World multplication factor
  // hWorldTxt, hWorldAll, and hPxTxt are given; get hPxAll
  var hPxAll = Math.ceil(hWorldAll / kPxToWorld); // hPxAll: height of the whole texture canvas
  // create the canvas for the texture
  var txtcanvas = document.createElement("canvas"); // create the canvas for the texture
  var ctx = txtcanvas.getContext("2d");
  ctx.font = hPxTxt + "px sans-serif";
  // now get the widths
  var wPxTxt = ctx.measureText(txt).width; // wPxTxt: width of the text in the texture canvas
  var wWorldTxt = wPxTxt * kPxToWorld; // wWorldTxt: world width of text in the plane
  var wWorldAll = wWorldTxt + (hWorldAll - hWorldTxt); // wWorldAll: world width of the whole plane
  var wPxAll = Math.ceil(wWorldAll / kPxToWorld); // wPxAll: width of the whole texture canvas
  // next, resize the texture canvas and fill the text
  txtcanvas.width = wPxAll;
  txtcanvas.height = hPxAll;
  if (bgcolor != undefined) {
    // fill background if desired (transparent if none)
    ctx.fillStyle = "#" + bgcolor.toString(16).padStart(6, "0");
    ctx.fillRect(0, 0, wPxAll, hPxAll);
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#" + fgcolor.toString(16).padStart(6, "0"); // fgcolor
  ctx.font = hPxTxt + "px sans-serif"; // needed after resize
  ctx.fillText(txt, wPxAll / 2, hPxAll / 2); // the deed is done
  // next, make the texture
  var texture = new THREE.Texture(txtcanvas); // now make texture
  texture.minFilter = THREE.LinearFilter; // eliminate console message
  texture.needsUpdate = true; // duh
  // and make the world plane with the texture
  geometry = new THREE.PlaneGeometry(wWorldAll, hWorldAll);
  var material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: texture, transparent: true, opacity: 1.0 });
  // and finally, the mesh
  var mesh = new THREE.Mesh(geometry, material);
  mesh.wWorldTxt = wWorldTxt; // return the width of the text in the plane
  mesh.wWorldAll = wWorldAll; //    and the width of the whole plane
  mesh.wPxTxt = wPxTxt; //    and the width of the text in the texture canvas
  // (the heights of the above items are known)
  mesh.wPxAll = wPxAll; //    and the width of the whole texture canvas
  mesh.hPxAll = hPxAll; //    and the height of the whole texture canvas
  mesh.ctx = ctx; //    and the 2d texture context, for any glitter
  // console.log(wPxTxt, hPxTxt, wPxAll, hPxAll);
  // console.log(wWorldTxt, hWorldTxt, wWorldAll, hWorldAll);
  return mesh;
}

export function ObjectCreator() {
  let geometries = {
    box: new THREE.BoxBufferGeometry(0.25, 0.25, 0.25),
    cone: new THREE.ConeBufferGeometry(0.2, 0.4, 64),
    cylinder: new THREE.CylinderBufferGeometry(0.2, 0.2, 0.2, 64),
    plane: new THREE.PlaneGeometry(2, 2, 64),
    sphere: new THREE.IcosahedronBufferGeometry(0.2, 3),
    torus: new THREE.TorusBufferGeometry(0.2, 0.04, 64, 32),
  };

  let colors = {
    red: 0xff0000,
    orange: 0xff4700,
    yellow: 0xffff00,
    green: 0x84ff00,
    darkgreen: 0x286940,
    blue: 0x00fff9,
    darkblue: 0x0006ff,
    purple: 0x8800ff,
    darkred: 0xcd111f,
    white: 0xffffff,
    black: 0x000000,
  };

  function factory(parent, t, c, a) {
    let color = c in colors ? colors[c] : colors["white"];
    let geo = t in geometries ? geometries[t] : geometries["box"];
    let autoupdate = a === true;

    let mesh = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.7,
        metalness: 0.0,
      })
    );
    mesh.matrixAutoUpdate = autoupdate;

    parent.add(mesh);
    return mesh;
  }

  function marker(parent, scale = 1.0) {
    let group = new THREE.Group();
    parent.add(group);
    group.matrixAutoUpdate = false; // controlled by cursor.matrix

    let scalegroup = new THREE.Group();
    scalegroup.scale.set(scale, scale, scale);
    group.add(scalegroup);

    let c = factory(scalegroup, "cone", "white");
    c.rotation.x = -Math.PI / 2;
    c.scale.x = 0.2;
    c.scale.z = 0.2;
    c.updateMatrix();
    return group;
  }

  return {
    factory,
    marker,
  };
}
