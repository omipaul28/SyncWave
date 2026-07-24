export const audio = new Audio();
audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
audio.preload = 'metadata';

// Attach to DOM for better mobile browser compatibility
if (typeof document !== 'undefined' && !document.getElementById('global-audio')) {
  audio.id = 'global-audio';
  audio.style.display = 'none';
  document.body.appendChild(audio);
}
