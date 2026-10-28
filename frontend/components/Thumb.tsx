"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { productsApi } from "@/lib/api/products";

function gradientIndex(id: string) {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash + id.charCodeAt(index) * (index + 1)) % 6;
  }
  return hash;
}

interface ThumbProps {
  id: string;
  photo: string | null;
  alt: string;
  className?: string;
  roundedClass?: string;
  openPdf?: boolean;
  showPdfTag?: boolean;
}

export function Thumb({
  id,
  photo,
  alt,
  className = "h-12 w-12",
  roundedClass = "rounded-2xl",
  openPdf = false,
  showPdfTag = true,
}: ThumbProps) {
  const [brokenPhoto, setBrokenPhoto] = useState<string | null>(null);
  const broken = photo !== null && brokenPhoto === photo;

  const { data: kind, isError } = useQuery({
    queryKey: ["photo-kind", photo],
    queryFn: () => productsApi.photoKind(photo as string),
    enabled: Boolean(photo),
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });

  const gradient = `thumb-${gradientIndex(id)}`;
  const baseClass = `relative overflow-hidden ${roundedClass} ${className}`;

  if (!photo) {
    return <div className={`${baseClass} ${gradient}`} aria-hidden="true" />;
  }

  if (kind === "pdf") {
    const content = (
      <div
        className={`${baseClass} ${gradient} flex items-center justify-center`}
      >
        {showPdfTag ? (
          <span className="rounded-full bg-ink/85 px-2.5 py-1 text-xs font-bold text-white">
            PDF
          </span>
        ) : null}
      </div>
    );

    if (openPdf) {
      return (
        <a
          href={photo}
          target="_blank"
          rel="noreferrer"
          aria-label={`Abrir PDF de ${alt}`}
          className="block h-full w-full"
        >
          {content}
        </a>
      );
    }

    return content;
  }

  if ((kind === "image" || kind === "other" || isError) && !broken) {
    return (
      <div className={baseClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo}
          alt={alt}
          loading="lazy"
          onError={() => setBrokenPhoto(photo)}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return <div className={`${baseClass} ${gradient}`} aria-hidden="true" />;
}
