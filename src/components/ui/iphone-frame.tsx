import * as React from 'react';

interface IphoneFrameProps {
  children: React.ReactNode;
  scale?: number;
}

export function IphoneFrame({ children, scale = 0.38 }: IphoneFrameProps) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 393 * scale, height: 852 * scale }}>
      {/* Corpo do iPhone */}
      <div
        className="relative overflow-hidden rounded-[54px] border-[8px] border-[#1d1d1f] bg-white shadow-2xl"
        style={{ width: 393 * scale, height: 852 * scale, borderRadius: 54 * scale, borderWidth: 8 * scale }}
      >
        {/* Dynamic Island */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#1d1d1f] z-10"
          style={{
            width: 126 * scale,
            height: 37 * scale,
            borderRadius: `0 0 ${20 * scale}px ${20 * scale}px`,
            top: 0,
          }}
        />

        {/* Conteúdo escalado */}
        <div
          style={{
            width: 393,
            height: 852,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            overflow: 'hidden',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          {children}
        </div>
      </div>

      {/* Botão lateral direito */}
      <div
        className="absolute right-0 bg-[#1d1d1f] rounded-r-md"
        style={{ width: 4 * scale, height: 80 * scale, right: -(4 * scale), top: 180 * scale }}
      />
      {/* Botões volume esquerdo */}
      <div
        className="absolute left-0 bg-[#1d1d1f] rounded-l-md"
        style={{ width: 4 * scale, height: 40 * scale, left: -(4 * scale), top: 140 * scale }}
      />
      <div
        className="absolute left-0 bg-[#1d1d1f] rounded-l-md"
        style={{ width: 4 * scale, height: 65 * scale, left: -(4 * scale), top: 195 * scale }}
      />
      <div
        className="absolute left-0 bg-[#1d1d1f] rounded-l-md"
        style={{ width: 4 * scale, height: 65 * scale, left: -(4 * scale), top: 275 * scale }}
      />
    </div>
  );
}
