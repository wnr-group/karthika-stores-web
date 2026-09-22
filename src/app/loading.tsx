/**
 * The route-level loading state.
 *
 * A hairline that fills from the left, and nothing else. No spinner, no
 * skeleton of a layout we do not know yet.
 */
export default function Loading() {
  return (
    <div className="shell py-24">
      <span className="sr-only">Loading</span>
      <div className="h-px w-full overflow-hidden bg-stone">
        <div className="h-px w-1/3 animate-[loading_1.2s_ease-in-out_infinite] bg-ink" />
      </div>

      <style>{`
        @keyframes loading {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}
