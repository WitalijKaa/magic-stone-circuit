# syntax=docker/dockerfile:1

FROM node:20.19.6-alpine AS build
WORKDIR /build_dir
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.29.3-alpine
RUN rm -rf /usr/share/nginx/html/*
RUN rm /etc/nginx/conf.d/default.conf
COPY docker/nginx.conf /etc/nginx/conf.d/magic-stones.conf

WORKDIR /app/magic-stones
COPY --from=build /build_dir/resources ./resources
COPY --from=build /build_dir/index.html /build_dir/main.css /build_dir/modal.css /build_dir/favicon.ico ./
COPY --from=build /build_dir/dist ./dist

CMD ["nginx", "-g", "daemon off;"]

EXPOSE 80/tcp
