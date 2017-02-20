FROM        progrium/busybox
MAINTAINER  Fletcher Nichol <fnichol@nichol.ca>

RUN opkg-install uhttpd
RUN printf '#!/bin/sh\nset -e\n\nchmod 755 /www\nexec /usr/sbin/uhttpd $*\n' > /usr/sbin/run_uhttpd && chmod 755 /usr/sbin/run_uhttpd

VOLUME ["/www"]

EXPOSE 8080

ENTRYPOINT ["/usr/sbin/run_uhttpd", "-f", "-p", "8080", "-h", "/www"]
CMD [""]
ADD target/opt/opentripplanner-data-container/webroot /www
