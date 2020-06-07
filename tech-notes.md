## Tech Notes

There are 6 canvases on the page:

* `imageCanvas` is the only visible canvas. It's where the composite image is rendered and is downloaded when the user is done.
* `tempCanvas` holds path data when drawing paths.
* `holderCanvas` takes a snapshot of the `imageCanvas` as soon as a new path starts.
* `rotationCanvas`
* `blurredCanvas` holds a blurred version of the current image, re-blurred on each mouseup.
* `offscreenCanvas`, which is used to render the custom cursor.

### Opening an image

When you open an image:

1. All canvases are resized to match the image's dimensions, scaled so that no side is 2500px or more.
1. The image is drawn on `imageCanvas` and `rotationCanvas`.
1. The brush size and blur radius adjust themselves to the size of the image - the larger the image, the larger the brush and blur.
1. The cursor is rendered offscreen and saved to a data URL in CSS.

### Drawing a path

When you click or tap on the canvas:

1. **On mouse down/tap start:**
    1. The current `imageCanvas` image is copied to the `holderCanvas`.
    1. The `tempCanvas` is cleared. 
    1. The mouse/touch position is saved as `lastPos`.
1. **On mouse/touch move:**
    1. A circle is drawn at each point to the `imageCanvas` and `tempCanvas`.
    1. A [rectangle is interpolated](https://github.com/everestpipkin/image-scrubber/issues/38) between the new position and `lastPos`.
    1. The mouse/touch position is saved as `lastPos`.
1. **On mouse/tap end (or the cursor leaving the canvas):**
    1. *If the user is painting a solid color:*
        * No extra action is taken, since the solid colors were drawn onto the `imageCanvas` during the mouse/tap move step.
    1. *If the user is painting a blur:*
        * The image from the `rotationCanvas` is copied to the `blurredCanvas`.
        * The `blurredCanvas` image is pixelated (`pixelateCanvas`), then blurred (`stackBlurCanvasRGBA`).
        * The image from the `blurredCanvas` is drawn onto the `tempCanvas`, using the alpha from the existing `tempCanvas` image as a mask ([source-in](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation) composite operation). This creates a blurred image that matches the path drawn on mouse/touch move.
        * The image from the `tempCanvas` is drawn onto the `imageCanvas`.
        * The image from the `holderCanvas` is drawn onto the `imageCanvas` below the existing content.
    1. *If the user is painting an undo:*
        * The same steps as the blur apply, but with a blur radius of 0 (ie, the unmodified image).
        
### Rotating an image

When you select "Rotate Image":
    
    1. `imageCanvas`, `tempCanvas`, `rotationCanvas`, `blurredCanvas` are resized, translated, and rotated.
