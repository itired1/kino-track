// ============================================
// Telegram бот — приветствие и кнопка входа
// Интегрирован в основной сервер (запускается на Render)
// ============================================

const TelegramBot = require('node-telegram-bot-api');

// URL веб-приложения (настраивается через env WEB_APP_URL).
// Дефолт — актуальный прод-адрес, чтобы кнопка работала даже без env.
const WEB_APP_URL = process.env.WEB_APP_URL || process.env.FRONTEND_URL || 'https://kino-track-1.onrender.com';
const BOT_ENABLED = process.env.BOT_ENABLED !== 'false';

let bot = null;

function startBot() {
    if (!BOT_ENABLED) return;
    if (!process.env.TELEGRAM_BOT_TOKEN) {
        console.warn('🤖 TELEGRAM_BOT_TOKEN не задан — бот не запущен');
        return;
    }

    try {
        bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
        bot.setChatMenuButton({
            menu_button: {
                type: 'web_app',
                text: 'Открыть KinoTrack',
                web_app: { url: WEB_APP_URL }
            }
        }).catch(err => console.warn('🤖 Не удалось обновить кнопку меню:', err.message));
    } catch (e) {
        console.error('🤖 Ошибка запуска бота:', e.message);
        return;
    }

    // Приветствие при /start (кнопка запуска приложения + кнопка меню)
    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        const firstName = msg.from.first_name || 'друг';
        const username = msg.from.username ? `@${msg.from.username}` : '';

        const text =
            `🎬 <b>Привет, ${firstName}${username ? ' ' + username : ''}!</b>\n\n` +
            `Меня зовут <b>lilbruhill</b> 👋\n` +
            `Я твой персональный киномир прямо в Telegram.\n\n` +
            `Что я умею:\n` +
            `🔍 Искать любые фильмы\n` +
            `⭐ Ставить оценки и вести рейтинги\n` +
            `🔥 Следить за новинками\n` +
            `🤖 Подбирать рекомендации под твой вкус\n` +
            `👥 Добавлять друзей и смотреть их кино\n` +
            `💬 Оставлять рецензии к фильмам\n` +
            `📊 Показывать статистику просмотров\n\n` +
            `Нажми кнопку ниже, чтобы открыть приложение 👇`;

        bot.sendMessage(chatId, text, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '🎬 Открыть KinoTrack',
                            web_app: { url: WEB_APP_URL }
                        }
                    ],
                    [
                        { text: 'ℹ️ О боте', callback_data: 'about' },
                        { text: '⭐ Популярное', callback_data: 'popular' }
                    ]
                ]
            }
        });
    });

    // Кнопки в сообщении
    bot.on('callback_query', async (query) => {
        const chatId = query.message.chat.id;
        try {
            await bot.answerCallbackQuery(query.id);

            if (query.data === 'about') {
                await bot.sendMessage(chatId,
                    `🎬 <b>KinoTrack</b> — приложение для настоящих киноманов.\n\n` +
                    `• Поиск фильмов по названию и актёрам\n` +
                    `• Оценки от 1 до 10\n` +
                    `• Коллекции «смотрю», «буду смотреть», «брошено»\n` +
                    `• Личная статистика и топ жанров\n` +
                    `• Рекомендации на основе твоих оценок\n` +
                    `• Новинки и популярное\n\n` +
                    `Всё хранится безопасно и привязано к твоему Telegram-аккаунту.`,
                    { parse_mode: 'HTML' }
                );
            }

            if (query.data === 'popular') {
                await bot.sendMessage(chatId,
                    `🔥 Хочешь узнать популярные фильмы?\n` +
                    `Открой приложение и зайди во вкладку «Популярное»!`,
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: '🎬 Открыть KinoTrack', web_app: { url: WEB_APP_URL } }]
                            ]
                        }
                    }
                );
            }
        } catch (e) {
            console.error('Bot callback error:', e.message);
        }
    });

    // Команда /app — быстрый запуск приложения
    bot.onText(/\/app/, (msg) => {
        bot.sendMessage(msg.chat.id, '🎬 Открываем KinoTrack!', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🎬 Открыть KinoTrack', web_app: { url: WEB_APP_URL } }]
                ]
            }
        });
    });

    // Команда /menu — кнопка запуска приложения
    bot.onText(/\/menu/, (msg) => {
        bot.sendMessage(msg.chat.id, '📱 Нажми кнопку, чтобы открыть приложение:', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🎬 Открыть KinoTrack', web_app: { url: WEB_APP_URL } }]
                ]
            }
        });
    });

    console.log(`🤖 Бот запущен. WebApp URL: ${WEB_APP_URL}`);
}

module.exports = { startBot };