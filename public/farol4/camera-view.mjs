// Prefer the sensor's complete image. Constraints are preferences so older
// mobile browsers can return their available camera resolution.
export function cameraConstraints(width, height) {
  const portrait = height > width;
  return {
    video: {
      facingMode: {ideal: 'environment'},
      width: {ideal: portrait ? 1080 : 1440},
      height: {ideal: portrait ? 1440 : 1080},
      resizeMode: {ideal: 'none'},
    },
    audio: false,
  };
}

// video.resize fires when the mobile camera changes its output orientation.
// The preview follows its real dimensions instead of imposing a landscape box.
export function syncCameraAspect(video) {
  if (!video.videoWidth || !video.videoHeight) return;
  video.parentElement.style.setProperty('--camera-aspect', `${video.videoWidth} / ${video.videoHeight}`);
}
