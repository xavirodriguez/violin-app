import type { PracticeSession } from '@/stores/analytics-store'

export async function generateAchievementImage(
  sessionData: PracticeSession,
  stars: number
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 630
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')
  const gradient = ctx.createLinearGradient(0, 0, 1200, 630)
  gradient.addColorStop(0, '#1a1a1a')
  gradient.addColorStop(1, '#3a3a3a')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1200, 630)
  ctx.beginPath()
  ctx.arc(1000, 315, 400, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(212, 165, 116, 0.05)'
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 84px Inter, sans-serif'
  ctx.fillText('Exercise Complete!', 100, 150)
  ctx.fillStyle = '#d4a574'
  ctx.font = '500 64px Inter, sans-serif'
  ctx.fillText(sessionData.exerciseName, 100, 240)
  ctx.font = '120px serif'
  const starText = '⭐'.repeat(stars)
  ctx.fillText(starText, 100, 400)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(100, 450)
  ctx.lineTo(600, 450)
  ctx.stroke()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.font = '32px Inter, sans-serif'
  ctx.fillText(`Accuracy: ${sessionData.accuracy.toFixed(1)}%`, 100, 510)
  ctx.fillText(`Duration: ${(sessionData.durationMs / 1000).toFixed(0)}s`, 100, 560)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 36px Inter, sans-serif'
  ctx.fillText('Violin Mentor', 1000, 580)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas blob generation failed'))
    }, 'image/png')
  })
}
