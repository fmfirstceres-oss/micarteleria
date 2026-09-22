import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3000';

function ScreenManager() {
  const [screens, setScreens] = useState([]);
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    fetchScreens();
    fetchPlaylists();
  }, []);

  const fetchScreens = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/screens`);
      const data = await res.json();
      setScreens(data);
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

  const assignPlaylist = async (screenId, playlistId) => {
    if (!playlistId) return;

    try {
      const res = await fetch(`${API_BASE}/api/screens/${screenId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistId })
      });
      if (res.ok) {
        alert('Playlist assigned successfully');
        fetchScreens(); // refresh to show updated assignment
      } else {
        alert('Error assigning playlist');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <h2>Screen Manager</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {screens.length === 0 && <p>No screens connected yet. Open a screen URL to register it.</p>}
        {screens.map(screen => (
          <div key={screen.id} style={{ background: '#fff', padding: '20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>{screen.name} (ID: {screen.id})</h3>
              <p>Current Playlist ID: {screen.current_playlist_id || 'None'}</p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <select id={`select-${screen.id}`} defaultValue={screen.current_playlist_id || ""}>
                <option value="" disabled>Select Playlist...</option>
                {playlists.map(pl => (
                  <option key={pl.id} value={pl.id}>{pl.name}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  const selectEl = document.getElementById(`select-${screen.id}`);
                  assignPlaylist(screen.id, selectEl.value);
                }}
                style={{ padding: '8px 16px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
              >
                Assign
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ScreenManager;
