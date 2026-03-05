/**
 * Converts an SVG chart <img> element to PNG and shares/downloads it.
 */
export async function shareChartImage(imgEl: HTMLImageElement, pairName: string): Promise<void> {
  const canvas = document.createElement('canvas');
  const scale = 2; // retina quality
  canvas.width = imgEl.naturalWidth * scale || 1200;
  canvas.height = imgEl.naturalHeight * scale || 600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Draw white/dark background
  ctx.fillStyle = '#050d1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Wait for image to load if needed
  if (!imgEl.complete) {
    await new Promise<void>((resolve) => {
      imgEl.onload = () => resolve();
      imgEl.onerror = () => resolve();
    });
  }

  ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);

  // Add watermark
  ctx.font = `${14 * scale}px monospace`;
  ctx.fillStyle = 'rgba(100, 180, 255, 0.4)';
  ctx.textAlign = 'right';
  ctx.fillText('Coins Signals', canvas.width - 16, canvas.height - 12);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png', 0.95)
  );
  if (!blob) return;

  const fileName = `${pairName.replace(/[^a-zA-Z0-9]/g, '-')}-chart.png`;

  // Try Web Share API first (mobile)
  if (navigator.share && navigator.canShare) {
    const file = new File([blob], fileName, { type: 'image/png' });
    const shareData = {
      title: `${pairName} - Señal de Trading`,
      text: `Gráfico de ${pairName} | Coins Signals`,
      files: [file],
    };
    if (navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled or error, fall through to download
      }
    }
  }

  // Fallback: download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
