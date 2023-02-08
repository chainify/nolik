FROM ubuntu:jammy
ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update
RUN apt-get upgrade
RUN apt-get install -y build-essential gcc libclang-dev make cmake curl

RUN curl https://sh.rustup.rs -sSf | bash -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

WORKDIR /usr/src/node-nolik
COPY . .

RUN rustup default stable
RUN rustup update
RUN rustup update nightly
RUN rustup target add wasm32-unknown-unknown --toolchain nightly
RUN cargo build --release

EXPOSE 9933 9944 30333
