import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Film, Calendar, Star, X, Shuffle, Users } from 'lucide-react';
import API from '../api';
import toast from 'react-hot-toast';
import { FilmListSkeleton } from '../components/Skeletons';

function SearchPage({ telegramId }) {
  const [query, setQuery] = useState('');
  const [year, setYear] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [randomizing, setRandomizing] = useState(false);
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Активность друзей за 14 дней
    API.getFriendsActivity(telegramId, 14)
      .then(res => setActivity(res.data || []))
      .catch(() => {})
      .finally(() => setActivityLoading(false));
  }, [telegramId]);

  async function handleSearch(e) {
    e.preventDefault();
    
    if (!query.trim()) {
      toast.error('Введите название фильма');
      return;
    }

    setLoading(true);
    try {
      const response = await API.searchFilms(query, year || null);
      setResults(response.data || []);
      setSearched(true);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Ошибка при поиске: ' + (error.response?.data?.error || error.message));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function clearSearch() {
    setQuery('');
    setYear('');
    setResults([]);
    setSearched(false);
  }

  async function handleRandom() {
    setRandomizing(true);
    try {
      const res = await API.getRandomFilm();
      if (res.success && res.data) {
        navigate(`/film/${res.data.id}`);
      } else {
        toast.error('Не удалось найти фильм');
      }
    } catch (error) {
      toast.error('Ошибка: ' + (error.response?.data?.error || error.message));
    } finally {
      setRandomizing(false);
    }
  }

  return (
    <div className="page">
      <div className="search-container">
        <form onSubmit={handleSearch} className="search-input-wrapper">
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="search-input"
              placeholder="Название фильма, актёр..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
          <input
            type="number"
            className="search-input"
            placeholder="Год"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            min="1900"
            max="2030"
            style={{ width: '80px', flex: 'none', textAlign: 'center' }}
          />
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? (
              <div className="loading-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
            ) : (
              'Найти'
            )}
          </button>
        </form>
        <button
          onClick={handleRandom}
          disabled={randomizing}
          style={{
            marginTop: '10px', width: '100%', padding: '12px', borderRadius: '12px',
            border: '1px dashed var(--accent)', background: 'transparent', color: 'var(--accent)',
            fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}
        >
          <Shuffle size={16} />
          {randomizing ? 'Подбираем фильм...' : 'Что посмотреть? Случайный фильм'}
        </button>
      </div>

      {/* Смотрят ваши друзья */}
      {!loading && !searched && activityLoading && activity.length === 0 && (
        <div style={{ marginTop: '16px' }}>
          <div className="skeleton skeleton-line w-40 pulse" style={{ height: '18px', marginBottom: '12px' }}></div>
          <div className="skeleton skeleton-card" style={{ height: '120px', borderRadius: '16px' }}></div>
        </div>
      )}

      {!loading && !searched && activity.length > 0 && (
        <div style={{ marginTop: '20px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Users size={18} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>
              Смотрят ваши друзья
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>за 14 дней</span>
          </div>
          <div>
            {activity.slice(0, 8).map((item, i) => (
              <Link
                key={i}
                to={`/film/${item.film.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div
                  className={`film-card stagger-${(i % 5) + 1}`}
                  style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px', marginBottom: '10px' }}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img
                      src={item.film.poster_url || 'https://via.placeholder.com/50x75/1a1a1a/333?text=?'}
                      alt={item.film.name_ru}
                      style={{ width: '50px', height: '75px', objectFit: 'cover', borderRadius: '8px' }}
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/50x75/1a1a1a/333?text=?'; }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.film.name_ru}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {item.film.year && <span>{item.film.year}</span>}
                      {item.film.name_original && <span> • {item.film.name_original}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #f50, #ff8800)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: '10px', fontWeight: '700'
                      }}>
                        {(item.friend.first_name || '?')[0]}
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {item.friend.first_name} {item.friend.last_name || ''} поставил
                      </span>
                      <span style={{
                        fontSize: '12px', fontWeight: '700',
                        background: 'var(--accent)', color: '#fff',
                        borderRadius: '6px', padding: '1px 6px'
                      }}>
                        {item.rating}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                        {new Date(item.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {loading && <FilmListSkeleton count={4} />}

      {!loading && searched && results.length === 0 && (
        <div className="empty-state">
          <Film size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p className="empty-state-text">Ничего не найдено</p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Попробуйте другой запрос
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Найдено: {results.length}
            </p>
            <button onClick={clearSearch} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
              <X size={16} /> Очистить
            </button>
          </div>
          {results.map((film, index) => (
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
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/120x180/1a1a1a/333?text=No+Poster';
                    }}
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
                        {film.genres.slice(0, 3).map((genre, i) => (
                          <span key={i} className="genre-tag">{genre}</span>
                        ))}
                      </div>
                    )}
                    {film.description && (
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {film.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!searched && (
        <div className="empty-state" style={{ marginTop: '48px' }}>
          <Film size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p className="empty-state-text">Найдите фильм</p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Введите название, имя актёра или режиссёра
          </p>
        </div>
      )}
    </div>
  );
}

export default SearchPage;
