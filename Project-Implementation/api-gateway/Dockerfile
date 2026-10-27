FROM node:20-alpine
WORKDIR /app
COPY shared ./shared
COPY api-gateway/package*.json ./api-gateway/
RUN cd api-gateway && npm install --production
COPY api-gateway ./api-gateway
WORKDIR /app/api-gateway
ENV NODE_PATH=/app/api-gateway/node_modules
CMD ["npm", "start"]
