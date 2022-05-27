FROM quay.io/keycloak/keycloak:17.0.0
ADD ./initial-data /initial-data
RUN /opt/keycloak/bin/kc.sh import --dir /initial-data