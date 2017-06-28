FROM       node:8.1-alpine
MAINTAINER Digitransit version: 0.1

WORKDIR /opt/datapipe

ADD https://get.docker.com/builds/Linux/x86_64/docker-1.11.2.tgz /opt/datapipe
RUN cd /opt/datapipe ; tar xzf docker-1.11.2.tgz ; cp docker/docker /usr/bin/docker ; rm -rf docker*

ADD package.json *.js *.sh router-* gulpfile.js /opt/datapipe/
ADD task /opt/datapipe/task
RUN npm install

CMD ["node", "index.js"]
