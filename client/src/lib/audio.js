export const audio = new Audio();
// Do not set a base64 src, as it can cause iOS to sandbox the element to data URIs.
audio.preload = 'metadata';

// Attach to DOM for better mobile browser compatibility
if (typeof document !== 'undefined' && !document.getElementById('global-audio')) {
  audio.id = 'global-audio';
  audio.style.display = 'none';
  document.body.appendChild(audio);
}
