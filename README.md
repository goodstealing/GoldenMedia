## Golden Media

Веб‑приложение для учёта просмотренного и прочитанного контента (сериалы, фильмы, аниме, манга, книги), основанное на ТЗ `ТЗ_Golden_Media.md`.

### Структура проекта

- `backend` — API на Node.js + TypeScript + SQLite.
- `frontend` — SPA‑клиент (будет создан на следующем шаге: Vite + React + TypeScript).
- `data/databases` — файлы SQLite по категориям.
- `data/covers` — обложки контента по категориям.

### Быстрый старт (backend)

1. Установить зависимости:
   ```bash
   cd backend
   npm install
   ```
2. Создать файл `.env` на основе `.env.example`.
3. Запустить сервер разработки:
   ```bash
   npm run dev
   ```

