const socket = io();
const form = document.getElementById('admin-form');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const targetScreen = document.getElementById('targetScreen').value;
    const mainText = document.getElementById('mainText').value;
    const subText = document.getElementById('subText').value;
    const mediaFileInput = document.getElementById('mediaFile');

    let mediaUrl = "";

    // Upload file if selected
    if (mediaFileInput.files.length > 0) {
        const file = mediaFileInput.files[0];
        const formData = new FormData();
        formData.append('mediaFile', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.fileUrl) {
                mediaUrl = data.fileUrl;
            } else {
                alert('Error al subir el archivo');
                return;
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Error al subir el archivo');
            return;
        }
    }

    const payload = {
        targetScreen: targetScreen === "" ? "all" : targetScreen,
        mainText: mainText,
        subText: subText,
        mediaUrl: mediaUrl
    };

    socket.emit('updateContent', payload);

    // Visual feedback
    const btn = form.querySelector('button');
    const originalText = btn.textContent;
    btn.textContent = '¡Enviado!';
    btn.style.backgroundColor = '#28a745';

    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.backgroundColor = '#007bff';
    }, 2000);
});
