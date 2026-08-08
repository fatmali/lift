import { useEffect, useState } from 'react';
import { getPhoto } from '../store/storage';

/** Loads a blob from IndexedDB. Images never leave the device. */
export function PhotoImage({ blobKey, alt }: { blobKey: string; alt: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let revoked = false;
    let objectUrl: string | null = null;
    void getPhoto(blobKey).then((blob) => {
      if (!blob || revoked) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [blobKey]);

  if (!url) return <div style={{ width: '100%', height: '100%', background: 'var(--surface-2)' }} />;
  return <img src={url} alt={alt} loading="lazy" />;
}
