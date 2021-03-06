From node:12.20.0
WORKDIR /usr/src/app
COPY package*.json /usr/src/app/
RUN npm install
COPY . /usr/src/app
ADD . /shared
EXPOSE 3000
ENV MONGO_HOST=mongo
CMD [ "npm", "start" ]
