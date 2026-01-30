"use client";

import { useEffect } from "react";

type Props = {
  adKey: string;
  width: number;
  height: number;
};

export default function AdsterraBanner({ adKey, width, height }: Props) {
  useEffect(() => {
    const script1 = document.createElement("script");
    script1.type = "text/javascript";
    script1.innerHTML = `
      atOptions = {
        'key': '${adKey}',
        'format': 'iframe',
        'height': ${height},
        'width': ${width},
        'params': {}
      };
    `;

    const script2 = document.createElement("script");
    script2.type = "text/javascript";
    script2.src = `//www.highperformanceformat.com/${adKey}/invoke.js`;

    const container = document.getElementById(`ad-${adKey}`);
    if (container && container.childNodes.length === 0) {
      container.appendChild(script1);
      container.appendChild(script2);
    }
  }, [adKey, width, height]);

  return (
    <div
      id={`ad-${adKey}`}
      className="flex justify-center items-center my-6"
      style={{ minWidth: width, minHeight: height }}
    />
  );
}