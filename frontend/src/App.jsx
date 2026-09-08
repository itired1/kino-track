import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import RecommendationsPage from './pages/RecommendationsPage';
import ProfilePage from './pages/ProfilePage';
import HistoryPage from './pages/HistoryPage';
import FilmDetail from './components/FilmDetail';
import BottomNav from './components/BottomNav';
import SplashScreen from './components/SplashScreen';
import API from './api';

// Компонент-обёртка для анимации при смене страницы
function AnimatedPage({ children }) {
  return <div className="page-enter">{children}</div>;
}

function App() {
  const [telegramId, setTelegramId] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [splashDone, setSplashDone] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const init = async () => {
      // Показываем сплэш минимум 6 секунд
      await new Promise(r => setTimeout(r, 6000));

      try {
        // Пытаемся получить initData из Telegram
        let tgUser = null;
        if (window.Telegram?.WebApp) {
          try {
            window.Telegram.WebApp.ready();
            window.Telegram.WebApp.expand();
            window.Telegram.WebApp.setBackgroundColor('#0f0f0f');
            window.Telegram.WebApp.setHeaderColor('#0f0f0f');
          } catch(e) {}

          const initData = window.Telegram.WebApp.initData;
          const userFromData = window.Telegram.WebApp.initDataUnsafe?.user;

          if (initData) {
            // Валидируем и логиним через сервер
            try {
              const res = await API.login(initData);
              if (res.success) {
                tgUser = res.data;
                setUserInfo(res.data);
              }
            } catch (e) {
              console.warn('Login API failed, fallback to initDataUnsafe:', e.message);
            }
          }
          if (!tgUser && userFromData) {
            tgUser = { id: userFromData.id, telegram_id: userFromData.id, first_name: userFromData.first_name, last_name: userFromData.last_name, username: userFromData.username, photo_url: userFromData.photo_url };
            setUserInfo(tgUser);
          }
        }

        // Режим браузера (тестовый)
        if (!tgUser) {
          tgUser = { id: 999999, first_name: 'Гость' };
        }

        setTelegramId(tgUser.id);
        API.initUser({
          id: tgUser.telegram_id || tgUser.id,
          username: tgUser.username || '',
          first_name: tgUser.first_name || 'Гость',
          last_name: tgUser.last_name || ''
        });
      } catch (e) {
        console.error('Init error:', e);
        setTelegramId(999999);
      } finally {
        setLoading(false);
        setSplashDone(true);
        // Даём сплэшу 700мс на fade-out, затем показываем приложение
        setTimeout(() => setSplashVisible(false), 700);
      }
    };

    init();
  }, []);

  if (!splashVisible) {
    return (
      <div className="app">
        <Routes>
          <Route path="/" element={<Navigate to="/search" replace />} />
          <Route path="/search" element={<AnimatedPage key={location.pathname}><SearchPage telegramId={telegramId} /></AnimatedPage>} />
          <Route path="/recommendations" element={<AnimatedPage key={location.pathname}><RecommendationsPage telegramId={telegramId} /></AnimatedPage>} />
          <Route path="/profile" element={<AnimatedPage key={location.pathname}><ProfilePage telegramId={telegramId} userInfo={userInfo} /></AnimatedPage>} />
          <Route path="/history" element={<AnimatedPage key={location.pathname}><HistoryPage telegramId={telegramId} /></AnimatedPage>} />
          <Route path="/film/:id" element={<AnimatedPage key={location.pathname}><FilmDetail telegramId={telegramId} /></AnimatedPage>} />
        </Routes>
        <BottomNav />
      </div>
    );
  }

  return <SplashScreen done={splashDone} />;
}

export default App;