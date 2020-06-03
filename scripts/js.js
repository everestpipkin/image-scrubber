
var filename;
var img;

var isDown = false;
var painting = false;

var canvas = document.getElementById('imageCanvas');
var ctx = canvas.getContext('2d');

var tempCanvas = document.getElementById("tempCanvas");
var tempCtx = tempCanvas.getContext("2d");

var holderCanvas = document.getElementById("holderCanvas");
var holderCtx = holderCanvas.getContext("2d");

var rotationCanvas = document.getElementById("rotationCanvas");
var rotationCtx = rotationCanvas.getContext("2d");

var blurredCanvas = document.getElementById("blurredCanvas");
var blurredCtx = blurredCanvas.getContext("2d");

// these are placeholders - i map this later on in the set canvas size
var brushSize = blurAmount = 50;
var brushAdjustment = 800;

canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseup', handleMouseUp);
canvas.addEventListener('mouseout', handleMouseOut);

canvas.addEventListener('touchstart', handleMouseDown);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', handleMouseUp);
canvas.addEventListener('touchcancel', handleMouseUp);

window.addEventListener("dragover",function(e){
    e = e || event;
    e.preventDefault();
},false);
window.addEventListener("drop",function(e){
    e = e || event;
    e.preventDefault();
},false);

var brushSizeDiv = document.getElementById("brushSizeSlider");
brushSizeDiv.onchange = populateBrushSize;

var blurAmountDiv = document.getElementById("blurAmountSlider");
blurAmountDiv.onchange = populateBlurAmount;

function populateBrushSize(){
    brushSize = Math.floor(this.value * canvas.width/brushAdjustment);
    setCursor();
}

function populateBlurAmount(){
    blurAmount = Math.floor(this.value);
}


function setCursor(){

    var cursorCanvas = document.createElement('canvas');
    var scaleX = canvas.getBoundingClientRect().width / canvas.width;
    cursorCanvas.width = ((brushSize*2)*scaleX);
    cursorCanvas.height = ((brushSize*2)*scaleX);
    var cursorCtx = cursorCanvas.getContext('2d');

    cursorCtx.beginPath();
    cursorCtx.arc(cursorCanvas.width / 2, cursorCanvas.height / 2, (brushSize)*scaleX, 0, Math.PI * 2);
    cursorCtx.closePath();
    cursorCtx.stroke();
    var cursorDataURL = cursorCanvas.toDataURL();
    canvas.style.cursor = "url("+cursorDataURL+") " + cursorCanvas.width / 2 +" "+ cursorCanvas.height / 2 + ", auto";

}

// get list of radio buttons with name 'paintForm'
var sz = document.forms['paintForm'].elements['paintingAction'];

// loop through list
for (var i=0, len=sz.length; i<len; i++) {
    sz[i].onclick = function() {
        painting = this.value;
    };
}

function saveImage(){
  document.getElementById('imageCanvas').toBlob(function (blob) {
    var link = document.createElement('a');

    var nameWithoutPath = filename.replace(/.*[\\/]([^\\/]+)$/, '$1');
    var nameWithoutExtension = nameWithoutPath.replace(/\.[^.]*$/, '');

    link.download = nameWithoutExtension + '_scrubbed.jpg';
    link.href = URL.createObjectURL(blob);
    link.click();
  }, 'image/jpeg', 0.8);
}

const dropContainer = document.getElementById('drop-zone')
const fileInput = document.getElementById('file-input');

dropContainer.ondragover = dropContainer.ondragenter = function(evt) {
    evt.preventDefault();
};

function onFileChange(e) {
    var reader = new FileReader();
    reader.onload = function(event){
        img = new Image();
        img.onload = function(){
            if (img.width < 2500 && img.height < 2500){
                var canvasScale = 1;
            }
            else {
                var canvasScale = Math.min(2500 / img.width, 2500 / img.height)
            }

            canvas.width = tempCanvas.width = holderCanvas.width = rotationCanvas.width = blurredCanvas.width = img.width*canvasScale;
            canvas.height = tempCanvas.height = holderCanvas.height = rotationCanvas.height = blurredCanvas.height = img.height*canvasScale;
            ctx.drawImage(img,0,0,img.width*canvasScale,img.height*canvasScale);
            rotationCtx.drawImage(img,0,0,img.width*canvasScale,img.height*canvasScale);

            var biggerDimension = Math.max(canvas.width, canvas.height);

            brushSize = 50 * (biggerDimension/brushAdjustment);
            blurAmount = (scale(brushSize, 10, 157, 20, 150));
            setCursor();

        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(e.target.files[0]);

    filename = document.getElementById("file-input").value;
    var exifInformationDiv = document.getElementById("exifInformationHolder");
    var imageScrubberInfo = document.getElementById("imageScrubberInfo");
    imageScrubberInfo.style.display = "none";
    exifInformationDiv.style.display = "block";
    var file = e.target.files[0]
    if (file && file.name) {
        EXIF.getData(file, function() {

            var exifData = JSON.stringify(this.exifdata, null, 4);
            if (exifData) {
                if (exifData.toString() == "{}"){
                    exifInformationHolder.innerHTML = "<center>No EXIF data found in image '" + file.name + "'.<br><br></center>";
                    var btn = document.createElement("BUTTON");
                    btn.id="continueButton";
                    btn.innerHTML = "Continue to edit image";
                    btn.onclick = goToBlur;
                    exifInformationHolder.appendChild(btn)
                }
                else{
                    var exifScrollDiv = document.createElement("div");
                    exifScrollDiv.id = "exifScrollDiv"
                    exifScrollDiv.innerHTML =  file.name + "<pre>" + exifData + "</pre>";
                    exifInformationHolder.innerHTML = "Exif Data:<br><br>"
                    exifInformationHolder.appendChild(exifScrollDiv)

                    var btn = document.createElement("BUTTON");
                    btn.id="continueButtonExif";
                    btn.innerHTML = "Scrub Exif Data";
                    btn.onclick = scrubData;
                    exifInformationHolder.appendChild(btn)
                }
            }
        });
    }
}

dropContainer.ondrop = function(evt) {
    // pretty simple -- but not for IE :(
    fileInput.files = evt.dataTransfer.files;

    // If you want to use some of the dropped files
    const dT = new DataTransfer();
    dT.items.add(evt.dataTransfer.files[0]);
    fileInput.files = dT.files;
    // Create a new 'change' event
    const event = new Event('change');

    // Dispatch it.
    fileInput.dispatchEvent(event);
    evt.preventDefault();
};

fileInput.onchange = function(e) {
    onFileChange(e);
}

function scrubData(){
    document.getElementById("exifInformationHolder").style.display = "none";
    alert("EXIF data removed: you may now save the image");
}

function goToBlur(){
    document.getElementById("exifInformationHolder").style.display = "none";
}


function handleMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();

    holderCtx.save();
    holderCtx.clearRect(0, 0, holderCanvas.width, holderCanvas.height);
    holderCtx.drawImage(canvas, 0, 0);
    holderCtx.restore();

    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    isDown = true;
}

function handleMouseOut(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (isDown != false){
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
    drawMousePath(pos.x, pos.y)
}



function handleTouchMove(e) {


    if (e.touches.length > 1){  // Ignore multi touch events
        return;
    }

    touch = event.changedTouches[0]; // get the position information

    var mouseEvent = new MouseEvent( // create event
    "mousemove",   // type of event
    {
        'view': event.target.ownerDocument.defaultView,
        'bubbles': true,
        'cancelable': true,
        'screenX':touch.screenX,  // get the touch coords
        'screenY':touch.screenY,  // and add them to the
        'clientX':touch.clientX,  // mouse event
        'clientY':touch.clientY,
        });
        // send it to the same target as the touch event contact point.
    touch.target.dispatchEvent(mouseEvent);

    var pos = getMousePos(canvas, e);
    posx = pos.x;
    posy = pos.y;

    if (!isDown) {
        return;
    }
    e.preventDefault();
    e.stopPropagation();

    drawMousePath(pos.x, pos.y)
}

function handleMouseUp(e) {
    e.preventDefault();
    e.stopPropagation();
    isDown = false;
    if (painting != "paint"){
        var tempBlurAmount = blurAmount;
        if (painting == "undo"){
            blurAmount = 0;
        }

        blurredCtx.drawImage(rotationCanvas, 0, 0);

        //pixelate function command is here
        if (painting != "undo"){
        pixelateCanvas(blurredCanvas, blurredCtx);
        }
        //blur command is here - undo brush is this same command, but run w radius zero
        stackBlurCanvasRGBA("blurredCanvas", 0, 0, blurredCanvas.width, blurredCanvas.height, blurAmount);
        tempCtx.save();
        tempCtx.globalCompositeOperation = 'source-in';
        tempCtx.drawImage(blurredCanvas, 0, 0);
        tempCtx.restore();

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.globalCompositeOperation = "destination-over";
        ctx.drawImage(holderCanvas, 0, 0);
        ctx.restore();
        blurAmount = tempBlurAmount;
    }
}

function drawMousePath(mouseX, mouseY){
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, brushSize, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    tempCtx.beginPath();
    tempCtx.arc(mouseX, mouseY, brushSize, 0, Math.PI * 2);
    tempCtx.closePath();
    tempCtx.fill();

}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
        y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
}


var button = document.getElementById("about");
button.onclick = function () {

    var imageScrubberInfo = document.getElementById("imageScrubberInfo");
    if (imageScrubberInfo.style.display == "none"){

        imageScrubberInfo.style.display = "block";

    }
    else{
       imageScrubberInfo.style.display = "none";
    }

}

// rotate the canvas 90 degrees each time the button is pressed
var button = document.getElementById("rotate");
button.onclick = function () {
    rotate();
}


//this function is very laggy and i'm sure there is a better way - should rewrite it soon
var myImageData, tempImageData, holderImageData, blurredImageData, rotating = false;

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
        }
    }
}



const scale = (num, in_min, in_max, out_min, out_max) => {
  return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

function pixelateCanvas(inCanvas, inCtx){

    // so - smaller canvases also need to scale down less, because they get too small to render anything
    //just gonna use a map function for now

    var biggerDimension = Math.max(inCanvas.width, inCanvas.height);

    var size = scale(biggerDimension, 10, 2500, 0.1, 0.015);
    w = inCanvas.width * size;
    h = inCanvas.height * size;

    // create offscreen image
    var offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = w;
    offscreenCanvas.height = h;

    var offscreenCtx = offscreenCanvas.getContext('2d');

    offscreenCtx.drawImage(inCanvas, 0, 0, w, h);
    inCtx.save();

    // enlarge the minimized image to full size and draw to main canvas
    inCtx.drawImage(offscreenCanvas, 0, 0, w, h, 0, 0, inCanvas.width, inCanvas.height);

    pixelArray = offscreenCtx.getImageData(0, 0, w, h);
    pixelArray.data = shuffle(pixelArray.data)

    offscreenCtx.putImageData(pixelArray, 0,0);

    // enlarge the minimized image to full size and draw to main canvas
    inCtx.drawImage(offscreenCanvas, 0, 0, w, h, 0, 0, inCanvas.width, inCanvas.height);

    inCtx.restore();

}


function shuffle(array) {

//this should maybe just be running on the blur path not the whole canvas - however i'd need to refactor the way the data is passed around in general so for now it runs on the whole canvas

    var holderArray = []

        for(var i = 0, n = array.length; i < n; i += 4) {
              var red = array[i];
              var green = array[i + 1];
              var blue = array[i + 2];
              //var alpha = array[i + 3];

              if (red+green+blue != 0){
                holderArray.push([i,array[i],array[i + 1],array[i + 2]]);
              }
        }

        for(x = 0; x < holderArray.length; x++) {

            //gets a random element within canvas.width/60 pixels of this one - in the linear pixel array, its kind of silly but it works! always skews horizontal. might want to come back through and do something nicer but its getting blurred anyway so eh

                var randomElement = x + (Math.floor(randomCryptoNumber() * (canvas.width/60)*negativeOrPositive()));

                if (randomElement >= holderArray.length || randomElement < 0){
                    randomElement = x;
                }

            //added some noise to the pixels when shifted so they should be very hard to next-neighbor stitch back together, even without the aliasing and blur

              array[holderArray[x][0]] = holderArray[randomElement][1] + Math.round(randomCryptoNumber()*negativeOrPositive()*3);
              array[holderArray[x][0] + 1] = holderArray[randomElement][2] + Math.round(randomCryptoNumber()*negativeOrPositive()*3);
              array[holderArray[x][0] + 2] = holderArray[randomElement][3] + Math.round(randomCryptoNumber()*negativeOrPositive()*3);

    }
    return array;
}


function randomCryptoNumber(){
  var buf = new Uint8Array(1);
  window.crypto.getRandomValues(buf);
  var randomNumber = (buf[0]/255)
  return randomNumber;
}

function negativeOrPositive(){
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
