FROM node

WORKDIR /root
RUN mkdir .leveldb

WORKDIR /opt
COPY ./.next /opt/.next
COPY ./components /opt/components
COPY ./node_modules /opt/node_modules
COPY ./pages /opt/pages
COPY ./static /opt/static
COPY ./store /opt/store
COPY ./i18n.js /opt/i18n.js
COPY ./next.config.js /opt/next.config.js
COPY ./.env.prod /opt/.env
COPY ./package.json /opt/package.json
COPY ./server.js /opt/server.js

EXPOSE 3000 3001