import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, Bookmark, XCircle, Trash2, Star } from 'lucide-react';
import API from '../api';
import toast from 'react-hot-toast';
import { FilmListSkeleton } from '../components/Skeletons';

function HistoryPage({ telegramId }) {
  const [history, setHistory] = useState({ watching: [], watchlist: [], dropped: [], rated: [] });
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'all', label: 'Все' },
    { id: 'watching', label: 'Смотрю' },
    { id: 'watchlist', label: 'Позже' },
    { id: 'dropped', label: 'Не буду' },
    { id: 'rated', label: 'Оценено' }
  ];

  useEffect(() => { loadHistory(); }, [telegramId]);

  async function loadHistory() {
    try {
      setLoading(true);
      const response = await API.getHistory(telegramId);
      setHistory(response.data);
    } catch (error) {
      toast.error('Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status) {
    try {
      await API.updateHistoryStatus(id, status);
      await loadHistory();
    } catch (error) {
      toast.error('Ошибка');
    }
  }

  async function deleteFromHistory(id) {
    try {
      await API.deleteFromHistory(id);
      await loadHistory();
    } catch (error) {
      toast.error('Ошибка');
    }
  }

  function getFilmsForTab(tabId) {
    if (tabId === 'all') {
      return [...history.watching, ...history.watchlist, ...history.dropped, ...history.rated]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return history[tabId] || [];
  }

  const films = getFilmsForTab(activeTab);

  if (loading) {
    return (
      <div className="page">
        <h1 className="page-title"><Clock size={24} /> История</h1>
        <FilmListSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title"><Clock size={24} /> История</h1>

      <div className="history-tabs">
        {tabs.map(tab => {
          const count = tab.id === 'all'
            ? history.watching.length + history.watchlist.length + history.dropped.length + history.rated.length
            : (history[tab.id] || []).length;
          return (
            <button
              key={tab.id}
              className={`history-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}{count > 0 && ` (${count})`}
            </button>
          );
        })}
      </div>

      {films.length === 0 ? (
        <div className="empty-state">
          <Clock size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p className="empty-state-text">История пуста</p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Добавьте фильмы через карточку фильма
          </p>
        </div>
      ) : (
        <div className="history-list">
          {films.map(item => (
            <div key={item.id} className="history-item">
              <img
                src={item.poster_url || 'https://via.placeholder.com/60x90/1a1a1a/333?text=?'}
                alt=""
                className="history-poster"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/60x90/1a1a1a/333?text=?'; }}
              />
              <div className="history-info">
                <Link to={`/film/${item.film_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <h3 className="history-title">{item.name_ru}</h3>
                </Link>
                <div className="history-meta">
                  {item.year && <span>{item.year}</span>}
                  {item.rating && <span style={{ color: 'var(--rating-star)' }}><Star size={11} fill="currentColor" /> {item.rating}</span>}
                  {item.genres && item.genres.length > 0 && <span>{item.genres.slice(0, 2).join(', ')}</span>}
                </div>
                <div className="history-actions">
                  {item.status !== 'watching' && (
                    <button className="action-button watching" onClick={() => updateStatus(item.id, 'watching')}>
                      <Eye size={13} /> Смотрю
                    </button>
                  )}
                  {item.status !== 'watchlist' && (
                    <button className="action-button watchlist" onClick={() => updateStatus(item.id, 'watchlist')}>
                      <Bookmark size={13} /> Позже
                    </button>
                  )}
                  {item.status !== 'dropped' && (
                    <button className="action-button dropped" onClick={() => updateStatus(item.id, 'dropped')}>
                      <XCircle size={13} /> Не буду
                    </button>
                  )}
                  <button
                    onClick={() => deleteFromHistory(item.id)}
                    style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: 'var(--text-secondary)' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HistoryPage;
