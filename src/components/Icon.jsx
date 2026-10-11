import React from "react";
const paths = {
  arrow: "M5 12h14m-6-6 6 6-6 6",
  northeast: "M5 19 19 5M5 5h14v14",
  play: "m8 5 11 7-11 7Z",
  pause: "M9 5v14M15 5v14",
  volume: "m11 5-5 4H3v6h3l5 4ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14",
  mute: "m11 5-5 4H3v6h3l5 4Zm5 4 5 6m0-6-5 6",
  music:
    "M9 17V5l11-2v12M9 9l11-2M9 18c0 3-6 3-6 0s6-3 6 0m11-2c0 3-6 3-6 0s6-3 6 0",
  inspect: "M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4M8 12h8m-4-4v8",
  menu: "M4 8h16M4 16h16",
  close: "m6 6 12 12M6 18 18 6",
  truck:
    "M3 6h11v11H3Zm11 5h4l3 4v2h-7M5 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4m13 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4",
  reset: "M4 10a8 8 0 1 1 1 9M4 4v6h6",
};
export function Icon({ name = "arrow", className = "h-4 w-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
