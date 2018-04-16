# Build process for OpenTripPlanner-data-container

[![Greenkeeper badge](https://badges.greenkeeper.io/HSLdevcom/OpenTripPlanner-data-container.svg)](https://greenkeeper.io/)
[![Build](https://api.travis-ci.org/HSLdevcom/OpenTripPlanner-data-container.svg?branch=master)](https://travis-ci.org/HSLdevcom/OpenTripPlanner-data-container)

## This project:
Contains tools for fetching, building and deploying fresh otp data-containers
for consumption by hsl, waltti and finland otp instances.

## Main components

### otp-data-builder
The actual data builder application. This is a node.js application that fetches
and processes new gtfs/osm data. It's build around gulp and all separate steps of
databuilding process can also be called directly from the source tree. The only
required external dependency is docker. Docker is used for launching external
commands that do for example data manipulation.

install gulp cli:
  `npm install -g gulp-cli`

install app deps:
  `npm install`

update osm data:
  `gulp osm:update`

download new gtfs data for waltti:
  `ROUTERS=waltti gulp gtfs:dl`

#### Configuration
It is possible to change the behaviour of the data builder by defining environment variables.

* "DOCKER_USER" defines username for authenticating to docker hub.
* "DOCKER_AUTH" defines password for authenticating to docker hub.
* (Optional, default latest, prod and tag based on date) "DOCKER_TAG" defines what will be the updated docker tag of data container images in remote register.
* (Optional, default ${process.cwd()}/data) "HOST_DATA" defines base path for volume directories.
* (Optional, default 'finland, waltti, hsl') "ROUTERS" defines which data containers are being built and deployed.
* (Optional, default ${process.cwd()}/data) "DATA" defines base path for data directories in container's file system.
* (Optional, default '0 0 3 * * *') "CRON" defines when data build is being run.

#### Data processing steps

Seed data can be retrieved with a single gulp command:

1. seed

Downloads previous data containers and extracts osm and gtfs data from there
and places it in 'data/ready' directory. Old data acts as backup in case fetching/validating new data fails.

Currently there is single processing step for OSM data. Because gtfs processing steps require osm data,
the osm data must be available before running the gtfs:fit stage later below.

2. osm:update

This command downloads required OSM packages from configured location, tests the file(s) with otp,
and if tests pass data is copied to 'data/downloads/osm' directory.

The data is then processed with the following steps:

3. gtfs:dl
Downloads a GTFS package from configured location, tests the file with otp, if
test passes data is copied to directory 'data/fit/gtfs'. The resulting zip is named <feedid>.zip.

4. gtfs:fit
Runs configured map fits. Copies data to directory 'data/filter/gtfs'.

5. gtfs:filter
Runs configured filterings. Copies data to directory 'data/id/gtfs'.

6. gtfs:id
Sets the gtfs feed id to <id> and copies data to directory 'data/ready/gtfs'.

Building the router from available (seeded or downloaded and processed) data:

7. router:buildGraph

Prebuilds graph with current production version of OTP and creates zip files
ready for building the otp-data container.

The final step is router deployment

8. deploy.sh

Builds a data container, starts it, starts a production version of otp and runs
a simple routing test to verify that the data container looks ok. If test passes
the fresh data container is pushed Docker Hub.

Normally when the application is running (as a container) the index.js is used.
It runs the data updating process on schedule specified as cron pattern.

The end result of a data build is a docker container uploaded into dockerhub, ready to be deployed

Each datacontainer image runs a http server listening to port 8080, serving both a gtfs data bundle and a pre-built graph:
- hsl: http://localhost:8080/router-hsl.zip and graph-hsl-<otpversion>.zip
- waltti: http://localhost:8080/router-waltti.zip and graph-waltti-<otpversion>.zip
- finland: http://localhost:8080/router-finland.zip and graph-finland-<otpversion>.zip

### otp-data-tools
Contains tools for gtfs manipulation, such as One Bus Away gtfs filter...
these tools are packaged inside docker container and are used dunring the data build process
