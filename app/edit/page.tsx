"use client";

import Image, { getImageProps } from "next/image";
import { useRef, useState, useTransition, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { generateImage } from "../actions";
import { ImageUploader } from "../ImageUploader";
import Spinner from "../Spinner";
import { preloadNextImage } from "@/lib/preload-next-image";
import clsx from "clsx";
import { SampleImages } from "../SampleImages";
import { getAdjustedDimensions } from "@/lib/get-adjusted-dimentions";
import { DownloadIcon } from "../components/DownloadIcon";
import { toast } from "sonner";
import { SuggestedPrompts } from "../suggested-prompts/SuggestedPrompts";
import { flushSync } from "react-dom";

// Helper to slugify the prompt for filenames
function slugifyPrompt(prompt?: string): string {
  if (!prompt) return "image";
  const words = prompt.split(/\s+/).slice(0, 8);
  let slug = words.join("-").toLowerCase();
  slug = slug.replace(/[^a-z0-9\-]/g, "");
  if (slug.length > 40) slug = slug.slice(0, 40);
  return slug || "image";
}

export default function EditPage() {
  const router = useRouter();
  const [images, setImages] = useState<
    { url: string; version: number; prompt?: string; viewMode?: "default" | "back" }[]
  >([]);
  const [imageData, setImageData] = useState<{
    width: number;
    height: number;
  }>({ width: 1024, height: 768 });
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [prompt, setPrompt] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedModel, setSelectedModel] = useState<
    | "black-forest-labs/FLUX.1-kontext-dev"
    | "black-forest-labs/FLUX.1-kontext-pro"
  >("black-forest-labs/FLUX.1-kontext-dev");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [modelImageUrl, setModelImageUrl] = useState<string | null>(null);
  const [modelImageInput, setModelImageInput] = useState("");
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  const [productImageInput, setProductImageInput] = useState("");
  const autoPromptGenerated = useRef(false);

  const handleLogout = () => {
    router.push("/login");
  };

  const activeImage = useMemo(
    () => images.find((i) => i.url === activeImageUrl),
    [images, activeImageUrl],
  );

  const adjustedImageDimensions = getAdjustedDimensions(
    imageData.width,
    imageData.height,
  );

  useEffect(() => {
    function handleNewSession() {
      setImages([]);
      setActiveImageUrl(null);
      setModelImageUrl(null);
      setProductImageUrl(null);
    }
    window.addEventListener("new-image-session", handleNewSession);
    return () => {
      window.removeEventListener("new-image-session", handleNewSession);
    };
  }, []);

  // Handle Ctrl+Enter shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (formRef.current && prompt.trim() && activeImageUrl) {
          formRef.current.requestSubmit();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prompt, activeImageUrl]);

  useEffect(() => {
    const checkApiKey = () => {
      const apiKey = localStorage.getItem("googleAiApiKey") || localStorage.getItem("nanobananaApiKey") || localStorage.getItem("togetherApiKey") || "AIzaSyBakNiY3J_zxOPaj0nmrFEFhUufpNvOHSc";
      const hasKey = !!apiKey;
      setHasApiKey(hasKey);

      if (!hasKey && selectedModel === "black-forest-labs/FLUX.1-kontext-pro") {
        setSelectedModel("black-forest-labs/FLUX.1-kontext-dev");
      }
    };

    checkApiKey();
    window.addEventListener("storage", checkApiKey);
    const interval = setInterval(checkApiKey, 500);

    return () => {
      window.removeEventListener("storage", checkApiKey);
      clearInterval(interval);
    };
  }, [selectedModel]);

  // Handle paste from clipboard - defaults to model image if no focus
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const dataUrl = event.target?.result as string;
              const img = new window.Image();
              img.onload = () => {
                setImageData({ width: img.width, height: img.height });
                // Default to model image if neither is set
                if (!modelImageUrl && !productImageUrl) {
                  setModelImageUrl(dataUrl);
                  if (!activeImageUrl) {
                    setImages([{ url: dataUrl, version: 0 }]);
                    setActiveImageUrl(dataUrl);
                  }
                }
              };
              img.src = dataUrl;
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [modelImageUrl, productImageUrl, activeImageUrl]);

  async function handleDownload() {
    if (!activeImage) return;

    const imageProps = getImageProps({
      src: activeImage.url,
      alt: "Generated image",
      height: imageData.height,
      width: imageData.width,
      quality: 100,
    });

    const response = await fetch(imageProps.props.src);
    const blob = await response.blob();

    const extension = blob.type.includes("jpeg")
      ? "jpg"
      : blob.type.includes("png")
        ? "png"
        : blob.type.includes("webp")
          ? "webp"
          : "bin";

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const slug = slugifyPrompt(activeImage.prompt);
    link.download = `v${activeImage.version}-${slug}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  function handleReset() {
    setImages([]);
    setActiveImageUrl(null);
    setModelImageUrl(null);
    setProductImageUrl(null);
    setPrompt("");
    setModelImageInput("");
    setProductImageInput("");
  }

  function handleAddModelImageUrl() {
    if (!modelImageInput.trim()) return;
    const img = new window.Image();
    img.onload = () => {
      setImageData({ width: img.width, height: img.height });
      setModelImageUrl(modelImageInput);
      if (!activeImageUrl) {
        setImages([{ url: modelImageInput, version: 0 }]);
        setActiveImageUrl(modelImageInput);
      }
      setModelImageInput("");
    };
    img.onerror = () => {
      toast.error("Invalid image URL");
    };
    img.src = modelImageInput;
  }

  function handleAddProductImageUrl() {
    if (!productImageInput.trim()) return;
    const img = new window.Image();
    img.onload = () => {
      setImageData({ width: img.width, height: img.height });
      setProductImageUrl(productImageInput);
      if (!activeImageUrl && !modelImageUrl) {
        setImages([{ url: productImageInput, version: 0 }]);
        setActiveImageUrl(productImageInput);
      }
      setProductImageInput("");
    };
    img.onerror = () => {
      toast.error("Invalid image URL");
    };
    img.src = productImageInput;
  }

  function handleImageUpload(type: "model" | "product", file: File) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        setImageData({ width: img.width, height: img.height });
        if (type === "model") {
          setModelImageUrl(dataUrl);
        } else {
          setProductImageUrl(dataUrl);
        }
        // Model ve product image'ları images array'ine eklenmez - sadece generate edilen sonuçlar eklenir
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  // Otomatik prompt üret - sadece iki resim eklendiğinde ve prompt boşsa
  useEffect(() => {
    if (modelImageUrl && productImageUrl && !prompt.trim() && !autoPromptGenerated.current) {
      const autoPrompt = "Put the product/clothing from the second image on the model in the first image. Make sure the product fits naturally on the model, maintaining proper proportions, lighting, and perspective. The product should look realistic and well-integrated into the scene.";
      setPrompt(autoPrompt);
      autoPromptGenerated.current = true;
    }
    // Reset flag if images are removed
    if (!modelImageUrl || !productImageUrl) {
      autoPromptGenerated.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelImageUrl, productImageUrl]);

  return (
    <div className="flex h-screen w-full flex-col bg-white">
      {/* Logout Button */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        >
          Logout
        </button>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Input */}
        <div className="w-1/2 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Input</h2>
              
              {/* Prompt */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prompt*
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter your prompt..."
                  className="w-full h-24 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  required
                />
              </div>


              {/* Model Image */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Model Image
                  </label>
                  <button
                    onClick={() => {
                      document.getElementById("model-file-input")?.click();
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Add Image
                  </button>
                </div>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith("image/")) {
                      handleImageUpload("model", file);
                    }
                  }}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors mb-2"
                >
                  <input
                    type="text"
                    value={modelImageInput}
                    onChange={(e) => setModelImageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddModelImageUrl();
                      }
                    }}
                    placeholder="Add model image from URL or paste from clipboard"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  />
                  <p className="text-xs text-gray-500 mb-2">
                    Drag and drop files, paste from clipboard (Ctrl/Cmd+V), or provide a URL.
                  </p>
                  
                  {/* Model Image Thumbnail */}
                  {modelImageUrl && (
                    <div className="relative group">
                      <button
                        onClick={() => {
                          // Model image'a tıklanınca aktif yapma - sadece görselleştirme için
                        }}
                        className="w-full"
                      >
                        <Image
                          src={modelImageUrl}
                          alt="Model image"
                          width={200}
                          height={200}
                          className={`w-full h-32 object-cover rounded-lg border-2 ${
                            activeImageUrl === modelImageUrl
                              ? "border-blue-500"
                              : "border-gray-200"
                          }`}
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setModelImageUrl(null);
                          // Model image silindiğinde activeImageUrl'i değiştirme
                        }}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md z-10"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                {/* Hidden file input for model */}
                <input
                  id="model-file-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload("model", file);
                    }
                  }}
                />
              </div>

              {/* Product Image */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Product Image
                  </label>
                  <button
                    onClick={() => {
                      document.getElementById("product-file-input")?.click();
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Add Image
                  </button>
                </div>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith("image/")) {
                      handleImageUpload("product", file);
                    }
                  }}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors mb-2"
                >
                  <input
                    type="text"
                    value={productImageInput}
                    onChange={(e) => setProductImageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddProductImageUrl();
                      }
                    }}
                    placeholder="Add product image from URL or paste from clipboard"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  />
                  <p className="text-xs text-gray-500 mb-2">
                    Drag and drop files, paste from clipboard (Ctrl/Cmd+V), or provide a URL.
                  </p>
                  
                  {/* Product Image Thumbnail */}
                  {productImageUrl && (
                    <div className="relative group">
                      <button
                        onClick={() => {
                          // Product image'a tıklanınca aktif yapma - sadece görselleştirme için
                        }}
                        className="w-full"
                      >
                        <Image
                          src={productImageUrl}
                          alt="Product image"
                          width={200}
                          height={200}
                          className={`w-full h-32 object-cover rounded-lg border-2 ${
                            activeImageUrl === productImageUrl
                              ? "border-blue-500"
                              : "border-gray-200"
                          }`}
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setProductImageUrl(null);
                          // Product image silindiğinde activeImageUrl'i değiştirme
                        }}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md z-10"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                {/* Hidden file input for product */}
                <input
                  id="product-file-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload("product", file);
                    }
                  }}
                />
              </div>


              {/* Additional Settings */}
              <div className="mb-4">
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 flex items-center justify-between">
                    <span>Additional Settings</span>
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Model
                      </label>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value as typeof selectedModel)}
                        disabled={pending}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="black-forest-labs/FLUX.1-kontext-dev">
                          Flux Kontext Dev
                        </option>
                        <option
                          value="black-forest-labs/FLUX.1-kontext-pro"
                          disabled={!hasApiKey}
                        >
                          Flux Kontext Pro {!hasApiKey && "(API key required)"}
                        </option>
                      </select>
                    </div>
                  </div>
                </details>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Reset
                </button>
                <form
                  ref={formRef}
                    action={(formData) => {
                      startTransition(async () => {
                        const promptValue = formData.get("prompt") as string;
                        
                        // İki resim varsa ikisini de gönder, yoksa tek resmi kullan
                        if (!modelImageUrl && !productImageUrl) {
                          toast.error("Please upload at least one image (Model or Product)");
                          return;
                        }

                        // Otomatik prompt üret (eğer boşsa ve iki resim varsa)
                        let defaultPrompt = promptValue;
                        if (!promptValue.trim() && modelImageUrl && productImageUrl) {
                          defaultPrompt = "Put the product/clothing from the second image on the model in the first image. Make sure the product fits naturally on the model, maintaining proper proportions, lighting, and perspective. The product should look realistic and well-integrated into the scene.";
                        }

                        // Back View için prompt
                        const backViewPrompt = modelImageUrl && productImageUrl 
                          ? `${defaultPrompt} Model arkası dönük, back view.`
                          : "Model arkası dönük, back view.";

                        // İki resim varsa ikisini de gönder
                        const baseImage = activeImageUrl || modelImageUrl || productImageUrl;
                        
                        // İlk generate'de hem default hem back view üret
                        const newVersion = images.length > 0 ? images[images.length - 1].version + 1 : 1;
                        
                        // Default view generate et - Route handler kullan
                        const defaultResponse = await fetch("/api/generate-image", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            modelImageUrl: modelImageUrl || undefined,
                            productImageUrl: productImageUrl || undefined,
                            imageUrl: baseImage || undefined,
                            prompt: defaultPrompt,
                            width: imageData.width,
                            height: imageData.height,
                            userAPIKey: localStorage.getItem("googleAiApiKey") || localStorage.getItem("nanobananaApiKey") || localStorage.getItem("togetherApiKey") || "AIzaSyBakNiY3J_zxOPaj0nmrFEFhUufpNvOHSc",
                            model: selectedModel,
                          }),
                        });
                        const defaultGeneration = await defaultResponse.json();

                        if (defaultGeneration.success) {
                          await preloadNextImage({
                            src: defaultGeneration.url,
                            width: imageData.width,
                            height: imageData.height,
                          });
                          
                          // Back View generate et - Route handler kullan
                          const backViewResponse = await fetch("/api/generate-image", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              modelImageUrl: modelImageUrl || undefined,
                              productImageUrl: productImageUrl || undefined,
                              imageUrl: baseImage || undefined,
                              prompt: backViewPrompt,
                              width: imageData.width,
                              height: imageData.height,
                              userAPIKey: localStorage.getItem("googleAiApiKey") || localStorage.getItem("nanobananaApiKey") || localStorage.getItem("togetherApiKey") || "AIzaSyBakNiY3J_zxOPaj0nmrFEFhUufpNvOHSc",
                              model: selectedModel,
                            }),
                          });
                          const backViewGeneration = await backViewResponse.json();

                          if (backViewGeneration.success) {
                            await preloadNextImage({
                              src: backViewGeneration.url,
                              width: imageData.width,
                              height: imageData.height,
                            });
                            
                            // Her iki görünümü de ekle
                            setImages((current) => [
                              ...current,
                              {
                                url: defaultGeneration.url,
                                prompt: defaultPrompt,
                                version: newVersion,
                                viewMode: "default",
                              },
                              {
                                url: backViewGeneration.url,
                                prompt: backViewPrompt,
                                version: newVersion,
                                viewMode: "back",
                              },
                            ]);
                            // Default'u aktif yap
                            setActiveImageUrl(defaultGeneration.url);
                            setPrompt("");
                            autoPromptGenerated.current = false;
                          } else {
                            // Sadece default başarılı oldu
                            setImages((current) => [
                              ...current,
                              {
                                url: defaultGeneration.url,
                                prompt: defaultPrompt,
                                version: newVersion,
                                viewMode: "default",
                              },
                            ]);
                            setActiveImageUrl(defaultGeneration.url);
                            setPrompt("");
                            toast.error("Back view üretilemedi, sadece default görünüm eklendi.");
                          }
                        } else {
                          toast.error(defaultGeneration.error);
                        }
                    });
                  }}
                  className="flex-1"
                >
                  <input type="hidden" name="prompt" value={prompt} />
                  <button
                    type="submit"
                    disabled={pending || !prompt.trim() || (!modelImageUrl && !productImageUrl)}
                    className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {pending ? (
                      <>
                        <Spinner className="size-4 text-white" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>Run</span>
                        <span className="text-xs opacity-75">Ctrl+Enter</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Result */}
        <div className="w-1/2 bg-white overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Result</h2>
              <div className="flex items-center gap-2">
                {pending && (
                  <span className="text-xs text-gray-500 px-2 py-1 rounded bg-gray-100">
                    Processing...
                  </span>
                )}
              </div>
            </div>

            {/* Versiyon ve görünüm butonları */}
            {images.length > 0 && (
              <div className="mb-4 space-y-2">
                {/* Versiyon numaraları */}
                <div className="flex gap-2 flex-wrap">
                  {Array.from(new Set(images.map(img => img.version))).map((version) => (
                    <button
                      key={version}
                      onClick={() => {
                        // Aynı versiyonun default görünümünü göster
                        const defaultImg = images.find(img => img.version === version && img.viewMode === "default");
                        if (defaultImg) {
                          setActiveImageUrl(defaultImg.url);
                        }
                      }}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        activeImage && activeImage.version === version && activeImage.viewMode === "default"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      v{version}
                    </button>
                  ))}
                </div>
                {/* Back View butonu - aktif versiyon için */}
                {activeImage && images.some(img => img.version === activeImage.version && img.viewMode === "back") && (
                  <button
                    onClick={() => {
                      const backViewImg = images.find(img => img.version === activeImage.version && img.viewMode === "back");
                      if (backViewImg) {
                        setActiveImageUrl(backViewImg.url);
                      }
                    }}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      activeImage.viewMode === "back"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Back View
                  </button>
                )}
              </div>
            )}

            {activeImage && images.length > 0 ? (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-white">
                  <Image
                    width={imageData.width}
                    height={imageData.height}
                    src={activeImage.url}
                    style={{
                      aspectRatio: adjustedImageDimensions.width / adjustedImageDimensions.height,
                    }}
                    alt="Generated image"
                    className="w-full h-auto object-contain"
                  />
                  <button
                    onClick={handleDownload}
                    className="absolute top-2 right-2 p-2 rounded-full bg-white/90 hover:bg-white shadow-md text-gray-900 transition-colors"
                    title="Download"
                  >
                    <DownloadIcon />
                  </button>
                </div>

                {/* Prompt bilgisi */}
                {activeImage.prompt && (
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Prompt used:</p>
                    <p className="text-sm text-gray-900">{activeImage.prompt}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600 mb-2">What would you like to do next?</p>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors">
                      Share
                    </button>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[400px] text-gray-400">
                <div className="text-center">
                  <p className="text-lg mb-2">No image generated yet</p>
                  <p className="text-sm">Upload model and product images, then enter a prompt and click Run</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
