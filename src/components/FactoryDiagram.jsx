import React, { useId } from "react";

function Belt({ x, width, id }) {
  return (
    <g transform={`translate(${x} 275)`}>
      <path d={`M0 0h${width}l20-14H20Z`} fill="#829994" />
      <path d={`M0 0h${width}v15H0Z`} fill="#243e3f" />
      <path d={`M${width} 0l20-14v15l-20 14Z`} fill="#526e69" />
      {Array.from({ length: 8 }, (_, i) => (
        <path key={i} d={`M${(i * width) / 8 + 7} 2v10`} stroke="#68817b" />
      ))}
      <path
        d={`M12 15v35m${width - 26}-35v35`}
        stroke="#657f79"
        strokeWidth="5"
      />
      {Array.from({ length: 4 }, (_, i) => (
        <ellipse
          key={i}
          className="diagram-food"
          cx="16"
          cy="-8"
          rx="7"
          ry="4"
          fill="#e3bd72"
          style={{ "--travel": `${width - 22}px`, animationDelay: `-${i}s` }}
        />
      ))}
    </g>
  );
}
function Cabinet({ x, width, label, children }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <path d={`M0 189h${width}v93H0Z`} fill="#829b95" />
      <path d={`M${width} 189l20-15v91l-20 17Z`} fill="#3d5d59" />
      <path d={`M0 189l20-15h${width}l-20 15Z`} fill="#c0d0c7" />
      <path
        d={`M9 204h${width - 18}v65H9Z`}
        fill="#748e89"
        stroke="#b4c7bd"
        strokeWidth=".6"
      />
      {[14, width - 14].map((xx) => (
        <g key={xx}>
          <path d={`M${xx} 282v35`} stroke="#afc2b6" strokeWidth="4" />
          <path d={`M${xx - 7} 319h14`} stroke="#3c5650" strokeWidth="5" />
        </g>
      ))}
      <rect
        x="15"
        y="211"
        width={Math.min(62, width - 30)}
        height="14"
        rx="2"
        fill="#1b3739"
      />
      <text x="20" y="221" fontFamily="DM Sans" fontSize="5.5" fill="#dbe4d5">
        {label}
      </text>
      {children}
    </g>
  );
}
export function TruckIllustration() {
  return (
    <svg
      viewBox="0 0 1050 480"
      className="h-full w-full"
      role="img"
      aria-label="CRISP delivery truck carrying cartons of chips across Pakistan"
    >
      <defs>
        <linearGradient id="vanBody" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#fff7e2" />
          <stop offset="1" stopColor="#b6bbac" />
        </linearGradient>
        <linearGradient id="cabBody">
          <stop stopColor="#43716a" />
          <stop offset="1" stopColor="#173d3c" />
        </linearGradient>
      </defs>
      <ellipse cx="550" cy="361" rx="340" ry="22" fill="#001719" opacity=".7" />
      <path d="M0 377h1050" stroke="#708d81" strokeWidth="1" />
      <path
        className="road-dashes"
        d="M-120 411h1290"
        stroke="#d7c494"
        strokeWidth="2"
        strokeDasharray="55 42"
      />
      <g className="delivery-truck-drawing">
        <path d="M240 136 273 113h432l-26 23Z" fill="#e3e5d4" />
        <path d="M679 136 705 113v218l-26 18Z" fill="#728a7c" />
        <rect
          x="240"
          y="136"
          width="439"
          height="201"
          rx="6"
          fill="url(#vanBody)"
        />
        <rect x="250" y="148" width="418" height="177" rx="3" fill="#214744" />
        <path d="M263 279h393" stroke="#dec388" strokeWidth="1" />
        <text
          x="310"
          y="247"
          fontFamily="Instrument Serif, Georgia"
          fontSize="111"
          fill="#f6f0e4"
        >
          crisp
          <tspan fill="#e6bd73" fontSize="47">
            ✳
          </tspan>
        </text>
        <text
          x="311"
          y="300"
          fontFamily="DM Sans"
          fontSize="10"
          letterSpacing="4"
          fill="#e9dfbd"
        >
          GOOD THINGS. ON THE WAY.
        </text>
        <path d="M687 207h111l50 45v91H687Z" fill="url(#cabBody)" />
        <path d="m699 218 94 0 37 36H699Z" fill="#97bbb1" />
        <path d="M748 218v37" stroke="#31584f" strokeWidth="5" />
        <path
          d="M697 267h104v66H697Z"
          fill="none"
          stroke="#78a092"
          strokeWidth="1"
        />
        <path d="M704 276h16" stroke="#e5d3ac" strokeWidth="3" />
        <rect x="831" y="296" width="18" height="16" rx="3" fill="#f8e7af" />
        <path d="M826 275h26v8h-26m-563 57h558v15H269Z" fill="#80978a" />
        <path
          d="M694 212v-12h-16v34h16"
          fill="none"
          stroke="#bdcabc"
          strokeWidth="3"
        />
        {[315, 391, 769].map((x) => (
          <g key={x}>
            <circle
              cx={x}
              cy="349"
              r="31"
              fill="#14292b"
              stroke="#3d5351"
              strokeWidth="4"
            />
            <circle cx={x} cy="349" r="17" fill="#a8b8ac" />
            <g
              className="diagram-wheel"
              style={{ transformOrigin: `${x}px 349px` }}
            >
              {[0, 60, 120].map((a) => (
                <path
                  key={a}
                  d={`M${x - 13} 349h26`}
                  stroke="#50665e"
                  strokeWidth="3"
                  transform={`rotate(${a} ${x} 349)`}
                />
              ))}
            </g>
            <circle cx={x} cy="349" r="5" fill="#d3d9c5" />
          </g>
        ))}
        <path d="M253 157v143m8-143v143" stroke="#9daf9e" strokeWidth="2" />
        <rect x="243" y="312" width="6" height="16" fill="#be5c44" />
        <path d="M239 337h27v19h-27m592-19h29v16h-29" fill="#abbbaa" />
        <text
          x="736"
          y="315"
          fontFamily="DM Sans"
          fontSize="7"
          letterSpacing="2"
          fill="#f6e9bf"
        >
          PAKISTAN
        </text>
      </g>
      <text
        x="525"
        y="70"
        textAnchor="middle"
        fill="#9fb7ac"
        fontFamily="DM Sans"
        fontSize="10"
        letterSpacing="4"
      >
        PACKED WITH CARE. READY FOR THE ROAD.
      </text>
    </svg>
  );
}
export function FactoryDiagram({ stage = 0, playing = true }) {
  const unique = useId().replaceAll(":", "");
  const views = [
    "-35 5 1510 425",
    "0 75 350 300",
    "240 65 420 330",
    "520 65 390 315",
    "780 40 350 320",
    "1070 45 375 330",
  ];
  if (stage === 6)
    return (
      <div className={`diagram ${playing ? "" : "is-paused"}`}>
        <TruckIllustration />
      </div>
    );
  return (
    <svg
      viewBox={views[stage] || views[0]}
      className={`diagram h-full w-full ${playing ? "" : "is-paused"}`}
      role="img"
      aria-label="Illustrated factory process: washing, peeling, cutting, frying, seasoning and packing"
    >
      <defs>
        <linearGradient id={`${unique}-steel`}>
          <stop stopColor="#b3c9bf" />
          <stop offset=".4" stopColor="#e2e7d4" />
          <stop offset="1" stopColor="#728e83" />
        </linearGradient>
      </defs>
      <path d="M-15 327H1430l35-27H20Z" fill="#284440" />
      <path d="M-15 327H1430v15H-15Z" fill="#173330" />
      <path d="M1430 327l35-27v16l-35 26Z" fill="#112c2b" />
      <path d="M5 335H1410" stroke="#bea36a" strokeWidth="1" />
      <Belt x={50} width={230} />
      <Belt x={290} width={280} />
      <Belt x={800} width={290} />
      <Belt x={1150} width={200} />
      <Cabinet x={44} width={170} label="01 / WASH & PEEL">
        <path d="M0 179h170v-24H0Z" fill="#618d85" />
        <path d="M7 174h155" stroke="#b1d4c3" strokeWidth="3" />
        {[25, 65, 105, 145].map((x) => (
          <g key={x}>
            <path
              d={`M${x} 154v-59h20l12 14v45`}
              fill="none"
              stroke="#b7c9bb"
              strokeWidth="3"
            />
            <path
              className="water-jet"
              d={`M${x + 13} 121v48`}
              stroke="#b5dfd2"
              strokeDasharray="3 5"
            />
          </g>
        ))}
        <path d="M2 91h165v82H2Z" fill="#93c9bb0b" stroke="#a5c2b154" />
      </Cabinet>
      <g transform="translate(265 164)">
        <ellipse rx="48" ry="66" fill="#385b54" />
        <path d="M0-66h73v132H0Z" fill={`url(#${unique}-steel)`} />
        <ellipse cx="73" rx="47" ry="66" fill="#91aaa0" />
        <ellipse cx="73" rx="32" ry="49" fill="#294c44" />
        {[0, 1, 2, 3].map((i) => (
          <path
            key={i}
            d={`M${i * 17 + 3} -59v119`}
            stroke="#668776"
            strokeWidth="2"
          />
        ))}
        <path d="M-19 60v90m116-90v90" stroke="#9cb3a1" strokeWidth="6" />
      </g>
      <Cabinet x={423} width={112} label="02 / SLICER">
        <path
          d="M10 190v-81c0-22 91-22 91 0v81"
          fill={`url(#${unique}-steel)`}
        />
        <ellipse cx="56" cy="109" rx="45" ry="15" fill="#bdcfc0" />
        <path
          d="M27 87 10 54h91L83 87v21H27Z"
          fill="#88a395"
          stroke="#c5d3be"
        />
        <path d="M36 116h42v60H36Z" fill="#1d423c" stroke="#b7c9b9" />
        <path
          className="cutter-lines"
          d="M44 127v38m12-38v38m12-38v38"
          stroke="#aebfab"
          strokeWidth="3"
        />
        <path d="M97 174h30l30 72-26 12-34-59Z" fill="#8ca598" />
      </Cabinet>
      <Cabinet x={600} width={191} label="03 / CONTINUOUS FRYER">
        <rect x="6" y="169" width="179" height="21" fill="#b68d41" />
        {Array.from({ length: 16 }, (_, i) => (
          <circle
            key={i}
            className="oil-bubble"
            cx={15 + i * 10}
            cy={180 + (i % 3) * 2}
            r={2 + (i % 2)}
            fill="#f1cb73"
            style={{ animationDelay: `-${i * 0.16}s` }}
          />
        ))}
        <path d="M-6 101h201v44H-6Z" fill={`url(#${unique}-steel)`} />
        <path d="M-6 101l19-14h202l-20 14Z" fill="#d4dfc9" />
        <path d="M20 145v22m146-22v22" stroke="#9bb7a5" strokeWidth="3" />
        <path
          d="M91 86V50h26V20"
          fill="none"
          stroke="#a9bdab"
          strokeWidth="16"
        />
        <path d="M27 116h147" stroke="#4e6c5d" strokeWidth="14" />
        <path
          d="M70 62h0"
          className="steam"
          stroke="#bed5c060"
          strokeWidth="4"
        />
      </Cabinet>
      <Cabinet x={866} width={130} label="04 / SEASONING">
        <g transform="translate(10 132)">
          <ellipse rx="39" ry="53" fill="#566e4e" />
          <path d="M0-53h77v106H0Z" fill={`url(#${unique}-steel)`} />
          <path d="M10-53v106M64-53v106" stroke="#bf9658" strokeWidth="10" />
          <ellipse
            cx="77"
            rx="37"
            ry="53"
            fill="#204139"
            stroke="#c6d0b9"
            strokeWidth="4"
          />
          {[0, 1, 2, 3, 4].map((i) => (
            <ellipse
              className="tumble-chip"
              key={i}
              cx={66 + i * 4}
              cy={12 + i * 6}
              rx="11"
              ry="5"
              fill="#e9c77d"
              transform={`rotate(${i * 26} 77 25)`}
            />
          ))}
        </g>
        <path d="m41 52-19-39h82L84 52v44H41Z" fill="#a6b9a1" />
      </Cabinet>
      <Cabinet x={1111} width={106} label="05 / FORM & SEAL">
        <path
          d="M0 187V91h106v96"
          fill="#a0bbae10"
          stroke="#9cb7a5"
          strokeWidth="4"
        />
        <path d="M31 110h43v65H31Z" fill="#b59651" />
        <path
          className="sealer-jaw"
          d="M17 170h72"
          stroke="#cdd9bd"
          strokeWidth="8"
        />
        <path d="m22 80-23-38h106L83 80Z" fill="#b1c3ac" />
        <path
          d="M14 52h77m-66 5v-28m30 28v-28m27 28v-28"
          stroke="#d2ddc3"
          strokeWidth="4"
        />
        <ellipse cx="53" cy="26" rx="47" ry="12" fill="#809d86" />
      </Cabinet>
      {[0, 1, 2].map((n) => (
        <g key={n} transform={`translate(${1265 + n * 52} ${253 - n * 8})`}>
          <path d="M0 0h42v45H0Z" fill="#b69262" />
          <path d="m0 0 10-8h42L42 0Z" fill="#d4b480" />
          <path d="m42 0 10-8v45l-10 8Z" fill="#836a49" />
          <path d="M17 0h8v45h-8Z" fill="#c8ac77" />
          <rect x="6" y="16" width="29" height="16" fill="#eee7cd" />
          <text
            x="9"
            y="27"
            fontFamily="Instrument Serif, Georgia"
            fontSize="12"
            fill="#274237"
          >
            crisp
          </text>
        </g>
      ))}
      {[
        ["WASH", 118],
        ["PEEL", 300],
        ["SLICE", 480],
        ["FRY", 695],
        ["SEASON", 933],
        ["PACK", 1160],
        ["DISPATCH", 1340],
      ].map(([t, x], i) => (
        <g key={t}>
          <text
            x={x}
            y="374"
            textAnchor="middle"
            fill="#c4d0bb"
            fontFamily="DM Sans"
            fontSize="9"
            letterSpacing="2"
          >
            {t}
          </text>
          <text
            x={x}
            y="394"
            textAnchor="middle"
            fill="#7f9a8d"
            fontFamily="DM Sans"
            fontSize="7"
          >
            0{i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}
