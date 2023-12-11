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

async function detectPose(model, video) {
    const poses = await model.estimatePoses(video);
    const ctx = document.getElementById('output').getContext('2d');
    const color = 'aqua'; // Color for the skeleton
    const lineWidth = 2; // Line width for the skeleton
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

        // Draw skeleton
        const adjacentKeyPoints =
            poseDetection.util.getAdjacentKeyPoints(pose.keypoints, 0.5);

        adjacentKeyPoints.forEach(([keypoint1, keypoint2]) => {
            drawSegment(
                [keypoint1.y, keypoint1.x],
                [keypoint2.y, keypoint2.x],
                color,
                scale,
                ctx
            );
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

