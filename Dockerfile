FROM node:19.8.1-bullseye-slim

ENV PROJECT_ROOT /app

RUN npm install -g pnpm

RUN mkdir -p ${PROJECT_ROOT}
ADD . ${PROJECT_ROOT}
WORKDIR ${PROJECT_ROOT}

EXPOSE 3000

CMD ["pnpm", "start"]
