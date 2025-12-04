/**
 * Tests for image compression utility
 */

import { describe, it, expect } from 'vitest'
import { formatFileSize, getCompressionStats } from './imageCompression'

describe('Image Compression Utilities', () => {
  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(1536 * 1024)).toBe('1.5 MB')
      expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB')
    })
  })

  describe('getCompressionStats', () => {
    it('should calculate compression statistics correctly', () => {
      const originalSize = 5 * 1024 * 1024 // 5MB
      const compressedSize = 1 * 1024 * 1024 // 1MB

      const stats = getCompressionStats(originalSize, compressedSize)

      expect(stats.originalSize).toBe(originalSize)
      expect(stats.compressedSize).toBe(compressedSize)
      expect(stats.savedBytes).toBe(4 * 1024 * 1024)
      expect(stats.savedPercentage).toBe(80)
      expect(parseFloat(stats.compressionRatio)).toBeCloseTo(5, 1)
    })

    it('should handle no compression case', () => {
      const size = 1024 * 1024
      const stats = getCompressionStats(size, size)

      expect(stats.savedBytes).toBe(0)
      expect(stats.savedPercentage).toBe(0)
      expect(stats.compressionRatio).toBe('1.00')
    })
  })
})
