/* @type {import('next').NextConfig} */
/* eslint-disable no-undef */
const nextConfig = {
  env: {
    FEATURE_UI_VIOLIN_FINGERBOARD: process.env.FEATURE_UI_VIOLIN_FINGERBOARD,
    FEATURE_ANALYTICS_DASHBOARD: process.env.FEATURE_ANALYTICS_DASHBOARD,
    FEATURE_PRACTICE_ADAPTIVE_DIFFICULTY: process.env.FEATURE_PRACTICE_ADAPTIVE_DIFFICULTY,
    FEATURE_AUDIO_WEB_WORKER: process.env.FEATURE_AUDIO_WEB_WORKER,
    FEATURE_UI_INTONATION_HEATMAPS: process.env.FEATURE_UI_INTONATION_HEATMAPS,
    FEATURE_PRACTICE_ASSISTANT: process.env.FEATURE_PRACTICE_ASSISTANT,
    FEATURE_TECHNICAL_FEEDBACK: process.env.FEATURE_TECHNICAL_FEEDBACK,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
