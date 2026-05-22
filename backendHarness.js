// Taken from https://github.com/get-convex/convex-helpers/blob/main/backendHarness.js

const http = require("http");
const crypto = require("crypto");
const { spawn, exec, execSync } = require("child_process");

// Run a command against a fresh local backend, handling setting up and tearing down the backend.

// Checks for a local backend running on port 3210.
const parsedUrl = new URL("http://127.0.0.1:3210");

async function isBackendRunning(backendUrl) {
  return new Promise ((resolve) => {
  http
  .request(
    {
      hostname: backendUrl.hostname,
      port: backendUrl.port,
      path: "/version",
      method: "GET",
    },
    (res) => {
      resolve(res.statusCode === 200)
    }
  )
  .on("error", () => { resolve(false) })
  .end();
  })
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const waitForLocalBackendRunning = async (backendUrl) => {
  let isRunning = await isBackendRunning(backendUrl);
  let i = 0
  while (!isRunning) {
    if (i % 10 === 0) {
      // Progress messages every ~5 seconds
      console.log("Waiting for backend to be running...")
    }
    await sleep(500);
    isRunning = await isBackendRunning(backendUrl);
    i += 1
  }
  return

}

let backendProcess = null

function cleanup() {
  if (backendProcess !== null) {
    console.log("Cleaning up running backend")
    backendProcess.kill("SIGTERM")
    execSync("just reset-local-backend")
  }
}

async function runWithLocalBackend(command, backendUrl) {
  if (process.env.CONVEX_LOCAL_BACKEND_PATH === undefined) {
    console.error("Please set environment variable CONVEX_LOCAL_BACKEND_PATH first")
    process.exit(1)
  }
  const isRunning = await isBackendRunning(backendUrl);
  if (isRunning) {
    console.error("Looks like local backend is already running. Cancel it and restart this command.")
    process.exit(1)
  }
  execSync("just reset-local-backend")

  const instanceName = "carnitas";
  const instanceSecret = crypto.randomBytes(32).toString("hex");
  const keyResponse = await fetch(
    "https://provision.convex.dev/api/local_deployment/generate_admin_key",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instanceName, instanceSecret }),
    },
  );
  if (!keyResponse.ok) {
    throw new Error(
      `Failed to generate admin key: ${keyResponse.status} ${await keyResponse.text()}`,
    );
  }
  const { adminKey } = await keyResponse.json();
  if (typeof adminKey !== "string" || adminKey.length === 0) {
    throw new Error("Provisioning response did not include a valid adminKey");
  }

  backendProcess = exec(
    `CONVEX_TRACE_FILE=1 just run-local-backend --instance-name ${instanceName} --instance-secret ${instanceSecret}`,
  )
  await waitForLocalBackendRunning(backendUrl)
  console.log("Backend running! Logs can be found in $CONVEX_LOCAL_BACKEND_PATH/convex-local-backend.log")
  const innerCommand = new Promise((resolve) => {
    const c = spawn(command, {
      shell: true,
      stdio: "pipe",
      env: { ...process.env, FORCE_COLOR: true, CONVEX_ADMIN_KEY: adminKey },
    })
    c.stdout.on('data', (data) => {
      process.stdout.write(data);
    })

    c.stderr.on('data', (data) => {
      process.stderr.write(data);
    })

    c.on('exit', (code) => {
      console.log('inner command exited with code ' + code.toString())
      resolve(code)
    })
  });
  return innerCommand;
}

runWithLocalBackend(process.argv[2], parsedUrl).then((code) => {
  cleanup()
  process.exit(code)
}).catch(() => {
  cleanup()
  process.exit(1)
})
