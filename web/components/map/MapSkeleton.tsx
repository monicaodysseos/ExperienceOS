export function MapSkeleton() {
  return (
    <div className="w-full h-full bg-sand-100 rounded-lg border-2 border-navy-900 animate-pulse flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 border-4 border-navy-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-navy-600 font-medium">Loading map...</p>
      </div>
    </div>
  );
}
