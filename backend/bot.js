# ============================================
# Скрипт для запуска Telegram бота
# ============================================

const TelegramBot = require('node-telegram-bot-api');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8623644777:AAHi2vnGjG0a8rU6HJr2BSiwllb86qsA2CU';

// URL веб-приложения (заменить на свой после деплоя)
const WEB_APP_URL = process.env.WEB_APP_URL || 'https://your-frontend-url.com';

const bot = new TelegramBot(TOKEN, { polling: true });

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name;

  bot.sendMessage(chatId, `👋 Привет, ${firstName}!`, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🎬 Открыть KinoTrack',
            web_app: { url: WEB_APP_URL }
          }
        ],
        [
          {
            text: 'ℹ️ О боте',
            callback_data: 'about'
          }
        ]
      ]
    }
  });
});

// Обработка callback query
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;

  if (query.data === 'about') {
    bot.sendMessage(
      chatId,
      `🎬 <b>KinoTrack</b> — ваше персональное приложение для отслеживания фильмов.

📊 <b>Возможности:</b>
• Поиск фильмов по названию и актёрам
• Оценка фильмов от 1 до 10
• Статистика и распределение оценок
• Топ любимых жанров и режиссёров
• Персональные рекомендации
• История просмотров

Нажмите кнопку ниже, чтобы начать!`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🎬 Открыть KinoTrack',
                web_app: { url: WEB_APP_URL }
              }
            ]
          ]
        }
      }
    );
  }
});

console.log('🤖 Бот kinopoisklilbot запущен...');
