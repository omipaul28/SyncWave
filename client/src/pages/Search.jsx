import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchSongs } from '../api/songsApi';
import SongCard from '../components/songs/SongCard';
import SongList from '../components/songs/SongList';
import { Search as SearchIcon, Music, LayoutGrid, List } from 'lucide-react';

const GENRES = ['Pop', 'Rock', 'Hip-Hop', 'Jazz', 'Classical', 'Electronic', 'R&B', 'Country'];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [genre, setGenre] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  const searchQuery = searchParams.get('q') || '';

  const { data: results = [], isLoading, isFetching } = useQuery({
    queryKey: ['search', searchQuery, genre],
    queryFn: () => fetchSongs({ search: searchQuery, genre: genre || undefined, limit: 50 }),
    enabled: !!(searchQuery || genre),
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) setSearchParams({ q: query.trim() });
  };

  return (
    <div className="space-y-8 pb-4">
      <div>
        <h1 className="font-display text-3xl font-bold text-text-primary mb-6">Search</h1>

        {/* Search form */}
        <form onSubmit={handleSearch} className="flex gap-3 max-w-xl">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              id="search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search songs, artists, albums…"
              className="input-field pl-12 rounded-full"
            />
          </div>
          <button id="search-submit-btn" type="submit" className="btn-primary px-6 rounded-full font-bold">
            Search
          </button>
        </form>
      </div>

      {/* Genre filters */}
      <div>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-widest mb-3">Browse by Genre</h2>
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              !genre ? 'bg-accent text-white' : 'bg-surface-overlay border border-surface-border text-text-secondary hover:bg-surface-hover'
            }`}
            onClick={() => setGenre('')}
          >
            All
          </button>
          {GENRES.map((g) => (
            <button
              key={g}
              id={`genre-${g.toLowerCase()}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                genre === g ? 'bg-accent text-white' : 'bg-surface-overlay border border-surface-border text-text-secondary hover:bg-surface-hover'
              }`}
              onClick={() => setGenre(genre === g ? '' : g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {(searchQuery || genre) && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-text-primary">
              {isLoading ? 'Searching…' : `${results.length} results`}
              {searchQuery && <span className="text-text-muted font-normal"> for "{searchQuery}"</span>}
            </h2>
            <div className="flex gap-1">
              <button
                className={`btn-icon ${viewMode === 'grid' ? 'text-accent' : 'text-text-muted'}`}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                className={`btn-icon ${viewMode === 'list' ? 'text-accent' : 'text-text-muted'}`}
                onClick={() => setViewMode('list')}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="song-card animate-pulse">
                  <div className="aspect-square rounded-lg bg-surface-overlay" />
                  <div className="h-3 bg-surface-overlay rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center">
              <SearchIcon className="w-16 h-16 text-text-muted mb-4" />
              <p className="text-text-secondary">No results found</p>
              <p className="text-text-muted text-sm mt-1">Try a different search term or genre</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {results.map((song) => <SongCard key={song.id} song={song} queue={results} />)}
            </div>
          ) : (
            <SongList songs={results} />
          )}
        </div>
      )}

      {/* Empty state */}
      {!searchQuery && !genre && (
        <div className="text-center py-16 flex flex-col items-center">
          <Music className="w-20 h-20 text-text-muted mb-4" />
          <p className="text-text-secondary text-lg font-bold">What do you want to listen to?</p>
        </div>
      )}
    </div>
  );
}
