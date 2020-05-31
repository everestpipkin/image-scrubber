# image-scrubber
This is a tool for anonymizing photographs taken at protests. 

Tool lives at : https://everestpipkin.github.io/image-scrubber/ 

It will remove identifying metadata (Exif data) from photographs, and also allow you to selectively blur parts of the image to cover faces and other identifiable information. 

Hit the upload button to upload a photograph. The program will display the data it is removing. 

Click okay, and you can then download the scrubbed image by hitting download or right clicking on it and saving it. 

Dragging on the image will blur it. You can change your brush size and the intensity of the blur via the sliders. Set the blur to zero to undo. 


All processing happens directly in the browser- no information is stored or sent anywhere. 



Bits of this code lifted and adapted from various jsfiddles and libraries --

Thank you:

http://jsfiddle.net/sierawski/4xezb7nL/

https://stackoverflow.com/questions/22604903/needed-canvas-blurring-tool

http://jsfiddle.net/m1erickson/baDLp/

https://storage.flother.is/etc/2010/examples/canvas-blur/v3/canvas-image.js

http://quasimondo.com/StackBlurForCanvas/StackBlur.js

https://github.com/exif-js/exif-js

http://jsfiddle.net/4cwpLvae/

https://stackoverflow.com/questions/16645801/rotate-canvas-90-degrees-clockwise-and-update-width-height

My code is a terrible mess right now but utility over cleanliness, will fix up in the coming days.