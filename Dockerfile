FROM       node:8.1-alpine
MAINTAINER Digitransit version: 0.1

RUN apk add --update --no-cache \
  bash \
  curl \
  && rm -rf /var/cache/apk/*

WORKDIR /opt/otp-data-builder

ADD https://get.docker.com/builds/Linux/x86_64/docker-1.11.2.tgz /opt/otp-data-builder
RUN cd /opt/otp-data-builder ; tar xzf docker-1.11.2.tgz ; cp docker/docker /usr/bin/docker ; rm -rf docker*

ADD package-lock.json package.json *.js *.sh  gulpfile.js /opt/otp-data-builder/
ADD task /opt/otp-data-builder/task
ADD router-finland /opt/otp-data-builder/router-finland
ADD router-hsl /opt/otp-data-builder/router-hsl
ADD router-waltti /opt/otp-data-builder/router-waltti
ADD otp-data-container /opt/otp-data-builder/otp-data-container

RUN npm install

CMD bash ./run-builder.sh
