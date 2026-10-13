import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Check,
  RotateCcw,
  Sparkles,
  Pipette,
  Download,
  AlertCircle,
  Play,
  Pause,
  Upload,
  Server,
  Zap,
  Camera,
  Clock,
  CheckCircle2,
  Repeat,
  Waves,
  Film
} from 'lucide-react';
import {
  ChromaKeyOptions,
  PerformanceMode,
  DEFAULT_CHROMA_OPTIONS,
  applyChromaKeyToImageData,
  autoDetectGreenColor,
  checkAlphaVideoExportSupport,
  getOptimizedDimensions,
  rgbToHex,
  blendImageFrames,
  applyTemporalAlphaSmoothing,
  applyCinematicMotionBlur,
  applyCineBloomDiffusion
} from '../services/chromaKeyEngine';
import { isVideoMedia } from './MasterSilhouette';

interface ChromaKeyStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMediaUrl?: string;
  onApplyResult: (resultUrl: string, isVideo: boolean) => void;
  masterName?: string;
}

const COMMON_GREEN_SHADES = [
  { label: 'Классический хромакей', value: '#00FF00' },
  { label: 'Студийный зеленый', value: '#00B140' },
  { label: 'Неоновый зеленый', value: '#10B981' },
  { label: 'Яркий лайм', value: '#22C55E' },
  { label: 'Глубокий зеленый', value: '#059669' },
  { label: 'Синий хромакей', value: '#0047AB' }
];

export const ChromaKeyStudioModal: React.FC<ChromaKeyStudioModalProps> = ({
  isOpen,
  onClose,
  initialMediaUrl,
  onApplyResult,
  masterName = 'Мастер'
}) => {
  const [mediaUrl, setMediaUrl] = useState<string>(initialMediaUrl || '');
  const [options, setOptions] = useState<ChromaKeyOptions>({ ...DEFAULT_CHROMA_OPTIONS });
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>('eco');
  const [previewBg, setPreviewBg] = useState<'checker' | 'dark' | 'aura'>('checker');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isEyedropperActive, setIsEyedropperActive] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const [activeSegment, setActiveSegment] = useState<number>(0);
  const [segmentProgress, setSegmentProgress] = useState<number>(0);
  const [segmentTitle, setSegmentTitle] = useState<string>('Сегмент 1/4');
  const [showCloudPromo, setShowCloudPromo] = useState<boolean>(false);
  const [videoDuration, setVideoDuration] = useState<number>(10);
  const [exportDuration, setExportDuration] = useState<number>(10);
  const [seamlessLoop, setSeamlessLoop] = useState<boolean>(true);
  const [temporalSmoothing, setTemporalSmoothing] = useState<boolean>(true);
  const [cinematicMotionBlur, setCinematicMotionBlur] = useState<boolean>(true);
  const [cineBloom, setCineBloom] = useState<boolean>(true);
  const previewPrevAlphaRef = useRef<Uint8Array | null>(null);
  const previewPrevFrameRef = useRef<ImageData | null>(null);

  const isVideo = isVideoMedia(mediaUrl);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement | null>(null);
  const hiddenImageRef = useRef<HTMLImageElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Check device capabilities
  const exportSupport = checkAlphaVideoExportSupport();

  // Reset or initialize when opened
  useEffect(() => {
    if (isOpen) {
      if (initialMediaUrl) {
        setMediaUrl(initialMediaUrl);
      }
      setOptions({ ...DEFAULT_CHROMA_OPTIONS });
      setIsPlaying(true);
      setExportProgress(null);
      setStatusMessage(null);
      setShowCloudPromo(false);
      // Auto-set eco mode for mobile browsers
      setPerformanceMode('eco');
    }
  }, [isOpen, initialMediaUrl]);

  // Clean up animation loop when closed
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // 1. Process Static Image (Downsampled for mobile performance)
  const renderImageFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const img = hiddenImageRef.current;
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;

    const { width, height } = getOptimizedDimensions(img.naturalWidth, img.naturalHeight, performanceMode);
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(img, 0, 0, width, height);
    const imgData = ctx.getImageData(0, 0, width, height);
    applyChromaKeyToImageData(imgData, options);
    ctx.putImageData(imgData, 0, 0);
  }, [options, performanceMode]);

  useEffect(() => {
    if (!isVideo && mediaUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        hiddenImageRef.current = img;
        renderImageFrame();
      };
      img.src = mediaUrl;
    }
  }, [isVideo, mediaUrl, renderImageFrame]);

  // 2. Real-Time Video Playback with Chroma Key (Downsampled for zero lag on mobile)
  const renderVideoLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const video = hiddenVideoRef.current;
    if (!canvas || !video || video.paused || video.ended || video.videoWidth === 0) {
      animFrameRef.current = requestAnimationFrame(renderVideoLoop);
      return;
    }

    const { width, height } = getOptimizedDimensions(video.videoWidth, video.videoHeight, performanceMode);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height);
      const frameData = ctx.getImageData(0, 0, width, height);
      applyChromaKeyToImageData(frameData, options);
      if (temporalSmoothing) {
        previewPrevAlphaRef.current = applyTemporalAlphaSmoothing(frameData, previewPrevAlphaRef.current, 0.3);
      }
      if (cinematicMotionBlur && previewPrevFrameRef.current) {
        applyCinematicMotionBlur(frameData, previewPrevFrameRef.current, 0.20);
      }
      previewPrevFrameRef.current = frameData;

      ctx.putImageData(frameData, 0, 0);

      if (cineBloom) {
        applyCineBloomDiffusion(ctx, width, height, 0.15);
      }
    }

    animFrameRef.current = requestAnimationFrame(renderVideoLoop);
  }, [options, performanceMode, temporalSmoothing, cinematicMotionBlur, cineBloom]);

  useEffect(() => {
    if (isVideo && mediaUrl) {
      const video = hiddenVideoRef.current;
      if (video) {
        video.src = mediaUrl;
        video.onloadedmetadata = () => {
          const rawDur = video.duration;
          if (rawDur && isFinite(rawDur) && rawDur > 0 && rawDur !== Infinity) {
            const dur = Math.round(rawDur * 10) / 10;
            setVideoDuration(dur);
            setExportDuration(Math.min(10, dur));
          } else {
            // WebM / MediaRecorder blobs often report duration === Infinity
            // Dynamically discover exact duration by seeking to end
            try {
              video.currentTime = 1e10;
              video.ontimeupdate = function() {
                video.ontimeupdate = null;
                const realDur = video.currentTime;
                video.currentTime = 0;
                if (realDur > 0 && isFinite(realDur) && realDur < 1000) {
                  const rounded = Math.round(realDur * 10) / 10;
                  setVideoDuration(rounded);
                  setExportDuration(Math.min(10, rounded));
                }
                video.play().catch(() => {});
              };
            } catch {
              setVideoDuration(10);
              setExportDuration(10);
            }
          }
        };
        video.play().catch(() => {});
        animFrameRef.current = requestAnimationFrame(renderVideoLoop);
      }
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isVideo, mediaUrl, renderVideoLoop]);

  // Auto-detect green background
  const handleAutoDetectGreen = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 320;
    tempCanvas.height = 320;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!tempCtx) return;

    if (isVideo && hiddenVideoRef.current) {
      tempCtx.drawImage(hiddenVideoRef.current, 0, 0, 320, 320);
    } else if (hiddenImageRef.current) {
      tempCtx.drawImage(hiddenImageRef.current, 0, 0, 320, 320);
    }

    const detected = autoDetectGreenColor(tempCtx, 320, 320);
    setOptions((prev) => ({ ...prev, keyColor: detected }));
    showToast(`Определен цвет фона: ${detected}`);
  };

  // Eyedropper click on canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEyedropperActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    if (isVideo && hiddenVideoRef.current) {
      tempCtx.drawImage(hiddenVideoRef.current, 0, 0, canvas.width, canvas.height);
    } else if (hiddenImageRef.current) {
      tempCtx.drawImage(hiddenImageRef.current, 0, 0, canvas.width, canvas.height);
    }

    const pixel = tempCtx.getImageData(x, y, 1, 1).data;
    const pickedHex = rgbToHex(pixel[0], pixel[1], pixel[2]);
    setOptions((prev) => ({ ...prev, keyColor: pickedHex }));
    setIsEyedropperActive(false);
    showToast(`Выбран цвет с холста: ${pickedHex}`);
  };

  // Upload new photo or video
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setMediaUrl(url);
    setIsPlaying(true);
    showToast('Файл успешно загружен в студию хромакея');
  };

  // Quick Snapshot: Capture single frame as transparent PNG (Instant, 0% CPU strain)
  const handleCaptureSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const blobUrl = URL.createObjectURL(blob);
      onApplyResult(blobUrl, false);
      showToast('Стоп-кадр успешно сохранен как прозрачный силуэт!');
      onClose();
    }, 'image/png');
  };

  // Save for Self (Downloads file or saves local offline profile copy)
  const handleSaveForSelf = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!isVideo) {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `bemoon_silhouette_${Date.now()}.png`;
        a.click();
        showToast('Прозрачный PNG сохранен на ваше устройство!');
      }, 'image/png');
    } else {
      if (exportSupport.isSupported) {
        handleExportVideo(true);
      } else {
        // Fallback for iOS or constrained devices: save snapshot PNG to device
        canvas.toBlob((blob) => {
          if (!blob) return;
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `bemoon_snapshot_${Date.now()}.png`;
          a.click();
          showToast('Прозрачный стоп-кадр PNG сохранен на устройство!');
        }, 'image/png');
      }
    }
  };

  // Ultra-Lightweight Video Export for Mobile Devices (Frame-Accurate, Continuous Recording)
  const handleExportVideo = async (downloadOnly = false) => {
    const canvas = canvasRef.current;
    const video = hiddenVideoRef.current;
    if (!canvas || !video) return;

    if (!exportSupport.isSupported) {
      setShowCloudPromo(true);
      return;
    }

    setIsProcessing(true);
    setExportProgress(1);

    try {
      const stream = canvas.captureStream(24);
      const mime = exportSupport.mimeType || 'video/webm;codecs=vp8';
      const recorder = new MediaRecorder(stream, {
        mimeType: mime,
        videoBitsPerSecond: 1_500_000 // 1.5 Mbps is extremely lightweight & clean
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const recordedBlob = new Blob(chunks, { type: mime });
        const recordedUrl = URL.createObjectURL(recordedBlob);
        setIsProcessing(false);
        setExportProgress(null);

        if (downloadOnly) {
          const a = document.createElement('a');
          a.href = recordedUrl;
          a.download = `bemoon_avatar_${Date.now()}.webm`;
          a.click();
          showToast('Прозрачное WebM-видео успешно сохранено!');
        } else {
          onApplyResult(recordedUrl, true);
          onClose();
        }
      };

      // Rewind video and start playback
      video.currentTime = 0;
      await video.play().catch(() => {});

      // Start recording monolithically so EBML cluster timestamps are perfectly continuous
      recorder.start();

      const rawDur = video.duration;
      const naturalDuration = rawDur && isFinite(rawDur) && rawDur > 0 ? rawDur : 10;
      // Target natural duration or user selected duration (no empty looping)
      const targetDurationSec = Math.min(exportDuration, Math.max(2, naturalDuration));
      const targetDurationMs = targetDurationSec * 1000;
      const segmentDurationMs = targetDurationMs / 4;
      const startTime = performance.now();
      let isExporting = true;
      let lastFrameTimestamp = 0;
      const TARGET_FPS = 24;
      const FRAME_STEP_MS = 1000 / TARGET_FPS; // 41.6ms budget

      const segmentLabels = [
        'Сегмент 1/4 • Захват начальных кадров',
        'Сегмент 2/4 • Рендеринг движения',
        'Сегмент 3/4 • Стабилизация контура',
        'Сегмент 4/4 • Бесшовная склейка стыка'
      ];

      const { width, height } = getOptimizedDimensions(
        video.videoWidth || 640,
        video.videoHeight || 640,
        performanceMode
      );
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      let prevAlphaExport: Uint8Array | null = null;
      let exportPrevFrame: ImageData | null = null;
      let prevVideoCurrentTime = 0;
      let hasStartedPlayback = false;
      let isFinishing = false;
      const startFramesBuffer: ImageData[] = [];
      const MAX_START_FRAMES = 8;
      const crossfadeDurationMs = 200; // 0.20s crisp seamless dissolve (no ghosting)

      const finishExport = () => {
        if (isFinishing || !isExporting) return;
        isFinishing = true;
        isExporting = false;
        setActiveSegment(3);
        setSegmentProgress(100);
        setExportProgress(100);
        setSegmentTitle('Сборка и финализация видеопотока...');

        // Ensure seamless loop blend on the final recorded frame
        if (seamlessLoop && startFramesBuffer.length > 0) {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            const frameData = ctx.getImageData(0, 0, width, height);
            blendImageFrames(frameData, startFramesBuffer[0], 0.85);
            ctx.putImageData(frameData, 0, 0);
          }
        }

        if (recorder.state === 'recording') {
          recorder.stop();
        }
      };

      // Continuous 4-segment render pipeline with strict 24 FPS throttling to prevent CPU spikes
      const onFrame = () => {
        if (!isExporting || isFinishing) return;

        const now = performance.now();
        // Throttle to 24 FPS: ignore high-refresh rate (60/90/120Hz) redundant ticks
        if (now - lastFrameTimestamp < FRAME_STEP_MS - 2) {
          requestAnimationFrame(onFrame);
          return;
        }
        lastFrameTimestamp = now;

        const elapsed = now - startTime;
        const totalPct = Math.min(100, Math.round((elapsed / targetDurationMs) * 100));
        setExportProgress(totalPct);

        // 4 Segment calculation (0, 1, 2, 3)
        const segIdx = Math.min(3, Math.floor(elapsed / segmentDurationMs));
        const segElapsed = elapsed - segIdx * segmentDurationMs;
        const segPct = Math.min(100, Math.round((segElapsed / segmentDurationMs) * 100));

        setActiveSegment(segIdx);
        setSegmentProgress(segPct);
        setSegmentTitle(segmentLabels[segIdx] || 'Обработка...');

        // Finished by target duration
        if (elapsed >= targetDurationMs) {
          finishExport();
          return;
        }

        if (video.currentTime > 0.1) {
          hasStartedPlayback = true;
        }

        // 1. Natural end of video file: do NOT freeze for 7 seconds! Finish immediately!
        if (video.ended) {
          finishExport();
          return;
        }

        // 2. Full single loop detection: if video completed 1 cycle (wrapped back to 0), finish cleanly!
        if (hasStartedPlayback && prevVideoCurrentTime > 1.2 && video.currentTime < 0.4) {
          finishExport();
          return;
        }
        prevVideoCurrentTime = video.currentTime;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx && video.readyState >= 2) {
          ctx.drawImage(video, 0, 0, width, height);
          const frameData = ctx.getImageData(0, 0, width, height);
          applyChromaKeyToImageData(frameData, options);

          // 1. Temporal edge anti-jitter to eliminate noise
          if (temporalSmoothing) {
            prevAlphaExport = applyTemporalAlphaSmoothing(frameData, prevAlphaExport, 0.35);
          }

          // 2. Cinematic 180-degree Shutter Motion Blur (Perceived 60+ FPS liquid motion at 24 FPS)
          if (cinematicMotionBlur && exportPrevFrame) {
            applyCinematicMotionBlur(frameData, exportPrevFrame, 0.22);
          }
          exportPrevFrame = frameData;

          // 3. Buffer opening frames from Segment 1 for seamless loop crossfade
          if (seamlessLoop && startFramesBuffer.length < MAX_START_FRAMES && elapsed < 400) {
            startFramesBuffer.push(new ImageData(new Uint8ClampedArray(frameData.data), width, height));
          }

          // 4. Seamless crossfade dissolve in final 200ms of Segment 4 (eliminates micro-freeze / jump cut at loop point)
          if (seamlessLoop && startFramesBuffer.length > 0 && elapsed >= targetDurationMs - crossfadeDurationMs) {
            const t = Math.max(0, Math.min(1, (elapsed - (targetDurationMs - crossfadeDurationMs)) / crossfadeDurationMs));
            const targetIndex = Math.min(startFramesBuffer.length - 1, Math.floor(t * startFramesBuffer.length));
            blendImageFrames(frameData, startFramesBuffer[targetIndex], t);
          }

          ctx.putImageData(frameData, 0, 0);

          // 5. CineBloom soft edge diffusion (velvety editorial glow)
          if (cineBloom) {
            applyCineBloomDiffusion(ctx, width, height, 0.14);
          }
        }

        requestAnimationFrame(onFrame);
      };

      requestAnimationFrame(onFrame);
    } catch {
      setIsProcessing(false);
      setExportProgress(null);
      showToast('Локальное кодирование не поддерживается чипом. Доступен Стоп-кадр в PNG!');
      setShowCloudPromo(true);
    }
  };

  // Apply directly to Profile
  const handleApplyToProfile = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!isVideo) {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const resultUrl = URL.createObjectURL(blob);
        onApplyResult(resultUrl, false);
        onClose();
      }, 'image/png');
    } else {
      if (exportSupport.isSupported) {
        handleExportVideo(false);
      } else {
        // Apply original video with live client-side player
        onApplyResult(mediaUrl, true);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] h-[100dvh] w-full bg-[#0d0e12] flex flex-col overflow-hidden select-none animate-in fade-in duration-150">
      {/* Active decoding video element (kept rendered to prevent mobile browser 3s suspension) */}
      <video
        ref={hiddenVideoRef}
        muted
        playsInline
        loop
        crossOrigin="anonymous"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '16px',
          height: '16px',
          opacity: 0.01,
          pointerEvents: 'none',
          zIndex: -10
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* 1. Header (Monolithic top bar with safe-area support) */}
      <header
        style={{ paddingTop: 'max(8px, env(safe-area-inset-top, 8px))' }}
        className="flex-shrink-0 w-full border-b border-white/10 bg-neutral-950/80 backdrop-blur-md px-3 sm:px-4 pb-2 flex items-center justify-between gap-2 z-30"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex-shrink-0">
            <Sparkles size={15} />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate flex items-center gap-1.5">
              <span>Хромакей Студия</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-mono">
                100% On-Device
              </span>
            </h3>
            <p className="text-[10px] text-neutral-400 truncate">
              {isVideo ? 'Оптимизировано для мобильных устройств' : 'Быстрое удаление фона с фото'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Режим производительности (Эко / HD) */}
          <button
            type="button"
            onClick={() => setPerformanceMode(performanceMode === 'eco' ? 'hd' : 'eco')}
            className={`flex items-center gap-1 h-7 px-2 rounded-lg border text-[10px] font-semibold transition-all cursor-pointer ${
              performanceMode === 'eco'
                ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                : 'bg-white/5 border-white/10 text-neutral-300'
            }`}
            title="Переключить разрешение: Эко (быстрое) или HD"
          >
            <Zap size={11} className={performanceMode === 'eco' ? 'text-emerald-400' : 'text-neutral-400'} />
            <span>{performanceMode === 'eco' ? 'Эко ⚡' : 'HD 💎'}</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Загрузить другой файл"
            className="flex items-center gap-1 h-7 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 text-[10px] font-medium transition-colors border border-white/10 cursor-pointer"
          >
            <Upload size={11} />
            <span className="hidden sm:inline">Файл</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none cursor-pointer flex-shrink-0"
          >
            <X size={15} />
          </button>
        </div>
      </header>

      {/* Toast Feedback Notification */}
      {statusMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[120] flex items-center gap-2 rounded-2xl bg-neutral-900/95 px-3.5 py-1.5 text-xs font-medium text-white shadow-2xl border border-white/15 backdrop-blur-xl animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 2. Interactive Preview Canvas Stage */}
      <div className="relative flex-1 min-h-0 w-full overflow-hidden flex flex-col items-center justify-center p-2 select-none">
        <div
          className={`relative max-h-full max-w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center ${
            previewBg === 'checker'
              ? 'bg-[linear-gradient(45deg,#16181f_25%,transparent_25%),linear-gradient(-45deg,#16181f_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#16181f_75%),linear-gradient(-45deg,transparent_75%,#16181f_75%)] bg-[size:16px_16px] bg-[#0c0d11]'
              : previewBg === 'dark'
              ? 'bg-[#0d0e12]'
              : 'bg-[#0d0e12]'
          }`}
          style={{ width: 'min(92vw, 400px)', height: 'min(48vh, 420px)' }}
        >
          {/* Emerald Aura Backdrop */}
          {previewBg === 'aura' && (
            <div
              className="absolute top-1/3 left-1/2 -translate-x-1/2 w-44 h-44 rounded-full bg-emerald-500/35 blur-[70px] pointer-events-none animate-aura-breathe z-0"
              aria-hidden="true"
            />
          )}

          {/* Interactive Canvas */}
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className={`relative z-10 max-h-full max-w-full object-contain ${
              isEyedropperActive ? 'cursor-crosshair ring-2 ring-emerald-400' : 'cursor-default'
            }`}
          />

          {/* Video play/pause */}
          {isVideo && (
            <button
              type="button"
              onClick={() => {
                const vid = hiddenVideoRef.current;
                if (!vid) return;
                if (isPlaying) {
                  vid.pause();
                  setIsPlaying(false);
                } else {
                  vid.play();
                  setIsPlaying(true);
                }
              }}
              className="absolute bottom-2.5 left-2.5 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 backdrop-blur-md text-white/90 border border-white/15 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} className="translate-x-0.5" />}
            </button>
          )}

          {/* Quick Snapshot button for video (Instant PNG fallback on weak phones) */}
          {isVideo && (
            <button
              type="button"
              onClick={handleCaptureSnapshot}
              className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold hover:bg-emerald-500/20 active:scale-95 transition-transform cursor-pointer shadow-lg"
              title="Сделать прозрачный снимок кадра прямо сейчас (0 сек)"
            >
              <Camera size={11} />
              <span>Стоп-кадр PNG</span>
            </button>
          )}

          {/* Eyedropper indicator */}
          {isEyedropperActive && (
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-20 px-2.5 py-0.5 rounded-full bg-emerald-500 text-neutral-950 font-bold text-[10px] shadow-lg flex items-center gap-1 animate-pulse">
              <Pipette size={11} />
              <span>Нажмите на фон</span>
            </div>
          )}

          {/* Background switcher */}
          <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-0.5 p-0.5 rounded-lg bg-neutral-950/80 backdrop-blur-md border border-white/10">
            <button
              type="button"
              onClick={() => setPreviewBg('checker')}
              className={`h-5 w-5 rounded flex items-center justify-center text-[9px] ${
                previewBg === 'checker' ? 'bg-white/20 text-white font-bold' : 'text-neutral-400'
              }`}
            >
              🏁
            </button>
            <button
              type="button"
              onClick={() => setPreviewBg('dark')}
              className={`h-5 w-5 rounded flex items-center justify-center text-[9px] ${
                previewBg === 'dark' ? 'bg-white/20 text-white font-bold' : 'text-neutral-400'
              }`}
            >
              ⬛
            </button>
            <button
              type="button"
              onClick={() => setPreviewBg('aura')}
              className={`h-5 w-5 rounded flex items-center justify-center text-[9px] ${
                previewBg === 'aura' ? 'bg-emerald-500/25 text-emerald-300 font-bold' : 'text-neutral-400'
              }`}
            >
              ✨
            </button>
          </div>

          {/* Apple-grade 4-Segment Multi-Pass Progress HUD (Steve Jobs Style) */}
          {isProcessing && (
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-[340px] bg-neutral-950/90 backdrop-blur-xl px-3.5 py-2 rounded-2xl border border-emerald-500/35 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(16,185,129,0.2)] flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5 text-white font-medium truncate">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                  <span className="truncate">{segmentTitle}</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[10px] text-emerald-300 font-bold flex-shrink-0">
                  <span>{exportProgress || 0}%</span>
                </div>
              </div>

              {/* 4 Equal Segments Progress Bar */}
              <div className="grid grid-cols-4 gap-1.5 w-full">
                {[0, 1, 2, 3].map((idx) => {
                  let fill = 0;
                  if (activeSegment > idx) fill = 100;
                  else if (activeSegment === idx) fill = segmentProgress;
                  return (
                    <div
                      key={idx}
                      className="h-1.5 bg-white/10 rounded-full overflow-hidden relative"
                    >
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-75 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                        style={{ width: `${fill}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[8px] text-neutral-400 font-medium">
                <span>0s</span>
                <span>2.5s</span>
                <span>5.0s</span>
                <span>7.5s</span>
                <span className="text-emerald-300">10s (Склейка)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Bottom Controls Panel */}
      <div
        style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))' }}
        className="flex-shrink-0 w-full bg-neutral-950 border-t border-white/10 px-3 pt-2 sm:px-6 sm:pt-2.5 space-y-1.5 z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"
      >
        {/* ROW 1: ВЫБОР ЦВЕТА ХРОМАКЕЯ */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-300">
            <span className="flex items-center gap-1">
              <Pipette size={12} className="text-emerald-400" />
              <span>Цвет фона</span>
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleAutoDetectGreen}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold hover:bg-emerald-500/25 transition-colors cursor-pointer active:scale-95"
              >
                <Sparkles size={11} />
                <span>Авто-зеленый</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEyedropperActive(!isEyedropperActive)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold transition-all active:scale-95 cursor-pointer ${
                  isEyedropperActive
                    ? 'bg-emerald-500 text-neutral-950 border-emerald-400 font-bold'
                    : 'bg-white/5 border-white/10 text-neutral-300'
                }`}
              >
                <Pipette size={11} />
                <span>Пипетка</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none no-scrollbar">
              {COMMON_GREEN_SHADES.map((c) => {
                const isSelected = options.keyColor.toLowerCase() === c.value.toLowerCase();
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setOptions((prev) => ({ ...prev, keyColor: c.value }))}
                    title={c.label}
                    className={`relative flex-shrink-0 h-5 w-5 sm:h-6 sm:w-6 rounded-full transition-transform active:scale-90 cursor-pointer focus:outline-none flex items-center justify-center ${
                      isSelected
                        ? 'scale-110 ring-2 ring-emerald-400 ring-offset-2 ring-offset-neutral-950 shadow-md'
                        : 'opacity-80 ring-1 ring-white/15'
                    }`}
                    style={{ backgroundColor: c.value }}
                  >
                    {isSelected && <Check size={10} strokeWidth={3} className="text-neutral-950" />}
                  </button>
                );
              })}

              <label
                title="Свой оттенок"
                className="relative flex-shrink-0 h-5 w-5 sm:h-6 sm:w-6 rounded-full ring-1 ring-white/20 flex items-center justify-center cursor-pointer active:scale-95 ml-0.5 overflow-hidden"
                style={{ backgroundColor: options.keyColor }}
              >
                <input
                  type="color"
                  value={options.keyColor}
                  onChange={(e) => setOptions((prev) => ({ ...prev, keyColor: e.target.value }))}
                  className="opacity-0 absolute inset-0 cursor-pointer"
                />
              </label>
            </div>

            <div className="text-[10px] font-mono text-neutral-400 uppercase bg-neutral-900 px-1.5 py-0.5 rounded border border-white/10">
              {options.keyColor}
            </div>
          </div>
        </div>

        {/* ROW 2: ПОЛЗУНКИ ТОЧНОСТИ */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5">
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-[10px] font-semibold text-neutral-300">
              <span>Допуск</span>
              <span className="font-mono text-emerald-400 font-bold">{Math.round(options.tolerance * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.80"
              step="0.02"
              value={options.tolerance}
              onChange={(e) => setOptions((prev) => ({ ...prev, tolerance: parseFloat(e.target.value) }))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
            />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-[10px] font-semibold text-neutral-300">
              <span>Мягкость</span>
              <span className="font-mono text-emerald-400 font-bold">{Math.round(options.smoothness * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.30"
              step="0.01"
              value={options.smoothness}
              onChange={(e) => setOptions((prev) => ({ ...prev, smoothness: parseFloat(e.target.value) }))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
            />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-[10px] font-semibold text-neutral-300">
              <span>Ореол</span>
              <span className="font-mono text-emerald-400 font-bold">{Math.round(options.despill * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={options.despill}
              onChange={(e) => setOptions((prev) => ({ ...prev, despill: parseFloat(e.target.value) }))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
            />
          </div>
        </div>

        {/* ROW: ДЛИТЕЛЬНОСТЬ ЭКСПОРТА ВИДЕО */}
        {isVideo && (
          <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-white/5 text-[10px]">
            <span className="flex items-center gap-1 font-semibold text-neutral-300">
              <Clock size={12} className="text-emerald-400" />
              <span>Длина видео:</span>
            </span>

            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none no-scrollbar">
              {[3, 5, 10, videoDuration]
                .filter((v, i, a) => v > 0 && a.indexOf(v) === i)
                .sort((a, b) => a - b)
                .map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setExportDuration(dur)}
                    className={`px-2 py-0.5 rounded-md border font-mono font-semibold transition-all cursor-pointer ${
                      exportDuration === dur
                        ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300 shadow-sm'
                        : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {dur === videoDuration && dur >= 10 ? `Всё (${dur}с)` : `${dur}с`}
                  </button>
                ))}

              <span className="font-mono text-emerald-400 font-bold ml-1">
                {exportDuration} сек
              </span>
            </div>
          </div>
        )}

        {/* ROW: ПЛАВНОСТЬ КАДРОВ И КИНЕМАТОГРАФИЯ (APPLE / STEVE JOBS STYLE) */}
        {isVideo && (
          <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-white/5 text-[10px]">
            <span className="flex items-center gap-1 font-semibold text-neutral-300 flex-shrink-0">
              <Sparkles size={12} className="text-emerald-400" />
              <span>Шёлк:</span>
            </span>

            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none no-scrollbar">
              <button
                type="button"
                onClick={() => setCinematicMotionBlur(!cinematicMotionBlur)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  cinematicMotionBlur
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm'
                    : 'bg-white/5 border-white/10 text-neutral-400'
                }`}
                title="Кино-смаз 180°: оптический шлейф затвора, дающий эффект 60 FPS при чистых 24 кадрах без нагрузки на процессор"
              >
                <Film size={10} className={cinematicMotionBlur ? 'text-emerald-400' : 'text-neutral-400'} />
                <span>Кино-смаз</span>
              </button>

              <button
                type="button"
                onClick={() => setCineBloom(!cineBloom)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  cineBloom
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm'
                    : 'bg-white/5 border-white/10 text-neutral-400'
                }`}
                title="CineBloom: пленочная мягкая диффузия контура, скрывающая цифровую ступенчатость"
              >
                <Sparkles size={10} className={cineBloom ? 'text-emerald-400' : 'text-neutral-400'} />
                <span>Диффузия</span>
              </button>

              <button
                type="button"
                onClick={() => setSeamlessLoop(!seamlessLoop)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  seamlessLoop
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm'
                    : 'bg-white/5 border-white/10 text-neutral-400'
                }`}
                title="Плавная склейка лупа: наплыв стыка без микрофризов и скачков"
              >
                <Repeat size={10} className={seamlessLoop ? 'text-emerald-400' : 'text-neutral-400'} />
                <span>Склейка</span>
              </button>

              <button
                type="button"
                onClick={() => setTemporalSmoothing(!temporalSmoothing)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  temporalSmoothing
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm'
                    : 'bg-white/5 border-white/10 text-neutral-400'
                }`}
                title="Сглаживание контура: убирает шум и дрожание пикселей по краям силуэта"
              >
                <Waves size={10} className={temporalSmoothing ? 'text-emerald-400' : 'text-neutral-400'} />
                <span>Анти-шум</span>
              </button>
            </div>
          </div>
        )}

        {/* Info notice for mobile export */}
        {isVideo && !exportSupport.isSupported && (
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-1.5 text-[9px] text-amber-200">
            <div className="flex items-center gap-1">
              <AlertCircle size={12} className="text-amber-400 flex-shrink-0" />
              <span>iOS/Safari: доступен «Стоп-кадр PNG» или живой силуэт</span>
            </div>
            <button
              type="button"
              onClick={() => setShowCloudPromo(true)}
              className="underline text-amber-300 hover:text-white font-medium flex-shrink-0 cursor-pointer"
            >
              Облако
            </button>
          </div>
        )}

        {/* ROW 3: КНОПКИ ДЕЙСТВИЙ */}
        <div className="pt-1 border-t border-white/10 flex items-center justify-between gap-1.5">
          <button
            type="button"
            onClick={() => setOptions({ ...DEFAULT_CHROMA_OPTIONS })}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-semibold transition-colors cursor-pointer active:scale-95 flex-shrink-0"
            title="Сбросить параметры"
          >
            <RotateCcw size={11} />
            <span className="hidden sm:inline">Сброс</span>
          </button>

          <button
            type="button"
            onClick={handleSaveForSelf}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-200 text-[11px] font-semibold transition-all active:scale-95 cursor-pointer flex-shrink-0"
            title="Сохранить обработанный файл на устройство"
          >
            <Download size={12} className="text-emerald-400" />
            <span>Сохранить для себя</span>
          </button>

          <button
            type="button"
            onClick={handleApplyToProfile}
            disabled={isProcessing}
            className="flex-1 max-w-[200px] flex items-center justify-center gap-1 py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition-all active:scale-95 shadow-lg shadow-emerald-500/25 cursor-pointer disabled:opacity-50"
          >
            <Check size={14} strokeWidth={2.5} />
            <span>{isVideo ? 'Применить видео' : 'В профиль'}</span>
          </button>
        </div>
      </div>

      {/* Cloud Processing Promo Modal */}
      {showCloudPromo && (
        <div className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-white/15 p-5 space-y-3.5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <Server size={18} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">Облачная AI-обработка</h4>
                <p className="text-[10px] text-neutral-400">Для тяжелых файлов и устройств с ограничениями</p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              На мобильных устройствах экспорт тяжелого 4K/1080p видео может вызывать нагрев или не поддерживаться браузером (iOS Safari).
              <br /><br />
              <strong>Для слабых устройств доступны быстрые альтернативы:</strong>
              <br />
              1. ⚡ <strong>Эко-режим</strong>: экспорт 640px за 1–2 секунды без нагрева.
              <br />
              2. 📸 <strong>Стоп-кадр в PNG</strong>: мгновенный прозрачный аватар в 1 клик.
              <br />
              3. ☁️ <strong>Облачный GPU-рендер</strong>: серверная обработка для тяжелых видео.
            </p>

            <button
              type="button"
              onClick={() => setShowCloudPromo(false)}
              className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-colors cursor-pointer"
            >
              Использовать быстрый Эко-режим
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
