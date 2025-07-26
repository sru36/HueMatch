import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Camera, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadedImage {
  file: File;
  url: string;
}

interface PixelData {
  x: number;
  y: number;
  rgb: [number, number, number];
}

interface FoundationMatch {
  bestMatch: {
    name: string;
    rgb: [number, number, number];
    undertone: string;
    confidence: number;
  };
  alternativeMatches: Array<{
    name: string;
    rgb: [number, number, number];
    undertone: string;
    distance: number;
  }>;
  userUndertone: string;
  recommendations: string[];
}

export default function Index() {
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [selectedPixel, setSelectedPixel] = useState<PixelData | null>(null);
  const [foundationMatch, setFoundationMatch] = useState<FoundationMatch | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'welcome' | 'upload' | 'picker' | 'results'>('welcome');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setUploadedImage({ file, url });
      setStep('picker');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const getPixelColor = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    
    if (!ctx) return;

    // Get click coordinates relative to the image
    const rect = img.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * img.naturalWidth;
    const y = ((e.clientY - rect.top) / rect.height) * img.naturalHeight;

    // Set canvas size to match image
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    // Draw image to canvas
    ctx.drawImage(img, 0, 0);
    
    // Get pixel data
    const imageData = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1);
    const [r, g, b] = imageData.data;
    
    setSelectedPixel({
      x: Math.floor(x),
      y: Math.floor(y),
      rgb: [r, g, b]
    });
  };

  const handleFindShade = async () => {
    if (!selectedPixel) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/foundation-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rgb: selectedPixel.rgb })
      });

      if (response.ok) {
        const result: FoundationMatch = await response.json();
        setFoundationMatch(result);
        setStep('results');
      } else {
        console.error('API error:', await response.text());
      }
    } catch (error) {
      console.error('Error finding foundation match:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-pink-50 via-white to-warm-beige-50">
      {/* Header */}
      <header className="w-full px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-soft-pink-400 to-soft-pink-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-soft-pink-600 to-warm-beige-700 bg-clip-text text-transparent">
              HueMatch
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pb-16">
        {/* Welcome Section */}
        {step === 'welcome' && (
          <div className="text-center space-y-8 pt-16">
            <div className="space-y-6">
              <h2 className="text-5xl md:text-6xl font-bold leading-tight">
                Find Your Perfect{' '}
                <span className="bg-gradient-to-r from-soft-pink-500 to-soft-pink-700 bg-clip-text text-transparent">
                  MAC Foundation
                </span>{' '}
                Shade
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Upload a photo, select your skin tone, and discover your ideal MAC foundation match with AI-powered color analysis.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Button
                onClick={() => setStep('upload')}
                size="lg"
                className="bg-gradient-to-r from-soft-pink-500 to-soft-pink-600 hover:from-soft-pink-600 hover:to-soft-pink-700 text-white px-8 py-6 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Camera className="w-6 h-6 mr-3" />
                Get Started
                <ArrowRight className="w-5 h-5 ml-3" />
              </Button>
            </div>

            {/* Feature highlights */}
            <div className="grid md:grid-cols-3 gap-8 pt-16">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-soft-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-soft-pink-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">Upload Your Photo</h3>
                  <p className="text-gray-600">Take or upload a clear photo in natural lighting for best results.</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-warm-beige-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <div className="w-8 h-8 rounded-full border-4 border-warm-beige-600 relative">
                      <div className="absolute inset-1 bg-warm-beige-600 rounded-full"></div>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">Select Your Skin</h3>
                  <p className="text-gray-600">Click on your skin to analyze the exact color tone.</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-soft-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-soft-pink-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">Get Your Match</h3>
                  <p className="text-gray-600">Discover your perfect MAC foundation shade instantly.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Upload Section */}
        {step === 'upload' && (
          <div className="space-y-8 pt-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-gray-800">Upload Your Photo</h2>
              <p className="text-lg text-gray-600">Choose a clear photo with good lighting for the most accurate results</p>
            </div>
            
            <Card 
              className={cn(
                "border-2 border-dashed transition-all duration-300 bg-white/80 backdrop-blur-sm",
                isDragging ? "border-soft-pink-400 bg-soft-pink-50" : "border-gray-300 hover:border-soft-pink-300"
              )}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
            >
              <CardContent className="p-16 text-center">
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-soft-pink-100 rounded-2xl flex items-center justify-center mx-auto">
                    <Upload className="w-10 h-10 text-soft-pink-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-gray-800">Drop your photo here</h3>
                    <p className="text-gray-500">or click to browse your files</p>
                  </div>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="lg"
                    className="border-soft-pink-300 text-soft-pink-600 hover:bg-soft-pink-50"
                  >
                    Choose File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </CardContent>
            </Card>
            
            <div className="text-center">
              <Button
                onClick={() => setStep('welcome')}
                variant="ghost"
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back
              </Button>
            </div>
          </div>
        )}

        {/* Pixel Picker Section */}
        {step === 'picker' && uploadedImage && (
          <div className="space-y-8 pt-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-gray-800">Select Your Skin Tone</h2>
              <p className="text-lg text-gray-600">Click on an area of your skin for color analysis</p>
            </div>
            
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="relative max-w-2xl mx-auto">
                    <img
                      ref={imageRef}
                      src={uploadedImage.url}
                      alt="Uploaded photo"
                      className="w-full h-auto rounded-lg shadow-lg cursor-crosshair"
                      onClick={getPixelColor}
                    />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  
                  {selectedPixel && (
                    <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800">Selected Color</h3>
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-16 h-16 rounded-lg border-2 border-gray-200 shadow-sm"
                          style={{ backgroundColor: `rgb(${selectedPixel.rgb.join(',')})` }}
                        />
                        <div className="space-y-1">
                          <p className="font-mono text-sm text-gray-600">
                            RGB({selectedPixel.rgb.join(', ')})
                          </p>
                          <p className="text-sm text-gray-500">
                            Position: ({selectedPixel.x}, {selectedPixel.y})
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        onClick={handleFindShade}
                        className="w-full bg-gradient-to-r from-soft-pink-500 to-soft-pink-600 hover:from-soft-pink-600 hover:to-soft-pink-700 text-white rounded-xl py-6 text-lg font-semibold"
                      >
                        Find My Foundation Shade
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <div className="text-center">
              <Button
                onClick={() => setStep('upload')}
                variant="ghost"
                className="text-gray-500 hover:text-gray-700"
              >
                ← Upload Different Photo
              </Button>
            </div>
          </div>
        )}

        {/* Results Section (Placeholder) */}
        {step === 'results' && (
          <div className="space-y-8 pt-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-gray-800">Your Perfect Match</h2>
              <p className="text-lg text-gray-600">Based on your skin tone analysis</p>
            </div>
            
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="space-y-6">
                  <div className="text-2xl font-semibold text-gray-800">
                    MAC Studio Fix Fluid - NC25
                  </div>
                  
                  <div className="flex justify-center gap-8">
                    {selectedPixel && (
                      <div className="space-y-2">
                        <div 
                          className="w-20 h-20 rounded-lg border-2 border-gray-200 shadow-sm mx-auto"
                          style={{ backgroundColor: `rgb(${selectedPixel.rgb.join(',')})` }}
                        />
                        <p className="text-sm text-gray-600">Your Skin Tone</p>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <div className="w-20 h-20 rounded-lg border-2 border-gray-200 shadow-sm mx-auto bg-[#D4A574]" />
                      <p className="text-sm text-gray-600">Foundation Match</p>
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm text-amber-700">
                      <strong>Disclaimer:</strong> Accuracy depends on lighting conditions and the selected pixel. 
                      We recommend testing the shade in-store for the best match.
                    </p>
                  </div>
                  
                  <Button
                    onClick={() => {
                      setStep('welcome');
                      setUploadedImage(null);
                      setSelectedPixel(null);
                    }}
                    className="bg-gradient-to-r from-soft-pink-500 to-soft-pink-600 hover:from-soft-pink-600 hover:to-soft-pink-700 text-white rounded-xl px-8 py-4"
                  >
                    Try Another Photo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
