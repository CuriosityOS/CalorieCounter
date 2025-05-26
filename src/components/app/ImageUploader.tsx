'use client';

import React, { useState, useRef, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import OptimizedImage from './OptimizedImage';
import { Camera, UploadCloud, X } from 'lucide-react';

interface ImageUploaderProps {
  onUpload: (base64Image: string) => void;
  isAnalyzing?: boolean;
}

const ImageUploader = memo<ImageUploaderProps>(({ onUpload, isAnalyzing }) => {
  // const [selectedFile, setSelectedFile] = useState<File | null>(null); // Removed unused state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    // setSelectedFile(null); // Removed unused state update
    setPreviewUrl(null);
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  }, []);

  const generatePreview = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const convertToBase64 = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result?.toString().split(',')[1];
      if (base64String) {
        onUpload(base64String);
      } else {
        setError('Failed to read image data.');
        resetState();
      }
    };
    reader.onerror = () => {
      setError('Error reading file.');
      resetState();
    };
    reader.readAsDataURL(file);
  }, [onUpload, resetState]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file.');
        resetState();
        return;
      }

      // setSelectedFile(file); // Removed unused state update
      generatePreview(file);
      convertToBase64(file);
    }
  }, [convertToBase64, generatePreview, resetState]);

  const handleRemoveImage = useCallback(() => {
    resetState();
    setError(null);
  }, [resetState]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setError(null);
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
       // setSelectedFile(file); // Removed unused state update
       generatePreview(file);
       convertToBase64(file);
    } else if (file) {
        setError('Please drop an image file.');
        resetState();
    }
  }, [convertToBase64, generatePreview, resetState]); // Updated dependencies

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Food Image</CardTitle>
      </CardHeader>
      <CardContent
        className="space-y-4"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Input
          id="gallery-upload-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          ref={galleryInputRef}
          className="hidden"
          disabled={isAnalyzing}
        />
        
        <Input
          id="camera-upload-input"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          ref={cameraInputRef}
          className="hidden"
          disabled={isAnalyzing}
        />

        {!previewUrl ? (
          <div
            className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg ${isAnalyzing ? 'cursor-not-allowed bg-muted/50' : 'hover:border-primary/50 hover:bg-muted/20'} transition-colors`}
          >
            <UploadCloud className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="mb-1 text-sm text-muted-foreground">
              Upload a photo or take a new one
            </p>
            <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WEBP etc.</p>
            <div className="flex space-x-4 mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={isAnalyzing} 
                type="button"
                onClick={() => galleryInputRef.current?.click()}
              >
                <UploadCloud className="w-4 h-4 mr-2" /> Upload Photo
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={isAnalyzing} 
                type="button"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="w-4 h-4 mr-2" /> Take Photo
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative group">
            <OptimizedImage
              src={previewUrl}
              alt="Selected food preview"
              width={200}
              height={200}
              className="w-full h-48 object-cover rounded-lg"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRemoveImage}
              disabled={isAnalyzing}
              aria-label="Remove image"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

      </CardContent>
    </Card>
  );
});

ImageUploader.displayName = 'ImageUploader';

export default ImageUploader;