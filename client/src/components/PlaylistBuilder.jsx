import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3000';

function PlaylistBuilder() {
  const [mediaList, setMediaList] = useState([]);
  const [playlists, setPlaylists] = useState([]);

  const [playlistName, setPlaylistName] = useState('');
  const [playlistItems, setPlaylistItems] = useState([]);

  useEffect(() => {
    fetchMedia();
    fetchPlaylists();
  }, []);

  const fetchMedia = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/media`);
      const data = await res.json();
      setMediaList(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPlaylists = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/playlists`);
      const data = await res.json();
      setPlaylists(data);
    } catch (e) {
      console.error(e);
    }
  };

  const addMediaToPlaylist = (media) => {
    setPlaylistItems([
      ...playlistItems,
      { ...media, duration: 5 } // Default 5 seconds
    ]);
  };

  const updateDuration = (index, duration) => {
    const newItems = [...playlistItems];
    newItems[index].duration = parseInt(duration) || 0;
    setPlaylistItems(newItems);
  };

  const removeItem = (index) => {
    setPlaylistItems(playlistItems.filter((_, i) => i !== index));
  };

  const savePlaylist = async () => {
    if (!playlistName || playlistItems.length === 0) {
      alert("Name and items are required");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/playlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playlistName, items: playlistItems })
      });
      if (res.ok) {
        setPlaylistName('');
        setPlaylistItems([]);
        fetchPlaylists();
      } else {
        alert('Failed to save playlist');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <h2>Playlist Builder</h2>

      <div style={{ display: 'flex', gap: '20px' }}>

        {/* Media Selector */}
        <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '8px' }}>
          <h3>Available Media</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {mediaList.map(m => (
              <div key={m.id} style={{ border: '1px solid #ccc', padding: '5px', width: '120px', cursor: 'pointer' }} onClick={() => addMediaToPlaylist(m)}>
                 {m.type === 'image' ? (
                  <img src={`${API_BASE}${m.url}`} alt={m.originalName} style={{ width: '100%', height: '80px', objectFit: 'cover' }} />
                ) : (
                  <video src={`${API_BASE}${m.url}`} style={{ width: '100%', height: '80px', objectFit: 'cover' }} />
                )}
                <div style={{ fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.originalName}</div>
                <button style={{ width: '100%' }}>Add</button>
              </div>
            ))}
          </div>
        </div>

        {/* Playlist Constructor */}
        <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '8px' }}>
          <h3>Create New Playlist</h3>
          <input
            type="text"
            placeholder="Playlist Name"
            value={playlistName}
            onChange={e => setPlaylistName(e.target.value)}
            style={{ width: '100%', padding: '8px', marginBottom: '15px' }}
          />

          <ul style={{ listStyle: 'none', padding: 0 }}>
            {playlistItems.map((item, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                <div style={{ width: '50px', height: '50px', background: '#ccc' }}>
                   {item.type === 'image' ? (
                      <img src={`${API_BASE}${item.url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <video src={`${API_BASE}${item.url}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                </div>
                <div style={{ flex: 1, fontSize: '12px' }}>{item.originalName}</div>
                <div>
                  <input type="number" value={item.duration} onChange={e => updateDuration(idx, e.target.value)} style={{ width: '50px' }} /> s
                </div>
                <button onClick={() => removeItem(idx)}>X</button>
              </li>
            ))}
          </ul>
          <button onClick={savePlaylist} style={{ padding: '10px', background: 'green', color: 'white', border: 'none', cursor: 'pointer' }}>Save Playlist</button>
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>Existing Playlists</h3>
        <ul>
          {playlists.map(pl => (
            <li key={pl.id}>
              <strong>{pl.name}</strong> - {pl.items.length} items
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default PlaylistBuilder;
