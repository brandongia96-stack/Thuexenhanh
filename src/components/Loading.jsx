export function Skeleton({ height = 16, width = '100%', radius = 'var(--r-sm)' }) {
  return <div className="skeleton" style={{ height, width, borderRadius: radius }} />
}

export function PageLoading() {
  return (
    <div className="page stack" aria-busy="true" aria-label="Đang tải">
      <Skeleton height={28} width="40%" />
      <div className="grid-cards">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card">
            <Skeleton height={160} radius="0" />
            <div className="card-pad stack" style={{ gap: 'var(--sp-2)' }}>
              <Skeleton height={18} width="70%" />
              <Skeleton height={14} width="45%" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
