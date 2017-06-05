FROM maven:3-jdk-8

MAINTAINER Digitransit version: 0.1

#need build-args ROUTER_NAME and DOCKER_TAG here
ARG ROUTER_NAME
ARG DOCKER_TAG

ENV WORK=/opt/opentripplanner-data-container
ENV WEBROOT=${WORK}/webroot
ENV PORT=8080

#log ENV vars for debug info
RUN env

RUN mkdir -p ${WORK}

WORKDIR ${WORK}

# Install dependencies
RUN apt-get update && \
  apt-get -y install \
    build-essential python-dev protobuf-compiler libprotobuf-dev \
    make swig g++ python-dev libreadosm-dev \
    libboost-graph-dev libproj-dev libgoogle-perftools-dev \
    osmctools unzip zip python-pyproj wget python-argh 1>/dev/null

RUN wget https://bootstrap.pypa.io/get-pip.py && \
  python get-pip.py && \
  pip install imposm.parser && \
  pip install argh 1>/dev/null

RUN mkdir -p ${WORK}/one-busaway-gtfs-transformer && \
  wget -O ${WORK}/one-busaway-gtfs-transformer/onebusaway-gtfs-transformer-cli.jar "http://nexus.onebusaway.org/service/local/artifact/maven/content?r=public&g=org.onebusaway&a=onebusaway-gtfs-transformer-cli&v=1.3.4-SNAPSHOT"

# TODO: Fix pyproj commit when it works
RUN git clone https://github.com/jswhit/pyproj.git && \
  cd pyproj && \
  git checkout ec9151e8c6909f7fac72bb2eab927ff18fa4cf1d && \
  python setup.py build &>/dev/null&& \
  python setup.py install &>/dev/null&& \
  cd ..

RUN git clone --recursive -b fastmapmatch https://github.com/HSLdevcom/gtfs_shape_mapfit.git && \
  cd gtfs_shape_mapfit && \
  make -C pymapmatch 1>/dev/null&& \
  cd ..


ADD finland.osm.pbf ${WORK}/router-finland/finland-latest.osm.pbf
ADD hsl.osm.pbf ${WORK}/router-hsl/helsinki_finland.osm.pbf

# Dependencies installed, next do build
ADD . ${WORK}

RUN bash build-routers.sh
