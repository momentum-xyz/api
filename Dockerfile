# syntax=docker/dockerfile:1.3
# Multi stage build for nestjs project
ARG BASE_IMAGE=node:14-alpine
FROM $BASE_IMAGE AS builder

WORKDIR /srv/app

RUN npm set audit false && npm set fund false

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# Paranoia mode, don't run npm script with secrets
RUN npm ci --ignore-scripts
# Run the install script without access to the token:
RUN npm rebuild && npm run prepare --if-present

COPY . .

RUN npm run build
RUN npm prune --production

#################
# Runtime image #
#################
FROM $BASE_IMAGE AS runtime

WORKDIR /srv/app

COPY --from=builder /srv/app/node_modules /srv/app/node_modules
COPY --from=builder /srv/app/dist /srv/app/dist
COPY --from=builder /srv/app/claimspace.sh /usr/local/bin/claimspace
RUN chmod +x /usr/local/bin/claimspace

EXPOSE 4000
ENTRYPOINT ["node"]
CMD [ "dist/main" ]

