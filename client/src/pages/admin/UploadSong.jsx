import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { adminUploadSong } from '../../api/adminApi';

export default function UploadSong() {
  const audioRef = useRef(null);
  const coverRef = useRef(null);

  const [form, setForm] = useState({
    title: '', artist: '', album: '', genre: '', duration: '',
  });
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [success, setSuccess] = useState(null);

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('audio', audioFile);
      if (coverFile) fd.append('cover', coverFile);
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      return adminUploadSong(fd);
    },
    onSuccess: (song) => {
      setSuccess(song);
      setForm({ title: '', artist: '', album: '', genre: '', duration: '' });
      setAudioFile(null);
      setCoverFile(null);
      setCoverPreview(null);
    },
  });

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setCoverPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const field = (name, label, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor={`upload-${name}`}>
        {label}
      </label>
      <input
        id={`upload-${name}`}
        type={type}
        value={form[name]}
        onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
        placeholder={placeholder}
        className="input-field"
      />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6 pb-4">
      <h1 className="font-display text-3xl font-bold text-text-primary">Upload Song</h1>

      {success && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          ✓ "{success.title}" uploaded successfully!
        </div>
      )}

      {mutation.error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          Upload failed: {mutation.error.message}
        </div>
      )}

      <div className="card space-y-5">
        {/* File uploads */}
        <div className="grid grid-cols-2 gap-4">
          {/* Audio */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Audio File (MP3)*</label>
            <div
              id="audio-drop-zone"
              className="border-2 border-dashed border-surface-border rounded-xl p-6 text-center cursor-pointer hover:border-accent/50 transition-colors"
              onClick={() => audioRef.current?.click()}
            >
              {audioFile ? (
                <div>
                  <div className="text-2xl mb-1">🎵</div>
                  <p className="text-sm text-text-primary font-medium truncate">{audioFile.name}</p>
                  <p className="text-xs text-text-muted">{(audioFile.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              ) : (
                <div>
                  <div className="text-3xl mb-2">⬆️</div>
                  <p className="text-sm text-text-secondary">Click to select MP3</p>
                  <p className="text-xs text-text-muted mt-1">Max 50 MB</p>
                </div>
              )}
              <input ref={audioRef} type="file" accept="audio/mpeg,audio/mp3" className="hidden" onChange={(e) => setAudioFile(e.target.files[0])} />
            </div>
          </div>

          {/* Cover */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Cover Image</label>
            <div
              id="cover-drop-zone"
              className="border-2 border-dashed border-surface-border rounded-xl p-6 text-center cursor-pointer hover:border-accent/50 transition-colors overflow-hidden"
              style={{ background: coverPreview ? `url(${coverPreview}) center/cover` : undefined }}
              onClick={() => coverRef.current?.click()}
            >
              {!coverPreview && (
                <div>
                  <div className="text-3xl mb-2">🖼️</div>
                  <p className="text-sm text-text-secondary">Click to select image</p>
                </div>
              )}
              <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
            </div>
          </div>
        </div>

        {/* Metadata */}
        {field('title', 'Title *', 'text', 'Song title')}
        {field('artist', 'Artist *', 'text', 'Artist name')}

        <div className="grid grid-cols-2 gap-4">
          {field('album', 'Album', 'text', 'Album name')}
          {field('duration', 'Duration (seconds)', 'number', '240')}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Genre</label>
          <select
            id="upload-genre"
            value={form.genre}
            onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}
            className="input-field"
          >
            <option value="">Select genre</option>
            {['Pop', 'Rock', 'Hip-Hop', 'Jazz', 'Classical', 'Electronic', 'R&B', 'Country'].map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <button
          id="upload-submit-btn"
          className="btn-primary w-full justify-center py-3"
          onClick={() => mutation.mutate()}
          disabled={!audioFile || !form.title || !form.artist || mutation.isPending}
        >
          {mutation.isPending ? 'Uploading…' : '⬆️ Upload Song'}
        </button>
      </div>
    </div>
  );
}
