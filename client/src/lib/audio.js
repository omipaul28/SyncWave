export const audio = new Audio();
// Do not set a base64 src, as it can cause iOS to sandbox the element to data URIs.
audio.preload = 'metadata';
audio.playsInline = true;
audio.setAttribute('webkit-playsinline', 'true');

// Attach to DOM for better mobile browser compatibility
if (typeof document !== 'undefined' && !document.getElementById('global-audio')) {
  audio.id = 'global-audio';
  // DO NOT use display: none, as iOS Safari often disables media playback for hidden elements
  audio.style.position = 'absolute';
  audio.style.width = '1px';
  audio.style.height = '1px';
  audio.style.opacity = '0';
  audio.style.pointerEvents = 'none';
  document.body.appendChild(audio);
}
