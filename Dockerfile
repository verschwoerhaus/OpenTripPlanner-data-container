FROM        progrium/busybox
MAINTAINER Digitransit version: 0.1

RUN opkg-install uhttpd
RUN printf '#!/bin/sh\nset -e\n\nchmod 755 /www\nexec /usr/sbin/uhttpd $*\n' > /usr/sbin/run_uhttpd && chmod 755 /usr/sbin/run_uhttpd
RUN printf '#!/bin/sh\nset -e\n/usr/sbin/uhttpd -f -p 0.0.0.0:$PORT -h /www' > /usr/sbin/httpd && chmod 755 /usr/sbin/httpd
VOLUME ["/www"]

ENV PORT="8080"
EXPOSE 8080

ADD target/opt/opentripplanner-data-container/webroot /www

ENTRYPOINT ["/usr/sbin/httpd" ]

