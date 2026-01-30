"use client";
import { useEffect, useRef } from "react";

interface AdsterraBannerProps {
  adKey: string;
  width: number;
  height: number;
}

export default function AdsterraBanner({ adKey, width, height }: AdsterraBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Remove old ad if exists
    containerRef.current.innerHTML = "";

    // Create script element
    const script = document.createElement("script");
    script.src = `https://www.highperformanceformat.com/${adKey}/invoke.js`;
    script.async = true;

    // Create container div for Adsterra iframe
    const adDiv = document.createElement("div");
    adDiv.style.width = `${width}px`;
    adDiv.style.height = `${height}px`;

    containerRef.current.appendChild(adDiv);
    containerRef.current.appendChild(script);

    return () => {
      // Cleanup
      containerRef.current?.removeChild(script);
      containerRef.current?.removeChild(adDiv);
    };
  }, [adKey, width, height]);

  return <div ref={containerRef} className="flex justify-center" />;
}
