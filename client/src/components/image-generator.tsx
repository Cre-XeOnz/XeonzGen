import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface GeneratedImage {
  url: string;
  model: string;
  id: string;
  prompt: string;
  isFavorite?: boolean;
}



interface VariationImage {
  originalUrl: string;
  variationUrl: string;
  variationType: string;
  model: string;
  processingTime: number;
  id: string;
}

interface GenerationResult {
  id: string;
  images: GeneratedImage[];
  generationTime: number;
  selectedModel: string;
  reasoning: string;
}

interface UsageData {
  generationsLeft: number;
  generationCount: number;
}

// Component for reliable image loading with retry and fallback
interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className: string;
  index: number;
  onClick?: () => void;
}

const ImageWithFallback = ({ src, alt, className, index, onClick }: ImageWithFallbackProps) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState(src);
  
  // Reset state when src prop changes
  useEffect(() => {
    setImageState('loading');
    setCurrentSrc(src);
  }, [src]);

  const handleImageLoad = () => {
    setImageState('loaded');
  };

  const handleImageError = () => {
    // Simple retry with cache busting
    const newSrc = src.includes('?') 
      ? `${src}&bust=${Date.now()}` 
      : `${src}?bust=${Date.now()}`;
    setCurrentSrc(newSrc);
    
    // If still fails after cache busting, mark as loaded anyway to show something
    setTimeout(() => {
      if (imageState === 'loading') {
        setImageState('loaded');
      }
    }, 3000);
  };

  return (
    <div className={`relative ${className}`}>
      {imageState === 'loading' && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-main mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading image {index + 1}...</p>
          </div>
        </div>
      )}
      
      <img
        src={currentSrc}
        alt={alt}
        className={`${className} ${imageState === 'loaded' ? 'opacity-100 cursor-pointer hover:opacity-90' : 'opacity-10'}`}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        onLoad={handleImageLoad}
        onError={handleImageError}
        onClick={() => onClick?.()}
        style={{ transition: 'opacity 0.3s ease-in-out' }}
      />
    </div>
  );
};

export function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("photorealistic");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [imageCount, setImageCount] = useState(5);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [favorites, setFavorites] = useState<GeneratedImage[]>([]);
  const [showGallery, setShowGallery] = useState(false);

  const [variationImages, setVariationImages] = useState<VariationImage[]>([]);
  const [creatingVariations, setCreatingVariations] = useState<Set<string>>(new Set());
  const [currentAbortController, setCurrentAbortController] = useState<AbortController | null>(null);
  const { toast } = useToast();

  const today = new Date().toISOString().split('T')[0];
  
  const { data: usage } = useQuery<UsageData>({
    queryKey: ['/api/usage', today],
    refetchInterval: 60000,
  });

  const generateImageMutation = useMutation({
    mutationFn: async ({ data, abortController }: { data: { prompt: string; style: string; aspectRatio: string; imageCount: number }, abortController?: AbortController }) => {
      const response = await apiRequest('POST', '/api/generate-thumbnail', data, abortController?.signal);
      return response.json();
    },
    onSuccess: (data: GenerationResult) => {
      const imagesWithIds = data.images.map((img, index) => ({
        ...img,
        id: `${Date.now()}-${index}`,
        prompt: prompt, // Store the prompt with each image
        isFavorite: false
      }));
      setResults(prevResults => [...prevResults, ...imagesWithIds]);
      queryClient.invalidateQueries({ queryKey: ['/api/usage'] });
      toast({
        title: "Success!",
        description: `Generated ${data.images.length} new images in ${data.generationTime}s`,
      });
      setCurrentAbortController(null); // Clear after successful completion
    },
    onError: (error: any) => {
      // Don't show error toast for aborted requests
      if (error.name !== 'AbortError') {
        toast({
          title: "Generation Failed",
          description: error.message || "Failed to generate image. Please try again.",
          variant: "destructive",
        });
      }
      setCurrentAbortController(null); // Clear after error
    },
  });



  const createVariationMutation = useMutation({
    mutationFn: async (data: { imageUrl: string; variationType?: string; prompt?: string }) => {
      const response = await apiRequest('POST', '/api/create-variation', data);
      return response.json();
    },
    onSuccess: (data: VariationImage, variables) => {
      const variationWithId = {
        ...data,
        id: `variation-${Date.now()}-${Math.random()}`
      };
      setVariationImages(prev => [...prev, variationWithId]);
      setCreatingVariations(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.delete(variables.imageUrl);
        return newSet;
      });
      toast({
        title: "Variation Created!",
        description: `New ${data.variationType} variation ready in ${data.processingTime}s`,
      });
    },
    onError: (error: any, variables) => {
      setCreatingVariations(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.delete(variables.imageUrl);
        return newSet;
      });
      toast({
        title: "Variation Failed",
        description: error.message || "Failed to create variation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: "Missing Prompt",
        description: "Please describe your image before generating.",
        variant: "destructive",
      });
      return;
    }

    // Cancel previous generation if it's still running
    if (currentAbortController) {
      currentAbortController.abort();
      toast({
        title: "Previous Generation Cancelled",
        description: "Started new image generation.",
      });
    }

    // Create new abort controller for this generation
    const abortController = new AbortController();
    setCurrentAbortController(abortController);

    setResults([]);
    setVariationImages([]);
    console.log("Sending data:", { prompt, style, aspectRatio, imageCount, types: { prompt: typeof prompt, style: typeof style, aspectRatio: typeof aspectRatio, imageCount: typeof imageCount } });
    generateImageMutation.mutate({ data: { prompt, style, aspectRatio, imageCount }, abortController });
  };

  const handleGenerateMore = () => {
    if (!prompt.trim()) {
      toast({
        title: "Missing Prompt", 
        description: "Please describe your image before generating.",
        variant: "destructive",
      });
      return;
    }

    // Cancel previous generation if it's still running
    if (currentAbortController) {
      currentAbortController.abort();
      toast({
        title: "Previous Generation Cancelled",
        description: "Started new image generation.",
      });
    }

    // Create new abort controller for this generation
    const abortController = new AbortController();
    setCurrentAbortController(abortController);

    generateImageMutation.mutate({ data: { prompt, style, aspectRatio, imageCount }, abortController });
  };

  const toggleFavorite = (imageId: string) => {
    const imageToToggle = results.find(img => img.id === imageId);
    if (!imageToToggle) return;

    if (imageToToggle.isFavorite) {
      setFavorites(prev => prev.filter(fav => fav.id !== imageId));
      setResults(prev => prev.map(img => 
        img.id === imageId ? { ...img, isFavorite: false } : img
      ));
      toast({
        title: "Removed from Favorites",
        description: "Image removed from your gallery",
      });
    } else {
      const favoriteImage = { ...imageToToggle, isFavorite: true };
      setFavorites(prev => [...prev, favoriteImage]);
      setResults(prev => prev.map(img => 
        img.id === imageId ? { ...img, isFavorite: true } : img
      ));
      toast({
        title: "Added to Favorites", 
        description: "Image saved to your gallery",
      });
    }
  };

  const handleDownload = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl, { mode: 'cors' });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `xeonz-image-${index + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download Complete",
        description: "Your image has been downloaded successfully.",
      });
    } catch (error) {
      window.open(imageUrl, '_blank');
      toast({
        title: "Download Started",
        description: "Image opened in new tab for manual download.",
      });
    }
  };



  const handleCreateVariation = (imageUrl: string, prompt: string, variationType: string = 'style') => {
    setCreatingVariations(prev => new Set(Array.from(prev).concat(imageUrl)));
    createVariationMutation.mutate({ imageUrl, variationType, prompt });
  };

  const handleDownloadVariation = async (imageUrl: string, index: number, variationType: string) => {
    try {
      const response = await fetch(imageUrl, { mode: 'cors' });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `xeonz-${variationType}-variation-${index + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download Complete",
        description: "Your variation image has been downloaded successfully.",
      });
    } catch (error) {
      window.open(imageUrl, '_blank');
      toast({
        title: "Download Started",
        description: "Image opened in new tab for manual download.",
      });
    }
  };

  const styleOptions = [
    { id: "photorealistic", icon: "fas fa-camera", label: "Photorealistic", description: "Realistic photos" },
    { id: "artistic", icon: "fas fa-palette", label: "Artistic", description: "Illustrations and art" },
    { id: "typography", icon: "fas fa-font", label: "Typography", description: "Text-focused designs" },
    { id: "abstract", icon: "fas fa-shapes", label: "Abstract", description: "Geometric and modern" },
  ];

  const aspectRatioOptions = [
    { id: "16:9", label: "16:9 (Widescreen)" },
    { id: "1:1", label: "1:1 (Square)" },
    { id: "4:3", label: "4:3 (Standard)" },
  ];

  return (
    <section className="py-12" id="gallery">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-main to-blue-main bg-clip-text text-transparent mb-4">
            Xeonz Image Gen
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
            Create stunning, professional images with the power of AI. Transform your ideas into beautiful visuals instantly.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setShowGallery(false)}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                !showGallery
                  ? "bg-purple-main text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-purple-main"
              }`}
              data-testid="button-generate"
            >
              Generate Images
            </button>
            <button
              onClick={() => setShowGallery(true)}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                showGallery
                  ? "bg-purple-main text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-purple-main"
              }`}
              data-testid="button-gallery"
            >
              Gallery ({favorites.length})
            </button>
          </div>
        </div>

        {showGallery ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Favorite Images</h2>
            {favorites.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-heart text-gray-400 text-3xl"></i>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Favorites Yet</h4>
                <p className="text-gray-600">Start generating images and add them to your favorites!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((image, index) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.url}
                      alt={`Favorite image ${index + 1}`}
                      className="w-full aspect-square object-cover rounded-lg shadow-md"
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleDownload(image.url, index)}
                          className="bg-white text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg font-medium"
                          data-testid={`button-download-${image.id}`}
                        >
                          <i className="fas fa-download mr-2"></i>
                          Download
                        </button>
                        <button
                          onClick={() => toggleFavorite(image.id)}
                          className="bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded-lg font-medium"
                          data-testid={`button-remove-favorite-${image.id}`}
                        >
                          <i className="fas fa-heart-broken mr-2"></i>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-start">
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 border border-slate-200">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Generate Your Image</h2>
            
            <div className="mb-6">
              <Label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                Describe your image
              </Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-32 resize-none"
                placeholder="e.g., A beautiful mountain landscape at sunset with vibrant colors, detailed and photorealistic..."
                maxLength={5000}
                data-testid="input-prompt"
              />
              <div className="mt-2 flex justify-between items-center">
                <span className="text-sm text-gray-500">Be specific for better results</span>
                <span className="text-sm text-gray-400">
                  {prompt.length}/5000
                </span>
              </div>
            </div>

            <div className="mb-6">
              <Label className="block text-sm font-medium text-gray-700 mb-3">Style Preference</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {styleOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setStyle(option.id)}
                    className={`p-3 border-2 rounded-lg text-left transition-colors ${
                      style === option.id
                        ? "border-purple-main bg-purple-50"
                        : "border-gray-200 hover:border-purple-main hover:bg-purple-50"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <i className={`${option.icon} ${style === option.id ? "text-purple-main" : "text-gray-600"}`}></i>
                      <span className={`font-medium ${style === option.id ? "text-purple-main" : "text-gray-900"}`}>
                        {option.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <Label className="block text-sm font-medium text-gray-700 mb-3">Aspect Ratio</Label>
              <div className="flex flex-wrap gap-2">
                {aspectRatioOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setAspectRatio(option.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      aspectRatio === option.id
                        ? "bg-purple-main text-white"
                        : "border border-gray-300 text-gray-700 hover:border-purple-main hover:text-purple-main"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <Label className="block text-lg font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Number of Images
              </Label>
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-2xl border border-purple-100">
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-white px-6 py-3 rounded-full shadow-md border-2 border-purple-200">
                    <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {imageCount}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-purple-600 min-w-[20px] text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>1</span>
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={imageCount}
                      onChange={(e) => setImageCount(parseInt(e.target.value))}
                      className="w-full h-3 bg-white rounded-full appearance-none cursor-pointer shadow-inner border border-purple-200 custom-slider"
                      style={{
                        background: `linear-gradient(to right, 
                          #8B5CF6 0%, 
                          #8B5CF6 ${((imageCount - 1) / 19) * 100}%, 
                          #F3F4F6 ${((imageCount - 1) / 19) * 100}%, 
                          #F3F4F6 100%)`
                      }}
                      data-testid="slider-image-count"
                    />
                  </div>
                  <span className="text-sm font-medium text-purple-600 min-w-[20px] text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>20</span>
                </div>
                
                <div className="mt-4 text-center">
                  <span className="text-base font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Generate {imageCount} professional image{imageCount !== 1 ? 's' : ''} ✨
                  </span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generateImageMutation.isPending || !prompt.trim()}
              className="w-full bg-gradient-to-r from-purple-main to-blue-main text-white py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity"
              data-testid="button-generate-images"
            >
              {generateImageMutation.isPending ? (
                <>
                  <i className="fas fa-spinner animate-spin mr-2"></i>
                  Generating...
                </>
              ) : (
                <>
                  <i className="fas fa-magic mr-2"></i>
                  Generate {imageCount} Image{imageCount !== 1 ? 's' : ''}
                </>
              )}
            </Button>

            <div className="mt-4 text-center text-sm text-gray-500">
              <i className="fas fa-infinity mr-1"></i>
              <span>Unlimited free generations available</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 border border-slate-200">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Generated Images</h3>
            </div>

            {generateImageMutation.isPending && (
              <div className="text-center py-12">
                <div className="aspect-video bg-gray-100 rounded-lg flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-main mb-4"></div>
                  <p className="text-gray-600 font-medium mb-2">Generating your images...</p>
                  <p className="text-sm text-gray-500">This may take up to 30 seconds</p>
                </div>
              </div>
            )}

            {!generateImageMutation.isPending && results.length > 0 && (
              <div className="space-y-6">
                <div className={`grid gap-3 sm:gap-4 ${
                  results.length === 1 
                    ? 'grid-cols-1 max-w-2xl mx-auto' 
                    : results.length === 2 
                    ? 'grid-cols-1 sm:grid-cols-2 max-w-4xl mx-auto' 
                    : results.length <= 4 
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 max-w-5xl mx-auto' 
                    : results.length <= 6
                    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 max-w-6xl mx-auto'
                    : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 max-w-7xl mx-auto'
                }`}>
                  {results.map((result, index) => (
                    <div key={result.id} className="relative group">
                      <ImageWithFallback
                        src={result.url}
                        alt={`Generated image ${index + 1}`}
                        className="w-full aspect-video object-cover rounded-lg shadow-md min-h-[200px] md:min-h-[250px] lg:min-h-[300px] xl:min-h-[350px] 2xl:min-h-[400px]"
                        index={index}
                        onClick={() => setFullscreenImage(result.url)}
                      />
                      
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex flex-wrap gap-1 sm:gap-2 justify-center p-2 sm:p-3 max-w-full">
                          <Button
                            onClick={() => handleDownload(result.url, index)}
                            size="sm"
                            className="bg-white text-gray-900 hover:bg-gray-100 text-xs px-2 py-1 h-auto min-h-0 min-w-[60px] sm:min-w-[70px]"
                            data-testid={`button-download-${result.id}`}
                          >
                            <i className="fas fa-download mr-1"></i>
                            Download
                          </Button>
                          <Button
                            onClick={() => toggleFavorite(result.id)}
                            size="sm"
                            className={`${result.isFavorite ? 'bg-red-500 hover:bg-red-600' : 'bg-white hover:bg-gray-100'} text-${result.isFavorite ? 'white' : 'gray-900'} text-xs px-2 py-1 h-auto min-h-0 min-w-[65px] sm:min-w-[75px]`}
                            data-testid={`button-favorite-${result.id}`}
                          >
                            <i className={`fas fa-heart mr-1 ${result.isFavorite ? 'text-white' : 'text-red-500'}`}></i>
                            {result.isFavorite ? 'Favorited' : 'Favorite'}
                          </Button>

                          <Button
                            onClick={() => handleCreateVariation(result.url, result.prompt, 'style')}
                            size="sm"
                            disabled={creatingVariations.has(result.url)}
                            className="bg-blue-500 text-white hover:bg-blue-600 text-xs px-2 py-1 h-auto min-h-0 min-w-[65px] sm:min-w-[75px]"
                            data-testid={`button-variation-${result.id}`}
                          >
                            {creatingVariations.has(result.url) ? (
                              <>
                                <i className="fas fa-spinner animate-spin mr-1"></i>
                                Creating...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-magic mr-1"></i>
                                Variation
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="absolute top-3 right-3 bg-purple-main text-white px-2 py-1 rounded-full text-xs font-medium">
                        <span>{result.model}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleGenerateMore}
                  disabled={generateImageMutation.isPending}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg py-8 text-gray-500 hover:border-purple-main hover:text-purple-main transition-colors flex flex-col items-center space-y-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-generate-more"
                >
                  <i className="fas fa-plus text-2xl"></i>
                  <span className="font-medium">Generate {imageCount} More Images</span>
                </button>



                {/* Variation Images Section */}
                {variationImages.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <i className="fas fa-magic mr-2 text-blue-500"></i>
                      Image Variations ({variationImages.length})
                    </h4>
                    <div className={`grid gap-3 sm:gap-4 ${
                      variationImages.length === 1 
                        ? 'grid-cols-1 max-w-2xl mx-auto' 
                        : variationImages.length === 2 
                        ? 'grid-cols-1 sm:grid-cols-2 max-w-4xl mx-auto' 
                        : variationImages.length <= 4 
                        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 max-w-5xl mx-auto' 
                        : variationImages.length <= 6
                        ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 max-w-6xl mx-auto'
                        : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 max-w-7xl mx-auto'
                    }`}>
                      {variationImages.map((variation, index) => (
                        <div key={variation.id} className="relative group">
                          <ImageWithFallback
                            src={variation.variationUrl}
                            alt={`${variation.variationType} variation ${index + 1}`}
                            className="w-full aspect-video object-cover rounded-lg shadow-md min-h-[200px] md:min-h-[250px] lg:min-h-[300px] xl:min-h-[350px] 2xl:min-h-[400px]"
                            index={index}
                            onClick={() => setFullscreenImage(variation.variationUrl)}
                          />
                          
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Button
                              onClick={() => handleDownloadVariation(variation.variationUrl, index, variation.variationType)}
                              className="bg-white text-gray-900 hover:bg-gray-100 text-xs px-2 py-1 h-auto min-h-0 min-w-[100px] sm:min-w-[120px]"
                              data-testid={`button-download-variation-${variation.id}`}
                            >
                              <i className="fas fa-download mr-1"></i>
                              Download Variation
                            </Button>
                          </div>

                          <div className="absolute top-3 right-3 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium capitalize">
                            <i className="fas fa-magic mr-1"></i>
                            {variation.variationType} Variation
                          </div>


                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!generateImageMutation.isPending && results.length === 0 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-image text-gray-400 text-3xl"></i>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Create</h4>
                <p className="text-gray-600">Fill out the form and click generate to see your images here</p>
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-3 sm:p-6"
             onClick={() => setFullscreenImage(null)}>
          <div className="relative w-full max-w-7xl">
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white text-xl sm:text-2xl hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center"
              data-testid="button-close-fullscreen"
            >
              <i className="fas fa-times"></i>
            </button>
            
            {/* Main selected image */}
            <div className="mb-6">
              <img
                src={fullscreenImage}
                alt="Selected image"
                className="w-full max-h-[60vh] object-contain rounded-lg mx-auto"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            {/* Grid of all available images */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 max-h-[25vh] sm:max-h-[30vh] overflow-y-auto">
              {[...results, ...variationImages.map(v => ({id: v.id, url: v.variationUrl}))].map((image, index) => (
                <div 
                  key={image.id} 
                  className={`relative cursor-pointer rounded-lg overflow-hidden transition-all duration-200 ${
                    image.url === fullscreenImage ? 'ring-4 ring-purple-main ring-opacity-80' : 'hover:ring-2 ring-white ring-opacity-50'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFullscreenImage(image.url);
                  }}
                >
                  <img
                    src={image.url}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full aspect-video object-cover"
                  />
                  {image.url === fullscreenImage && (
                    <div className="absolute inset-0 bg-purple-main bg-opacity-20 flex items-center justify-center">
                      <i className="fas fa-eye text-white text-xl"></i>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-60 px-4 py-2 rounded-full">
              <i className="fas fa-mouse-pointer mr-2"></i>
              Click thumbnails to view • Click outside to close
            </div>
          </div>
        </div>
      )}
    </section>
  );
}