const socket = io();

// Retrieve screenId from URL, default to '1' if not present
const urlParams = new URLSearchParams(window.location.search);
const screenId = urlParams.get('screenId') || '1';

// Register this screen upon connection
socket.on('connect', () => {
    socket.emit('registerScreen', screenId);
});

const mainText = document.getElementById('main-text');
const subText = document.getElementById('sub-text');
const imageDisplay = document.getElementById('image-display');
const videoDisplay = document.getElementById('video-display');

let currentVideoUrl = "";

socket.on('updateContent', (data) => {
    console.log('Received new content:', data);

    if (data.mainText !== undefined) {
        mainText.textContent = data.mainText;
    }

    if (data.subText !== undefined) {
        subText.textContent = data.subText;
    }

    // Process mediaUrl
    if (data.mediaUrl !== undefined && data.mediaUrl.trim() !== "") {
        const url = data.mediaUrl.toLowerCase();

        // Check if video
        if (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg')) {
            imageDisplay.style.display = 'none';
            imageDisplay.src = "";

            if (currentVideoUrl !== data.mediaUrl) {
                currentVideoUrl = data.mediaUrl;
                videoDisplay.src = data.mediaUrl;
                videoDisplay.style.display = 'inline-block';
                videoDisplay.play().catch(e => console.error("Error playing video:", e));
            } else {
                videoDisplay.style.display = 'inline-block';
            }
        } else {
            // Assume image
            videoDisplay.style.display = 'none';
            videoDisplay.src = "";
            currentVideoUrl = "";

            imageDisplay.src = data.mediaUrl;
            imageDisplay.style.display = 'inline-block';
        }
    } else {
        imageDisplay.style.display = 'none';
        imageDisplay.src = "";
        videoDisplay.style.display = 'none';
        videoDisplay.src = "";
        currentVideoUrl = "";
    }
});
