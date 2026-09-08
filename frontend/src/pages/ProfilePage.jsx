import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Star, TrendingUp, Eye, Bookmark, Film, Trophy, Moon, Sun, Clock, Library, Trash2, Plus } from 'lucide-react';
import API from '../api';
import toast from 'react-hot-toast';
import ExportStatsButton from '../components/ExportStatsButton';
import { StatsSkeleton } from '../components/Skeletons';

function ProfilePage({ telegramId, userInfo, theme, onToggleTheme }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState([]);
  const [shelvesLoaded, setShelvesLoaded] = useState(false);
  const [newShelfName, setNewShelfName] = useState('');

  useEffect(() => {
    loadProfile();
  }, [telegramId]);

  async function loadProfile() {
    try {
      setLoading(true);
      const [profileRes, collectionsRes] = await Promise.all([
        API.getProfile(telegramId),
        API.getCollections(telegramId)
      ]);
      setProfile(profileRes.data);
      setCollections(collectionsRes.data || []);
      setShelvesLoaded(true);
    } catch (error) {
      console.error('Profile error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createShelf() {
    const name = newShelfName.trim();
    if (!name) {
      toast.error('Введите название полки');
      return;
    }
    try {
      const res = await API.createCollection(telegramId, name);
      if (res.success) {
        toast.success('Полка создана!');
        setNewShelfName('');
        const collectionsRes = await API.getCollections(telegramId);
        setCollections(collectionsRes.data || []);
      } else {
        toast.error(res.error || 'Ошибка');
      }
    } catch (e) {
      toast.error('Ошибка создания');
    }
  }

  async function removeShelf(collId) {
    if (!confirm('Удалить полку?')) return;
    try {
      await API.deleteCollection(collId);
      toast.success('Полка удалена');
      const collectionsRes = await API.getCollections(telegramId);
      setCollections(collectionsRes.data || []);
    } catch (e) {
      toast.error('Ошибка');
    }
  }

  async function removeFromShelf(collId, filmId) {
    try {
      await API.removeFromCollection(collId, filmId);
      const collectionsRes = await API.getCollections(telegramId);
      setCollections(collectionsRes.data || []);
    } catch (e) {
      toast.error('Ошибка');
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

  const { user, stats, ratingDistribution, favorites, recentRatings, extendedStats, badges } = profile || {};

  return (
    <div className="page">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span><User size={24} /> Профиль</span>
        <button
          onClick={onToggleTheme}
          style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '10px 14px', cursor: 'pointer',
            color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '14px'
          }}
        >
          {theme === 'dark' ? <><Sun size={18} /> Светлая</> : <><Moon size={18} /> Тёмная</>}
        </button>
      </h1>

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

      {/* Бейджи */}
      {badges && badges.length > 0 && (
        <div className="favorites-section">
          <h3 className="favorites-title"><Trophy size={18} /> Мои бейджи</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {badges.map(b => (
              <div
                key={b.id}
                title={b.description}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 14px', background: 'var(--bg-secondary)',
                  borderRadius: '12px', border: '1px solid var(--border)'
                }}
              >
                <span style={{ fontSize: '20px' }}>{b.icon}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600' }}>{b.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{b.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Тёмная статистика */}
      {extendedStats && extendedStats.watch_hours > 0 && (
        <div className="distribution-chart">
          <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>
            <Clock size={18} /> Моя статистика
          </h3>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px'
          }}>
            <div className="stat-card">
              <div className="stat-value">{extendedStats.watch_hours} ч</div>
              <div className="stat-label">Просмотрено часов</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{extendedStats.top_genres?.length || 0}</div>
              <div className="stat-label">Любимых жанров</div>
            </div>
          </div>

          {/* Часы по жанрам */}
          {extendedStats.top_genres && extendedStats.top_genres.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Жанры по количеству просмотров</div>
              {extendedStats.top_genres.slice(0, 5).map(g => {
                const max = Math.max(...extendedStats.top_genres.map(x => x.count), 1);
                const pct = (g.count / max) * 100;
                return (
                  <div key={g.genre} style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span>{g.genre}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{g.count} • {g.avg_rating}</span>
                    </div>
                    <div style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`, height: '100%',
                        background: 'var(--accent)', borderRadius: '8px'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Фильмы по периодам */}
          {extendedStats.years && extendedStats.years.length > 0 && (
            <div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Просмотрено по годам выхода</div>
              <div className="distribution-bars" style={{ height: '110px' }}>
                {extendedStats.years.map(y => {
                  const max = Math.max(...extendedStats.years.map(x => x.count), 1);
                  const height = (y.count / max) * 100;
                  return (
                    <div key={y.range} className="distribution-bar" style={{ height: `${Math.max(height, 8)}%` }} title={`${y.range}: ${y.count}`}>
                      <span className="count">{y.count}</span>
                      <span>{y.range.split('–')[0]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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

      {/* Мои полки */}
      {shelvesLoaded && (
        <div className="favorites-section">
          <h3 className="favorites-title"><Library size={18} /> Мои полки</h3>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              value={newShelfName}
              onChange={(e) => setNewShelfName(e.target.value)}
              placeholder="Название новой полки..."
              style={{
                flex: 1, padding: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: '12px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none'
              }}
            />
            <button
              onClick={createShelf}
              style={{
                padding: '0 16px', background: 'var(--accent)', border: 'none', borderRadius: '12px',
                color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px'
              }}
            >
              <Plus size={16} /> Создать
            </button>
          </div>

          {collections.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
              Полок пока нет. Добавьте фильм в полку со страницы фильма — например, «Любимые» или «Киновечера».
            </p>
          ) : (
            <div>
              {collections.map(coll => (
                <div key={coll.id} className="favorite-item" style={{ flexDirection: 'column', alignItems: 'stretch', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span className="favorite-name"><Library size={14} style={{ marginRight: '6px' }} />{coll.name} <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>({coll.count})</span></span>
                    <button
                      onClick={() => removeShelf(coll.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '4px' }}
                      title="Удалить полку"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  {coll.films.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Пусто</p>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                      {coll.films.map(f => (
                        <div key={f.film_id} style={{ position: 'relative', flexShrink: 0 }}>
                          <Link to={`/film/${f.film_id}`} style={{ display: 'block' }}>
                            <img
                              src={f.poster_url || 'https://via.placeholder.com/60x90/1a1a1a/333?text=?'}
                              alt={f.name_ru}
                              title={f.name_ru}
                              style={{ width: '60px', height: '90px', objectFit: 'cover', borderRadius: '8px' }}
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/60x90/1a1a1a/333?text=?'; }}
                            />
                          </Link>
                          <button
                            onClick={() => removeFromShelf(coll.id, f.film_id)}
                            title="Убрать из полки"
                            style={{
                              position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px',
                              borderRadius: '50%', background: 'var(--error)', color: '#fff', border: 'none',
                              fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              padding: 0
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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
