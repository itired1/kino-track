import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Star, TrendingUp, Eye, Bookmark, Film } from 'lucide-react';
import API from '../api';
import toast from 'react-hot-toast';
import ExportStatsButton from '../components/ExportStatsButton';
import { StatsSkeleton } from '../components/Skeletons';

function ProfilePage({ telegramId, userInfo }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [telegramId]);

  async function loadProfile() {
    try {
      setLoading(true);
      const response = await API.getProfile(telegramId);
      setProfile(response.data);
    } catch (error) {
      console.error('Profile error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <h1 className="page-title"><User size={24} /> Профиль</h1>
        <div className="skeleton skeleton-line w-50 pulse" style={{ height: '80px', marginBottom: '16px' }}></div>
        <StatsSkeleton />
      </div>
    );
  }

  const { user, stats, ratingDistribution, favorites, recentRatings } = profile || {};

  return (
    <div className="page">
      <h1 className="page-title"><User size={24} /> Профиль</h1>

      {user && (
        <div style={{
          marginBottom: '24px', padding: '16px',
          background: 'var(--bg-secondary)', borderRadius: '16px',
          display: 'flex', alignItems: 'center', gap: '16px'
        }}>
          {(userInfo?.photo_url || user.photo_url) ? (
            <img
              src={userInfo?.photo_url || user.photo_url}
              alt="avatar"
              style={{
                width: '56px', height: '56px', borderRadius: '50%',
                objectFit: 'cover', border: '2px solid var(--accent)', flexShrink: 0
              }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'var(--accent)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '22px', fontWeight: '700',
              flexShrink: 0
            }}>
              {(userInfo?.first_name || user.first_name || 'Г')[0]}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>
              {userInfo?.first_name || user.first_name} {userInfo?.last_name || user.last_name}
            </h2>
            {(userInfo?.username || user.username) && (
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                @{userInfo?.username || user.username}
              </p>
            )}
            {userInfo?.is_premium && (
              <span style={{
                fontSize: '12px', color: '#428bca', marginTop: '4px',
                display: 'inline-block'
              }}>
                ★ Telegram Premium
              </span>
            )}
          </div>
        </div>
      )}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.total_ratings || 0}</div>
            <div className="stat-label">Оценок</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.average_rating || '0.0'}</div>
            <div className="stat-label">Средний балл</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.watching_count || 0}</div>
            <div className="stat-label">Смотрю</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{stats.watchlist_count || 0}</div>
            <div className="stat-label">В планах</div>
          </div>
        </div>
      )}

      {/* Распределение оценок */}
      {/* Кнопка экспорта статистики */}
      {stats && stats.total_ratings > 0 && (
        <ExportStatsButton profile={profile} userName={user?.first_name || user?.username} />
      )}

      {ratingDistribution && ratingDistribution.length > 0 && (
        <div className="distribution-chart">
          <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>
            <TrendingUp size={18} /> Распределение оценок
          </h3>
          <div className="distribution-bars">
            {ratingDistribution.map(item => {
              const maxCount = Math.max(...ratingDistribution.map(d => d.count), 1);
              const height = (item.count / maxCount) * 100;
              return (
                <div
                  key={item.rating_value}
                  className="distribution-bar"
                  style={{ height: `${Math.max(height, 4)}%` }}
                >
                  <span className="count">{item.count}</span>
                  <span>{item.rating_value}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Топ жанров */}
      {favorites?.genres && favorites.genres.length > 0 && (
        <div className="favorites-section">
          <h3 className="favorites-title"><Film size={18} /> Любимые жанры</h3>
          <div className="favorites-list">
            {favorites.genres.map((item, i) => (
              <div key={i} className="favorite-item">
                <span className="favorite-name">{item.genre}</span>
                <span className="favorite-stats">
                  {item.count} фильмов &middot; {item.avg_rating} <Star size={12} fill="var(--rating-star)" color="var(--rating-star)" />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Топ режиссёров */}
      {favorites?.directors && favorites.directors.length > 0 && (
        <div className="favorites-section">
          <h3 className="favorites-title">Режиссёры</h3>
          <div className="favorites-list">
            {favorites.directors.map((item, i) => (
              <div key={i} className="favorite-item">
                <span className="favorite-name">{item.director}</span>
                <span className="favorite-stats">
                  {item.count} фильмов &middot; {item.avg_rating} <Star size={12} fill="var(--rating-star)" color="var(--rating-star)" />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Топ актёров */}
      {favorites?.actors && favorites.actors.length > 0 && (
        <div className="favorites-section">
          <h3 className="favorites-title">Актёры</h3>
          <div className="favorites-list">
            {favorites.actors.map((item, i) => (
              <div key={i} className="favorite-item">
                <span className="favorite-name">{item.actor}</span>
                <span className="favorite-stats">
                  {item.count} фильмов &middot; {item.avg_rating} <Star size={12} fill="var(--rating-star)" color="var(--rating-star)" />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Последние оценки */}
      {recentRatings && recentRatings.length > 0 && (
        <div className="favorites-section">
          <h3 className="favorites-title">Последние оценки</h3>
          <div className="favorites-list">
            {recentRatings.map((item, i) => (
              <Link key={i} to={`/film/${item.film_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="favorite-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={item.poster_url || 'https://via.placeholder.com/40x60/1a1a1a/333?text=?'}
                      alt=""
                      style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '6px' }}
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/40x60/1a1a1a/333?text=?'; }}
                    />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.name_ru}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {new Date(item.created_at).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'var(--accent)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontWeight: '700', fontSize: '14px'
                  }}>
                    {item.rating}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {(!stats || stats.total_ratings === 0) && (
        <div className="empty-state" style={{ marginTop: '48px' }}>
          <Star size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p className="empty-state-text">Нет оценок</p>
          <Link to="/search" style={{
            display: 'inline-block', marginTop: '16px', padding: '12px 24px',
            background: 'var(--accent)', borderRadius: '12px', color: 'white',
            textDecoration: 'none', fontWeight: '600'
          }}>
            Найти фильмы
          </Link>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
