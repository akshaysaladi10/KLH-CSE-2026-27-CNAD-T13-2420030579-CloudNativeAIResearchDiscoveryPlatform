FROM node:20-alpine
WORKDIR /app
COPY shared ./shared
COPY services/auth-service/package*.json ./services/auth-service/
RUN cd services/auth-service && npm install --production
COPY services/auth-service ./services/auth-service
WORKDIR /app/services/auth-service
ENV NODE_PATH=/app/services/auth-service/node_modules
CMD ["npm", "start"]
