FROM node:lts

WORKDIR /app

COPY . .

COPY frontend/dist backend/src

WORKDIR /app/backend

EXPOSE 3001

CMD ["npm", "run", "dev"]