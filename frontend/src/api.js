import axios from 'axios';

// Базовый URL API (Vercel задаёт VITE_API_URL; тут fallback на Render)
const API_URL = import.meta.env.VITE_API_URL || 'https://kino-track.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default {
  // Вход через Telegram initData
  async login(initData) {
    const response = await api.post('/users/login', { initData });
    return response.data;
  },

  // Инициализация пользователя
  async initUser(telegramUser) {
    const response = await api.post('/users/init', { telegram_user: telegramUser });
    return response.data;
  },

  // Поиск фильмов
  async searchFilms(query, year) {
    const response = await api.post('/search', { query, year });
    return response.data;
  },

  // Получение фильма по ID
  async getFilm(id) {
    const response = await api.get(`/search/${id}`);
    return response.data;
  },

  // Добавление оценки
  async addRating(telegramId, kinopoiskId, rating, review = null, status = 'rated') {
    const response = await api.post('/ratings', {
      telegram_id: telegramId,
      kinopoisk_id: kinopoiskId,
      rating,
      review,
      status
    });
    return response.data;
  },

  // Получение профиля пользователя
  async getProfile(telegramId) {
    const response = await api.get(`/users/${telegramId}/profile`);
    return response.data;
  },

  // Получение рекомендаций
  async getRecommendations(telegramId) {
    const response = await api.get(`/recommendations/${telegramId}`);
    return response.data;
  },

  // Добавление в историю
  async addToHistory(telegramId, kinopoiskId, status, rating = null) {
    const response = await api.post('/history', {
      telegram_id: telegramId,
      kinopoisk_id: kinopoiskId,
      status,
      rating
    });
    return response.data;
  },

  // Получение истории
  async getHistory(telegramId, status = null) {
    const params = status ? { status } : {};
    const response = await api.get(`/history/${telegramId}`, { params });
    return response.data;
  },

  // Обновление статуса
  async updateHistoryStatus(id, status) {
    const response = await api.put(`/history/${id}/status`, { status });
    return response.data;
  },

  // Удаление из истории
  async deleteFromHistory(id) {
    const response = await api.delete(`/history/${id}`);
    return response.data;
  },

  // Получение статистики
  async getStats(telegramId) {
    const response = await api.get(`/users/${telegramId}/stats`);
    return response.data;
  },

  // Новинки
  async getReleases() {
    const response = await api.get('/search/releases');
    return response.data;
  },

  // Популярные
  async getPopular() {
    const response = await api.get('/search/popular');
    return response.data;
  },

  // === Друзья ===
  async getFriends(telegramId) {
    const response = await api.get(`/friends/${telegramId}`);
    return response.data;
  },

  async searchFriends(telegramId, query) {
    const response = await api.get(`/friends/${telegramId}/search`, { params: { q: query } });
    return response.data;
  },

  async addFriend(telegramId, friendTelegramId) {
    const response = await api.post(`/friends/${telegramId}`, { friend_telegram_id: friendTelegramId });
    return response.data;
  },

  async removeFriend(telegramId, friendTelegramId) {
    const response = await api.delete(`/friends/${telegramId}/${friendTelegramId}`);
    return response.data;
  },

  async getFriendProfile(telegramId, friendTelegramId) {
    const response = await api.get(`/friends/${telegramId}/${friendTelegramId}/profile`);
    return response.data;
  },

  // === Рецензии ===
  async getReviews(filmId) {
    const response = await api.get(`/reviews/film/${filmId}`);
    return response.data;
  },

  async addReview(telegramId, filmId, rating, text, is_spoiler = false) {
    const response = await api.post('/reviews', { telegram_id: telegramId, film_id: filmId, rating, text, is_spoiler });
    return response.data;
  },

  async deleteReview(id) {
    const response = await api.delete(`/reviews/${id}`);
    return response.data;
  },

  // === Случайный фильм ===
  async getRandomFilm() {
    const response = await api.get('/search/random');
    return response.data;
  },

  // === Рейтинг друзей ===
  async getLeaderboard(telegramId) {
    const response = await api.get(`/friends/${telegramId}/leaderboard`);
    return response.data;
  },

  // === Полки ===
  async getCollections(telegramId) {
    const response = await api.get(`/collections/${telegramId}`);
    return response.data;
  },

  async getUserCollections(otherTelegramId) {
    const response = await api.get(`/collections/user/${otherTelegramId}`);
    return response.data;
  },

  async createCollection(telegramId, name) {
    const response = await api.post('/collections', { telegram_id: telegramId, name });
    return response.data;
  },

  async addToCollection(collectionId, filmId) {
    const response = await api.post(`/collections/${collectionId}/films`, { film_id: filmId });
    return response.data;
  },

  async removeFromCollection(collectionId, filmId) {
    const response = await api.delete(`/collections/${collectionId}/films/${filmId}`);
    return response.data;
  },

  async deleteCollection(collectionId) {
    const response = await api.delete(`/collections/${collectionId}`);
    return response.data;
  }
};
