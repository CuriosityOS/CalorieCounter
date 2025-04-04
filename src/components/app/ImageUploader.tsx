'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Image from 'next/image';
import { Camera, UploadCloud, X } from 'lucide-react';

interface ImageUploaderProps {
  onUpload: (base64Image: string) => void;
  isAnalyzing?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onUpload, isAnalyzing }) => {
  // const [selectedFile, setSelectedFile] = useState<File | null>(null); // Removed unused state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const generatePreview = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const convertToBase64 = (file: File) => {
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
  };

  const resetState = () => {
    // setSelectedFile(null); // Removed unused state update
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    resetState();
    setError(null);
  };

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
  }, [convertToBase64]); // Removed unnecessary onUpload dependency

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
          id="image-upload-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="hidden"
          disabled={isAnalyzing}
        />

        {!previewUrl ? (
          <Label
            htmlFor="image-upload-input"
            className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer ${isAnalyzing ? 'cursor-not-allowed bg-muted/50' : 'hover:border-primary/50 hover:bg-muted/20'} transition-colors`}
          >
            <UploadCloud className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="mb-1 text-sm text-muted-foreground">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WEBP etc.</p>
            <Button variant="ghost" size="sm" className="mt-2" disabled={isAnalyzing}>
              <Camera className="w-4 h-4 mr-1" /> Use Camera
            </Button>
          </Label>
        ) : (
          <div className="relative group">
            <Image
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
};

export default ImageUploader;