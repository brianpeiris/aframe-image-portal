AFRAME.registerComponent("image-portal", {
  schema: {
    src: { type: "asset" },
  },
  update: async function () {
    this.el.addEventListener("model-loaded", () => {
      const occluder = this.el.object3D.getObjectByName("occluder");

      if (!occluder) {
        console.warn("image-portal: Model did not have an occluder mesh.");
      } else {
        occluder.material.colorWrite = false;
      }
    }, {once: true});

    this.el.setAttribute("gltf-model", this.data.src);
  },
});
