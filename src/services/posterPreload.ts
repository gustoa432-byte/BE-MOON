// Lightweight Poster Preloading Service (Level 1 Lifecycle)
// Warm-caches the next 10-12 poster photographs ahead of user scroll
// Zero memory overhead (browser image cache).

const preloadedUrls = new Set<string>();

export function preloadPosters(images: string[], startIndex: number = 0, count: number = 12) {
  if (typeof window === 'undefined') return;

  const endIndex = Math.min(images.length, startIndex + count);
  for (let i = startIndex; i < endIndex; i++) {
    const url = images[i];
    if (url && !preloadedUrls.has(url)) {
      preloadedUrls.add(url);
      const img = new Image();
      img.src = url;
    }
  }
}
