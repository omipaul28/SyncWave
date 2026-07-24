import useOffline from '../../hooks/useOffline';
import { ArrowDownCircle, Loader2 } from 'lucide-react';

export default function DownloadButton({ song, className = '' }) {
  const { downloaded, downloading, toggleDownload } = useOffline(song);

  if (!song) return null;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleDownload();
      }}
      disabled={downloading}
      className={`p-1.5 rounded-full transition-colors ${
        downloaded ? 'text-accent' : 'text-text-muted hover:text-text-primary'
      } ${downloading ? 'opacity-50 cursor-not-allowed animate-pulse' : ''} ${className}`}
      title={downloaded ? 'Remove download' : 'Download for offline'}
    >
      {downloading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : downloaded ? (
        <ArrowDownCircle className="w-5 h-5 fill-accent text-black" />
      ) : (
        <ArrowDownCircle className="w-5 h-5" />
      )}
    </button>
  );
}
