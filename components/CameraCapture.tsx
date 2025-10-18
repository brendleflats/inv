
import React, { useState } from 'react';
import { useCamera } from '../hooks/useCamera';
import { CameraIcon } from './icons/CameraIcon';
import { FlipCameraIcon } from './icons/FlipCameraIcon';

interface CameraCaptureProps {
  onPhotoCapture: (base64Image: string) => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onPhotoCapture }) => {
  const { videoRef, stream, error, flipCamera, capturePhoto } = useCamera();
  const [isCaptured, setIsCaptured] = useState(false);

  const handleCapture = () => {
    const photo = capturePhoto();
    if (photo) {
      onPhotoCapture(photo);
      setIsCaptured(true);
      setTimeout(() => setIsCaptured(false), 300); // Reset after animation
    }
  };

  return (
    <div className="relative w-full aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      {stream && (
        <div className={`absolute inset-0 transition-colors duration-300 ${isCaptured ? 'bg-white/50' : 'bg-transparent'}`}></div>
      )}
      {error && <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80"><p className="text-red-400 p-4">{error}</p></div>}
      {!stream && !error && <div className="absolute inset-0 flex items-center justify-center"><p className="text-slate-400">Initializing Camera...</p></div>}
      
      <div className="absolute bottom-3 left-3 right-3 flex justify-center items-center gap-4">
        <button
          onClick={flipCamera}
          className="p-3 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
          aria-label="Flip camera"
        >
          <FlipCameraIcon className="w-6 h-6" />
        </button>
        <button
          onClick={handleCapture}
          className="w-16 h-16 rounded-full bg-white border-4 border-slate-500/50 flex items-center justify-center ring-4 ring-white/20 hover:ring-white/40 transition-all"
          aria-label="Capture photo"
        >
          <CameraIcon className="w-8 h-8 text-slate-800" />
        </button>
      </div>
    </div>
  );
};

export default CameraCapture;
