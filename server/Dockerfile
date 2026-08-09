# Zero-dependency service, so the image is just Node plus one file.
FROM node:22-alpine

ENV NODE_ENV=production \
    PORT=4000 \
    DATA_FILE=/data/tasks.json

WORKDIR /app

COPY package.json ./
COPY server.js ./

# Persisted task data lives on a volume so it survives `docker compose down`.
RUN mkdir -p /data && chown -R node:node /data /app
VOLUME ["/data"]

USER node
EXPOSE 4000

HEALTHCHECK --interval=10s --timeout=3s --start-period=3s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
