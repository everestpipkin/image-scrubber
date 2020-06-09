const dropContainer = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');

fileInput.onchange = function (e) {
    onFileChange(e);
};

dropContainer.ondragover = dropContainer.ondragenter = function (evt) {
    evt.preventDefault();
};

function onDrop(evt) {
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
}

dropContainer.ondrop = function (evt) {
    onDrop(evt);
};

window.addEventListener(
    'dragover',
    function (e) {
        e = e || event;
        e.preventDefault();
        document.body.classList.add('dragging');
    },
    false
);
window.addEventListener(
    'drop',
    function (e) {
        e = e || event;
        e.preventDefault();
        onDrop(e);
        document.body.classList.remove('dragging');
    },
    false
);
window.addEventListener('mouseout', function (e) {
    document.body.classList.remove('dragging');
});

function onFileChange(e) {
    var reader = new FileReader();
    reader.onload = function (event) {
        img = new Image();
        img.onload = function () {
            if (img.width < 2500 && img.height < 2500) {
                canvasScale = 1;
            } else {
                canvasScale = Math.min(2500 / img.width, 2500 / img.height);
            }

            canvas.width = tempCanvas.width = holderCanvas.width = rotationCanvas.width = blurredCanvas.width =
                img.width * canvasScale;
            canvas.height = tempCanvas.height = holderCanvas.height = rotationCanvas.height = blurredCanvas.height =
                img.height * canvasScale;
            ctx.drawImage(
                img,
                0,
                0,
                img.width * canvasScale,
                img.height * canvasScale
            );
            rotationCtx.drawImage(
                img,
                0,
                0,
                img.width * canvasScale,
                img.height * canvasScale
            );

            var biggerDimension = Math.max(canvas.width, canvas.height);

            brushSize = (50 * biggerDimension) / brushAdjustment;
            brushSizeDiv.value = 50;
            blurAmount = scale(brushSize, 10, 157, 20, 150);
            blurAmountDiv.value = blurAmount;
            setCursor();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);

    filename = document.getElementById('file-input').value;
    var exifInformationDiv = document.getElementById('exifInformationHolder');
    var imageScrubberInfo = document.getElementById('imageScrubberInfo');
    imageScrubberInfo.style.display = 'none';
    exifInformationDiv.style.display = 'block';
    var file = e.target.files[0];
    if (file && file.name) {
        EXIF.getData(file, function () {
            var exifData = JSON.stringify(this.exifdata, null, 4);
            if (exifData) {
                if (exifData.toString() == '{}') {
                    exifInformationHolder.innerHTML =
                        "<center>No EXIF data found in image '" +
                        file.name +
                        "'.<br><br></center>";
                    var btn = document.createElement('BUTTON');
                    btn.id = 'continueButton';
                    btn.innerHTML = 'Continue to edit image';
                    btn.onclick = goToBlur;
                    exifInformationHolder.appendChild(btn);
                } else {
                    var exifScrollDiv = document.createElement('div');
                    exifScrollDiv.id = 'exifScrollDiv';
                    exifScrollDiv.innerHTML =
                        file.name + '<pre>' + exifData + '</pre>';
                    exifInformationHolder.innerHTML = 'Exif Data:<br><br>';
                    exifInformationHolder.appendChild(exifScrollDiv);

                    var btn = document.createElement('BUTTON');
                    btn.id = 'continueButtonExif';
                    btn.innerHTML = 'Scrub Exif Data';
                    btn.onclick = scrubData;
                    exifInformationHolder.appendChild(btn);
                }
            }
        });
    }
}
