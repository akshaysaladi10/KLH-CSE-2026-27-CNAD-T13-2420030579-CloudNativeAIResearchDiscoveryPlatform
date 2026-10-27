FROM node:20-alpine
WORKDIR /app
COPY shared ./shared
COPY services/paper-service/package*.json ./services/paper-service/
RUN cd services/paper-service && npm install --production
COPY services/paper-service ./services/paper-service
WORKDIR /app/services/paper-service
ENV NODE_PATH=/app/services/paper-service/node_modules
CMD ["npm", "start"]
