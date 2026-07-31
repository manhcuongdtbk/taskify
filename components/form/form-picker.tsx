"use client";

import { unsplash } from "@/lib/unsplash";
import { type AssetBasic } from "unsplash-js";
import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { defaultImages } from "@/constants/images";
import { FormErrors } from "./form-errors";

interface FormPickerProps {
  id: string;
  errors?: Record<string, string[] | undefined>;
}

export function FormPicker({ id, errors }: FormPickerProps) {
  const { pending } = useFormStatus();
  const [images, setImages] = useState<AssetBasic[]>(defaultImages);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const { data, error } = await unsplash.GET("/photos/random", {
          params: { query: { collections: ["317099"], count: 9 } },
        });

        if (error || !data) {
          console.error("Failed to get images from Unsplash", error);
          setImages(defaultImages);
          return;
        }

        setImages(Array.isArray(data) ? data : [data]);
      } catch (error) {
        console.error(error);
        setImages(defaultImages);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-sky-700" />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="mb-2 grid grid-cols-3 gap-2">
        {images.map((image) => (
          <div
            key={image.id}
            className={cn(
              "group relative aspect-video cursor-pointer bg-muted transition hover:opacity-75",
              pending && "cursor-auto opacity-50 hover:opacity-50",
            )}
            onClick={() => {
              if (pending) return;
              setSelectedImageId(image.id);
            }}
          >
            <input
              type="radio"
              id={id}
              name={id}
              className="hidden"
              checked={selectedImageId === image.id}
              disabled={pending}
              value={`${image.id}|${image.urls.thumb}|${image.urls.full}|${image.links.html}|${image.user.name}`}
            />
            <Image
              alt={image.description || "Unsplash Image"}
              src={image.urls.thumb}
              fill
              className="rounded-sm object-cover"
            />
            {selectedImageId === image.id && (
              <div className="absolute inset-y-0 flex h-full w-full items-center justify-center bg-black/30">
                <Check className="h-4 w-4 text-white" />
              </div>
            )}
            <a
              href={image.links.html}
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-0 w-full truncate bg-black/50 p-1 text-[10px] text-white opacity-0 group-hover:opacity-100 hover:underline"
            >
              {image.user.name}
            </a>
          </div>
        ))}
      </div>
      <FormErrors id="image" errors={errors} />
    </div>
  );
}
