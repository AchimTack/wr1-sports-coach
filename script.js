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
    video.width = 640;
    video.height = 480;
    
    const stream = await navigator.mediaDevices.getUserMedia({ 'video': true });
    video.srcObject = stream;
    video.style.display = 'none'; // Hide the video element

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

async function main() {
    const video = await setupCamera();
    video.play();

    const model = await loadModel();

    setInterval(() => {
        detectPose(model, video);
    }, 100);
}

window.onload = main;

