# Nevvi

![Develop](https://github.com/Nevvi/Server/actions/workflows/deploy-dev.yml/badge.svg)
![Production](https://github.com/Nevvi/Server/actions/workflows/deploy-prod.yml/badge.svg)

The Nevvi backend is powered by AWS using API Gateway, Lambda, DynamoDB, SNS, and Cognito. The server is broken up into 
3 different applications.

#### Authentication

This app talks with Cognito to create, confirm, authenticate, and modify users in the system. 

#### Notification

This app works with SNS and DynamoDB to manage notification groups as well as sending and receiving messages from users.

#### Payment

This app connects to Braintree to manage user payment sessions and accept payments from users into Braintree.

## Technology

- AWS CLI
- node/npm 
- Serverless
- Github Actions

## Development

To test changes locally I found it easiest to just deploy a full stack to AWS under a custom stage name that doesn't 
interfere with development or production. To mimic what we do in CICD I use the serverless binary that is installed 
via NPM instead of one that I have installed globally. Versions are changing pretty frequently with Serverless so 
keeping the version consistent is nice.

1. Set your AWS access key and secret key using the AWS CLI (Serverless needs this)
2. `cd apps/{app_you_are_working_on}`
3. `../../node_modules/serverless/bin/serverless.js deploy --stage {stage i.e. tyler}`

DO NOT USE `development` or `production` as the stage name otherwise it could break dev/prod. Let CICD manage that.

This will create a new domain in API Gateway for your stage and can be accessed like https://api.development.nevvi.net/tyler-{app_you_are_working_on}/

When done it is nice to clean up the test stack by running `../../node_modules/serverless/bin/serverless.js remove --stage {stage}`
as there is nothing that will do it automatically. 