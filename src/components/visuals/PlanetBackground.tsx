"use client";

import { useEffect, useState } from "react";

export default function PlanetBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large Floating Orbs - using your CSS classes */}
      <div className="floating-orb w-64 h-64 top-10 left-10"></div>
      <div className="floating-orb w-48 h-48 top-1/3 right-20"></div>
      <div className="floating-orb w-32 h-32 bottom-20 left-1/4"></div>
      <div className="floating-orb w-56 h-56 bottom-10 right-10"></div>

      {/* Medium Floating Elements */}
      <div className="floating-orb w-24 h-24 top-1/2 left-1/2"></div>
      <div className="floating-orb w-20 h-20 top-20 right-1/3"></div>
      <div className="floating-orb w-28 h-28 bottom-1/3 left-20"></div>

      {/* Small Ambient Dots */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-white/10 rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${6 + Math.random() * 4}s`
          }}
        />
      ))}

      {/* Ripple Effects */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32">
        <div className="ripple w-full h-full"></div>
        <div
          className="ripple w-full h-full"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="ripple w-full h-full"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="absolute bottom-1/4 right-1/4 w-24 h-24">
        <div
          className="ripple w-full h-full"
          style={{ animationDelay: "0.5s" }}
        ></div>
        <div
          className="ripple w-full h-full"
          style={{ animationDelay: "1.5s" }}
        ></div>
      </div>
    </div>
  );
}
