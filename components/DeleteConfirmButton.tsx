// components/DeleteConfirmButton.tsx
"use client";

import { ReactNode } from "react";

export default function DeleteConfirmButton({
  children,
  confirmMessage,
  className,
  title,
}: {
  children: ReactNode;
  confirmMessage: string;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type="submit"
      title={title}
      className={className}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault(); // Nếu bấm Hủy (Cancel), chặn việc submit form
        }
      }}
    >
      {children}
    </button>
  );
}