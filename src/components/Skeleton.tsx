// Reusable dark skeleton – matches Web3 dark theme
export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`bg-[#1C2838]/60 animate-pulse rounded ${className}`} />
)

// TokenDetail skeleton – mirrors the real layout
export const TokenDetailSkeleton = () => (
  <div className="max-w-[1100px] mx-auto px-3 sm:px-6 pt-18 pb-12 animate-pulse">
    {/* Header */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pt-4">
      <div className="flex items-center gap-3.5">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-2">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>
      <div className="flex gap-3 w-full md:w-auto">
        <Skeleton className="h-8 w-[120px] rounded-lg flex-1 md:flex-none" />
        <Skeleton className="h-8 w-[140px] rounded-lg flex-1 md:flex-none" />
      </div>
    </div>

    {/* Banner */}
    <Skeleton className="h-16 w-full rounded-xl mb-4" />

    {/* Risk card */}
    <div className="bg-[#0A1017] border border-[#1C2838] rounded-lg p-3 mb-3">
      <Skeleton className="h-4 w-40 mb-3" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-6 w-32 rounded-full" />
      </div>
    </div>

    <Skeleton className="h-px w-full mb-4" />

    {/* Two columns */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-3 xl:col-span-2">
        <div className="bg-[#0A1017] border border-[#1C2838] rounded-lg p-3.5">
          <div className="flex justify-between mb-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border-l-2 border-[#1C2838] pl-3 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-2 w-24" />
                <Skeleton className="h-2 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="lg:col-span-9 xl:col-span-10 space-y-5">
        <div className="bg-[#091018] border border-[#162232]/40 rounded-xl p-5">
          <div className="flex justify-between mb-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-3 w-64 mb-4" />
          <Skeleton className="h-32 w-full rounded-xl mb-4" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="bg-[#091018] border border-[#162232]/40 rounded-xl p-5">
          <div className="flex justify-between mb-4">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-6 w-20 rounded-md" />
          </div>
          <Skeleton className="h-3 w-64 mb-6" />
          <div className="flex flex-col items-center py-8">
            <Skeleton className="w-12 h-12 rounded-full mb-3" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      </div>
    </div>
  </div>
)

export const DashboardSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
    <div className="mb-8 space-y-3">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96 max-w-full" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-dark-200 rounded-lg border border-dark-50 p-6">
          <div className="flex justify-between">
            <div className="space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-12" />
            </div>
            <Skeleton className="w-12 h-12 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-dark-200 rounded-lg border border-dark-50 p-6">
          <div className="flex items-start space-x-4 mb-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="flex gap-2 mb-3">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full mt-4" />
        </div>
      ))}
    </div>
  </div>
)

export const SubmissionsSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
    <div className="mb-8 space-y-3">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-4 w-64" />
    </div>
    <div className="bg-dark-200 rounded-lg border border-dark-50 p-4 mb-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="w-5 h-5" />
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-20 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
    <div className="bg-dark-200 rounded-lg border border-dark-50 overflow-hidden p-4">
      <div className="space-y-3">
        <div className="grid grid-cols-5 gap-4 pb-3 border-b border-dark-50">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-3 w-full" />
          ))}
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="h-4 w-24 flex-1" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  </div>
)

export const NewsSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
    <div className="mb-8 space-y-3">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-4 w-64" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-dark-200 rounded-lg border border-dark-50 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-2 w-24" />
            </div>
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-3 w-full mb-1" />
          <Skeleton className="h-3 w-5/6 mb-4" />
          <div className="flex justify-between pt-3 border-t border-dark-50">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  </div>
)

export const AdminSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
    <div className="mb-8 space-y-3">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-dark-200 rounded-lg border border-dark-50 p-6">
          <div className="flex justify-between mb-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="w-5 h-5" />
          </div>
          <Skeleton className="h-6 w-12" />
        </div>
      ))}
    </div>
    <Skeleton className="h-12 w-full rounded-lg mb-6" />
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-dark-200 rounded-lg border border-dark-50 p-6">
          <div className="flex gap-4">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-12 w-full rounded" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-9 w-20 rounded-lg" />
              <Skeleton className="h-9 w-20 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)
