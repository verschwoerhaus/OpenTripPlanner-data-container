FROM openjdk:8-jre

MAINTAINER Digitransit version: 0.1

ADD build-builder.sh ${WORK}

VOLUME /data

RUN ./build-builder.sh && rm build-builder.sh
