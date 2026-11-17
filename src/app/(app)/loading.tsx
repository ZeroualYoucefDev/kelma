export default function Loading() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="space-y-3">
        <div className="h-4 w-32 rounded bg-white/8" />
        <div className="h-10 w-2/3 rounded bg-white/8" />
        <div className="h-4 w-1/2 rounded bg-white/5" />
      </div>
      <div className="space-y-7">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className={`flex ${item % 2 === 0 ? "justify-start" : "justify-end"}`}
          >
            <div className="size-14 rounded-2xl bg-white/8" />
          </div>
        ))}
      </div>
    </div>
  );
}
