import React from 'react';

interface CesurgLogoProps {
  className?: string;
  height?: number | string;
}

/**
 * Logomarca oficial da CESURG (Centro de Ensino Superior Riograndense)
 * Fundo 100% transparente, vetorizado em branco puro com proporções ampliadas (sem cortes).
 */
export const CesurgLogo: React.FC<CesurgLogoProps> = ({
  className = '',
  height = 40,
}) => {
  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <svg
        viewBox="0 0 620 160"
        style={{ height, width: 'auto' }}
        className="max-h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        {/* Emblema CESURG: 3 Arcos/Penas Dinâmicas em Branco Puro */}
        <g fill="#FFFFFF">
          {/* 1. Arco Esquerdo */}
          <path
            d="M 28 22 C 26 38, 20 78, 28 108 C 36 132, 54 146, 80 152 C 55 146, 38 132, 32 108 C 24 80, 29 46, 28 22 Z"
          />
          {/* 2. Arco Central */}
          <path
            d="M 68 12 C 64 30, 52 70, 52 100 C 52 128, 66 144, 102 152 C 76 144, 62 130, 62 104 C 62 74, 72 38, 68 12 Z"
          />
          {/* 3. Arco Direito Principal */}
          <path
            d="M 112 6 C 102 34, 82 72, 82 102 C 82 130, 108 146, 170 140 C 118 140, 94 126, 94 98 C 94 66, 112 30, 112 6 Z"
          />
        </g>

        {/* Tipografia Principal: CESURG em Branco Puro com Tracking Amplo */}
        <text
          x="172"
          y="110"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontWeight="900"
          fontSize="92"
          fill="#FFFFFF"
          letterSpacing="-1"
        >
          CESURG
        </text>

        {/* Subtítulo: CENTRO DE ENSINO SUPERIOR RIOGRANDENSE com espaço amplo e sem corte */}
        <text
          x="174"
          y="138"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontStyle="italic"
          fontWeight="600"
          fontSize="13"
          fill="#FFFFFF"
          letterSpacing="0.3"
        >
          CENTRO DE ENSINO SUPERIOR RIOGRANDENSE
        </text>
      </svg>
    </div>
  );
};
