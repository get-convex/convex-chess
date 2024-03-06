This is a chess app built on Convex.

## Testing

This app has tests that run against a local Convex backend.

To run these tests:
* Clone the Convex open source backend repo and follow setup instructions
* Set `CONVEX_LOCAL_BACKEND` to the path of the repo
* `npm run test`


How this works:
* `npm run test` ensures a Convex local backend is running (`testing/checkLocalBackend.js`)
* It then pushes the functions in this repo to the backend
* It sets the `IS_TEST` environment variable, which allows running "test only" functions (`convex/testing/`)
* It runs jest tests using the `ConvexClient` hooked up to the local backend (`testing/ConvexTestingHelper.ts`)

`tests.test.ts` has some examples of tests. 

Functions that should only be run in tests, like `clearAll`, which resets data between
each test or setup functions should use the `testingQuery` or `testingMutation` wrapper
to prevent these functions from being called in production or developement.

Functions needing auth can use `t.newIdentity` and `t.withIdentity` to run functions
with the specified user identity.


Limitations:
Because all of these tests run against the same backend, there is a large risk
of leaking state between tests.

To solve this we:

1. Set Jest's `maxWorkers` to 1 so only 1 test runs at a time.
2. Have a `clearAll` mutation that deletes all data after each test.

Scheduled functions and crons will run as they normally do -- tests can assert
on the `_scheduled_functions` table but cannot advance time or run scheduled functions
manually.

