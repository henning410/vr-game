export function create_laser(cursor, line, array_of_objects) {
  // Raycaster
  let raycaster = new THREE.Raycaster();
  let direction = new THREE.Vector3();
  let rayEnd = new THREE.Vector3();

  // for matrix de-composition
  let position = new THREE.Vector3();
  let quaternion = new THREE.Quaternion();
  let scale = new THREE.Vector3();

  // find a hit on predefined object-list
  function update() {
    direction.set(0, 0, -1);
    cursor.matrix.decompose(position, quaternion, scale);
    direction.applyQuaternion(quaternion);

    line.pos(0, position);
    raycaster.set(position, direction);
    let intersects = raycaster.intersectObjects(array_of_objects);
    if (intersects.length > 0) {
      line.pos(1, intersects[0].point);
      raylength = intersects[0].distance;
      return intersects[0].object;
    } else {
      rayEnd.addVectors(position, direction.multiplyScalar(100));
      line.pos(1, rayEnd);
    }
  }

  // when grabbed, just draw the ray
  let raylength = 5;
  function ray() {
    cursor.matrix.decompose(position, quaternion, scale);
    line.pos(0, position);
    direction.set(0, 0, -1);
    direction.applyQuaternion(quaternion);
    rayEnd.addVectors(position, direction.multiplyScalar(raylength));
    line.pos(1, rayEnd);
  }

  //Test method to remove object from laser array
  function removeFromArray(obj) {
    const index = array_of_objects.indexOf(obj);
    if (index > -1) {
      array_of_objects.splice(index, 1);
    }
  }

  function addToArray(obj) {
    array_of_objects.push(obj);
  }

  return {
    update,
    ray,
    removeFromArray,
    addToArray,
  };
}

export function create_stretch_line(scene) {
  let that = {};
  let material = new THREE.LineBasicMaterial({
    color: 0x00ff00,
  });

  const points = [];
  points.push(new THREE.Vector3(-10, 0, 0));
  points.push(new THREE.Vector3(0, 10, 0));

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  that.line = new THREE.Line(geometry, material);
  let positions = that.line.geometry.attributes.position.array;

  that.pos = function (idx, pos) {
    idx *= 3;
    positions[idx++] = pos.x;
    positions[idx++] = pos.y;
    positions[idx++] = pos.z;
    that.line.geometry.attributes.position.needsUpdate = true;
  };
  scene.add(that.line);
  return that;
}
