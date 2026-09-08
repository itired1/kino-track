import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, UserPlus, UserMinus, Star, MessageCircle, X, Trophy, Clock, BookOpen } from 'lucide-react';
import API from '../api';
import toast from 'react-hot-toast';
import { FilmListSkeleton } from '../components/Skeletons';

function FriendsPage({ telegramId }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);   // выбранный друг для просмотра
  const [friendData, setFriendData] = useState(null); // данные профиля друга
  const [friendLoading, setFriendLoading] = useState(false);
  const [friendCollections, setFriendCollections] = useState([]);
  const [tab, setTab] = useState('friends'); // friends | rating
  const [leaderboard, setLeaderboard] = useState(null);
  const [lbLoading, setLbLoading] = useState(false);

  useEffect(() => { loadFriends(); }, [telegramId]);

  async function loadFriends() {
    try {
      setLoading(true);
      const res = await API.getFriends(telegramId);
      setFriends(res.data || []);
    } catch (e) {
      toast.error('Ошибка загрузки друзей');
    } finally {
      setLoading(false);
    }
  }

  async function loadLeaderboard() {
    try {
      setLbLoading(true);
      const res = await API.getLeaderboard(telegramId);
      setLeaderboard(res.data || null);
    } catch (e) {
      const status = e.response?.status;
      if (status && status !== 404) toast.error('Ошибка загрузки рейтинга');
      setLeaderboard({ total_friends: 0, by_ratings: [], by_average: [] });
    } finally {
      setLbLoading(false);
    }
  }

  useEffect(() => {
    if (tab === 'rating') loadLeaderboard();
  }, [tab]);

  async function doSearch(q) {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    try {
      setSearching(true);
      const res = await API.searchFriends(telegramId, q.trim());
      setSearchResults(res.data || []);
    } catch (e) {
      toast.error('Ошибка поиска');
    } finally {
      setSearching(false);
    }
  }

  async function addFriend(friendTelegramId) {
    try {
      const res = await API.addFriend(telegramId, friendTelegramId);
      if (res.success) {
        toast.success('Друг добавлен!');
        setSearchResults([]);
        setSearchQuery('');
        loadFriends();
      } else {
        toast.error(res.error || 'Ошибка');
      }
    } catch (e) {
      toast.error('Не удалось добавить');
    }
  }

  async function removeFriend(friendTelegramId) {
    try {
      await API.removeFriend(telegramId, friendTelegramId);
      toast.success('Удалён из друзей');
      if (selected && selected.telegram_id === friendTelegramId) {
        setSelected(null);
        setFriendData(null);
      }
      loadFriends();
    } catch (e) {
      toast.error('Ошибка');
    }
  }

  async function openFriend(friend) {
    setSelected(friend);
    setFriendData(null);
    setFriendCollections([]);
    setFriendLoading(true);
    try {
      const [profileRes, collectionsRes] = await Promise.all([
        API.getFriendProfile(telegramId, friend.telegram_id),
        API.getUserCollections(friend.telegram_id)
      ]);
      setFriendData(profileRes.data || null);
      setFriendCollections(collectionsRes.data || []);
    } catch (e) {
      toast.error('Ошибка загрузки профиля');
    } finally {
      setFriendLoading(false);
    }
  }

  function initials(friend) {
    return `${(friend.first_name || '?')[0]}${(friend.last_name || '')?.[0] || ''}`.toUpperCase();
  }

  // Режим просмотра профиля друга
  if (selected) {
    return (
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h1 className="page-title" style={{ marginBottom: 0 }}>
            <Users size={24} /> Профиль
          </h1>
          <button
            onClick={() => { setSelected(null); setFriendData(null); }}
            style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <X size={16} /> Назад
          </button>
        </div>

        <div className="friend-profile-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '16px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #f50, #ff8800)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '24px', flexShrink: 0 }}>
            {initials(selected)}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>
              {selected.first_name} {selected.last_name || ''}
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
              {selected.username ? `@${selected.username}` : 'нет ника'}
            </p>
            <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Star size={14} fill="currentColor" style={{ color: 'var(--rating-star)' }} />
              {friendData?.stats?.total_ratings ? `${friendData.stats.total_ratings} оценок, средняя ${friendData.stats.average_rating}` : 'Пока нет оценок'}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {selected.username && (
              <a
                href={`https://t.me/${selected.username}`}
                target="_blank"
                rel="noreferrer"
                style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <MessageCircle size={14} /> Написать
              </a>
            )}
            <button
              onClick={() => removeFriend(selected.telegram_id)}
              style={{ background: 'transparent', border: '1px solid #555', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <UserMinus size={14} /> Удалить
            </button>
          </div>
        </div>

        {friendLoading ? (
          <FilmListSkeleton count={3} />
        ) : friendData ? (
          <>
            {friendData.favorites?.genres?.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '10px' }}>Любимые жанры</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {friendData.favorites.genres.map((g, i) => (
                    <span key={i} className="genre-tag">{g.genre}</span>
                  ))}
                </div>
              </div>
            )}

            <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '10px' }}>
              Недавние оценки
            </h3>
            {(friendData.recentRatings || []).length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Пока ничего не оценено</p>
            ) : (
              <div>
                {friendData.recentRatings.map(item => (
                  <Link
                    key={item.film_id}
                    to={`/film/${item.film_id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div className="history-item">
                      <img src={item.poster_url || 'https://via.placeholder.com/60x90/1a1a1a/333?text=?'} alt="" className="history-poster" />
                      <div className="history-info">
                        <h3 className="history-title">{item.name_ru}</h3>
                        <div className="history-meta">
                          {item.year && <span>{item.year}</span>}
                          {item.rating && <span style={{ color: 'var(--rating-star)' }}><Star size={11} fill="currentColor" /> {item.rating}</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : null}

        {/* Бейджи друга */}
        {friendData?.badges && friendData.badges.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '10px' }}>Бейджи</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {friendData.badges.map(b => (
                <span key={b.id} title={b.description} className="genre-tag" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {b.icon} {b.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Полки друга */}
        {!friendLoading && friendCollections.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '10px' }}>
              <BookOpen size={14} /> Полки друга
            </h3>
            <div>
              {friendCollections.map(coll => (
                <div
                  key={coll.id}
                  style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)', padding: '12px', marginBottom: '10px' }}
                >
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                    {coll.name} <span style={{ color: 'var(--text-secondary)', fontWeight: '400' }}>({coll.count})</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
                    {coll.films.slice(0, 8).map(f => (
                      <Link key={f.film_id} to={`/film/${f.film_id}`} style={{ flexShrink: 0 }}>
                        <img
                          src={f.poster_url || 'https://via.placeholder.com/50x75/1a1a1a/333?text=?'}
                          alt={f.name_ru}
                          title={f.name_ru}
                          style={{ width: '50px', height: '75px', objectFit: 'cover', borderRadius: '8px' }}
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/50x75/1a1a1a/333?text=?'; }}
                        />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title"><Users size={24} /> Друзья</h1>

      {/* Табы */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setTab('friends')}
          style={{
            flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            background: tab === 'friends' ? 'var(--accent)' : 'var(--bg-secondary)',
            color: tab === 'friends' ? '#fff' : 'var(--text-secondary)', fontSize: '14px', fontWeight: '600'
          }}
        >
          Друзья
        </button>
        <button
          onClick={() => setTab('rating')}
          style={{
            flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            background: tab === 'rating' ? 'var(--accent)' : 'var(--bg-secondary)',
            color: tab === 'rating' ? '#fff' : 'var(--text-secondary)', fontSize: '14px', fontWeight: '600',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}
        >
          <Trophy size={15} /> Рейтинг
        </button>
      </div>

      {/* Рейтинг друзей */}
      {tab === 'rating' && (
        <div>
          {lbLoading ? (
            <FilmListSkeleton count={5} />
          ) : leaderboard ? (
            <>
              <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '10px' }}>
                По количеству оценок <span style={{ fontWeight: '400', color: 'var(--text-secondary)' }}>(друзей: {leaderboard.total_friends})</span>
              </h3>
              <div style={{ marginBottom: '20px' }}>
                {leaderboard.by_ratings.map((e, i) => (
                  <div
                    key={e.user.telegram_id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
                      background: 'var(--bg-secondary)', borderRadius: '12px',
                      border: '1px solid var(--border)', marginBottom: '8px'
                    }}
                  >
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: i === 0 ? 'var(--rating-star)' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'var(--bg-tertiary)',
                      color: i < 3 ? '#000' : 'var(--text-secondary)', fontWeight: '700', fontSize: '13px'
                    }}>
                      {i + 1}
                    </div>
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                      background: e.is_me ? 'var(--success)' : 'linear-gradient(135deg, #f50, #ff8800)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '15px'
                    }}>
                      {(e.user.first_name || '?')[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                        {e.user.first_name} {e.user.last_name || ''} {e.is_me && <span style={{ color: 'var(--success)', fontSize: '12px' }}>(вы)</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {e.user.username ? `@${e.user.username}` : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{e.total_ratings} 🎬</div>
                      {e.average_rating > 0 && <div style={{ fontSize: '12px', color: 'var(--rating-star)' }}>ср. {e.average_rating}</div>}
                    </div>
                  </div>
                ))}
              </div>

              <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '10px' }}>
                По среднему баллу
              </h3>
              <div>
                {leaderboard.by_average.slice(0, 10).map((e, i) => (
                  <div
                    key={e.user.telegram_id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
                      background: 'var(--bg-secondary)', borderRadius: '12px',
                      border: '1px solid var(--border)', marginBottom: '8px'
                    }}
                  >
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: i === 0 ? 'var(--rating-star)' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'var(--bg-tertiary)',
                      color: i < 3 ? '#000' : 'var(--text-secondary)', fontWeight: '700', fontSize: '13px'
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                        {e.user.first_name} {e.user.last_name || ''} {e.is_me && <span style={{ color: 'var(--success)', fontSize: '12px' }}>(вы)</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {e.user.username ? `@${e.user.username}` : ''} • {e.total_ratings} 🎬
                      </div>
                    </div>
                    <div style={{ fontWeight: '700', color: 'var(--rating-star)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Star size={14} fill="currentColor" /> {e.average_rating}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <Trophy size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <p className="empty-state-text">Рейтинг пуст</p>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Добавьте друзей, чтобы сравнить, кто больше смотрит!</p>
            </div>
          )}
        </div>
      )}

      {/* Поиск человека */}
      {tab === 'friends' && (
        <div style={{ marginBottom: '20px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => doSearch(e.target.value)}
            placeholder="Найти друга по нику @username или имени..."
            style={{ width: '100%', boxSizing: 'border-box', padding: '14px 14px 14px 40px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
          />
        </div>

        {searching && <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '10px' }}>Поиск...</p>}

        {searchResults.length > 0 && (
          <div style={{ marginTop: '10px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
            {searchResults.map(u => {
              const isFriend = friends.some(f => f.telegram_id === u.telegram_id);
              return (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #f50, #ff8800)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '15px', flexShrink: 0 }}>
                    {initials(u)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{u.first_name} {u.last_name || ''}</div>
                    {u.username && <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>@{u.username}</div>}
                  </div>
                  {!isFriend ? (
                    <button
                      onClick={() => addFriend(u.telegram_id)}
                      style={{ background: 'var(--accent)', border: 'none', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', color: '#fff', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      <UserPlus size={14} /> Добавить
                    </button>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>В друзьях ✓</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {searchQuery && !searching && searchResults.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '10px' }}>
            Никого не найдено. Чтобы человек появился здесь, ему нужно хотя бы раз открыть приложение через Telegram.
          </p>
        )}
      </div>
      )}

      {/* Список друзей */}
      {tab === 'friends' && (
      <>
      <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '10px' }}>
        Мои друзья ({friends.length})
      </h3>

      {loading ? (
        <FilmListSkeleton count={3} />
      ) : friends.length === 0 ? (
        <div className="empty-state">
          <Users size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p className="empty-state-text">Пока нет друзей</p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center', padding: '0 20px' }}>
            Найдите человека по нику из Telegram выше и добавьте его! Сможете видеть, что друг посмотрел и как оценил.
          </p>
        </div>
      ) : (
        <div>
          {friends.map(friend => (
            <div
              key={friend.id}
              onClick={() => openFriend(friend)}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '10px', cursor: 'pointer' }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #f50, #ff8800)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '18px', flexShrink: 0 }}>
                {initials(friend)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{friend.first_name} {friend.last_name || ''}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {friend.username && <span>@{friend.username}</span>}
                  <Star size={12} fill="currentColor" style={{ color: 'var(--rating-star)' }} />
                  <span>{friend.total_ratings} оценок</span>
                  {friend.average_rating > 0 && <span>• ср. {friend.average_rating}</span>}
                </div>
              </div>
              {friend.username && (
                <a
                  href={`https://t.me/${friend.username}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
                >
                  <MessageCircle size={16} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
      </>
      )}
    </div>
  );
}

export default FriendsPage;