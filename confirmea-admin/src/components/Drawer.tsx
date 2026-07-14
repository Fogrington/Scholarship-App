import type { ReactNode } from "react";
import { CloseIcon } from "./Icons";

interface DrawerProps {
  onClose: () => void;
  children: ReactNode;
}

export default function Drawer({ onClose, children }: DrawerProps) {
  return (
    <div
      className="drawer-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="drawer">
        <button className="drawer-close" onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>
        {children}
      </div>
    </div>
  );
}
