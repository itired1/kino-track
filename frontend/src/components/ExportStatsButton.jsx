import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Download, Star, Film } from 'lucide-react';
import toast from 'react-hot-toast';

// Компонент для экспорта статистики в PNG
function ExportStatsButton({ profile, userName }) {
  const chartRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  const exportPng = async () => {
    if (!chartRef.current) return;
    try {
      setExporting(true);
      const dataUrl = await toPng(chartRef.current, {
        pixelRatio: 2,
        backgroundColor: '#0f0f0f',
        style: {
          borderRadius: '16px'
        }
      });
      const link = document.createElement('a');
      link.download = `kinotrack-stats-${userName || 'user'}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Статистика скачана!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Ошибка экспорта');
    } finally {
      setExporting(false);
    }
  };

  const { stats, ratingDistribution, favorites } = profile?.data || {};

  return (
    <div>
      {/* Скрытый график для экспорта */}
      <div ref={chartRef} style={{
        display: 'inline-block',
        background: 'var(--bg-primary)',
        padding: '24px',
        borderRadius: '16px',
        minWidth: '340px',
        maxWidth: '400px',
        position: 'absolute',
        left: '-9999px',
        top: '0',
        width: '380px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '16px', color: '#fff' }}>
          <div style={{ fontSize: '20px', fontWeight: '700' }}>
            🎬 KinoTrack — Статистика
          </div>
          <div style={{ fontSize: '13px', opacity: 0.6, marginTop: '4px' }}>
            {userName || 'Пользователь'}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#f50' }}>{stats?.total_ratings || 0}</div>
            <div style={{ fontSize: '12px', opacity: 0.6, color: '#aaa' }}>Оценок</div>
          </div>
          <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#f50' }}>{stats?.average_rating || '0.0'}</div>
            <div style={{ fontSize: '12px', opacity: 0.6, color: '#aaa' }}>Средний балл</div>
          </div>
        </div>

        {ratingDistribution && ratingDistribution.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '8px', fontWeight: '600' }}>
              Распределение оценок
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '120px' }}>
              {ratingDistribution.map(item => {
                const maxCount = Math.max(...ratingDistribution.map(d => d.count), 1);
                const height = (item.count / maxCount) * 100;
                return (
                  <div key={item.rating_value} style={{
                    flex: 1,
                    height: `${Math.max(height, 4)}%`,
                    background: '#f50',
                    borderRadius: '4px 4px 0 0',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute', top: '-16px', left: '50%', transform: 'translateX(-50%)',
                      fontSize: '9px', color: '#fff'
                    }}>{item.count}</div>
                    <div style={{
                      position: 'absolute', bottom: '-16px', left: '50%', transform: 'translateX(-50%)',
                      fontSize: '10px', color: '#aaa'
                    }}>{item.rating_value}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {favorites?.genres && favorites.genres.length > 0 && (
          <div>
            <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '8px', fontWeight: '600' }}>
              Любимые жанры
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {favorites.genres.slice(0, 3).map((g, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  background: '#1a1a1a', borderRadius: '8px', padding: '8px 12px'
                }}>
                  <span style={{ color: '#fff', fontSize: '13px' }}>{g.genre}</span>
                  <span style={{ color: '#f50', fontSize: '13px' }}><Star size={11} fill="currentColor" style={{ verticalAlign: 'middle' }} /> {g.avg_rating}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Кнопка экспорта */}
      <button
        onClick={exportPng}
        disabled={exporting}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          padding: '14px', background: 'var(--bg-secondary)', border: '1px solid var(--accent)',
          borderRadius: '12px', color: 'var(--accent)', fontSize: '14px', fontWeight: '600',
          cursor: exporting ? 'wait' : 'pointer', marginBottom: '16px',
          opacity: exporting ? 0.6 : 1
        }}
      >
        {exporting ? (
          <div className="loading-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div>
        ) : (
          <Download size={18} />
        )}
        Скачать статистику (PNG)
      </button>
    </div>
  );
}

export default ExportStatsButton;
