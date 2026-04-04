import type { PracticeSession } from '@/stores/analytics-store'

/**
 * Generates a shareable image for exercise completion.
 * Decomposed into focused helpers for Senior Software Craftsmanship.
 */
export async function generateAchievementImage(
  sessionData: PracticeSession,
  stars: number,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 630
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  drawBackground(ctx)
  drawMainContent(ctx, sessionData.exerciseName, stars)
  drawStats(ctx, sessionData)
  drawFooter(ctx)

  return convertToBlob(canvas)
}

function drawBackground(ctx: CanvasRenderingContext2D): void {
  const gradient = ctx.createLinearGradient(0, 0, 1200, 630)
  gradient.addColorStop(0, '#1a1a1a')
  gradient.addColorStop(1, '#3a3a3a')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1200, 630)

  ctx.beginPath()
  ctx.arc(1000, 315, 400, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(212, 165, 116, 0.05)'
  ctx.fill()
}

function drawMainContent(ctx: CanvasRenderingContext2D, name: string, stars: number): void {
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 84px Inter, sans-serif'
  ctx.fillText('Exercise Complete!', 100, 150)

  ctx.fillStyle = '#d4a574'
  ctx.font = '500 64px Inter, sans-serif'
  ctx.fillText(name, 100, 240)

  ctx.font = '120px serif'
  const starText = '⭐'.repeat(stars)
  ctx.fillText(starText, 100, 400)
}

function drawStats(ctx: CanvasRenderingContext2D, session: PracticeSession): void {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(100, 450)
  ctx.lineTo(600, 450)
  ctx.stroke()

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.font = '32px Inter, sans-serif'
  ctx.fillText(`Accuracy: ${session.accuracy.toFixed(1)}%`, 100, 510)
  ctx.fillText(`Duration: ${(session.durationMs / 1000).toFixed(0)}s`, 100, 560)
}

function drawFooter(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 36px Inter, sans-serif'
  ctx.fillText('Violin Mentor', 1000, 580)
}

function convertToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Canvas blob generation failed'))
      }
    }, 'image/png')
  })
}
