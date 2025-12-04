/**
 * Image compression utility
 * Compresses images before upload to improve performance and reduce storage costs
 * Requirement: Performance optimization - compress images before upload
 */

import imageCompression from 'browser-image-compression'

/**
 * Compression options for avatar images
 */
const COMPRESSION_OPTIONS = {
  maxSizeMB: 1, // Maximum file size in MB
  maxWidthOrHeight: 1024, // Maximum width or height in pixels
  useWebWorker: true, // Use web worker for better performance
  fileType: 'image/jpeg', // Convert to JPEG for better compression
}

/**
 * Compress an image file before upload
 * 
 * @param file - The image file to compress
 * @returns Promise<File> - The compressed image file
 * 
 * @example
 * const compressedFile = await compressImage(originalFile)
 * // Upload compressedFile instead of originalFile
 */
export async function compressImage(file: File): Promise<File> {
  try {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      throw new Error('File is not an image')
    }

    // If file is already small enough, return it as-is
    if (file.size <= 1024 * 1024) {
      // Less than 1MB
      return file
    }

    // Compress the image
    const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS)

    // Return compressed file with original name
    return new File([compressedFile], file.name, {
      type: compressedFile.type,
      lastModified: Date.now(),
    })
  } catch (error) {
    console.error('Error compressing image:', error)
    // If compression fails, return original file
    return file
  }
}

/**
 * Get compression statistics
 * Useful for showing users how much space was saved
 * 
 * @param originalSize - Original file size in bytes
 * @param compressedSize - Compressed file size in bytes
 * @returns Object with compression statistics
 */
export function getCompressionStats(originalSize: number, compressedSize: number) {
  const savedBytes = originalSize - compressedSize
  const savedPercentage = ((savedBytes / originalSize) * 100).toFixed(1)

  return {
    originalSize,
    compressedSize,
    savedBytes,
    savedPercentage: parseFloat(savedPercentage),
    compressionRatio: (originalSize / compressedSize).toFixed(2),
  }
}

/**
 * Format file size for display
 * 
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
