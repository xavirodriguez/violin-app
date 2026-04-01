/* @type {import('next').NextConfig} */
/* eslint-disable no-undef */
const nextConfig = {
  env: {
    FEATURE_AUDIO_WEB_WORKER: process.env.FEATURE_AUDIO_WEB_WORKER,
    FEATURE_SOCIAL_PRACTICE_ROOMS: process.env.FEATURE_SOCIAL_PRACTICE_ROOMS,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    allowedRevalidateHeaderKeys: ['host'],
  },
  serverExternalPackages: [],
}

export default nextConfig
