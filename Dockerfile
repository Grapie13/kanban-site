FROM alpine
WORKDIR /app
RUN apk --update add nodejs npm
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "start"]