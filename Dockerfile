FROM node:lts

WORKDIR /app

COPY . .

WORKDIR /app/frontend

RUN npm install

RUN npm run build && mkdir -p dist

WORKDIR /app

RUN cp -r frontend/dist backend/public

WORKDIR /app/backend

EXPOSE 3000

CMD ["npm", "run", "dev"]