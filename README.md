# OpenTripPlanner-data-containers
[![Build](https://api.travis-ci.org/HSLdevcom/OpenTripPlanner-data-container.svg?branch=master)](https://travis-ci.org/HSLdevcom/OpenTripPlanner-data-container)

## This dockerization project:

1. Fetches HSL, Liikennevirasto, and waltti cities GTFS data
2. Alters, and transforms that data
3. Forms OpenTripPlanner router zip files from the data
4. Creates and pushes 3 docker images (hsl/waltti/finland)

Each docker image runs a http server listening to port 8080, serving both a gtfs data bundle and a pre-built graph:
- hsl: http://localhost:8080/router-hsl.zip and graph-hsl-<otpversion>.zip
- waltti: http://localhost:8080/router-waltti.zip and graph-waltti-<otpversion>.zip
- finland: http://localhost:8080/router-finland.zip and graph-finland-<otpversion>.zip

