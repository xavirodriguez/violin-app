/* @type {import('next').NextConfig} */
/* eslint-disable no-undef */
const nextConfig = {
  env: {
    FEATURE_PRACTICE_ADAPTIVE_DIFFICULTY: process.env.FEATURE_PRACTICE_ADAPTIVE_DIFFICULTY,
    FEATURE_AUDIO_WEB_WORKER: process.env.FEATURE_AUDIO_WEB_WORKER,
    FEATURE_UI_INTONATION_HEATMAPS: process.env.FEATURE_UI_INTONATION_HEATMAPS,
    FEATURE_SOCIAL_PRACTICE_ROOMS: process.env.FEATURE_SOCIAL_PRACTICE_ROOMS,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
