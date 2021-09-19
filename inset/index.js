import { Point, Polygon } from "@flatten-js/core";
import offset from "@flatten-js/polygon-offset";

(async () => {
  const scene = AFRAME.scenes[0].object3D;

  async function makeMesh(inset) {
    const origin = new THREE.Vector2();
    const radius = 1;
    const config = {
      holeSize: 1,
    };

    const paths = await new Promise((resolve) => {
      new THREE.SVGLoader().load("/winter.svg", (svg) => {
        resolve(svg.paths);
      });
    });

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 300 300");
    svgs.append(svg);

    const shapes = paths
      .flatMap((p) => p.toShapes())
      .map((s) => {
        const polygon = new Polygon();
        polygon.addFace(s.getPoints(6).map((p) => new Point(p.x, p.y)));
        objURL = URL.createObjectURL(new Blob([JSON.stringify(polygon.toJSON())], {type: "application/json"}));
        document.body.innerHTML += `<a href="${objURL}">download</a>`;

        let finalPolygon;
        if (inset) {
          finalPolygon = offset(polygon, inset);
        } else {
          finalPolygon = polygon;
        }

        svg.innerHTML += finalPolygon.svg();

        return new THREE.Shape(finalPolygon.vertices);
      });

    const geo = new THREE.ExtrudeGeometry(shapes, { curveSegments: 3, depth: radius * 1, bevelEnabled: false });

    // geo.computeBoundingBox();
    // const size = new THREE.Vector3();
    // geo.boundingBox.getSize(size);

    // const mat4 = new THREE.Matrix4();
    // if (size.x > size.y) {
    //   mat4.makeScale(config.holeSize / size.x, (config.holeSize / size.x) * (size.y / size.x), radius * 1);
    // } else {
    //   mat4.makeScale((config.holeSize / size.y) * (size.x / size.y), config.holeSize / size.y, radius * 1);
    // }
    // geo.applyMatrix(mat4);
    // mat4.makeScale(1, -1, -1);
    // geo.applyMatrix(mat4);

    // geo.computeBoundingBox();
    // geo.center();

    const mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color: inset ? "red" : "grey", wireframe: false }));

    mesh.scale.setScalar(0.01);

    return mesh;
  }

  const outer = await makeMesh();
  scene.add(outer);
  // const inner = await makeMesh(-4);
  // inner.position.z = 0.01;
  // scene.add(inner);
})();
