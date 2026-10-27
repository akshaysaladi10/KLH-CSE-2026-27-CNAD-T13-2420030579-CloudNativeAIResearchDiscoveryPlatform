FROM node:20-alpine
WORKDIR /app
COPY shared ./shared
COPY services/search-recommendation-service/package*.json ./services/search-recommendation-service/
RUN cd services/search-recommendation-service && npm install --production
COPY services/search-recommendation-service ./services/search-recommendation-service
WORKDIR /app/services/search-recommendation-service
ENV NODE_PATH=/app/services/search-recommendation-service/node_modules
CMD ["npm", "start"]
