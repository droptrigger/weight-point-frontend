// Иллюстрации вместо фото в карточке отчёта: плоские фигуры в спокойных цветах, без градиентов.
// Цвета не зависят от темы — это картинки, а не интерфейс

// Машина на платформе весов
export function VehiclePhoto({ carrier }: { carrier: string }) {
  return (
    <svg className="demo-photo-scene" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="300" fill="#e4ecf2" />
      <path d="M0 196 C70 170 120 176 180 188 C240 166 320 164 400 186 V230 H0Z" fill="#d3dfd6" />
      <rect y="226" width="400" height="74" fill="#cdd4da" />

      {/* Платформа весов */}
      <rect x="20" y="232" width="360" height="12" rx="3" fill="#8e99a2" />
      <rect x="20" y="244" width="360" height="5" fill="#e3b341" />

      {/* Кузов-пресс и задний загрузчик */}
      <rect x="40" y="118" width="26" height="92" rx="6" fill="#4f7d62" />
      <rect x="60" y="104" width="196" height="102" rx="10" fill="#5f9474" />
      <path
        d="M96 116 V194 M132 116 V194 M168 116 V194 M204 116 V194"
        stroke="#4f7d62"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <text
        x="158"
        y="160"
        textAnchor="middle"
        fill="#fff"
        fontFamily="Arial, sans-serif"
        fontWeight="700"
        fontSize="16"
        letterSpacing="1"
      >
        {carrier.toUpperCase()}
      </text>
      <rect x="44" y="204" width="300" height="10" rx="3" fill="#3d464d" />

      {/* Кабина */}
      <path
        d="M262 118 H318 Q330 118 334 130 L344 162 Q346 168 346 176 V210 H262Z"
        fill="#f5f7f8"
      />
      <path d="M272 128 H314 Q320 128 322 134 L330 158 H272Z" fill="#9fc0d8" />
      <path d="M262 168 H346" stroke="#d5dce1" strokeWidth="2" />
      <rect x="282" y="174" width="12" height="4" rx="2" fill="#b4bec6" />
      <rect x="338" y="182" width="8" height="8" rx="2" fill="#f3c55b" />
      <rect x="300" y="110" width="12" height="8" rx="3" fill="#ef9a3a" />

      {/* Колёса */}
      {[98, 146, 312].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="216" r="19" fill="#2f363c" />
          <circle cx={cx} cy="216" r="8" fill="#c6cfd6" />
        </g>
      ))}
    </svg>
  )
}

// Табло весового терминала
export function ScalePhoto({ kg }: { kg: number }) {
  return (
    <svg className="demo-photo-scene" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="300" fill="#e4ecf2" />
      <rect x="64" y="70" width="272" height="164" rx="16" fill="#cfd8df" />
      <rect x="84" y="90" width="232" height="76" rx="8" fill="#26313a" />
      <circle cx="104" cy="110" r="4" fill="#5ad07e" />
      <text
        x="292"
        y="142"
        textAnchor="end"
        fill="#ff7a5c"
        fontFamily="ui-monospace, Consolas, monospace"
        fontWeight="700"
        fontSize="36"
        letterSpacing="2"
      >
        {kg}
      </text>
      <text x="300" y="142" fill="#8a96a0" fontFamily="Arial, sans-serif" fontSize="11">
        кг
      </text>
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={92 + i * 56} y="186" width="48" height="24" rx="6" fill="#a9b5bf" />
      ))}
    </svg>
  )
}
