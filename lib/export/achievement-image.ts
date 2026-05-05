import { CompletedPracticeSession } from '@/lib/domain/practice'

/**
 * AchievementImageService
 *
 * Generates a shareable image for practice achievements using the Canvas API.
 */
export class AchievementImageService {
  static async generateAchievementImage(session: CompletedPracticeSession, stars: number): Promise<string> {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get canvas context')

    canvas.width = 1200
    canvas.height = 630 // Standard OG image size

    // 1. Background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#1a1208') // Dark ink
    gradient.addColorStop(1, '#2d1f0d')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 2. Decorative pattern (violin-inspired f-hole silhouette approach)
    ctx.strokeStyle = 'rgba(200, 130, 10, 0.1)'
    ctx.lineWidth = 2
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, canvas.height)
      ctx.stroke()
    }

    // 3. Branding
    ctx.fillStyle = '#c8820a' // Amber
    ctx.font = 'bold 32px sans-serif'
    ctx.fillText('VIOLIN MENTOR · ACHIEVEMENT', 60, 80)

    // 4. Main Title
    ctx.fillStyle = '#f5f0e8' // Parchment
    ctx.font = '700 80px serif'
    ctx.fillText(session.exerciseName, 60, 200)

    // 5. Stars
    ctx.font = '80px serif'
    const starText = '★'.repeat(stars) + '☆'.repeat(3 - stars)
    ctx.fillStyle = '#e8a020'
    ctx.fillText(starText, 60, 300)

    // 6. Accuracy Metric
    const accuracy = Math.round(session.accuracy)
    ctx.fillStyle = accuracy > 85 ? '#6a8f62' : accuracy > 70 ? '#c8820a' : '#c45a2a'
    ctx.font = 'bold 160px sans-serif'
    ctx.fillText(`${accuracy}%`, 60, 480)

    ctx.fillStyle = '#7a6e5e' // Muted
    ctx.font = '32px sans-serif'
    ctx.fillText('PRECISION SCORE', 60, 530)

    // 7. Secondary Stats
    ctx.fillStyle = '#f5f0e8'
    ctx.font = 'bold 40px sans-serif'
    const duration = Math.round(session.durationMs / 1000)
    ctx.fillText(`${duration}s`, 600, 430)
    ctx.font = '24px sans-serif'
    ctx.fillStyle = '#7a6e5e'
    ctx.fillText('PRACTICE TIME', 600, 470)

    // 8. Footer
    ctx.fillStyle = 'rgba(200, 130, 10, 0.5)'
    ctx.font = '20px monospace'
    ctx.fillText('PROUDLY PRACTICED WITH AI MENTORSHIP', 60, 590)

    return canvas.toDataURL('image/png')
  }

  static async share(session: CompletedPracticeSession, stars: number) {
    try {
      const dataUrl = await this.generateAchievementImage(session, stars)

      if (navigator.share) {
        const response = await fetch(dataUrl)
        const blob = await response.blob()
        const file = new File([blob], 'achievement.png', { type: 'image/png' })

        await navigator.share({
          title: `My Violin Progress: ${session.exerciseName}`,
          text: `I just achieved ${Math.round(session.accuracy)}% accuracy on ${session.exerciseName}!`,
          files: [file]
        })
      } else {
        // Fallback: Download
        const link = document.createElement('a')
        link.download = `violin-achievement-${session.exerciseId}.png`
        link.href = dataUrl
        link.click()
      }
    } catch (err) {
      console.error('Sharing failed', err)
      // Final fallback: just download if navigator.share failed
      const dataUrl = await this.generateAchievementImage(session, stars)
      const link = document.createElement('a')
      link.download = `violin-achievement-${session.exerciseId}.png`
      link.href = dataUrl
      link.click()
    }
  }
}
