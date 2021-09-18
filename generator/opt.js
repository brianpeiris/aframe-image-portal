import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const projectShapeToMesh = (() => {
  const raycaster = new THREE.Raycaster();
  const origin = new THREE.Vector3();
  const intersects = [];
  return (shape, mesh, offset, direction) => {
    const points = shape.getSpacedPoints();
    for (let i = 0; i < points.length - 1; i += 2) {
      const a = points[i];
      origin.set(a.x + offset.x, a.y + offset.y, offset.z);
      raycaster.set(origin, direction);
      intersects.length = 0;
      raycaster.intersectObject(mesh, true, intersects);
      ai = intersects[0];

      const b = points[i + 1];
      origin.set(b.x + offset.x, b.y + offset.y, offset.z);
      raycaster.set(origin, direction);
      intersects.length = 0;
      raycaster.intersectObject(mesh, true, intersects);
      bi = intersects[0];

      if (ai, bi) {
        addLine(mesh, ai, bi);
      }
    }
  };
})();

const scene = new THREE.Scene();

const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(1),
  new THREE.MeshBasicMaterial({
    wireframe: true,
    map: new THREE.TextureLoader().load("winter.jpg"),
    side: THREE.DoubleSide,
  })
);
scene.add(sphere);

const cursor = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 8), new THREE.MeshBasicMaterial());
scene.add(cursor);

const shape = new THREE.Shape();
shape.absarc(0, 0, 0.25, 0, Math.PI * 2);

const shapeMesh = new THREE.Mesh(
  new THREE.ShapeGeometry(shape),
  new THREE.MeshBasicMaterial()
);
scene.add(shapeMesh);

sphere.updateMatrix();
projectShapeToMesh(shape, sphere, new THREE.Vector3(0, 0, 3), new THREE.Vector3(0, 0, -1));

const renderer = new THREE.WebGLRenderer({ antialias: true });
document.body.append(renderer.domElement);

const camera = new THREE.PerspectiveCamera();
camera.position.set(0, 0, 3);
new OrbitControls(camera, renderer.domElement);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let mouseMovedSinceDown = false;
window.onmousemove = (e) => {
  mouseMovedSinceDown = true;
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
};

intersects = [];
renderer.setAnimationLoop(() => {
  raycaster.setFromCamera(mouse, camera);
  intersects.length = 0;
  raycaster.intersectObject(sphere, false, intersects);
  cursor.visible = !!intersects.length;
  if (intersects.length) {
    cursor.position.copy(intersects[0].point);
  }
  renderer.render(scene, camera);
});

function resize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
resize();
window.onresize = resize;

window.onkeydown = (e) => {
  if (e.key === "w") {
    sphere.material.wireframe = !sphere.material.wireframe;
  }
};
window.onmousedown = () => {
  mouseMovedSinceDown = false;
};
window.onmouseup = () => {
  if (!mouseMovedSinceDown && intersects.length) {
    addVertex(sphere, intersects[0]);
  }
};

function addVertex(mesh, intersect) {
    const { point, faceIndex, face, uv } = intersect;
    const vertices = Array.from(mesh.geometry.attributes.position.array);
    vertices.push(point.x, point.y, point.z);
    const positionAttr = new THREE.BufferAttribute(Float32Array.from(vertices), 3);
    mesh.geometry.setAttribute("position", positionAttr);

    const uvs = Array.from(mesh.geometry.attributes.uv.array);
    uvs.push(uv.x, uv.y);
    const uvAttr = new THREE.BufferAttribute(Float32Array.from(uvs), 2);
    mesh.geometry.setAttribute("uv", uvAttr);

    const { a, b, c } = face;
    const d = vertices.length / 3 - 1;

    const previousVersion = mesh.geometry.index.version;
    const index = Array.from(mesh.geometry.index.array);
    index.splice(faceIndex * 3, 3);
    index.push(a, b, d);
    index.push(d, b, c);
    index.push(c, a, d);
    mesh.geometry.setIndex(index);
    mesh.geometry.index.version = previousVersion + 1;
}

function addLine(mesh, a, b) {
}
