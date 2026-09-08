import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Star, Calendar, RefreshCw, Film, Flame, TrendingUp } from 'lucide-react';
import API from '../api';
import toast from 'react-hot-toast';
import { FilmListSkeleton } from '../components/Skeletons';

function RecommendationsPage({ telegramId }) {
  const [tab, setTab] = useState('releases'); // releases | recommendations | popular
  const [releases, setReleases] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    loadData();
  }, [tab, telegramId]);

  async function loadData() {
    try {
      setLoading(true);
      if (tab === 'releases') {
        const res = await API.getReleases();
        setReleases(res.data || []);
      } else if (tab === 'recommendations') {
        const res = await API.getRecommendations(telegramId);
        setRecommendations(res.data || []);
        setMeta(res.meta);
      } else if (tab === 'popular') {
        const res = await API.getPopular();
        setPopular(res.data || []);
      }
    } catch (error) {
      toast.error('Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: 'releases', label: 'Новинки', icon: Flame },
    { id: 'recommendations', label: 'Для вас', icon: Sparkles },
    { id: 'popular', label: 'Популярное', icon: TrendingUp }
  ];

  const films = tab === 'releases' ? releases : tab === 'recommendations' ? recommendations : popular;

  return (
    <div className="page">
      <h1 className="page-title"><Flame size={24} /> Новинки</h1>

      {/* Табы */}
      <div className="history-tabs" style={{ marginBottom: '20px' }}>
        {tabs.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              className={`history-tab ${active ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <FilmListSkeleton count={5} />
      ) : films.length === 0 ? (
        <div className="empty-state">
          <Film size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p className="empty-state-text">Ничего не найдено</p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Попробуйте обновить или изменить вкладку
          </p>
        </div>
      ) : (
        <div>
          {films.map((film, index) => (
            <Link
              key={film.id}
              to={`/film/${film.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className={`film-card stagger-${(index % 5) + 1}`}>
                <div className="film-card-inner">
                  <img
                    src={film.poster_url || film.posterUrl || 'https://via.placeholder.com/120x180/1a1a1a/333?text=No+Poster'}
                    alt={film.name_ru}
                    className="film-poster-sm"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/120x180/1a1a1a/333?text=No+Poster'; }}
                  />
                  <div className="film-info">
                    <h2 className="film-title">{film.name_ru}</h2>
                    {film.name_original && (
                      <p className="film-original-title">{film.name_original}</p>
                    )}
                    <div className="film-meta">
                      {film.year && <span><Calendar size={12} /> {film.year}</span>}
                      {film.duration && <span>{film.duration} мин</span>}
                    </div>
                    {film.rating_kp && (
                      <div className="film-rating-badge">
                        <Star size={14} fill="currentColor" /> {film.rating_kp.toFixed(1)}
                      </div>
                    )}
                    {film.genres && film.genres.length > 0 && (
                      <div className="film-genres" style={{ marginTop: '8px' }}>
                        {film.genres.slice(0, 3).map((g, i) => (
                          <span key={i} className="genre-tag">{g}</span>
                        ))}
                      </div>
                    )}
                    {film.recommendation_reason && (
                      <p style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '8px' }}>
                        {film.recommendation_reason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <button
        onClick={loadData}
        style={{
          width: '100%', padding: '14px', background: 'var(--bg-secondary)',
          border: '1px solid var(--border)', borderRadius: '12px',
          color: 'var(--text-primary)', fontSize: '14px', cursor: 'pointer',
          marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
        }}
      >
        <RefreshCw size={16} /> Обновить
      </button>
    </div>
  );
}

export default RecommendationsPage;