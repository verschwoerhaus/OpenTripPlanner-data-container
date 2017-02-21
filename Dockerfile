FROM        progrium/busybox
MAINTAINER Digitransit version: 0.1

RUN opkg-install uhttpd
RUN printf '#!/bin/sh\nset -e\n\nchmod 755 /www\nexec /usr/sbin/uhttpd $*\n' > /usr/sbin/run_uhttpd && chmod 755 /usr/sbin/run_uhttpd

VOLUME ["/www"]

EXPOSE 8080
ADD target/opt/opentripplanner-data-container/webroot /www

ENTRYPOINT ["/usr/sbin/run_uhttpd", "-f", "-p", "0.0.0.0:8080", "-h", "/www" ]
