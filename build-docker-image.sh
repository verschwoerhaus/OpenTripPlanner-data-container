#!/bin/bash
set -e
ORG=hsldevcom
DOCKER_IMAGE=opentripplanner-data-container

# Set these environment variables
#DOCKER_TAG=
#DOCKER_EMAIL=
#DOCKER_USER=
#DOCKER_AUTH=

# Build data with builder
rm -rf target build
docker build --tag="$ORG/$DOCKER_IMAGE:builder" -f Dockerfile.builder .
mkdir target
docker run --rm --entrypoint tar hsldevcom/opentripplanner-data-container:builder -c /opt/opentripplanner-data-container/webroot|tar x -C target

mkdir build

##prebuild graph
function prebuild () {
  NAME=$1
  mkdir build/$NAME
  unzip -j target/opt/opentripplanner-data-container/webroot/router-$NAME.zip  -d build/$NAME/
  VERSION=`docker run --rm --entrypoint /bin/bash hsldevcom/opentripplanner:prod  -c "java -jar otp-*-shaded.jar --version"|grep commit|cut -d' ' -f2`
  docker run -v `pwd`/build:/opt/opentripplanner/graphs --rm --entrypoint /bin/bash hsldevcom/opentripplanner:prod  -c "java -Xmx6g -jar otp-*-shaded.jar --build graphs/$NAME"
  cd build/
  zip graph-$NAME-$VERSION.zip $NAME/router-config.json $NAME/Graph.obj
  cd ..
}

prebuild 'hsl'
prebuild 'waltti'
prebuild 'finland'

docker build --tag="$ORG/$DOCKER_IMAGE:$DOCKER_TAG" -f Dockerfile .
docker login -e $DOCKER_EMAIL -u $DOCKER_USER -p $DOCKER_AUTH
docker push $ORG/$DOCKER_IMAGE:$DOCKER_TAG
docker tag -f $ORG/$DOCKER_IMAGE:$DOCKER_TAG $ORG/$DOCKER_IMAGE:latest
docker push $ORG/$DOCKER_IMAGE:latest
