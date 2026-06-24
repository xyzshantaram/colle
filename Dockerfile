FROM denoland/deno:alpine-2.8.3 AS builder

RUN apk add --no-cache libstdc++

WORKDIR /app

COPY deno.json deno.lock ./
COPY src/ ./src/
COPY mod.ts ./

RUN deno cache mod.ts

FROM denoland/deno:alpine-2.8.3

RUN apk add --no-cache libstdc++

WORKDIR /app

COPY --from=builder /app/deno.json /app/deno.lock ./
COPY --from=builder /app/src/ ./src/
COPY --from=builder /app/mod.ts ./
COPY public/ ./public/

RUN deno cache mod.ts && \
    mkdir -p /app/data && \
    chown -R deno:deno /app

USER deno

ENV COLLE_DB_PATH=/app/data/colle.db
ENV COLLE_ENV=PROD
ENV COLLE_PORT=3000

EXPOSE 3000

CMD ["run", "-A", "--unstable-kv", "./mod.ts"]
