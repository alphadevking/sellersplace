"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { uploadProductImage } from "@/app/actions/admin";

/** Product image list: paste links directly, or upload a file (goes to Cloudinary). */
export default function ImagesField({ defaultValue }: { defaultValue: string }) {
  const [urls, setUrls] = useState<string[]>(
    defaultValue
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
  );
  const [linkInput, setLinkInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isUploading, startUpload] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addUrl(url: string) {
    const trimmed = url.trim();
    if (!trimmed) return;
    setUrls((prev) => [...prev, trimmed]);
  }

  function removeUrl(index: number) {
    setUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    startUpload(async () => {
      const result = await uploadProductImage(fd);
      if ("error" in result) setError(result.error);
      else addUrl(result.url);
    });
  }

  return (
    <div className="field-label">
      <span>Images</span>

      <input type="hidden" name="images" value={urls.join("\n")} />

      {urls.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {urls.map((url, index) => (
            <li key={`${url}-${index}`} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="h-20 w-full rounded-md border object-cover"
                style={{ borderColor: "var(--border)" }}
              />
              <button
                type="button"
                onClick={() => removeUrl(index)}
                aria-label="Remove image"
                className="absolute -right-1.5 -top-1.5 rounded-full bg-black/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="url"
          value={linkInput}
          onChange={(e) => setLinkInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addUrl(linkInput);
              setLinkInput("");
            }
          }}
          placeholder="Paste an image URL"
          className="input-field flex-1"
        />
        <button
          type="button"
          onClick={() => {
            addUrl(linkInput);
            setLinkInput("");
          }}
          className="btn-ghost px-3 py-2 text-xs"
        >
          Add link
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="btn-ghost px-3 py-2 text-xs disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {isUploading ? "Uploading…" : "Upload image"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
