import React from "react";
const cities = [
  { name: "Karachi", x: 125, y: 323 },
  { name: "Quetta", x: 72, y: 209 },
  { name: "Lahore", x: 294, y: 163 },
  { name: "Islamabad", x: 276, y: 82 },
  { name: "Peshawar", x: 205, y: 45 },
];
export function DeliveryMap() {
  return (
    <svg
      viewBox="0 0 400 390"
      className="delivery-map h-full w-full"
      role="img"
      aria-label="Illustrative delivery network connecting Karachi, Quetta, Lahore, Islamabad and Peshawar in Pakistan"
    >
      <defs>
        <linearGradient id="routeGold" x1="0" y1="1" x2="1" y2="0">
          <stop stopColor="#ca9851" />
          <stop offset="1" stopColor="#f4dda4" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="#ffffff0c">
        {[70, 140, 210, 280, 350].map((y) => (
          <path key={y} d={`M30 ${y}H365`} />
        ))}
        {[70, 140, 210, 280, 350].map((x) => (
          <path key={x} d={`M${x} 20V360`} />
        ))}
      </g>
      <path
        d="M125 323C136 260 263 263 294 163S281 104 276 82L205 45M125 323C83 294 79 251 72 209"
        stroke="#ecc1712a"
        strokeWidth="5"
        fill="none"
      />
      <path
        className="route-line"
        d="M125 323C136 260 263 263 294 163S281 104 276 82L205 45M125 323C83 294 79 251 72 209"
        stroke="url(#routeGold)"
        strokeWidth="1.5"
        fill="none"
        strokeDasharray="6 8"
      />
      {cities.map((city, i) => (
        <g key={city.name}>
          <circle
            className="city-pulse"
            cx={city.x}
            cy={city.y}
            r="14"
            fill="#ecc1710d"
            style={{ animationDelay: `${i * 1.1}s` }}
          />
          <circle cx={city.x} cy={city.y} r="4" fill="#ecc171" />
          <text
            x={city.x + (i === 1 ? -13 : 13)}
            y={city.y + 4}
            textAnchor={i === 1 ? "end" : "start"}
            fill="#f3eee2"
            fontFamily="DM Sans, sans-serif"
            fontSize="12"
          >
            {city.name}
          </text>
        </g>
      ))}
      <text
        x="32"
        y="377"
        fill="#a6b9b2"
        fontFamily="DM Sans, sans-serif"
        fontSize="9"
        letterSpacing="2"
      >
        PAKISTAN / AN ILLUSTRATIVE JOURNEY
      </text>
    </svg>
  );
}
