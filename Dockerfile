FROM node:lts

WORKDIR /app

COPY . .

COPY frontend/dist backend/src

WORKDIR /app/backend

EXPOSE 3000

CMD ["npm", "run", "dev"]