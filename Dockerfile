FROM node:12.16
COPY /app code
WORKDIR /code

ENV NODE_ENV=production
RUN npm ci
CMD ["npm", "start"]