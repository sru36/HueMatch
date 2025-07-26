import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Camera, Sparkles, ArrowRight, Heart, ExternalLink } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-brand-light-pink via-white to-brand-light-pink/30 transition-all duration-500">
      {/* Header */}
      <header className="w-full px-6 py-12">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-title font-bold text-brand-purple">
            HueMatch
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pb-16">
        {/* Welcome Section */}
        {step === 'welcome' && (
          <div className="text-center space-y-12 pt-24 animate-in fade-in duration-700">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-purple uppercase tracking-wide">
                  FOUNDATION
                </h2>
                <h3 className="text-5xl md:text-6xl font-bold font-heading leading-tight text-brand-purple">
                  Find the <em className="italic">right</em> foundation
                  <br />
                  shade for your skin
                </h3>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Button
                onClick={() => setStep('upload')}
                size="lg"
                className="bg-brand-pink hover:bg-brand-pink/90 text-brand-purple px-12 py-6 text-lg font-button font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 uppercase tracking-wide"
              >
                FIND YOUR PERFECT SHADE & TRY IT ON NOW!
              </Button>
            </div>

            {/* Feature highlights */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pt-16">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-brand-light-pink rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-brand-purple" />
                  </div>
                  <h3 className="text-xl font-semibold font-heading mb-3 text-gray-800">Upload Your Photo</h3>
                  <p className="text-gray-600">Take or upload a clear photo in natural lighting for best results.</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-brand-light-pink rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <div className="w-8 h-8 rounded-full border-4 border-brand-purple relative">
                      <div className="absolute inset-1 bg-brand-purple rounded-full"></div>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold font-heading mb-3 text-gray-800">Select Your Skin</h3>
                  <p className="text-gray-600">Click on your skin to analyze the exact color tone.</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-brand-light-pink rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-brand-purple" />
                  </div>
                  <h3 className="text-xl font-semibold font-heading mb-3 text-gray-800">Get Your Match</h3>
                  <p className="text-gray-600">Discover your perfect MAC foundation shade instantly.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Upload Section */}
        {step === 'upload' && (
          <div className="space-y-8 pt-8 animate-in slide-in-from-right duration-500">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold font-heading text-gray-800">Upload Your Photo</h2>
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
                    className="border-soft-pink-300 text-soft-pink-600 hover:bg-soft-pink-50 font-button"
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
          <div className="space-y-8 pt-8 animate-in slide-in-from-left duration-500">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold font-heading text-gray-800">Select Your Skin Tone</h2>
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
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-soft-pink-500 to-soft-pink-600 hover:from-soft-pink-600 hover:to-soft-pink-700 text-white rounded-xl py-6 text-lg font-semibold font-button disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            Find My Foundation Shade
                            <ArrowRight className="w-5 h-5 ml-2" />
                          </>
                        )}
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

        {/* Results Section */}
        {step === 'results' && foundationMatch && (
          <div className="space-y-8 pt-8 animate-in zoom-in duration-700">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold font-heading text-gray-800">Your Perfect Match</h2>
              <p className="text-lg text-gray-600">Based on your skin tone analysis</p>
            </div>

            {/* Main Match Result */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="space-y-8">
                  {/* Best Match */}
                  <div className="text-center space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-3xl font-bold text-gray-800">
                        MAC {foundationMatch.bestMatch.name}
                      </h3>
                      <p className="text-lg text-gray-600">
                        {foundationMatch.bestMatch.confidence}% confidence match
                      </p>
                      <p className="text-sm text-gray-500 capitalize">
                        {foundationMatch.bestMatch.undertone} undertones
                      </p>
                    </div>

                    {/* Color Swatches */}
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-8 sm:gap-12">
                      {selectedPixel && (
                        <div className="text-center space-y-3">
                          <div
                            className="w-24 h-24 rounded-2xl border-4 border-gray-200 shadow-lg mx-auto"
                            style={{ backgroundColor: `rgb(${selectedPixel.rgb.join(',')})` }}
                          />
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-800">Your Skin Tone</p>
                            <p className="text-xs text-gray-500 font-mono">
                              RGB({selectedPixel.rgb.join(', ')})
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {foundationMatch.userUndertone} undertones
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="text-center space-y-3">
                        <div
                          className="w-24 h-24 rounded-2xl border-4 border-soft-pink-200 shadow-lg mx-auto"
                          style={{ backgroundColor: `rgb(${foundationMatch.bestMatch.rgb.join(',')})` }}
                        />
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-800">Foundation Match</p>
                          <p className="text-xs text-gray-500 font-mono">
                            RGB({foundationMatch.bestMatch.rgb.join(', ')})
                          </p>
                          <p className="text-xs text-gray-500">
                            MAC {foundationMatch.bestMatch.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Alternative Matches */}
                  {foundationMatch.alternativeMatches.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800 text-center">
                        Alternative Matches
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {foundationMatch.alternativeMatches.map((alt, index) => (
                          <div key={index} className="text-center space-y-2">
                            <div
                              className="w-16 h-16 rounded-lg border-2 border-gray-200 shadow-sm mx-auto"
                              style={{ backgroundColor: `rgb(${alt.rgb.join(',')})` }}
                            />
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-gray-800">MAC {alt.name}</p>
                              <p className="text-xs text-gray-500 capitalize">{alt.undertone}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  <div className="bg-soft-pink-50 border border-soft-pink-200 rounded-xl p-6 space-y-4">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-soft-pink-600" />
                      Recommendations
                    </h4>
                    <ul className="space-y-2">
                      {foundationMatch.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-soft-pink-400 rounded-full mt-2 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Disclaimer */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm text-amber-700 text-center">
                      <strong>Disclaimer:</strong> Accuracy depends on lighting conditions and the selected pixel.
                      We recommend testing the shade in-store for the best match.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={() => {
                        setStep('welcome');
                        setUploadedImage(null);
                        setSelectedPixel(null);
                        setFoundationMatch(null);
                      }}
                      className="bg-gradient-to-r from-soft-pink-500 to-soft-pink-600 hover:from-soft-pink-600 hover:to-soft-pink-700 text-white rounded-xl px-8 py-4"
                    >
                      Try Another Photo
                    </Button>
                    <Button
                      onClick={() => setStep('picker')}
                      variant="outline"
                      className="border-soft-pink-300 text-soft-pink-600 hover:bg-soft-pink-50 rounded-xl px-8 py-4"
                    >
                      Select Different Pixel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-gradient-to-r from-brand-light-pink/30 to-brand-light-pink/50 border-t border-brand-light-pink mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <span className="text-sm">© 2025 Srushti Rawal. Built with</span>
              <Heart className="w-4 h-4 text-brand-pink fill-current" />
              <a
                href="https://srushtifr.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-brand-purple hover:text-brand-purple/80 transition-colors duration-200 font-medium"
              >
                <span>by the creator</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 bg-brand-purple rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-title font-medium text-brand-purple">
                HueMatch
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
