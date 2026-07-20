export default function Loading() {
  return (
    <div className="min-h-screen bg-white" aria-hidden="true">
      {/* Hero skeleton */}
      <div className="w-full h-screen bg-gradient-to-br from-emerald-900 to-emerald-700 animate-pulse" />
      {/* Services skeleton */}
      <div className="w-full py-20 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
