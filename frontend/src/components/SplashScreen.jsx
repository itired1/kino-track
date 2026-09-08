import React, { useState, useEffect } from 'react';
import { Clapperboard } from 'lucide-react';

// Экран загрузки (сплэш) приложения
function SplashScreen({ done }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Анимация прогресса загрузки — плавная и не слишком быстрая
    const interval = setInterval(() => {
      setProgress(prev => {
        // Скорость уменьшается к концу, чтобы загрузка казалась длинной
        const step = prev < 50 ? 8 : prev < 80 ? 5 : 2;
        const next = prev + step + Math.random() * 3;
        return next >= 100 ? 100 : next;
      });
    }, 350);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`splash-screen ${done ? 'splash-hide' : ''}`}>
      <div className="splash-content">
        <div className="splash-logo">
          <Clapperboard size={56} strokeWidth={1.5} color="#f50" />
        </div>
        <h1 className="splash-title">KinoTrack</h1>
        <p className="splash-subtitle">Твой личный киномир</p>

        <div className="splash-progress">
          <div className="splash-progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="splash-loading-text">
          {progress < 20 ? 'Запускаем...' : progress < 40 ? 'Загружаем фильмы...' : progress < 60 ? 'Подключаем базу данных...' : progress < 80 ? 'Подбираем рекомендации...' : 'Готовим всё для тебя...'}
        </p>
      </div>
    </div>
  );
}

export default SplashScreen;