{
  let portalCount = 0;

  AFRAME.registerComponent("image-portal", {
    schema: {
      src: { type: "asset" },
      autoReparent: { type: "boolean", default: false },
      renderOrder: { type: "int", default: 1 },
      debug: { type: "boolean", default: false },
    },
    update: async function () {
      this.el.addEventListener(
        "model-loaded",
        () => {
          if (this.occluder && this.occluder.parent === this.el.sceneEl.object3D) {
            this.el.sceneEl.object3D.remove(this.occluder);
            this.occluder = null;
          }

          const occluder = this.el.object3D.getObjectByName("occluder");

          if (!occluder) {
            console.warn("image-portal: Model did not have an occluder mesh.");
          } else {
            this.occluder = occluder;
            this.originalOccluderMatrix = occluder.matrix.clone();
            // This only works if sortObjects is enabled on the renderer.
            occluder.renderOrder = this.data.renderOrder;
            occluder.material.colorWrite = false;
            if (this.data.debug) {
              occluder.material.wireframe = true;
            }
            this.portalIndex = portalCount;
            portalCount++;
          }

          const rim = this.el.object3D.getObjectByName("rim");
          if (!rim) {
            console.warn("image-portal: Model did not have an rim mesh.");
          } else {
            rim.renderOrder = this.data.renderOrder + 1;
          }
        },
        { once: true }
      );

      this.el.setAttribute("gltf-model", this.data.src);
    },
    tick: function () {
      if (this.data.autoReparent && this.occluder) {
        this.occluder.matrixAutoUpdate = false;
        const sceneObj = this.el.sceneEl.object3D;
        const expectedIndex = sceneObj.children.length - 1 - this.portalIndex;
        if (sceneObj.children[expectedIndex] !== this.occluder) {
          console.log("reparenting");
          const currentIndex = sceneObj.children.indexOf(this.occluder);
          if (currentIndex !== -1) {
            sceneObj.children.splice(currentIndex, 1);
          }
          sceneObj.children.splice(expectedIndex, 0, this.occluder);
          this.occluder.parent = sceneObj;
        }
        this.el.object3D.updateMatrixWorld();
        this.occluder.matrix.copy(this.el.object3D.matrixWorld);
        this.occluder.matrix.multiply(this.originalOccluderMatrix);
      }
    },
    remove: function () {
      if (this.occluder && this.occluder.parent === this.el.sceneEl.object3D) {
        this.el.sceneEl.object3D.remove(this.occluder);
        this.occluder = null;
        portalCount--;
      }
    }
  });
}
