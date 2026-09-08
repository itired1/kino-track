import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Film, Eye, Bookmark, XCircle, Share2, Link2, Check } from 'lucide-react';
import API from '../api';
import toast from 'react-hot-toast';
import { FilmDetailSkeleton } from './Skeletons';

// Функция отправки ссылки другу в Telegram
function shareFilmToTelegram(film) {
  const text = `🎬 ${film.name_ru} (${film.year})\n⭐ Рейтинг: ${film.rating_kp ? film.rating_kp.toFixed(1) : '-'} ${film.name_original ? '\n' + film.name_original : ''}`;
  const url = `https://t.me/share/url?url=${encodeURIComponent('https://www.kinopoisk.ru/film/' + film.kinopoisk_id + '/')}&text=${encodeURIComponent(text)}`;
  // Открываем в Telegram или новом окне
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.openTelegramLink(url);
  } else {
    window.open(url, '_blank');
  }
}

// Функция копирования ссылки
async function copyFilmLink(film) {
  const url = `https://www.kinopoisk.ru/film/${film.kinopoisk_id}/`;
  try {
    await navigator.clipboard.writeText(url);
    toast.success('Ссылка скопирована!');
  } catch (e) {
    toast.error('Не удалось скопировать');
  }
}

function FilmDetail({ telegramId }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [film, setFilm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState(null);
  const [review, setReview] = useState('');
  const [showReviewInput, setShowReviewInput] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadFilm();
  }, [id]);

  async function loadFilm() {
    try {
      setLoading(true);
      const response = await API.getFilm(id);
      setFilm(response.data);
    } catch (error) {
      toast.error('Ошибка загрузки фильма');
      navigate('/search');
    } finally {
      setLoading(false);
    }
  }

  async function handleRating(rating) {
    try {
      setSelectedRating(rating);
      await API.addRating(telegramId, film.kinopoisk_id, rating, review || null);
      setSaved(true);
      toast.success(`Оценка ${rating} сохранена!`);
    } catch (error) {
      toast.error('Ошибка сохранения');
      setSelectedRating(null);
    }
  }

  async function addToHistory(status) {
    try {
      await API.addToHistory(telegramId, film.kinopoisk_id, status);
      toast.success('Добавлено');
    } catch (error) {
      toast.error('Ошибка');
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="skeleton skeleton-line w-30 pulse" style={{ height: '20px', marginBottom: '16px' }}></div>
        <FilmDetailSkeleton />
      </div>
    );
  }

  if (!film) return null;

  return (
    <div className="page">
      {/* Кнопка назад */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'none', border: 'none', color: 'var(--text-secondary)',
          cursor: 'pointer', marginBottom: '16px', fontSize: '14px'
        }}
      >
        <ArrowLeft size={18} /> Назад
      </button>

      <div className="film-detail">
        {/* Постер + информация */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <img
            src={film.poster_url || 'https://via.placeholder.com/200x300/1a1a1a/333?text=No+Poster'}
            alt={film.name_ru}
            style={{
              width: '150px', height: '225px', objectFit: 'cover',
              borderRadius: '12px', flexShrink: 0
            }}
            onError={(e) => { e.target.src = 'https://via.placeholder.com/200x300/1a1a1a/333?text=No+Poster'; }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>{film.name_ru}</h1>
            {film.name_original && (
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{film.name_original}</p>
            )}
            <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              {film.year && <span>{film.year}</span>}
              {film.duration && <span>{film.duration} мин</span>}
              {film.type && <span>{film.type}</span>}
            </div>
            {film.rating_kp && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: 'var(--accent)', borderRadius: '8px', fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>
                <Star size={16} fill="currentColor" /> {film.rating_kp.toFixed(1)}
              </div>
            )}
            {film.genres && film.genres.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {film.genres.map((g, i) => (
                  <span key={i} className="genre-tag">{g}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Описание */}
        {film.description && (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              {film.description}
            </p>
          </div>
        )}

        {/* Режиссёр и актёры */}
        {film.directors && film.directors.length > 0 && (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Режиссёр:</strong> {film.directors.join(', ')}
          </p>
        )}
        {film.actors && film.actors.length > 0 && (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            <strong style={{ color: 'var(--text-primary)' }}>В ролях:</strong> {film.actors.slice(0, 5).join(', ')}
          </p>
        )}

        {/* Звёзды для оценки */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
          <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', textAlign: 'center' }}>
            {saved ? 'Ваша оценка:' : 'Поставьте оценку:'}
          </p>
          <div className="rating-stars">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
              <button
                key={num}
                className={`rating-star ${saved && selectedRating === num ? 'selected' : ''}`}
                onClick={() => !saved && handleRating(num)}
                disabled={saved}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Отзыв */}
        {!saved && !showReviewInput && (
          <button
            onClick={() => setShowReviewInput(true)}
            style={{
              width: '100%', padding: '12px', background: 'var(--bg-secondary)',
              border: '1px solid var(--border)', borderRadius: '12px',
              color: 'var(--text-secondary)', fontSize: '14px', cursor: 'pointer', marginBottom: '16px'
            }}
          >
            Добавить отзыв
          </button>
        )}
        {showReviewInput && !saved && (
          <div style={{ marginBottom: '16px' }}>
            <textarea
              className="review-input"
              rows="3"
              placeholder="Ваш отзыв..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              maxLength={500}
            />
          </div>
        )}

        {/* Кнопки истории */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="action-button watching" onClick={() => addToHistory('watching')}>
            <Eye size={14} /> Смотрю
          </button>
          <button className="action-button watchlist" onClick={() => addToHistory('watchlist')}>
            <Bookmark size={14} /> Посмотрю
          </button>
          <button className="action-button dropped" onClick={() => addToHistory('dropped')}>
            <XCircle size={14} /> Не буду
          </button>
        </div>

        {/* Поделиться */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button
            onClick={() => shareFilmToTelegram(film)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '12px', background: '#2AABEE', border: 'none', borderRadius: '12px',
              color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
            }}
          >
            <Share2 size={16} /> Поделиться
          </button>
          <button
            onClick={() => copyFilmLink(film)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '12px 20px', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: '12px', color: 'var(--text-primary)', fontSize: '14px', cursor: 'pointer'
            }}
          >
            <Link2 size={16} /> Ссылка
          </button>
        </div>
      </div>
    </div>
  );
}

export default FilmDetail;
