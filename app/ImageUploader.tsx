import clsx from "clsx";
import { useRef, useState, useTransition } from "react";
import Spinner from "./Spinner";

export function ImageUploader({
  onUpload,
}: {
  onUpload: ({
    url,
    width,
    height,
  }: {
    url: string;
    width: number;
    height: number;
  }) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pending, startTransition] = useTransition();

  function getImageData(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ width: img.width, height: img.height });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Failed to load image"));
      };
      
      img.src = objectUrl;
    });
  }

  function fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === "string") {
          resolve(e.target.result);
        } else {
          reject(new Error("Failed to convert file to data URL"));
        }
      };
      
      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };
      
      reader.readAsDataURL(file);
    });
  }

  async function handleUpload(file: File) {
    startTransition(async () => {
      try {
        const [dataUrl, imageData] = await Promise.all([
          fileToDataURL(file),
          getImageData(file),
        ]);

        onUpload({
          url: dataUrl,
          width: imageData.width ?? 1024,
          height: imageData.height ?? 768,
        });
      } catch (error) {
        console.error("Upload error:", error);
        alert("Resim yüklenirken bir hata oluştu. Lütfen tekrar deneyin.");
      }
    });
  }

  return (
    <button
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const data = e.dataTransfer;
        const file = data?.files?.[0];
        if (file) {
          handleUpload(file);
        }
      }}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => {
        setIsDragging(false);
      }}
      onClick={() => {
        fileInputRef.current?.click();
      }}
      className={clsx(
        isDragging && "text-gray-400",
        !isDragging && !pending && "text-gray-700 hover:text-gray-400",
        "relative flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center rounded-xl bg-gray-900 focus-visible:text-gray-400 focus-visible:outline-none",
      )}
    >
      <svg
        className={clsx("absolute inset-0 transition-colors")}
        viewBox="0 0 400 300"
      >
        <rect
          x=".5"
          y=".5"
          width="399"
          height="299"
          rx="6"
          ry="6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="8,10"
        />
      </svg>

      {!pending ? (
        <>
          <div className="flex grow flex-col justify-center">
            <p className="text-xl text-white">Drop a photo</p>
            <p className="mt-1 text-gray-500">or click to upload</p>
          </div>

          <div className="pb-3">
            <p className="text-sm text-gray-500">
              Powered by <span className="text-white">Nano Banana</span>
            </p>
          </div>
        </>
      ) : (
        <div className="text-white">
          <Spinner />
          <p className="mt-2 text-lg">Processing...</p>
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleUpload(file);
          }
        }}
        ref={fileInputRef}
      />
    </button>
  );
}
