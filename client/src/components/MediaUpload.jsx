import React, { useState, useEffect } from 'react';

const API_BASE = '';

function MediaUpload() {
  const [file, setFile] = useState(null);
  const [mediaList, setMediaList] = useState([]);

  const fetchMedia = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/media`);
      const data = await res.json();
      setMediaList(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('mediaFile', file);

    try {
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        setFile(null);
        e.target.reset();
        fetchMedia(); // refresh list
      } else {
        alert('Upload failed');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <h2>Media Gallery</h2>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Upload New Media (Image or Video)</h3>
        <form onSubmit={handleUpload}>
          <input type="file" accept="image/*,video/*" onChange={e => setFile(e.target.files[0])} />
          <button type="submit" style={{ padding: '8px 16px', cursor: 'pointer' }}>Upload</button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
        {mediaList.map(m => (
          <div key={m.id} style={{ background: '#fff', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
            {m.type === 'image' ? (
              <img src={`${API_BASE}${m.url}`} alt={m.originalName} style={{ maxWidth: '100%', maxHeight: '150px' }} />
            ) : (
              <video src={`${API_BASE}${m.url}`} style={{ maxWidth: '100%', maxHeight: '150px' }} controls />
            )}
            <p style={{ fontSize: '12px', wordBreak: 'break-all' }}>{m.originalName}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MediaUpload;
