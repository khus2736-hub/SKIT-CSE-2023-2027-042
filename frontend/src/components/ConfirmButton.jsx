import React, { useState } from 'react';

export default function ConfirmButton({
  onConfirm,
  children,
  confirmText = 'Are you sure?',
  className = 'btn btn-secondary btn-sm',
  disabled = false
}) {
  const [confirming, setConfirming] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 4000);
    } else {
      setConfirming(false);
      onConfirm();
    }
  };

  return (
    <button
      type="button"
      className={confirming ? 'btn btn-danger btn-sm' : className}
      onClick={handleClick}
      disabled={disabled}
    >
      {confirming ? confirmText : children}
    </button>
  );
}
