import { useState, useCallback } from 'react';

interface CameraResult {
  dataUrl: string;
  blob: Blob;
  filename: string;
}

/**
 * Hook para captura de câmera.
 * Web usa getUserMedia. Capacitor Camera será integrado quando wrapper nativo estiver pronto.
 */
export function useCamera() {
  const [capturing, setCapturing] = useState(false);

  const capture = useCallback(async (filename = 'photo.jpg'): Promise<CameraResult | null> => {
    setCapturing(true);
    try {
      // Web API: abre câmera traseira por padrão
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      await video.play();

      // Aguarda frame estabilizar
      await new Promise(r => setTimeout(r, 200));

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0);

      stream.getTracks().forEach(t => t.stop());

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.85);
      });

      return { dataUrl, blob, filename };
    } catch {
      return null;
    } finally {
      setCapturing(false);
    }
  }, []);

  return { capture, capturing };
}
