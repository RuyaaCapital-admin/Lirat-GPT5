export const chatkitOptions = {
  theme: {
    colorScheme: "dark" as const,
    radius: "pill" as const,
    density: "compact" as const,
    typography: {
      fontFamily: "system-ui, -apple-system, sans-serif",
    },
  },
  composer: {
    attachments: {
      enabled: true,
    },
  },
  startScreen: {
    greeting: "What can I help with today?",
    prompts: [
      { label: "Analyze current market trends", prompt: "Analyze current market trends" },
      { label: "What's the outlook for gold?", prompt: "What's the outlook for gold?" },
      { label: "Help me understand risk management", prompt: "Help me understand risk management" },
      { label: "Explain technical indicators", prompt: "Explain technical indicators" },
    ],
  },
} as const

