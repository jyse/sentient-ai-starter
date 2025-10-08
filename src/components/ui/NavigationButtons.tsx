"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";

interface NavigationButtonsProps {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  disabled?: boolean;
}

export default function NavigationButtons({
  onBack,
  onNext,
  nextLabel = "Continue",
  backLabel = "Back",
  disabled = false
}: NavigationButtonsProps) {
  return (
    <div className="flex items-center justify-between w-full ">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> {backLabel}
      </button>

      <button
        onClick={!disabled ? onNext : undefined}
        disabled={disabled}
        className={`flex items-center gap-2 px-6 py-2 rounded-xl font-medium shadow-lg transition-all duration-300
          ${
            disabled
              ? "bg-gray-700/40 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          }`}
      >
        {nextLabel}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
