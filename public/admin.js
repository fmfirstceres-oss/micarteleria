const socket = io();

const form = document.getElementById('admin-form');

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const mainText = document.getElementById('mainText').value;
    const subText = document.getElementById('subText').value;
    const imageUrl = document.getElementById('imageUrl').value;

    const updateData = {
        mainText: mainText,
        subText: subText,
        imageUrl: imageUrl
    };

    // Emitir el evento al servidor
    socket.emit('updateContent', updateData);

    // Opcional: mostrar un pequeño feedback visual
    const btn = form.querySelector('button');
    const originalText = btn.textContent;
    btn.textContent = '¡Actualizado!';
    btn.style.backgroundColor = '#28a745';

    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.backgroundColor = '#007bff';
    }, 2000);
});
