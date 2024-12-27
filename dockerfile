FROM clux/muslrust as backend
WORKDIR /opt/iami
COPY Cargo.* ./
RUN mkdir src && touch src/main.rs && cargo fetch
COPY src src
RUN cargo build --release

# FROM node as frontend
# WORKDIR /opt/iami/
# COPY package* ./
# RUN npm install
# COPY src src
# COPY *.json *.html *.ts ./
# RUN npm run build

FROM alpine
WORKDIR /opt/iami
COPY --from=backend /opt/iami/target/x86_64-unknown-linux-musl/release/simple-match-logger sml
# COPY --from=frontend /opt/iami/dist dist
COPY dist dist
ENV STATIC_DIR=/opt/iami/dist
ENTRYPOINT [ "./sml" ]
