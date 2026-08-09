"use client";

import { unsplash } from "@/lib/unsplash";
import { type AssetBasic } from "unsplash-js";
import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { defaultImages } from "@/constants/images";
import { type BoardImageInput } from "@/actions/create-board/types";
import { type FieldErrors } from "@/lib/create-safe-action.types";
import { FormErrors } from "./form-errors";

interface FormPickerProps {
  selectedImage?: BoardImageInput;
  onSelect: (image: BoardImageInput) => void;
  errors?: FieldErrors;
}

export const FormPicker = ({
  selectedImage,
  onSelect,
  errors,
}: FormPickerProps) => {
  const { pending } = useFormStatus();
  const [images, setImages] = useState<AssetBasic[]>(defaultImages);
  const [isLoading, setIsLoading] = useState(true);

  // TODO: Move this Unsplash read to TanStack Query (`lib/api/` factory) — client
  // remote fetch belongs there (docs/data.md), not ad-hoc useEffect. Pick staleTime /
  // refetchOnMount deliberately: `/photos/random` is random; caching avoids reopen
  // spinner flash but keeps the same set until stale.
  useEffect(() => {
    let cancelled = false;

    const fetchImages = async () => {
      try {
        const { data, error } = await unsplash.GET("/photos/random", {
          params: { query: { collections: ["317099"], count: 9 } },
        });

        if (cancelled) return;

        if (error || !data) {
          console.error("Failed to get images from Unsplash", error);
          setImages(defaultImages);
          return;
        }

        setImages(Array.isArray(data) ? data : [data]);
      } catch (reason) {
        if (cancelled) return;
        console.error(reason);
        setImages(defaultImages);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchImages();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6" role="status">
        <Loader2 className="h-6 w-6 animate-spin text-sky-700" />
      </div>
    );
  }

  const handleSelect = (image: AssetBasic) => {
    onSelect({
      id: image.id,
      thumbUrl: image.urls.thumb,
      fullUrl: image.urls.full,
      linkHTML: image.links.html,
      userName: image.user.name,
    });
  };

  return (
    <div className="relative">
      <div className="mb-2 grid grid-cols-3 gap-2">
        {images.map((image) => {
          const label = image.description || "Unsplash Image";
          const isSelected = selectedImage?.id === image.id;

          return (
            <div
              key={image.id}
              className={cn(
                "group relative aspect-video bg-muted transition hover:opacity-75",
                pending && "opacity-50 hover:opacity-50",
              )}
            >
              <button
                type="button"
                disabled={pending}
                aria-label={label}
                aria-pressed={isSelected}
                className={cn(
                  "absolute inset-0 cursor-pointer rounded-sm",
                  pending && "cursor-auto",
                )}
                onClick={() => handleSelect(image)}
              >
                <Image
                  alt={label}
                  src={image.urls.thumb}
                  fill
                  className="rounded-sm object-cover"
                />
                {isSelected ? (
                  <div
                    data-testid="selected-image-check"
                    className="absolute inset-y-0 flex h-full w-full items-center justify-center bg-black/30"
                  >
                    <Check aria-hidden className="h-4 w-4 text-white" />
                  </div>
                ) : null}
              </button>
              <a
                href={image.links.html}
                target="_blank"
                rel="noreferrer"
                className="absolute bottom-0 z-10 w-full truncate bg-black/50 p-1 text-[10px] text-white opacity-0 group-hover:opacity-100 hover:underline"
              >
                {image.user.name}
              </a>
            </div>
          );
        })}
      </div>
      <FormErrors id="image" errors={errors} />
    </div>
  );
};
