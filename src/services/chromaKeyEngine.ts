/**
 * BE'MOON Local Chroma Key Engine
 * 100% Client-Side Green Screen Removal for Images and Videos
 * Optimized for Mobile & Low-End Devices (Zero Lag, Low RAM, Adaptive Downsampling)
 */

export interface ChromaKeyOptions {
  keyColor: string; // Hex color e.g. '#00FF00'
  tolerance: number; // 0.05 to 0.85 (default 0.35)
  smoothness: number; // 0.01 to 0.4 (default 0.1)
  despill: number; // 0.0 to 1.0 (default 0.8)
}

export type PerformanceMode = 'eco' | 'hd';

export const DEFAULT_CHROMA_OPTIONS: ChromaKeyOptions = {
  keyColor: '#00FF00',
  tolerance: 0.36,
  smoothness: 0.12,
  despill: 0.85
};

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 0, g: 255, b: 0 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calculates downscaled dimensions to guarantee smooth performance on weak mobile GPUs/CPUs.
 * In 'eco' mode, limits max dimension to 640px (~0.3 MP instead of 12-48 MP).
 */
export function getOptimizedDimensions(
  srcWidth: number,
  srcHeight: number,
  mode: PerformanceMode = 'eco'
): { width: number; height: number; scale: number } {
  const maxDim = mode === 'eco' ? 640 : 1280;
  if (srcWidth <= maxDim && srcHeight <= maxDim) {
    return { width: Math.max(1, srcWidth), height: Math.max(1, srcHeight), scale: 1 };
  }
  const ratio = Math.min(maxDim / srcWidth, maxDim / srcHeight);
  return {
    width: Math.max(1, Math.round(srcWidth * ratio)),
    height: Math.max(1, Math.round(srcHeight * ratio)),
    scale: ratio
  };
}

/**
 * Auto-detect dominant green background color from image or video frame corners
 */
export function autoDetectGreenColor(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): string {
  try {
    const sampleSize = Math.max(4, Math.min(16, Math.floor(width / 20)));
    const tlData = ctx.getImageData(2, 2, sampleSize, sampleSize).data;
    const trData = ctx.getImageData(Math.max(0, width - sampleSize - 2), 2, sampleSize, sampleSize).data;

    let totalR = 0;
    let totalG = 0;
    let totalB = 0;
    let count = 0;

    const processSamples = (data: Uint8ClampedArray) => {
      for (let i = 0; i < data.length; i += 4) {
        totalR += data[i];
        totalG += data[i + 1];
        totalB += data[i + 2];
        count++;
      }
    };

    processSamples(tlData);
    processSamples(trData);

    if (count > 0) {
      const avgR = totalR / count;
      const avgG = totalG / count;
      const avgB = totalB / count;
      if (avgG > avgR * 1.08 && avgG > avgB * 1.08) {
        return rgbToHex(avgR, avgG, avgB);
      }
    }
  } catch {}
  return '#00FF00';
}

/**
 * High-performance CPU Chroma Keyer for Canvas 2D
 * Optimized with multiplication, precomputed constants, and green despill.
 */
export function applyChromaKeyToImageData(
  imageData: ImageData,
  options: ChromaKeyOptions
): void {
  const data = imageData.data;
  const { r: kr, g: kg, b: kb } = hexToRgb(options.keyColor);
  const tol = options.tolerance;
  const smooth = Math.max(0.001, options.smoothness);
  const despill = options.despill;
  const tolPlusSmooth = tol + smooth;
  const invSmooth = 1 / smooth;

  const len = data.length;

  for (let i = 0; i < len; i += 4) {
    const a = data[i + 3];
    if (a === 0) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Normalized color difference (multiplication is 3x faster than division)
    const dr = (r - kr) * 0.00392156862;
    const dg = (g - kg) * 0.00392156862;
    const db = (b - kb) * 0.00392156862;

    // Fast weighted perceptual distance
    const dist = Math.sqrt(dr * dr * 0.299 + dg * dg * 0.587 + db * db * 0.114);

    if (dist <= tol) {
      data[i + 3] = 0;
      continue;
    }

    let alpha = 1.0;
    if (dist < tolPlusSmooth) {
      const t = (dist - tol) * invSmooth;
      alpha = t * t * (3 - 2 * t);
    }

    // Despill: eliminate green reflection from edges
    if (despill > 0) {
      const maxRB = (r + b) * 0.5;
      if (g > maxRB) {
        data[i + 1] = Math.round(g - (g - maxRB) * despill);
      }
    }

    data[i + 3] = (a * alpha) | 0;
  }
}

/**
 * Process a static image with adaptive downsampling to prevent mobile browser crashes.
 */
export async function processImageChromaKey(
  source: string | HTMLImageElement,
  options: ChromaKeyOptions = DEFAULT_CHROMA_OPTIONS,
  mode: PerformanceMode = 'eco'
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = source instanceof HTMLImageElement ? source : new Image();
    img.crossOrigin = 'anonymous';

    const onImageLoaded = () => {
      const naturalW = img.naturalWidth || img.width;
      const naturalH = img.naturalHeight || img.height;
      const { width, height } = getOptimizedDimensions(naturalW, naturalH, mode);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const imgData = ctx.getImageData(0, 0, width, height);
      applyChromaKeyToImageData(imgData, options);
      ctx.putImageData(imgData, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Blob creation failed'));
            return;
          }
          const dataUrl = canvas.toDataURL('image/png');
          resolve({ blob, dataUrl, width, height });
        },
        'image/png',
        0.95
      );
    };

    if (source instanceof HTMLImageElement && source.complete) {
      onImageLoaded();
    } else if (typeof source === 'string') {
      img.onload = onImageLoaded;
      img.onerror = () => reject(new Error('Failed to load image for chroma key'));
      img.src = source;
    } else {
      img.onload = onImageLoaded;
    }
  });
}

/**
 * Checks device capability for WebM alpha recording.
 */
/**
 * Linearly blends current frame with a target frame for seamless loop crossfades.
 * t ranges from 0.0 (100% current) to 1.0 (100% target).
 */
export function blendImageFrames(
  current: ImageData,
  target: ImageData,
  t: number
): void {
  const cData = current.data;
  const tData = target.data;
  const len = Math.min(cData.length, tData.length);
  const clampedT = Math.max(0, Math.min(1, t));
  const invT = 1 - clampedT;

  for (let i = 0; i < len; i += 4) {
    const a1 = cData[i + 3];
    const a2 = tData[i + 3];
    cData[i] = (cData[i] * invT + tData[i] * clampedT) | 0;
    cData[i + 1] = (cData[i + 1] * invT + tData[i + 1] * clampedT) | 0;
    cData[i + 2] = (cData[i + 2] * invT + tData[i + 2] * clampedT) | 0;
    cData[i + 3] = (a1 * invT + a2 * clampedT) | 0;
  }
}

/**
 * Smooths alpha values between consecutive video frames to prevent edge flickering / jitter.
 */
export function applyTemporalAlphaSmoothing(
  current: ImageData,
  prevAlpha: Uint8Array | null,
  blendFactor: number = 0.35
): Uint8Array {
  const data = current.data;
  const len = data.length;
  const pixelCount = len >> 2;
  const newAlpha = new Uint8Array(pixelCount);

  if (!prevAlpha || prevAlpha.length !== pixelCount) {
    for (let p = 0; p < pixelCount; p++) {
      newAlpha[p] = data[(p << 2) + 3];
    }
    return newAlpha;
  }

  const invB = 1 - blendFactor;
  for (let p = 0; p < pixelCount; p++) {
    const idx = (p << 2) + 3;
    const a = data[idx];
    const pa = prevAlpha[p];
    // Smooth transitional edge pixels (0 < a < 255) to keep silhouette crisp
    if (a > 0 && a < 255) {
      const smoothed = (a * invB + pa * blendFactor) | 0;
      data[idx] = smoothed;
      newAlpha[p] = smoothed;
    } else {
      newAlpha[p] = a;
    }
  }

  return newAlpha;
}

/**
 * Applies cinematic 180-degree shutter motion blur between consecutive frames.
 * Keeps frame count at 24 FPS while giving the human visual perception of 60+ FPS liquid motion.
 * Steve Jobs / Cinema hack: the human eye perceives temporal shutter blur trails as organic continuous movement.
 */
export function applyCinematicMotionBlur(
  current: ImageData,
  prevFrame: ImageData | null,
  shutterAmount: number = 0.22 // 180-degree shutter angle
): void {
  if (!prevFrame) return;
  const cData = current.data;
  const pData = prevFrame.data;
  const len = Math.min(cData.length, pData.length);
  const curWeight = 1 - shutterAmount;

  for (let i = 0; i < len; i += 4) {
    const ca = cData[i + 3];
    const pa = pData[i + 3];

    if (ca > 0 || pa > 0) {
      cData[i] = (cData[i] * curWeight + pData[i] * shutterAmount) | 0;
      cData[i + 1] = (cData[i + 1] * curWeight + pData[i + 1] * shutterAmount) | 0;
      cData[i + 2] = (cData[i + 2] * curWeight + pData[i + 2] * shutterAmount) | 0;
      cData[i + 3] = Math.max(ca, (ca * curWeight + pa * shutterAmount) | 0);
    }
  }
}

/**
 * Applies luxurious Pro-Mist / CineBloom soft diffusion to the canvas.
 * Transforms digital stepping into a dreamy, velvety cinematic fashion portrait.
 */
export function applyCineBloomDiffusion(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number = 0.16
): void {
  if (intensity <= 0) return;
  try {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.filter = 'blur(4px)';
    ctx.globalAlpha = intensity;
    ctx.drawImage(ctx.canvas, 0, 0, width, height);
    ctx.restore();
  } catch {
    // Graceful fallback if filter is not supported
  }
}


/**
 * Checks device capability for WebM alpha recording.
 */
export function checkAlphaVideoExportSupport(): {
  isSupported: boolean;
  mimeType: string;
  isIOS: boolean;
  isWeakDevice: boolean;
  notes: string;
} {
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const isWeakDevice = hardwareConcurrency <= 4;

  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return {
      isSupported: false,
      mimeType: '',
      isIOS,
      isWeakDevice,
      notes: 'MediaRecorder API не поддерживается данным браузером.'
    };
  }

  const candidateMimes = [
    'video/webm;codecs=vp8',
    'video/webm;codecs=vp9',
    'video/webm'
  ];

  for (const mime of candidateMimes) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return {
        isSupported: true,
        mimeType: mime,
        isIOS,
        isWeakDevice,
        notes: isIOS
          ? 'iOS Safari поддерживает только MP4 без альфа-канала при экспорте.'
          : 'Аппаратный экспорт прозрачного WebM поддерживается!'
      };
    }
  }

  return {
    isSupported: false,
    mimeType: '',
    isIOS,
    isWeakDevice,
    notes: isIOS
      ? 'iOS Safari не поддерживает экспорт WebM с прозрачностью. Доступно живое воспроизведение в реальном времени или облачная обработка.'
      : 'Формат прозрачного видео не поддерживается браузером.'
  };
}
