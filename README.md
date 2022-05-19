# _TEMPLATE_-service

## Getting started

1. Install npm dependencies with `npm i`.

## Running the application in develop mode

1. Run `npm start:dev` to run the application.

## Running integration tests

1. `npm run test:e2e:runenv` to run MySQL, Mosquitto and Keyclock locally
2. `npm run test:e2e` to run tests

## Integration tests environment
Available web UIs:
1. Keycloak - http://localhost:8081/
2. Mailcatcher - http://localhost:1080/

Each test case should clean data **before** execution. 
It will help to debug - all data will be available after test execution  
