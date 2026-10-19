import type { ReactNode, SVGAttributes } from 'react';

type P = SVGAttributes<SVGSVGElement> & { size?: number };

function Base({ size = 18, children, ...rest }: P & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}

export const SearchIcon = (p: P) => <Base {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></Base>;
export const MicIcon = (p: P) => <Base {...p}><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></Base>;
export const ArrowIcon = (p: P) => <Base {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Base>;
export const CheckIcon = (p: P) => <Base {...p}><path d="M20 6 9 17l-5-5" /></Base>;
export const InfoIcon = (p: P) => <Base {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></Base>;
export const PinIcon = (p: P) => <Base {...p}><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></Base>;
export const ListIcon = (p: P) => <Base {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></Base>;
export const ImageIcon = (p: P) => <Base {...p}><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="m4 18 5-4 4 3 3-2 4 3" /></Base>;
export const ClipIcon = (p: P) => <Base {...p}><rect x="8" y="4" width="12" height="14" rx="2" /><path d="M16 4V2H6a2 2 0 0 0-2 2v14" /></Base>;
export const UploadIcon = (p: P) => <Base {...p}><path d="M12 16V4M12 4 7 9M12 4l5 5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></Base>;
export const CompareIcon = (p: P) => <Base {...p}><path d="M7 16V4M7 4 3 8M7 4l4 4M17 8v12M17 20l4-4M17 20l-4-4" /></Base>;
export const ThumbIcon = (p: P) => <Base {...p}><path d="M7 10v11M2 13v6a2 2 0 0 0 2 2h13.5a2 2 0 0 0 2-1.7l1.3-8A1.5 1.5 0 0 0 20.3 9H14l1-5a2 2 0 0 0-2-2L7 10" /></Base>;
export const MenuIcon = (p: P) => <Base {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Base>;
export const CloseIcon = (p: P) => <Base {...p}><path d="M6 6l12 12M18 6 6 18" /></Base>;
export const ChevronRight = (p: P) => <Base {...p}><path d="m9 6 6 6-6 6" /></Base>;
export const PlayIcon = (p: P) => <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>;

export function HeartIcon({ filled, ...p }: P & { filled?: boolean }) {
  return (
    <Base {...p} fill={filled ? 'currentColor' : 'none'}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </Base>
  );
}
