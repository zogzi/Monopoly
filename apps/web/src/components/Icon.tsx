export default function Icon({
  name,
}: {
  name: "close" | "sound" | "mute" | "reset" | "arrow";
}) {
  const paths = {
    close: "M6 6l12 12M6 18L18 6",
    sound: "M4 9h4l5-4v14l-5-4H4V9m12-1c3 2 3 6 0 8m3-11c5 4 5 10 0 14",
    mute: "M4 9h4l5-4v14l-5-4H4V9m12 0l5 6m-5 0l5-6",
    reset: "M5 8a8 8 0 1 1-1 7m1-12v5h5",
    arrow: "M4 12h15m-6-6l6 6-6 6",
  };
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
