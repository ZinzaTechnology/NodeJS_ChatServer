FROM node:8-alpine

RUN apk add tzdata
RUN cp /usr/share/zoneinfo/Asia/Tokyo /etc/localtime
RUN echo "Asia/Tokyo" > /etc/timezone
RUN apk del tzdata

RUN npm install yarn nodemon --global

WORKDIR /app
COPY . .

RUN yarn install --no-dev

EXPOSE 3000

CMD ["yarn", "start"]
