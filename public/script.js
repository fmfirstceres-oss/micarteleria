const socket = io();

const mainText = document.getElementById('main-text');
const subText = document.getElementById('sub-text');
const imageDisplay = document.getElementById('image-display');

socket.on('updateContent', (data) => {
    console.log('Received new content:', data);

    if (data.mainText !== undefined) {
        mainText.textContent = data.mainText;
    }

    if (data.subText !== undefined) {
        subText.textContent = data.subText;
    }

    if (data.imageUrl !== undefined && data.imageUrl.trim() !== "") {
        imageDisplay.src = data.imageUrl;
        imageDisplay.style.display = 'block';
    } else {
        imageDisplay.style.display = 'none';
        imageDisplay.src = "";
    }
});
