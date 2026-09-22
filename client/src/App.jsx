import { BrowserRouter as Router, Routes, Route, Link, Outlet } from 'react-router-dom';
import MediaUpload from './components/MediaUpload';
import PlaylistBuilder from './components/PlaylistBuilder';
import ScreenManager from './components/ScreenManager';
import ScreenPlayer from './components/ScreenPlayer';

function AdminLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <nav style={{ width: '250px', background: '#2c3e50', color: '#fff', padding: '20px' }}>
        <h2>Admin Panel</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ margin: '10px 0' }}><Link to="/admin/media" style={{ color: '#fff', textDecoration: 'none' }}>Media Gallery</Link></li>
          <li style={{ margin: '10px 0' }}><Link to="/admin/playlists" style={{ color: '#fff', textDecoration: 'none' }}>Playlists</Link></li>
          <li style={{ margin: '10px 0' }}><Link to="/admin/screens" style={{ color: '#fff', textDecoration: 'none' }}>Screens</Link></li>
        </ul>
      </nav>
      <main style={{ flex: 1, padding: '20px', background: '#ecf0f1' }}>
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="media" element={<MediaUpload />} />
          <Route path="playlists" element={<PlaylistBuilder />} />
          <Route path="screens" element={<ScreenManager />} />
          <Route index element={<h2>Welcome to Digital Signage Admin</h2>} />
        </Route>
        <Route path="/screen/:id" element={<ScreenPlayer />} />
        {/* Default route */}
        <Route path="/" element={<h2 style={{fontFamily: 'sans-serif', padding: '20px'}}>Go to /admin or /screen/1</h2>} />
      </Routes>
    </Router>
  );
}

export default App;
