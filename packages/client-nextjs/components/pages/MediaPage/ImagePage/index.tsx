"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";

const ImagePage = () => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [memeUrl, setMemeUrl] = useState<string | null>(null);
  const [imageList, setImageList] = useState<string[]>([]);

  const fetchLogo = async () => {
    try {
      const response = await fetch("/api/v1/image/logo");
      if (response.ok && response.headers.get("Content-Type")?.includes("image/webp")) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setLogoUrl(url);
      } else {
        console.error("Unexpected response format:", await response.text());
      }
    } catch (error) {
      console.error("Error fetching logo:", error);
    }
  };

  const fetchMeme = async () => {
    try {
      const response = await fetch("/api/v1/image/meme");
      if (response.ok && response.headers.get("Content-Type")?.includes("image/webp")) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setMemeUrl(url);
      } else {
        console.error("Unexpected response format:", await response.text());
      }
    } catch (error) {
      console.error("Error fetching meme:", error);
    }
  };

  const fetchImageList = async () => {
    try {
      const response = await fetch("/api/v1/image/list");
      if (response.ok && response.headers.get("Content-Type")?.includes("application/json")) {
        const data = await response.json();
        if (data.images && Array.isArray(data.images)) {
          setImageList(data.images);
        } else {
          console.error("Unexpected image list format:", data);
        }
      } else {
        console.error("Unexpected response format:", await response.text());
      }
    } catch (error) {
      console.error("Error fetching image list:", error);
    }
  };

  return (
    <main className="bg-zinc-950">
      <div className="p-4 h-screen flex flex-col gap-4 overflow-hidden">
        <Navbar />
        <div className="max-w-screen-lg mx-auto w-full">
          <h1 className="text-5xl orbitron-500 text-zinc-50">
            Image API Demo
          </h1>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Get Logo */}
            <section className="p-4 rounded bg-zinc-900 shadow-sm space-y-4">
              <h2 className="text-xl orbitron-500 text-zinc-200">Get Logo</h2>
              <button
                onClick={fetchLogo}
                className="rounded bg-green-800 hover:bg-green-700 text-zinc-200 px-8 py-2 orbitron-500"
              >
                Fetch
              </button>
              {logoUrl && <img src={logoUrl} alt="Logo" className="max-w-full h-auto rounded" />}
            </section>

            {/* Get Meme */}
            <section className="p-4 rounded bg-zinc-900 shadow-sm space-y-4">
              <h2 className="text-xl orbitron-500 text-zinc-200">Get Meme</h2>
              <button
                onClick={fetchMeme}
                className="rounded bg-green-800 hover:bg-green-700 text-zinc-200 px-8 py-2 orbitron-500"
              >
                Fetch
              </button>
              {memeUrl && <img src={memeUrl} alt="Meme" className="max-w-full h-auto rounded" />}
            </section>

            {/* List Images */}
            <section className="p-4 rounded bg-zinc-900 shadow-sm space-y-4">
              <h2 className="text-xl orbitron-500 text-zinc-200">List Images</h2>
              <button
                onClick={fetchImageList}
                className="rounded bg-green-800 hover:bg-green-700 text-zinc-200 px-8 py-2 orbitron-500"
              >
                Fetch
              </button>
              {imageList.length > 0 && (
                <ul className="bg-gray-100 p-4 rounded text-sm space-y-2">
                  {imageList.map((image, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="text-gray-700">{image}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ImagePage;
