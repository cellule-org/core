FROM node:lts

WORKDIR /app

COPY . .

WORKDIR /app/frontend

RUN npm install

RUN npm run build && mkdir -p dist

WORKDIR /app

RUN cp -r frontend/dist backend/src

WORKDIR /app/backend

EXPOSE 3000

CMD npx prisma migrate deploy && npx prisma generate && npx prisma db push --accept-data-loss && npm run dev