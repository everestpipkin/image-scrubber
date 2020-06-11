var filename;
var img;
var canvasScale;

var isDown = false;
var painting = false;
var brush = "round"; //default to round brush at start
var paintColor = "#000";
var mouseX_start;
var mouseY_start;
var lastPos;

var canvas = document.getElementById('imageCanvas');
var ctx = canvas.getContext('2d');

var tempCanvas = document.getElementById('tempCanvas');
var tempCtx = tempCanvas.getContext('2d');

var holderCanvas = document.getElementById('holderCanvas');
var holderCtx = holderCanvas.getContext('2d');

var rotationCanvas = document.getElementById('rotationCanvas');
var rotationCtx = rotationCanvas.getContext('2d');

var blurredCanvas = document.getElementById('blurredCanvas');
var blurredCtx = blurredCanvas.getContext('2d');

var offscreenCanvas = document.getElementById('offscreenCanvas');
var offscreenCtx = offscreenCanvas.getContext('2d');

// these are placeholders - i map this later on in the set canvas size
var brushSize = (blurAmount = 50);
var brushAdjustment = 800;

canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseup', handleMouseUp);
canvas.addEventListener('mouseout', handleMouseOut);

canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', handleMouseUp);
canvas.addEventListener('touchcancel', handleMouseUp);

var brushSizeDiv = document.getElementById('brushSizeSlider');
brushSizeDiv.onchange = populateBrushSize;

var blurAmountDiv = document.getElementById('blurAmountSlider');
blurAmountDiv.onchange = populateBlurAmount;

var paintColorForm = document.getElementById("paintColor");

function populateBrushSize() {
    var biggerDimension = Math.max(canvas.width, canvas.height);
    brushSize = Math.floor((document.getElementById('brushSizeSlider').value * biggerDimension) / brushAdjustment);
    setCursor();
}

function populateBlurAmount() {
    blurAmount = Math.floor(this.value);
}


function setCursor() {
	if(brush == 'area'){
		canvas.style.cursor = 'crosshair';
	} else {	
	    var cursorCanvas = document.createElement('canvas');
	    var scaleX = canvas.getBoundingClientRect().width / canvas.width;
	    cursorCanvas.width = brushSize * 2 * scaleX;
	    cursorCanvas.height = brushSize * 2 * scaleX;
	    var cursorCtx = cursorCanvas.getContext('2d');
	
	    cursorCtx.strokeStyle = '#000000';
	    cursorCtx.beginPath();
	    cursorCtx.arc(
	        cursorCanvas.width / 2,
	        cursorCanvas.height / 2,
	        brushSize * scaleX - 2,
	        0,
	        Math.PI * 2
	    );
	    cursorCtx.closePath();
	    cursorCtx.stroke();
	
	     // for visibility against dark backgrounds
	    cursorCtx.strokeStyle = '#ffffff';
	    cursorCtx.beginPath();
	    cursorCtx.arc(
	        cursorCanvas.width / 2,
	        cursorCanvas.height / 2,
	        brushSize * scaleX - 1,
	        0,
	        Math.PI * 2
	    );
	    cursorCtx.closePath();
	    cursorCtx.stroke();
	
	    var cursorDataURL = cursorCanvas.toDataURL();
	    canvas.style.cursor =
	        'url(' +
	        cursorDataURL +
	        ') ' +
	        cursorCanvas.width / 2 +
	        ' ' +
	        cursorCanvas.height / 2 +
	        ', auto';
	}
}

// get list of radio buttons with name 'paintForm'
var paintFormElements = document.forms['paintForm'].elements['paintingAction'];

// loop through list
for (var i = 0, len = paintFormElements.length; i < len; i++) {
    if (paintFormElements[i].value == "blur"){
        paintFormElements[i].checked = true;
    }
    paintFormElements[i].onclick = function () {
        painting = this.value;
    };
}

var paintColorButton = document.getElementById("paintColor");
paintColorButton.onclick = function () {
        document.getElementById("Paint").checked = true;
        painting = "paint";
    };

// same as above, but for 'useBrush' options
var brushFormElements = document.forms['brushForm'].elements['useBrush'];

for (var i = 0, len = brushFormElements.length; i < len; i++) {

    if (brushFormElements[i].value == "round"){
        brushFormElements[i].checked = true;
    }
    brushFormElements[i].onclick = function () {
        brush = this.value;
		populateBrushSize();
    };
}

function saveImage() {
    document.getElementById('imageCanvas').toBlob(
        function (blob) {
            var link = document.createElement('a');

            var nameWithoutPath = filename.replace(/.*[\\/]([^\\/]+)$/, '$1');
            var nameWithoutExtension = nameWithoutPath.replace(/\.[^.]*$/, '');

            link.download = nameWithoutExtension + '_scrubbed.png';
            link.href = URL.createObjectURL(blob);
            link.click();
        },
        'image/png',
        0.8
    );
}

function scrubData() {
    document.getElementById('exifInformationHolder').style.display = 'none';
    alert('EXIF data removed: you may now save the image');
}

function goToBlur() {
    document.getElementById('exifInformationHolder').style.display = 'none';
}

function handleMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();

    var pos = getMousePos(canvas, e);
    mouseX_start = pos.x;
    mouseY_start = pos.y;

    holderCtx.save();
    holderCtx.clearRect(0, 0, holderCanvas.width, holderCanvas.height);
    holderCtx.drawImage(canvas, 0, 0);
    holderCtx.restore();

    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    isDown = true;
    lastPos = getMousePos(canvas, e);
    if (brush == "tap"){
        handleMouseMove(e);
    }

}

function handleMouseOut(e) {
    e.preventDefault();
    e.stopPropagation();

    if (isDown != false) {
        handleMouseUp(e);
    }
}

function handleMouseMove(e) {
    var pos = getMousePos(canvas, e);
    posx = pos.x;
    posy = pos.y;

    if (!isDown) {
        return;
    }
    e.preventDefault();
    e.stopPropagation();
    drawMousePath(pos.x, pos.y);
    lastPos = pos;
}

function handleTouchStart(e) { //added to properly handle start point for area draw
    e.preventDefault();
    e.stopPropagation();

    if (e.touches.length > 1) {
        // Ignore multi touch events
        return;
    }

    touch = event.changedTouches[0]; // get the position information
	
	
	
    var mouseEvent = new MouseEvent( // create event
        'mousedown', // type of event
        {
            view: event.target.ownerDocument.defaultView,
            bubbles: true,
            cancelable: true,
            screenX: touch.screenX, // get the touch coords
            screenY: touch.screenY, // and add them to the
            clientX: touch.clientX, // mouse event
            clientY: touch.clientY,
        }
    );
    // send it to the same target as the touch event contact point.
    touch.target.dispatchEvent(mouseEvent);

}

function handleTouchMove(e) {
    if (e.touches.length > 1) {
        // Ignore multi touch events
        return;
    }

    touch = event.changedTouches[0]; // get the position information
	
	
	
    var mouseEvent = new MouseEvent( // create event
        'mousemove', // type of event
        {
            view: event.target.ownerDocument.defaultView,
            bubbles: true,
            cancelable: true,
            screenX: touch.screenX, // get the touch coords
            screenY: touch.screenY, // and add them to the
            clientX: touch.clientX, // mouse event
            clientY: touch.clientY,
        }
    );
    // send it to the same target as the touch event contact point.
    touch.target.dispatchEvent(mouseEvent);
}

function handleMouseUp(e) {
    e.preventDefault();
    e.stopPropagation();
    isDown = false;
    lastPos = null;
    if (painting != 'paint') {
        var tempBlurAmount = blurAmount;
        if (painting == 'undo') {
            blurAmount = 0;
        }

        blurredCtx.drawImage(rotationCanvas, 0, 0);

        //pixelate function command is here
        if (painting != 'undo') {
            pixelateCanvas(blurredCanvas, blurredCtx);
        }

        //blur command is here - undo brush is this same command, but run w radius zero
        
        stackBlurCanvasRGBA(
            'blurredCanvas',
            0,
            0,
            blurredCanvas.width,
            blurredCanvas.height,
            blurAmount
        );
        tempCtx.save();
        tempCtx.globalCompositeOperation = 'source-in';
        tempCtx.drawImage(blurredCanvas, 0, 0);
        tempCtx.restore();

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.globalCompositeOperation = 'destination-over';
        ctx.drawImage(holderCanvas, 0, 0);
        ctx.restore();
        blurAmount = tempBlurAmount;
    }
}

function drawMousePath(mouseX, mouseY) {
        if (painting == 'undo') {
            paintColor = "#ffffff"
        }
        if (painting == 'blur') {
            paintColor = "#000000"
        }
        else if (painting == 'paint') {
            paintColor = (paintColorForm.style.backgroundColor)// change to color
        }
    switch(brush){
		case 'round':
			interpolatePath(ctx, lastPos.x, lastPos.y, mouseX, mouseY, brushSize);
    		interpolatePath(tempCtx, lastPos.x, lastPos.y, mouseX, mouseY, brushSize);
			break;
		case 'area':
			areaDraw(ctx, mouseX, mouseY, true);
			areaDraw(tempCtx, mouseX, mouseY, false);
			break;
        case 'tap':
            tapDraw(ctx, mouseX, mouseY, brushSize);
            tapDraw(tempCtx, mouseX, mouseY, brushSize);
            break;
		default:
			//this means that brush had either no value or an unlisted value, which should never happen
			console.log('brush switch error')
	}
}

function interpolatePath(pathCtx, x1, y1, x2, y2, r) {

    pathCtx.strokeStyle = paintColor;
    pathCtx.fillStyle = paintColor;

    // Draw rectangle from last point
    pathCtx.beginPath();
    pathCtx.moveTo(x1,y1);
    pathCtx.lineTo(x2,y2);
    pathCtx.closePath();
    pathCtx.lineWidth = 2 * r;
    pathCtx.stroke();

    // Draw the circle at the end
    pathCtx.beginPath();
    pathCtx.arc(x2, y2, r, 0, Math.PI * 2);
    pathCtx.closePath();
    pathCtx.fill();
}


function tapDraw(pathCtx, mouseX, mouseY, r) {

    pathCtx.strokeStyle = paintColor;
    pathCtx.fillStyle = paintColor;

    // Draw the circle at the end
    pathCtx.beginPath();
    pathCtx.arc(mouseX, mouseY, r, 0, Math.PI * 2);
    pathCtx.closePath();
    pathCtx.fill();
}

function areaDraw(pathCtx, mouseX, mouseY, redraw){

	//clear any previous drawings and restore image
	pathCtx.clearRect(0, 0, canvas.width, canvas.height);
	
	//determines if we need to redraw image after clearing canvas
	if(redraw){
		pathCtx.drawImage(holderCanvas, 0, 0);
	}
	pathCtx.beginPath();
	
	//calculate width and height of rectangle based on start posisions and current positions
	var width = mouseX-mouseX_start;
	var height = mouseY-mouseY_start;
	
	//draw current rectangle
	pathCtx.rect(mouseX_start,mouseY_start,width,height);
	pathCtx.strokeStyle = paintColor;
    pathCtx.fillStyle = paintColor;
	pathCtx.lineWidth = 10;
	pathCtx.stroke();
	pathCtx.fill();
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x:
            ((evt.clientX - rect.left) / (rect.right - rect.left)) *
            canvas.width,
        y:
            ((evt.clientY - rect.top) / (rect.bottom - rect.top)) *
            canvas.height,
    };
}

var button = document.getElementById('about');
button.onclick = function () {
    var imageScrubberInfo = document.getElementById('imageScrubberInfo');
    if (imageScrubberInfo.style.display == 'none') {
        imageScrubberInfo.style.display = 'block';
    } else {
        imageScrubberInfo.style.display = 'none';
    }
};

// rotate the canvas 90 degrees each time the button is pressed
var button = document.getElementById('rotate');
button.onclick = function () {
    rotate();
};

//this function is very laggy and i'm sure there is a better way - should rewrite it soon
var myImageData,
    tempImageData,
    holderImageData,
    blurredImageData,
    rotating = false;

var rotate = function () {
    if (!rotating) {
        rotating = true;
        // store current data to an image
        myImageData = new Image();
        tempImageData = new Image();
        rotationImageData = new Image();
        blurredImageData = new Image();

        myImageData.src = canvas.toDataURL();
        tempImageData.src = tempCanvas.toDataURL();
        rotationImageData.src = rotationCanvas.toDataURL();
        blurredImageData.src = blurredCanvas.toDataURL();

        //holderImageData.src = holderCanvas.toDataURL();

        myImageData.onload = function () {
            // reset the canvas with new dimensions
            cw = canvas.width;
            ch = canvas.height;
            canvas.width = tempCanvas.width = holderCanvas.width = rotationCanvas.width = blurredCanvas.width = ch;
            canvas.height = tempCanvas.height = holderCanvas.height = rotationCanvas.height = blurredCanvas.height = cw;
            cw = canvas.width;
            ch = canvas.height;

            ctx.save();
            // translate and rotate
            ctx.translate(cw, ch / cw);
            ctx.rotate(Math.PI / 2);
            // draw the previows image, now rotated
            ctx.drawImage(myImageData, 0, 0);
            ctx.restore();

            tempCtx.save();
            tempCtx.translate(cw, ch / cw);
            tempCtx.rotate(Math.PI / 2);
            tempCtx.drawImage(tempImageData, 0, 0);
            tempCtx.restore();

            rotationCtx.save();
            rotationCtx.translate(cw, ch / cw);
            rotationCtx.rotate(Math.PI / 2);
            rotationCtx.drawImage(rotationImageData, 0, 0);
            rotationCtx.restore();

            blurredCtx.save();
            blurredCtx.translate(cw, ch / cw);
            blurredCtx.rotate(Math.PI / 2);
            blurredCtx.drawImage(rotationImageData, 0, 0);
            blurredCtx.restore();

            //don't need to rotate the holder as it gets cleared anyway.

            // clear the temporary image
            myImageData = null;
            tempImageData = null;
            blurredImageData = null;

            rotating = false;
        };
    }
};

const scale = (num, in_min, in_max, out_min, out_max) => {
    return ((num - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
};

function pixelateCanvas(inCanvas, inCtx) {
    // so - smaller canvases also need to scale down less, because they get too small to render anything
    //just gonna use a map function for now

    var biggerDimension = Math.max(inCanvas.width, inCanvas.height);

    var size = scale(biggerDimension, 10, 2500, 0.1, 0.015);
    w = inCanvas.width * size;
    h = inCanvas.height * size;

    offscreenCanvas.width = inCanvas.width; //w;
    offscreenCanvas.height = inCanvas.height; //h;

    offscreenCtx.drawImage(inCanvas, 0, 0, w, h);
    offscreenCtx.scale(w*size,h*size);
    
    inCtx.save();

    // turn off image aliasing for a pixely look - currently off
    //inCtx.msImageSmoothingEnabled = false;
    //inCtx.mozImageSmoothingEnabled = false;
    //inCtx.webkitImageSmoothingEnabled = false;
    //inCtx.imageSmoothingEnabled = false;

    // enlarge the minimized image to full size and draw to main canvas
    inCtx.drawImage(
        offscreenCanvas,
        0,
        0,
        w,
        h,
        0,
        0,
        inCanvas.width,
        inCanvas.height
    );

    pixelArray = offscreenCtx.getImageData(0, 0, w, h);
    pixelArray.data = shuffle(pixelArray.data);

    offscreenCtx.putImageData(pixelArray, 0, 0);

    inCtx.drawImage(
        offscreenCanvas,
        0,
        0,
        w,
        h,
        0,
        0,
        inCanvas.width,
        inCanvas.height
    );


    inCtx.restore();
}

function shuffle(array) {
    //this should maybe just be running on the blur path not the whole canvas - however i'd need to refactor the way the data is passed around in general so for now it runs on the whole canvas

    var biggerDimension = Math.max(canvas.width, canvas.height);
    var holderArray = [];

    for (var i = 0, n = array.length; i < n; i += 4) {
        var red = array[i];
        var green = array[i + 1];
        var blue = array[i + 2];
        //var alpha = array[i + 3];

        if (red + green + blue != 0) {
            holderArray.push([i, array[i], array[i + 1], array[i + 2]]);
        }
    }

    for (x = 0; x < holderArray.length; x++) {
        //gets a random element within biggerDimension/100 pixels of this one - in the linear pixel array, its kind of silly but it works! always skews horizontal. might want to come back through and do something nicer but its getting blurred anyway so eh

        var randomElement =
            x +
            Math.floor(
                randomCryptoNumber() *
                    (biggerDimension / 100) *
                    negativeOrPositive()
            );

        if (randomElement >= holderArray.length || randomElement < 0) {
            randomElement = x;
        }

        //added some noise to the pixels when shifted so they should be very hard to next-neighbor stitch back together, even without the aliasing and blur

        array[holderArray[x][0]] =
            holderArray[randomElement][1] +
            Math.round(randomCryptoNumber() * negativeOrPositive() * 3);
        array[holderArray[x][0] + 1] =
            holderArray[randomElement][2] +
            Math.round(randomCryptoNumber() * negativeOrPositive() * 3);
        array[holderArray[x][0] + 2] =
            holderArray[randomElement][3] +
            Math.round(randomCryptoNumber() * negativeOrPositive() * 3);
    }
    return array;
}


function randomCryptoNumber() {
    var buf = new Uint8Array(1);
    window.crypto.getRandomValues(buf);
    var randomNumber = buf[0] / 255;
    return randomNumber;
}

function negativeOrPositive() {
    return randomCryptoNumber() < 0.5 ? -1 : 1;
}






//bits of this code lifted and adapted from various jsfiddles and libraries --
//thank you:
//http://jsfiddle.net/sierawski/4xezb7nL/
//https://stackoverflow.com/questions/22604903/needed-canvas-blurring-tool
//http://jsfiddle.net/m1erickson/baDLp/
//view-source:https://storage.flother.is/etc/2010/examples/canvas-blur/v3/canvas-image.js
//http://quasimondo.com/StackBlurForCanvas/StackBlur.js
//https://github.com/exif-js/exif-js
//http://jsfiddle.net/4cwpLvae/
//https://stackoverflow.com/questions/16645801/rotate-canvas-90-degrees-clockwise-and-update-width-height
//https://stackoverflow.com/questions/19129644/how-to-pixelate-an-image-with-canvas-and-javascript
//https://devbutze.blogspot.com/2014/02/html5-canvas-offscreen-rendering.html

/// // // /
