# mHealth (1296) Subscription Service
## Introduction
 After running the mHealth service (see http://healthyfamilycommunity.org/) for a couple of years, PIN Cambodia chose to explore long term sustainability of the service through user contribution. The model that was chosen is based on a $0.25 charge per month, which is what this codebase is meant to handle.

 ## How it works
 We use Push from Ilhasoft to manage the campaigns for mHealth. In Push, there are 4 groups set up:

- Primary group: This is the group that receives the Campaign. This is where users are first added when they sign up.
- Pending subscription confirmation from user: This group is the users are added to while we're pending them to confirm that they want to continue with the service, and pay for it. Users are moved to this group from the primary group after 6 weeks
- Confirmed subscription - Pending telco: This group is for users who have confirmed that they want to receive the service, but haven't yet been charged by the telco. Everyone in this group are checked each hour by the `unstableWebhookWorkaround.js` controller, and for each of them, the telcos are called to try to subscribe them to the Service
- Confirmed cancel subscription - Pending telco: Same as above, but with cancelation

## Running the code

There are a few tools in this repo.

### Automatic

The hourly check is managed by AWS Lambda. The code running it is `controllers/unstableWebhookWorkaround.js`. In order to deploy changes to this code, `serverless` is needed, and the correct environmental variables should be set in `config.prod.json`

To test locally, use:

    sls invoke local -f webhook_workaround_subscribe -s prod

To deploy:

    sls deploy -s prod

To run on lambda:

    sls invoke -f webhook_workaround_subscribe -s prod

Note that in order to avoid mistakes on production, the development environment is selected by default

### Get Statistics
The `getStatistics.js` file allows you to get statistics based on the contacts in Push. In order to run it, do the following (with the correct `PUSH_ACCESS_TOKEN`):

    npm install
    PUSH_ACCESS_TOKEN=xxxx node getStatistics.js

And wait a couple of minutes for it to loop through all the contacts in Push.

### Clean contacts

This is legacy code used to loop over the contacts and clean them (find users that were in the primary group by mistake, as well as moving the ones that were Smart subscribers to the pending confirmation group). This code is here for reference only at this point, and shouldn't be needed in the future unless addition telcos are added to the subscription model.
