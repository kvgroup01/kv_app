import * as React from 'react';

interface IphoneFrameProps {
  children: React.ReactNode;
  scale?: number;
}

export function IphoneFrame({ children, scale = 0.72 }: IphoneFrameProps) {
  const W = 393;
  const H = 852;

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: W * scale, height: H * scale }}
    >
      {/* Corpo */}
      <div
        className="relative bg-white overflow-hidden"
        style={{
          width: W * scale,
          height: H * scale,
          borderRadius: 54 * scale,
          border: `${8 * scale}px solid #1d1d1f`,
          boxShadow: '0 24px 48px rgba(0,0,0,0.25)',
        }}
      >
        {/* Dynamic Island */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 126 * scale,
            height: 37 * scale,
            background: '#1d1d1f',
            borderRadius: `0 0 ${20 * scale}px ${20 * scale}px`,
            zIndex: 20,
          }}
        />

        {/* Área de conteúdo — scrollable na escala original */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: W,
            height: H,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {children}
        </div>
      </div>

      {/* Botão direito */}
      <div style={{ position: 'absolute', right: -(3 * scale), top: 180 * scale, width: 3 * scale, height: 80 * scale, background: '#1d1d1f', borderRadius: '0 4px 4px 0' }} />
      {/* Botões volume esquerdo */}
      <div style={{ position: 'absolute', left: -(3 * scale), top: 140 * scale, width: 3 * scale, height: 40 * scale, background: '#1d1d1f', borderRadius: '4px 0 0 4px' }} />
      <div style={{ position: 'absolute', left: -(3 * scale), top: 195 * scale, width: 3 * scale, height: 65 * scale, background: '#1d1d1f', borderRadius: '4px 0 0 4px' }} />
      <div style={{ position: 'absolute', left: -(3 * scale), top: 275 * scale, width: 3 * scale, height: 65 * scale, background: '#1d1d1f', borderRadius: '4px 0 0 4px' }} />
    </div>
  );
}
