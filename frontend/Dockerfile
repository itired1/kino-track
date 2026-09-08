# Stage 1: Сборка
FROM node:18-alpine as build

WORKDIR /app

# Копируем package файлы
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Stage 2: Nginx для раздачи статики
FROM nginx:alpine

# Копируем собранные файлы
COPY --from=build /app/dist /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт
EXPOSE 80

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]
