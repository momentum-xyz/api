# Momentum API

The Momentum API

## Build

```console
npm run build
```

## Run

This application depends on having a connection with MySQL  
This application depends on having a connection with MQTT  
This application can depend on having Hydra running and direct access to it's admin API.  
This application can depend on having an instance of the render-service running in order to use the render related endpoints.  

| env | Description | Default |
| --- | --- | --- |
| `DB_HOST` | The MySQL host | |
| `DB_PORT` | The MySQL port | |
| `DB_USERNAME` | The MySQL username | |
| `DB_PASSWORD` | The MySQL password | |
| `DB_DATABASE` | The MySQL database | |
| `MQTT_BROKER_HOST` | The MQTT host | |
| `MQTT_BROKER_PORT` | The MQTT port | |
| `MQTT_BROKER_USER` | The MQTT username | |
| `MQTT_BROKER_PASSWORD` | The MQTT password | |
| `RENDER_DEFAULT_URL` | Default render service URL | |
| `RENDER_INTERNAL_URL` | Internal render service URL | |
| `OIDC_PROVIDERS` | Active OIDC providers separated by ',' | |
| `OIDC_MOMENTUM_URL` | Momentum OIDC provider URL | |
| `OIDC_MOMENTUM_ID` | Momentum OIDC provider ID | |
| `OIDC_MOMENTUM_SECRET` | Momentum OIDC secret | |
| `OIDC_MOMENTUM_ADDITIONAL_PARTY`  | Momentum OIDC AP | |
| `OIDC_WEB3_ID` | Web3 OIDC ID | |
| `OIDC_WEB3_URL` | Web3 OIDC URL | |
| `OIDC_WEB3_INTROSPECTION_URL` | Web3 OIDC introspection URL | |
| `OIDC_WEB3_SECRET` | Web3 OIDC secret | |
| `OIDC_WEB3_ADDITIONAL_PARTY` | Web3 OIDC AP | |
| `OIDC_GUEST_ID` | Guest OIDC ID | |
| `OIDC_GUEST_URL` | Guest OIDC URL | |
| `OIDC_GUEST_INTROSPECTION_URL` | Guest OIDC Introspection URL | |
| `OIDC_GUEST_SECRET` | Guest OIDC secret | |
| `OIDC_GUEST_ADDITIONAL_PARTY` | Guest OIDC AP | |
| `SYSTEM_KIND` | Current kind of environment | development |
| `AGORA_APP_ID` | Name/path of a YAML config file to read | |
| `AGORA_APP_CERTIFICATE` | Name/path of a YAML config file to read | |  

Run the server:    

```console
npm run start
```
Or when developing  
```console
npm run start:dev
```

## Use

HTTP API endpoints can be found in the Swagger docs at: http://<domain>/api/v3/backend/docs/


## Test

Project has some automated tests.

```console
npm run test
```
