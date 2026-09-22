import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:3000';

function ScreenPlayer() {
  const { id: screenId } = useParams();

  const [playlist, setPlaylist] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    // Connect to Socket.IO Server
    const socket = io(API_BASE);

    socket.on('connect', () => {
      console.log(`Connected with socket id: ${socket.id}`);
      // Register this screen
      socket.emit('registerScreen', screenId);
    });

    socket.on('playlistUpdated', (data) => {
      console.log('Received new playlist:', data);
      setPlaylist(data);
      setCurrentIndex(0); // Start from the beginning
    });

    return () => {
      socket.disconnect();
    };
  }, [screenId]);

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) clearTimeout(timerRef.current);

    if (playlist && playlist.items && playlist.items.length > 0) {
      const currentItem = playlist.items[currentIndex];

      // If it's an image, use setTimeout based on duration
      if (currentItem.type === 'image') {
        const durationMs = (currentItem.duration || 5) * 1000;
        timerRef.current = setTimeout(() => {
          advancePlaylist();
        }, durationMs);
      }
      // If it's a video, we will rely on the onEnded event of the video element,
      // but we could set a fallback timeout if desired.
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [playlist, currentIndex]);

  const advancePlaylist = () => {
    if (!playlist || !playlist.items) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % playlist.items.length);
  };

  if (!playlist || !playlist.items || playlist.items.length === 0) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: '#000', color: '#fff', alignItems: 'center', justifyContent: 'center', fontSize: '2em' }}>
        Screen {screenId} - Waiting for Playlist...
      </div>
    );
  }

  const currentItem = playlist.items[currentIndex];

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {currentItem.type === 'image' ? (
        <img
          src={`${API_BASE}${currentItem.url}`}
          alt={currentItem.originalName}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
      ) : (
        <video
          ref={videoRef}
          src={`${API_BASE}${currentItem.url}`}
          autoPlay
          muted
          onEnded={advancePlaylist}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
      )}
    </div>
  );
}

export default ScreenPlayer;
