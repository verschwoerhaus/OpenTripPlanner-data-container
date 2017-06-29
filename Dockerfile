FROM       node:8.1-alpine
MAINTAINER Digitransit version: 0.1

WORKDIR /opt/otp-data-builder

ADD https://get.docker.com/builds/Linux/x86_64/docker-1.11.2.tgz /opt/otp-data-builder
RUN cd /opt/otp-data-builder ; tar xzf docker-1.11.2.tgz ; cp docker/docker /usr/bin/docker ; rm -rf docker*

ADD package-lock.json package.json *.js *.sh router-* gulpfile.js /opt/otp-data-builder/
ADD task /opt/otp-data-builder/task
RUN npm install

CMD ["node", "index.js"]
