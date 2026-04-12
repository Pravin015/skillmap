"use client";
import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";

const syne = "font-[family-name:var(--font-syne)]";

interface Props {
  onCropped: (base64: string) => void;
  onCancel: () => void;
  imageSrc: string;
}

export default function PhotoCropper({ onCropped, onCancel, imageSrc }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  async function handleSave() {
    if (!croppedArea) return;

    const canvas = document.createElement("canvas");
    const img = new Image();
    img.src = imageSrc;

    await new Promise<void>((resolve) => {
      img.onload = () => {
        const size = 300; // output size
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(
          img,
          croppedArea.x, croppedArea.y, croppedArea.width, croppedArea.height,
          0, 0, size, size
        );

        const base64 = canvas.toDataURL("image/jpeg", 0.85);
        onCropped(base64);
        resolve();
      };
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="w-full max-w-md mx-4 rounded-2xl bg-white overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h3 className={`${syne} font-bold text-base`}>Adjust Photo</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Drag to reposition, scroll to zoom</p>
        </div>

        <div className="relative h-72" style={{ background: "#111" }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Zoom slider */}
        <div className="px-5 py-3 flex items-center gap-3">
          <span className="text-xs" style={{ color: "var(--muted)" }}>−</span>
          <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-[var(--ink)]" />
          <span className="text-xs" style={{ color: "var(--muted)" }}>+</span>
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button onClick={handleSave} className={`flex-1 py-2.5 rounded-xl ${syne} font-bold text-sm`} style={{ background: "var(--ink)", color: "var(--accent)" }}>Save Photo</button>
          <button onClick={onCancel} className={`flex-1 py-2.5 rounded-xl ${syne} font-bold text-sm border`} style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
