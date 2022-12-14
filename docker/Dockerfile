# syntax=docker/dockerfile:1
FROM debian:11
RUN apt update
RUN apt upgrade

RUN apt install --no-install-recommends --no-install-suggests -y nginx nodejs npm

WORKDIR /app
COPY . .

RUN npm install
RUN npm run build

COPY /docker/nginx.conf /etc/nginx/sites-available/default

CMD ["/usr/sbin/nginx", "-g", "daemon off;"]

EXPOSE 80/tcp
