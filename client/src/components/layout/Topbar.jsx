import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search, Headphones } from 'lucide-react';

export default function Topbar() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-base/80 backdrop-blur-sm sticky top-0 z-20">
      {/* Back/forward navigation */}
      <div className="flex items-center gap-2">
        <button onClick={() => history.back()}  className="btn-icon text-lg bg-surface-overlay text-white"><ChevronLeft className="w-5 h-5" /></button>
        <button onClick={() => history.forward()} className="btn-icon text-lg bg-surface-overlay text-white"><ChevronRight className="w-5 h-5" /></button>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md mx-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            id="topbar-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs, artists, albums…"
            className="input-field pl-9 pr-4 py-2 text-sm rounded-full bg-surface-overlay border-none focus:ring-2 focus:ring-white"
          />
        </div>
      </form>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        <button
          id="create-room-btn"
          onClick={() => navigate('/room/new')}
          className="btn-secondary text-xs py-2 px-4 rounded-full font-bold"
        >
          <Headphones className="w-4 h-4 mr-1" /> Start Room
        </button>
      </div>
    </header>
  );
}
