export const EMOTIONAL_JOURNEY_MAP: Record<string, string[]> = {
  // High frequency, negative → reduce arousal to low arousal, positive
  anxious: ["calm", "grounded", "peaceful"],
  worried: ["calm", "accepting", "peaceful"],
  stressed: ["relaxed", "calm", "peaceful"],

  // High frequency, negative → reduce intensity OR shift valence
  angry: ["calm", "accepting", "peaceful"],
  frustrated: ["patient", "calm", "accepting"],
  irritated: ["calm", "patient", "accepting"],

  // Low frequency, negative → shift valence to positive
  sad: ["accepting", "content", "peaceful"],
  depressed: ["accepting", "hopeful", "calm"],
  lonely: ["connected", "accepting", "peaceful"],

  // Mid-range states can move multiple directions
  bored: ["curious", "interested", "content"],
  confused: ["clear", "focused", "understanding"],
  tired: ["rested", "peaceful", "calm"],

  // Already positive states
  content: ["grateful", "joyful", "energized"],
  calm: ["peaceful", "grateful", "content"],
  happy: ["joyful", "grateful", "energized"]
};

export function getDestinationEmotionsFrom(
  startingEmotion: string | null
): string[] {
  if (!startingEmotion) return ["calm", "peaceful", "content"];
  return (
    EMOTIONAL_JOURNEY_MAP[startingEmotion.toLowerCase()] || [
      "calm",
      "peaceful",
      "content"
    ]
  );
}

export const EMOTION_DISPLAY: Record<
  string,
  {
    label: string;
    description: string;
    emoji: string;
    color: string;
  }
> = {
  // Calming & Grounding States
  calm: {
    label: "Calm",
    description: "Peace and serenity",
    emoji: "🌿",
    color: "bg-teal-600"
  },
  peaceful: {
    label: "Peaceful",
    description: "Inner stillness",
    emoji: "☮️",
    color: "bg-blue-600"
  },
  grounded: {
    label: "Grounded",
    description: "Centered and stable",
    emoji: "🌱",
    color: "bg-green-700"
  },
  relaxed: {
    label: "Relaxed",
    description: "Ease and comfort",
    emoji: "😌",
    color: "bg-cyan-600"
  },
  rested: {
    label: "Rested",
    description: "Refreshed and renewed",
    emoji: "🛏️",
    color: "bg-indigo-600"
  },

  // Accepting & Patient States
  accepting: {
    label: "Accepting",
    description: "Allowing what is",
    emoji: "🤲",
    color: "bg-amber-600"
  },
  patient: {
    label: "Patient",
    description: "Steady and calm",
    emoji: "🐢",
    color: "bg-yellow-600"
  },
  content: {
    label: "Content",
    description: "Gentle satisfaction",
    emoji: "😊",
    color: "bg-orange-600"
  },

  // Hopeful & Connected States
  hopeful: {
    label: "Hopeful",
    description: "Looking forward",
    emoji: "🌈",
    color: "bg-sky-500"
  },
  connected: {
    label: "Connected",
    description: "In touch with others",
    emoji: "🤝",
    color: "bg-rose-500"
  },
  grateful: {
    label: "Grateful",
    description: "Appreciating what is",
    emoji: "🙏",
    color: "bg-pink-600"
  },

  // Clear & Focused States
  clear: {
    label: "Clear",
    description: "Mental clarity",
    emoji: "💎",
    color: "bg-blue-400"
  },
  focused: {
    label: "Focused",
    description: "Sharp and attentive",
    emoji: "🎯",
    color: "bg-violet-600"
  },
  understanding: {
    label: "Understanding",
    description: "Seeing with insight",
    emoji: "💡",
    color: "bg-amber-500"
  },

  // Curious & Engaged States
  curious: {
    label: "Curious",
    description: "Open to discovery",
    emoji: "🪶",
    color: "bg-indigo-500"
  },
  interested: {
    label: "Interested",
    description: "Engaged and attentive",
    emoji: "👀",
    color: "bg-purple-500"
  },

  // Joyful & Energized States
  joyful: {
    label: "Joyful",
    description: "Light and radiant",
    emoji: "☀️",
    color: "bg-yellow-400"
  },
  energized: {
    label: "Energized",
    description: "Alive and vibrant",
    emoji: "⚡",
    color: "bg-lime-500"
  }
};

export function getEmotionMetadata(emotionName: string) {
  return (
    EMOTION_DISPLAY[emotionName] || {
      label: emotionName,
      description: "Finding balance",
      emoji: "✨",
      color: "bg-purple-600"
    }
  );
}
