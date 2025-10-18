import React, { useState, useRef } from 'react';
import CameraCapture from './CameraCapture';
import { CameraIcon } from './icons/CameraIcon';
import { UploadIcon } from './icons/UploadIcon';
import { TrashIcon } from './icons/TrashIcon';

interface ImageInputProps {
  label: string;
  onImageSet: (base64: string | null) => void;
}

const ImageInput: React.FC<ImageInputProps> = ({ label, onImageSet }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoCapture = (base64Image: string) => {
    setImage(base64Image);
    onImageSet(base64Image);
    setIsCameraOpen(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Image = e.target?.result as string;
        setImage(base64Image);
        onImageSet(base64Image);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    onImageSet(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (isCameraOpen) {
      return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-slate-300">{label}</h3>
                <button 
                    onClick={() => setIsCameraOpen(false)}
                    className="px-3 py-1 rounded-full bg-slate-700/80 text-white text-xs hover:bg-slate-600 transition-colors"
                >
                    Cancel Camera
                </button>
            </div>
             <CameraCapture onPhotoCapture={handlePhotoCapture} />
        </div>
      )
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-slate-300">{label}</h3>
      <div className="aspect-video w-full rounded-lg bg-slate-900/70 border-2 border-dashed border-slate-700 flex items-center justify-center relative overflow-hidden p-2">
        {image ? (
          <>
            <img src={image} alt={label} className="w-full h-full object-contain rounded-md" />
            <button
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-red-500 transition-colors"
              aria-label="Remove image"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setIsCameraOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <CameraIcon className="w-5 h-5" />
              <span>Use Camera</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <UploadIcon className="w-5 h-5" />
              <span>Upload File</span>
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageInput;
