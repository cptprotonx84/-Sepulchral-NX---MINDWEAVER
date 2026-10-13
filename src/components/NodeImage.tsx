import { useEffect, useState } from 'react';
import { getNodeImage } from '../services/imageAssets';

interface NodeImageProps {
  imageId: string;
  className?: string;
  alt?: string;
}

export const NodeImage = ({ imageId, className, alt = 'Attached node image' }: NodeImageProps) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    setUrl(null);
    getNodeImage(imageId).then(blob => {
      if (blob && active) {
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      }
    }).catch(() => undefined);
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageId]);
  return url ? <img src={url} alt={alt} className={className} draggable={false} /> : null;
};
