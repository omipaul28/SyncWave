export const audio = new Audio();
audio.preload = 'metadata';

// Attach to DOM for better mobile browser compatibility
if (typeof document !== 'undefined' && !document.getElementById('global-audio')) {
  audio.id = 'global-audio';
  audio.style.display = 'none';
  document.body.appendChild(audio);
}
