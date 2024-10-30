# Use the Node.js 20 image with Alpine for a smaller footprint
FROM node:20-alpine AS build

LABEL maintainer="admin"
LABEL description="This Dockerfile installs the rice-inspection API."

WORKDIR /api

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE ${API_PORT}

CMD ["npm", "start"]