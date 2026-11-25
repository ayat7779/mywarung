import React, { useState } from 'react';
import { Package } from 'lucide-react';

export default function ProductImage({ src, alt, className = '', iconClassName = 'w-6 h-6 text-slate-400' }) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className={`bg-slate-100 flex items-center justify-center shrink-0 ${className}`}>
        <Package className={iconClassName} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || 'Foto barang'}
      onError={() => setHasError(true)}
      className={`object-cover shrink-0 ${className}`}
      loading="lazy"
    />
  );
}
