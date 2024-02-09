async function loadModel() {
    return poseDetection.createDetector(poseDetection.SupportedModels.BlazePose, {
        runtime: 'tfjs'
    });
}

// Helper function to draw a line on the canvas
function drawSegment([ay, ax], [by, bx], color, scale, ctx) {
    ctx.beginPath();
    ctx.moveTo(ax * scale, ay * scale);
    ctx.lineTo(bx * scale, by * scale);
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.stroke();
}

// Define keypoint pairs for the skeleton
const connectedKeyPoints = [
    // Head and upper body
    [8, 6], [6, 5], [5, 4], [4, 0], [0, 1], [1, 2], [2, 3], [3, 7], // Head and face
    [9, 10], // Body (spine)

    // Arms
    [11, 13], [13, 15], // Left upper arm and forearm
    [15, 17], [15, 19], [15, 21], // Left hand
    [12, 14], [14, 16], // Right upper arm and forearm
    [16, 18], [16, 20], [16, 22], // Right hand

    // Torso
    [12, 11], // Shoulder connection
    [23, 11], [24, 12], // Shoulders to hips
    [23, 24], // Hips connection

    // Legs
    [23, 25], [25, 27], [27, 29], // Left thigh, shin, and foot
    [27, 31], // Left toe
    [24, 26], [26, 28], [28, 30], // Right thigh, shin, and foot
    [28, 32] // Right toe
];


async function detectPose(model, video) {
    const poses = await model.estimatePoses(video);
    const ctx = document.getElementById('output').getContext('2d');
    const color = '#6ac44f'; // Color for the skeleton
    const lineWidth = 1.5; // Line width for the skeleton
    const scale = 1; // Scale for the keypoints

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    poses.forEach(pose => {
        pose.keypoints.forEach(keypoint => {
            if (keypoint.score > 0.5) {
                // Draw keypoints
                ctx.beginPath();
                ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
                ctx.fillStyle = '#5eeb34';
                ctx.fill();
            }
        });

        // Connect specific keypoints to form a skeleton
        connectedKeyPoints.forEach(pair => {
            const keypoint1 = pose.keypoints[pair[0]];
            const keypoint2 = pose.keypoints[pair[1]];

            if (keypoint1.score > 0.5 && keypoint2.score > 0.5) {
                drawSegment(
                    [keypoint1.y, keypoint1.x],
                    [keypoint2.y, keypoint2.x],
                    color,
                    scale,
                    ctx
                );
            }
        });
    });
}


async function setupCamera() {
    const video = document.getElementById('webcam');
    
    // Make the video responsive
    video.style.width = '100%';
    video.style.height = 'auto';
    
    // Ask the user which camera to use
    const facingMode = window.confirm('Möchtest du die Frontkamera nutzen? Klicke auf "OK" für Ja und auf "Abbrechen" für Nein.') ? 'user' : 'environment';
    
    const constraints = {
        video: {
            facingMode: facingMode
        }
    };
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    video.style.display = 'none'; // Hide the video element

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}


let captureInterval;

async function startCapture() {
    const video = await setupCamera();
    video.play();

    const model = await loadModel();

    const ctx = document.getElementById('output').getContext('2d');
    let countdown = 5;
    const countdownInterval = setInterval(() => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        const fontSize = Math.min(ctx.canvas.width, ctx.canvas.height) / 5; // Make the font size larger
        ctx.font = `bold ${fontSize}px 'Orbitron'`; // Use Orbitron font and make it bold
        ctx.fillStyle = "#39ff14"; // Set the font color to neon green
        ctx.textAlign = "center"; // Center the text
        ctx.textBaseline = "middle"; // Align the text vertically in the middle
        ctx.fillText(countdown--, ctx.canvas.width / 2, ctx.canvas.height / 2);
        if (countdown < 0) {
            clearInterval(countdownInterval);
            captureInterval = setInterval(() => {
                detectPose(model, video);
            }, 100);
        }
    }, 1000);
}

function stopCapture() {
    clearInterval(captureInterval);
    const video = document.getElementById('webcam');
    video.srcObject.getTracks().forEach(track => track.stop());

    const ctx = document.getElementById('output').getContext('2d');
    const fontSize = Math.min(ctx.canvas.width, ctx.canvas.height) / 10;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.font = `bold ${fontSize}px 'Orbitron'`;
    ctx.fillStyle = "#39ff14";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("analysiere...", ctx.canvas.width / 2, ctx.canvas.height / 2 + fontSize);

    setTimeout(() => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        showScreen('exercise_result');
    }, 5000);
}
