import React from 'react';

// Скелетон карточки фильма для загрузки
export function FilmCardSkeleton() {
  return (
    <div className="film-card skeleton-card">
      <div className="film-card-inner">
        <div className="skeleton skeleton-poster pulse"></div>
        <div className="film-info">
          <div className="skeleton skeleton-line w-80 pulse"></div>
          <div className="skeleton skeleton-line w-60 pulse"></div>
          <div className="skeleton skeleton-line w-40 pulse" style={{ marginTop: '8px' }}></div>
          <div className="skeleton skeleton-line w-70 pulse"></div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
            <div className="skeleton skeleton-tag pulse"></div>
            <div className="skeleton skeleton-tag pulse"></div>
            <div className="skeleton skeleton-tag pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Скелетон списка
export function FilmListSkeleton({ count = 5 }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <FilmCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Скелетон статистики
export function StatsSkeleton() {
  return (
    <div className="stats-grid">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="stat-card">
          <div className="skeleton skeleton-line w-40 center pulse" style={{ fontSize: '28px' }}></div>
          <div className="skeleton skeleton-line w-50 center pulse" style={{ marginTop: '8px' }}></div>
        </div>
      ))}
    </div>
  );
}

// Скелетон детали фильма
export function FilmDetailSkeleton() {
  return (
    <div className="film-detail">
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
        <div className="skeleton skeleton-detail-poster pulse"></div>
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton-line w-80 pulse"></div>
          <div className="skeleton skeleton-line w-60 pulse" style={{ marginTop: '8px' }}></div>
          <div className="skeleton skeleton-line w-40 pulse" style={{ marginTop: '8px' }}></div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
            <div className="skeleton skeleton-tag pulse"></div>
            <div className="skeleton skeleton-tag pulse"></div>
          </div>
        </div>
      </div>
      <div className="skeleton skeleton-line w-100 pulse"></div>
      <div className="skeleton skeleton-line w-90 pulse"></div>
      <div className="skeleton skeleton-line w-95 pulse"></div>
    </div>
  );
}
