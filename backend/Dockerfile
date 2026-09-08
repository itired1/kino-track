FROM node:18-alpine

WORKDIR /app

# Копируем package файлы
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Открываем порт
EXPOSE 3000

# Запускаем сервер
CMD ["npm", "start"]
