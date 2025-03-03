let model, isDetecting = false;
let model2 = false;
const videoElement = document.getElementById('videoElement');
const outputCanvas = document.getElementById('outputCanvas');
const infoBox = document.getElementById('infoBox');
const objectLabel = document.getElementById('objectLabel');
const confidenceScore = document.getElementById('confidenceScore');
const inputSelection = document.getElementById('inputSelection');
const imageInput = document.getElementById('imageInput');
const videoInput = document.getElementById('videoInput');
const imageDisplay = document.getElementById('imageDisplay');
const videoDisplay = document.getElementById('videoDisplay');
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const captureButton = document.getElementById('captureButton');
const loadingIndicator = document.getElementById('loadingIndicator');

async function loadModel() {
    try {
        model = await cocoSsd.load();
        console.log('Model loaded successfully.');
    } catch (error) {
        console.error('Error loading model:', error);
        // alert('Error loading model. Please try again.');
    }
}

async function loadModel2() {
    try {
        model2 = await mobilenet.load();
        console.log('Model2 loaded successfully.');
    } catch (error) {
        console.error('Error loading model2:', error);
        // alert('Error loading model2. Please try again.');
    }
}

async function startDetection() {
    showLoading(true);
    try {
        if (!model) {
            await loadModel();
        }
        if (!model2) {
            await loadModel2();
        }
        showLoading(false);
        inputSelection.style.display = 'none';
        const inputType = document.querySelector('input[name="inputType"]:checked').value;

        if (inputType === 'webcam') {
            startWebcamDetection();
        } else if (inputType === 'image') {
            imageInput.click();
        } else if (inputType === 'video') {
            videoInput.click();
        }
    } catch (error) {
        showLoading(false);
        alert('Error starting detection. Please try again.');
        console.error('Error in startDetection:', error);
    }
}

function stopDetection() {
    isDetecting = false;
    startButton.disabled = false;
    stopButton.disabled = true;
    captureButton.disabled = true;
    inputSelection.style.display = 'flex';

    if (videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => track.stop());
    }

    videoElement.style.display = 'none';
    imageDisplay.style.display = 'none';
    videoDisplay.style.display = 'none';
    outputCanvas.style.display = 'none';
    infoBox.classList.remove('active');
}

async function startWebcamDetection() {
    videoElement.style.display = 'block';
    isDetecting = true;
    startButton.disabled = true;
    stopButton.disabled = false;
    captureButton.disabled = false;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoElement.srcObject = stream;
        videoElement.onloadedmetadata = () => {
            videoElement.play();
            detectObjects(videoElement);
        };
    } catch (error) {
        stopDetection();
        alert('Error accessing webcam. Please check your camera settings.');
        console.error('Webcam Error:', error);
    }
}

function handleFileInput(event, type) {
    const file = event.target.files[0];
    if (!file) return alert('Please select a valid file.');

    const mediaUrl = URL.createObjectURL(file);
    if (type === 'image') {
        displayImage(mediaUrl);
    } 
    // else if (type === 'video') {
    //     displayVideo(mediaUrl);
    // }
}

function displayImage(mediaUrl) {
    console.log(mediaUrl);

    // videoElement.style.display = 'none';
    // videoDisplay.style.display = 'none';
    imageDisplay.onload = () => detectImageObjects(imageDisplay);
    imageDisplay.src = mediaUrl;
    imageDisplay.style.display = 'block';
}

function displayVideo(mediaUrl) {
    videoDisplay.src = mediaUrl;
    videoDisplay.style.display = 'block';
    videoElement.style.display = 'none';
    imageDisplay.style.display = 'none';
    videoDisplay.onloadedmetadata = () => {
        videoDisplay.play();
        detectVideoObjects(videoDisplay);
    };
}

async function detectObjects(inputElement) {
    if (!isDetecting) return;

    const [canvas, ctx] = createCanvasFromElement(inputElement);
    const inputTensor = tf.browser.fromPixels(canvas);
    const predictions = await model.detect(inputTensor);

    drawBoundingBoxes(ctx, predictions);
    // updateOutputCanvas(canvas);
    updateDetectionInfo(predictions);

    if (isDetecting) {
        requestAnimationFrame(() => detectObjects(inputElement));
    }
}

// async function detectImageObjects(image) {
//     const [canvas, ctx] = createCanvasFromElement(image);
//     const inputTensor = tf.browser.fromPixels(canvas);
//     const predictions = await model.detect(inputTensor);
//     const classes =  await model2.classify(inputTensor);


    
//     drawBoundingBoxes(ctx, predictions);
//     updateOutputCanvas(image);
//     // updateOutputCanvas(canvas);
//     // updateOutputCanvas(canvas);

//     updateDetectionInfo(predictions);
//     console.log(classes);

//     // Get the container element
//     const classOutput = document.getElementById('classOutput');
//     classOutput.innerHTML = ''; // Clear previous output

//     // Create and append new elements for each class
//     classes.forEach(cls => {
//         const classElement = document.createElement('p');
//         classElement.textContent = `Class: ${cls.className}, Probability: ${(cls.probability * 100).toFixed(2)}%`;
//         classOutput.appendChild(classElement);
//     });
// }


// async function detectImageObjects(image) {
//     const [canvas, ctx] = createCanvasFromElement(image);
//     const inputTensor = tf.browser.fromPixels(canvas);
//     const predictions = await model.detect(inputTensor);
//     const classes = await model2.classify(inputTensor);

//     updateOutputCanvas(image, predictions); // Pass the image element to updateOutputCanvas
//     updateDetectionInfo(predictions);
//     console.log(classes);

//     // Get the container element
//     const classOutput = document.getElementById('classOutput');
//     classOutput.innerHTML = ''; // Clear previous output

//     // Create and append new elements for each class
//     classes.forEach(cls => {
//         const classElement = document.createElement('p');
//         classElement.textContent = `Class: ${cls.className}, Probability: ${(cls.probability * 100).toFixed(2)}%`;
//         classOutput.appendChild(classElement);
//     });
// }

async function detectImageObjects(image) {
    const [canvas, ctx] = createCanvasFromElement(image);
    const inputTensor = tf.browser.fromPixels(canvas);
    const predictions = await model.detect(inputTensor);
    const classes = await model2.classify(inputTensor);

    updateOutputCanvas(image, predictions); // Pass the image element to updateOutputCanvas
    updateDetectionInfo(predictions);
    console.log(classes);

    // Get the container element
    const classOutput = document.getElementById('classOutput');
    classOutput.innerHTML = ''; // Clear previous output

    // Create and append new elements for each class
    const hashtags = new Set();
    predictions.forEach(prediction => {
        hashtags.add({ tag: `#${prediction.class}`, score: prediction.score });
    });
    classes.forEach(cls => {
        hashtags.add({ tag: `#${cls.className.replace(/\W+/g, ', #')}`, score: cls.probability });
    });

    // Sort hashtags by score and take the top 5
    const sortedHashtags = Array.from(hashtags).sort((a, b) => b.score - a.score).slice(0, 5);

    // Display hashtags in one line
    const hashtagLine = sortedHashtags.map(h => h.tag).join(' ');
    const classElement = document.createElement('p');
    classElement.textContent = hashtagLine;

    // Create and append the header
    const headerElement = document.createElement('h2');
    headerElement.textContent = 'Predicted Hashtags';
    classOutput.appendChild(headerElement);
    classOutput.appendChild(classElement);
}


async function detectVideoObjects(video) {
    if (!isDetecting) return;

    const [canvas, ctx] = createCanvasFromElement(video);
    const inputTensor = tf.browser.fromPixels(canvas);
    const predictions = await model.detect(inputTensor);

    drawBoundingBoxes(ctx, predictions);
    updateOutputCanvas(canvas);
    updateDetectionInfo(predictions);

    if (isDetecting) {
        requestAnimationFrame(() => detectVideoObjects(video));
    }
}

function createCanvasFromElement(element) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = element.videoWidth || element.width;
    canvas.height = element.videoHeight || element.height;
    ctx.drawImage(element, 0, 0, canvas.width, canvas.height);
    return [canvas, ctx];
}

function drawBoundingBoxes(ctx, predictions) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    predictions.forEach(prediction => {
        ctx.beginPath();
        ctx.rect(...prediction.bbox);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'red';
        ctx.fillStyle = 'red';
        ctx.stroke();
        ctx.fillText(
            `${prediction.class} (${(prediction.score * 100).toFixed(1)}%)`,
            prediction.bbox[0],
            prediction.bbox[1] > 10 ? prediction.bbox[1] - 5 : 10
        );
    });
}

// function updateOutputCanvas(canvas) {
//     const outputCtx = outputCanvas.getContext('2d');
//     outputCanvas.width = canvas.width;
//     outputCanvas.height = canvas.height;

//     // outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
//     outputCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height);
//     outputCanvas.style.display = 'block';
//     console.log("Done");
// }

function updateOutputCanvas(imageElement, predictions) {
    const outputCtx = outputCanvas.getContext('2d');
    outputCanvas.width = imageElement.width;
    outputCanvas.height = imageElement.height;

    // Draw the image on the canvas
    outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    outputCtx.drawImage(imageElement, 0, 0, outputCanvas.width, outputCanvas.height);

    // Draw bounding boxes on the canvas
    predictions.forEach(prediction => {
        outputCtx.beginPath();
        outputCtx.rect(...prediction.bbox);
        outputCtx.lineWidth = 2;
        outputCtx.strokeStyle = 'red';
        outputCtx.fillStyle = 'red';
        outputCtx.stroke();
        outputCtx.fillText(
            `${prediction.class} (${(prediction.score * 100).toFixed(1)}%)`,
            prediction.bbox[0],
            prediction.bbox[1] > 10 ? prediction.bbox[1] - 5 : 10
        );
    });

    outputCanvas.style.display = 'block';
    console.log("Done");
}

function updateDetectionInfo(predictions) {
   
    try { if (predictions.length > 0) {
        const { class: detectedClass, score } = predictions[0];
        objectLabel.textContent = detectedClass;
        confidenceScore.textContent = `${(score * 100).toFixed(1)}%`;
        infoBox.classList.add('active');
    } else {
        infoBox.classList.remove('active');
    }
} catch (error){
    console.log(error);
}
}

function captureScreenshot() {
    if (outputCanvas.style.display === 'block') {
        const link = document.createElement('a');
        link.href = outputCanvas.toDataURL('image/png');
        link.download = 'screenshot.png';
        link.click();
    } else {
        alert('No detection result to capture.');
    }
}

function showLoading(show) {
    loadingIndicator.style.display = show ? 'block' : 'none';
}

// document.getElementById('startButton').addEventListener('click', startDetection);
// document.getElementById('stopButton').addEventListener('click', stopDetection);
// document.getElementById('captureButton').addEventListener('click', captureScreenshot);
imageInput.addEventListener('change', (event) => handleFileInput(event, 'image'));
// videoInput.addEventListener('change', (event) => handleFileInput(event, 'video'));
document.addEventListener('DOMContentLoaded', loadModel);
document.addEventListener('DOMContentLoaded', loadModel2);
imageInput.style.display = 'block';


// Handle input selection visibility
document.querySelectorAll('input[name="inputType"]').forEach((input) => {
    input.addEventListener('change', () => {
        imageInput.style.display = 'none';
        // videoInput.style.display = 'none';
        if (input.value === 'image') {
            imageInput.style.display = 'block';
        }
        //  else if (input.value === 'video') {
        //     videoInput.style.display = 'block';
        // }
    });
});
