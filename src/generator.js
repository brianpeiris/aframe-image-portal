import { CSG } from "three-csg-ts";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader";
import { VertexNormalsHelper } from "three/examples/jsm/helpers/VertexNormalsHelper";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils";

const removeFaces = (() => {
  const vertex = new THREE.Vector3();
  const normal = new THREE.Vector3();
  return (mesh, direction) => {
    const index = Array.from(mesh.geometry.index.array);
    const newIndex = [];
    for (let i = 0; i < index.length; i += 3) {
      vertex.fromBufferAttribute(mesh.geometry.attributes.position, index[i]);
      vertex.normalize();
      normal.fromBufferAttribute(mesh.geometry.attributes.normal, index[i]);
      const pointingTowards = 
        Math.sign(vertex.x) === Math.sign(normal.x) &&
        Math.sign(vertex.y) === Math.sign(normal.y) &&
        Math.sign(vertex.z) === Math.sign(normal.z)
      if (direction === 1 && pointingTowards || direction === -1 && !pointingTowards) {
        newIndex.push(
          index[i],
          index[i + 1],
          index[i + 2],
        )
      }
    }
    mesh.geometry.setIndex(newIndex);
  };
})();

async function generate(config) {
  const map = config.image ? new THREE.Texture(config.image) : null;
  // const map = new THREE.TextureLoader().load("/winter.jpg");
  if (config.image) {
    map.format = config.isJpeg ? THREE.RGBFormat : THREE.RGBAFormat;
    map.needsUpdate = true;
  }

  function makeSphere(r, map) {
    const materialConfig = {}
    if (map) {
      materialConfig.map = map;
    }
    return new THREE.Mesh(new THREE.SphereGeometry(r, 32, 16), new THREE.MeshBasicMaterial(materialConfig));
  }

  const radius = config.diameter / 2;

  const holeMat = new THREE.MeshStandardMaterial({
    color: config.holeColor,
    roughness: config.holeRoughness,
    metalness: config.holeMetalness,
  });

  let hole;
  if (config.hole === "circle") {
    hole = new THREE.Mesh(
      new THREE.CylinderGeometry(config.holeSize * 0.5, config.holeSize * 0.5, radius * 1, 32),
      holeMat
    );
    hole.rotation.y = Math.PI / 8;
    hole.rotation.x = Math.PI / 2;
  } else if (config.hole === "square") {
    hole = new THREE.Mesh(new THREE.BoxGeometry(config.holeSize, config.holeSize, radius * 1), holeMat);
  } else {
    const paths = await new Promise((resolve) => {
      new SVGLoader().load(config.hole, (svg) => {
        resolve(svg.paths);
      });
    });
    const shapes = paths.flatMap((p) => p.toShapes());
    const geo = new THREE.ExtrudeGeometry(shapes, { curveSegments: 3, depth: radius * 1, bevelEnabled: false });

    geo.computeBoundingBox();
    const size = new THREE.Vector3();
    geo.boundingBox.getSize(size);

    const mat4 = new THREE.Matrix4();
    if (size.x > size.y) {
      mat4.makeScale(config.holeSize / size.x, (config.holeSize / size.x) * (size.y / size.x), radius * 1);
    } else {
      mat4.makeScale((config.holeSize / size.y) * (size.x / size.y), config.holeSize / size.y, radius * 1);
    }
    geo.applyMatrix(mat4);
    mat4.makeScale(1, -1, -1);
    geo.applyMatrix(mat4);

    geo.computeBoundingBox();
    geo.center();

    hole = new THREE.Mesh(geo, holeMat);
  }
  hole.position.z = radius * 1;
  hole.updateMatrix();

  const outerSphere = makeSphere(radius, map);
  const innerSphere = makeSphere(radius * 0.99);

  const photoSphere = CSG.subtract(CSG.subtract(outerSphere, innerSphere), hole);
  photoSphere.material.transparent = true;
  photoSphere.material.wireframe = false;
  photoSphere.name = "photoSphere";
  photoSphere.geometry = mergeVertices(photoSphere.geometry);
  removeFaces(photoSphere, -1);
  window.photoSphere = photoSphere;

  // photoSphere.geometry.computeVertexNormals();
  // const helper = new VertexNormalsHelper(photoSphere, 0.1);
  // AFRAME.scenes[0].object3D.add(helper);

  outerSphere.scale.setScalar(1.02);
  outerSphere.updateMatrix();
  innerSphere.scale.setScalar(1.01);
  innerSphere.updateMatrix();
  const occluder = CSG.subtract(CSG.subtract(outerSphere, innerSphere), hole);
  occluder.name = "occluder";
  occluder.material = new THREE.MeshBasicMaterial({ colorWrite: false, wireframe: false });
  occluder.geometry = mergeVertices(occluder.geometry);
  removeFaces(occluder, 1);
  window.occluder = occluder;

  // occluder.geometry.computeVertexNormals();
  // const helper = new VertexNormalsHelper(occluder, 0.1);
  // AFRAME.scenes[0].object3D.add(helper);

  const innerHole = hole.clone();
  innerHole.scale.setScalar(0.95);
  innerHole.updateMatrix();
  const hollowHole = CSG.subtract(hole, innerHole);
  const halfHole = CSG.subtract(hollowHole, makeSphere(radius * 0.99));
  const shell = CSG.subtract(makeSphere(radius * 10), makeSphere(radius * 1.025));
  const rim = CSG.subtract(halfHole, shell);
  rim.name = "rim";

  // innerHole.position.z = radius + 0.2;
  // AFRAME.scenes[0].object3D.add(innerHole);
  // AFRAME.scenes[0].object3D.add(hole);

  const group = new THREE.Group();
  group.add(occluder);
  group.add(photoSphere);
  group.add(rim);

  // AFRAME.scenes[0].object3D.add(group);
  // return null;

  return new Promise((resolve) => {
    new GLTFExporter().parse(
      group,
      (glb) => {
        resolve(URL.createObjectURL(new Blob([glb])));
      },
      { binary: true }
    );
  });
}

function tick() {
  return new Promise((resolve) => setTimeout(resolve, 20));
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = document.createElement("img");
    img.onload = () => resolve(img);
    img.src = src;
  });
}

async function generateFromInputs(e) {
  if (e) e.preventDefault();

  generateButton.disabled = true;
  generateButton.textContent = "Generating...";
  download.href = "";

  await tick();

  const img = image.files.length ? await loadImage(URL.createObjectURL(image.files[0])) : null;
  const diameter = parseFloat(diameterInput.value);

  const glbUrl = await generate({
    diameter,
    hole: hole.value === "custom" ? URL.createObjectURL(holeShape.files[0]) : hole.value,
    holeSize: parseFloat(holeSize.value),
    holeColor: holeColor.value,
    holeRoughness: parseFloat(holeRoughness.value),
    holeMetalness: parseFloat(holeMetalness.value),
    image: img,
    isJpeg: image.files.length ? image.files[0].type === "image/jpeg" : false,
  });

  download.href = glbUrl;

  portal.setAttribute("image-portal", { src: glbUrl, autoReparent: false });

  camera.removeAttribute("look-controls");
  camera.setAttribute("position", `0 0 ${diameter * 2}`);
  camera.setAttribute("rotation", `0 0 0`);
  camera.setAttribute("look-controls", "");
  grid.object3D.position.y = -diameter / 2;

  generateButton.textContent = "Generate";
  generateButton.disabled = false;
}

function updateHoleShape() {
  holeShapeLabel.style.display = hole.value !== "custom" ? "none" : "block";
  holeShape.style.display = hole.value !== "custom" ? "none" : "block";
  holeShape.disabled = hole.value !== "custom";
}

function main() {
  updateHoleShape();
  inputs.addEventListener("submit", generateFromInputs);
  hole.addEventListener("change", updateHoleShape);
  const gridHelper = new THREE.GridHelper();
  grid.object3D.add(gridHelper);
}

main();
