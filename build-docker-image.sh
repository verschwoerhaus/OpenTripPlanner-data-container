#!/bin/bash

# Set these environment variables
#ROUTER_NAME // hsl/waltti/finland
#DOCKER_USER // dockerhub credentials
#DOCKER_AUTH

set -e

echo "Building for" $ROUTER_NAME

ORG=hsldevcom
CONTAINER=opentripplanner-data-container
DOCKER_TAG=${TRAVIS_COMMIT:-$TRAVIS_BUILD_ID}
DOCKER_IMAGE=$ORG/$CONTAINER-$ROUTER_NAME
DOCKER_BUILDER_IMAGE=$DOCKER_IMAGE:builder
DOCKER_LATEST_IMAGE=$DOCKER_IMAGE:latest
DOCKER_PROD_IMAGE=$DOCKER_IMAGE:prod
export DOCKER_TAGGED_IMAGE=$DOCKER_IMAGE:$DOCKER_TAG

# Build data with builder
rm -rf target build
docker build --build-arg NAME="$NAME" --tag=$DOCKER_BUILDER_IMAGE -f Dockerfile.builder .
mkdir target
docker run --rm --entrypoint tar $DOCKER_BUILDER_IMAGE -c /opt/$CONTAINER/webroot|tar x -C target

#prebuild graph
mkdir -p build/$ROUTER_NAME
unzip -j target/opt/$CONTAINER/webroot/router-$ROUTER_NAME.zip -d build/$ROUTER_NAME/
VERSION=`docker run --rm --entrypoint /bin/bash hsldevcom/opentripplanner:prod  -c "java -jar otp-shaded.jar --version"|grep commit|cut -d' ' -f2`
docker run -v `pwd`/build:/opt/opentripplanner/graphs --rm --entrypoint /bin/bash hsldevcom/opentripplanner:prod  -c "java -Xmx6g -jar otp-shaded.jar --build graphs/$ROUTER_NAME"
cd build/
zip graph-$ROUTER_NAME-$VERSION.zip $ROUTER_NAME/router-config.json $ROUTER_NAME/Graph.obj
cd ..

#build docker image
docker build --tag=$DOCKER_TAGGED_IMAGE -f Dockerfile .
docker login -u $DOCKER_USER -p $DOCKER_AUTH
docker push $DOCKER_TAGGED_IMAGE

#test new image

if [ "$ROUTER_NAME" == "hsl" ]; then
    export MAX_WAIT=10
    export URL=http://127.0.0.1:10000/otp/routers/default/plan?fromPlace=60.19812876015124%2C24.934051036834713&toPlace=60.218630210423306%2C24.807472229003906
elif [ "$ROUTER_NAME" == "waltti" ]; then
    export MAX_WAIT=15
    export URL=http://127.0.0.1:10000/otp/routers/default/plan?fromPlace=60.44638185995603%2C22.244396209716797&toPlace=60.45053041945487%2C22.313575744628906
else
    export MAX_WAIT=25
    export URL=http://127.0.0.1:10000/otp/routers/default/plan?fromPlace=60.19812876015124%2C24.934051036834713&toPlace=60.218630210423306%2C24.807472229003906
fi

./test.sh

#if ok, tag and push to dev and production
docker tag -f $DOCKER_TAGGED_IMAGE $DOCKER_LATEST_IMAGE
docker push $DOCKER_LATEST_IMAGE

#enable when new build is tested
#docker tag -f $DOCKER_TAGGED_IMAGE $DOCKER_PROD_IMAGE
#docker push $DOCKER_PROD_IMAGE
