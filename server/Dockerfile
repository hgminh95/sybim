FROM ubuntu:focal

COPY . /src/

WORKDIR /work/

ENV CXX=/usr/bin/g++ \
    CC=/usr/bin/gcc

RUN apt-get -qq update \
    && DEBIAN_FRONTEND=noninteractive apt-get -qq install -y --no-install-recommends \
        build-essential \
        g++-9 \
        zlib1g-dev \
        python \
        cmake \
        libgoogle-glog-dev \
    && rm -rf /var/lib/apt/lists/*

RUN cmake -DCMAKE_BUILD_TYPE=Release /src && make

EXPOSE 1331

CMD ["./sync_server", "-p", "1331"]
