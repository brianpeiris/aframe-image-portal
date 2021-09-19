# aframe-image-portal

The image-portal component allows you to create "portal" effects in AR scenes, where an image can be displayed on the inside of a sphere, with a hole in it which you can enter through. The portal effect is achieved by making the outside of the sphere invisible.

The image-portal component only takes care of displaying the portal, you can use the [generator tool](https://brianpeiris.github.io/aframe-image-portal/generator/) to create portals and download them as GLB (glTF) files.

Visit the [examples](https://brianpeiris.github.io/aframe-image-portal/examples) on a device that supports WebXR to see the effect in AR.

## API

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
| src | Asset or url for the portal GLB model. | null |
| autoReparent | Optional. Automatically reparent the occlusion mesh to the scene and ensure that it is the last object. See the "How it works" section for more information. | false |
| renderOrder | Optional. Render order to use on the occlusion mesh, when sortObjects is enabled on the renderer, and autoReparent is false. See the "How it works" section for more information. | 1 |
| debug | Optional. Render the occlusion mesh as a wireframe so that you can see it for troubleshooting. | false |

## Usage

```html
<head>
  <script src="https://aframe.io/releases/1.2.0/aframe.min.js"></script>
  <script src="https://unpkg.com/aframe-image-portal@latest"></script>
</head>

<body>
  <a-scene>
    <a-assets>
      <a-asset-item id="portal" src="portal.glb"></a-asset-item>
    </a-assets>
    <a-entity image-portal="src: #portal"></a-entity>
  </a-scene>
</body>
```

## How it works

The image-portal effect works by using an occlusion mesh which does not write to the color buffer. Additionally, if you have other objects in the scene, they need to be rendered in the correct order, so that the occluder actually occludes the image and other objects correctly.

By default, the image-portal does not attempt to change rendering order. It uses the rendering order defined by the order you have added objects to the scene. This works fine if the only thing you have in the scene is the image-portal.

If you have other objects in the scene and you want image-portal to render correctly with those objects, you have two options. Either enable the sortObjects property on your renderer, or enable the autoReparent property on the image-portal. If you chose to enable sortObjects, you can further control the ordering by using the renderOrder property on the image-portal.
