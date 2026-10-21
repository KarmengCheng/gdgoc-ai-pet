# Workshop troubleshooting

[Return to the complete walkthrough](../README.md)

Use the section that matches your error. Run commands in the named terminal. After a fix, return to the checkpoint that failed.

## npm says Missing script: dev

The terminal is usually at the repository root instead of inside the Next.js app.

Run in: Codespaces terminal.

```bash
# Codespaces terminal
cd "$(git rev-parse --show-toplevel)/ai-pet" &&
pwd &&
npm run dev
```

Checkpoint: The path ends in `/ai-pet` and Next.js starts. The `package.json` visible at the repository root, if any, is a different file from `ai-pet/package.json`.

## The app folder already exists

Expand `ai-pet` in Explorer. If it already contains `package.json` and `src/app`, do not run Create Next App again. Resume at the last completed workshop step.

Checkpoint: The application lives directly in the repository's `ai-pet` directory. Avoid creating `ai-pet/ai-pet`.

## nvm is not found

Open a new Bash terminal from the Codespaces terminal dropdown. If the command is still unavailable, load the existing installation before choosing Node.js.

Run in: Codespaces terminal.

```bash
# Codespaces terminal
if [ -s /usr/local/share/nvm/nvm.sh ]
then
  . /usr/local/share/nvm/nvm.sh
elif [ -s "$HOME/.nvm/nvm.sh" ]
then
  . "$HOME/.nvm/nvm.sh"
fi

nvm install 22 &&
nvm use 22 &&
node --version
```

Checkpoint: The version starts with `v22.`. If neither installation exists, ask the facilitator to help configure the Codespace.

## The preview does not open, or it opens an old page

1. Look at the terminal running `npm run dev` and check its port number.
2. If it chose port 3001 because 3000 was occupied, find the earlier development-server terminal and stop it with Ctrl + C.
3. Restart the intended app from its `ai-pet` folder.
4. In Codespaces, open the Ports panel and use Open in Browser for that same port.
5. Refresh with Cmd + Shift + R on a Mac, or Ctrl + Shift + R on Windows or Linux.
6. Confirm you are testing the Codespaces preview when testing local changes. The public Cloud Run URL updates only after a deployment.

Checkpoint: The intended app is running on port 3000 and the preview shows your latest saved source.

## Chat returns an HTML page instead of JSON

An HTML response usually means Next.js could not compile the route or you called the wrong server. Read the development-server terminal first.

Check that the route is saved as `ai-pet/src/app/api/chat/route.ts` and your server is running from that application's directory.

Checkpoint: The request in Step 7 returns JSON with HTTP 200, rather than an error page.

## The runtime export conflicts with Cache Components

The workshop configuration enables Cache Components. Remove an explicit runtime export if one was added to the API route.

Run in: Codespaces terminal, with the development server stopped.

```bash
# Codespaces terminal
cd "$(git rev-parse --show-toplevel)/ai-pet" &&
sed -i '/^export const runtime = /d' src/app/api/chat/route.ts &&
npm run dev
```

Checkpoint: The compilation error about `runtime` and `cacheComponents` is gone. Retest the chat endpoint in Step 7.

## Chat reports a missing GOOGLE_API_KEY

1. Expand `ai-pet` in Explorer.
2. Check `.env.local` is beside that folder's `package.json`.
3. Check its key is named `GOOGLE_API_KEY` and contains your full API key.
4. Save the file.
5. Stop the development server with Ctrl + C, then restart it.

Run in: Codespaces terminal.

```bash
# Codespaces terminal
cd "$(git rev-parse --show-toplevel)/ai-pet" &&
npm run dev
```

Checkpoint: The chat request no longer returns a missing-key error. Do not print the environment file or paste its key into a group chat.

## Chat returns HTTP 429

This is a Gemini API quota issue. It is different from the Service Usage error while enabling Cloud APIs.

1. Open Google AI Studio using the account that owns the key.
2. Check the key's project matches the project whose usage and limits you are viewing.
3. Check the selected model, current quota and billing status if required for your API tier.
4. Wait for an available request window before retrying.
5. If the allowed quota is zero, ask the facilitator to help check model access and the project's API tier.

The workshop uses `gemini-3.5-flash-lite`. Cloud credits do not by themselves guarantee a particular Gemini request quota.

Checkpoint: A single chat request returns HTTP 200. Avoid repeated retries while the same quota limit is still active.

## Chat returns HTTP 502

Read the server error in the terminal running Next.js. Common causes are an invalid key, blocked API access, a model that the project cannot use, or an upstream error.

Check that `.env.local` uses the workshop model and that the key belongs to the intended project. Restart after editing environment variables. If it still fails, share the error with the facilitator after confirming it contains no secret value.

For the deployed app, read Cloud Run logs instead.

Run in: Google Cloud Shell.

```bash
# Google Cloud Shell
source ~/ai-pet-workshop.env

gcloud run services logs read ai-pet \
  --project "$PET_PROJECT_ID" \
  --region "$PET_REGION" \
  --limit 30
```

Checkpoint: You have the server-side error for the failed request. Use that error to distinguish a Gemini problem from a missing secret or deployment problem.

## I cannot find my project in AI Studio

Open AI Studio, then Dashboard, Projects and Import projects. Search using the Project ID. Use the same Google account that owns the project. After importing it, create the key from API Keys.

If key creation is disabled by a permission error, ask the facilitator to check which Google account and project you selected. This walkthrough assumes a personal project you created yourself.

Checkpoint: The project's ID appears beside your API key in AI Studio.

## Billing is not enabled

In the Google Cloud console, select the workshop project, open Billing and link the intended active billing account. Credit redemption and account access depend on the workshop allocation, so ask the facilitator if no account is available.

Run in: Google Cloud Shell.

```bash
# Google Cloud Shell
source ~/ai-pet-workshop.env

gcloud billing projects describe "$PET_PROJECT_ID" \
  --format='value(billingEnabled)'
```

Checkpoint: The command prints `True`. Continue with the Cloud API enablement step.

## Cloud Shell variables are empty after reopening it

Run in: Google Cloud Shell.

```bash
# Google Cloud Shell
source ~/ai-pet-workshop.env
gcloud config set project "$PET_PROJECT_ID"
gcloud config set billing/quota_project "$PET_PROJECT_ID"
printf 'Project: %s\nRegion: %s\n' "$PET_PROJECT_ID" "$PET_REGION"
```

Checkpoint: The intended project and region are printed. If the settings file does not exist, recreate it using the project-selection block in Step 3 of the walkthrough.

## gcloud is using the wrong Google account

Run in: Google Cloud Shell.

```bash
# Google Cloud Shell
gcloud auth list --filter='status:ACTIVE' --format='value(account)'
```

Checkpoint: The printed account owns your workshop project. If it is different, reopen the Google Cloud console under the intended account and open Cloud Shell there. Complete its authorization dialog if shown.

## Enabling APIs fails with Service Usage 429

This error mentions `serviceusage.googleapis.com` and a mutate-request quota. Set the quota project, then allow the quota window to reset.

Run in: Google Cloud Shell.

```bash
# Google Cloud Shell
source ~/ai-pet-workshop.env
gcloud config set billing/quota_project "$PET_PROJECT_ID"
```

Checkpoint: The quota project is your own workshop project. Wait at least one minute, then rerun the API enablement block in Step 3 once. If the error persists, ask the facilitator before retrying again.

## A newly created service account does not exist

IAM can take time to recognise a new account. Wait 30 seconds, then check both named workshop accounts.

Run in: Google Cloud Shell.

```bash
# Google Cloud Shell
source ~/ai-pet-workshop.env
sleep 30

gcloud iam service-accounts describe \
  "ai-pet-build@${PET_PROJECT_ID}.iam.gserviceaccount.com" \
  --project "$PET_PROJECT_ID" \
  --format='value(email)'

gcloud iam service-accounts describe \
  "ai-pet-runtime@${PET_PROJECT_ID}.iam.gserviceaccount.com" \
  --project "$PET_PROJECT_ID" \
  --format='value(email)'
```

Checkpoint: Both emails are printed. Rerun the specific IAM permission command that failed. Do not recreate an account that already exists.

If an account was never created, create only that missing account using Step 11. The guide uses named service accounts and does not depend on a default Compute Engine account.

## Account creation stops because the build account already exists

The two creation commands in Step 11 are connected with `&&`. If the build account existed, the runtime creation command may not have run.

Check IAM & Admin, Service Accounts. If `ai-pet-runtime` is absent, create only it.

Run in: Google Cloud Shell, only if the runtime account is missing.

```bash
# Google Cloud Shell
source ~/ai-pet-workshop.env

gcloud iam service-accounts create ai-pet-runtime \
  --project "$PET_PROJECT_ID" \
  --display-name="AI Pet Runtime"
```

Checkpoint: Both named accounts exist. Return to the build-role and secret-access steps.

## Deployment cannot read the source ZIP

An error mentioning `could not resolve source`, `storage.googleapis.com` or the `run-sources` bucket can mean the build account lacks read access.

Run in: Google Cloud Shell.

```bash
# Google Cloud Shell
source ~/ai-pet-workshop.env

gcloud projects add-iam-policy-binding "$PET_PROJECT_ID" \
  --member="serviceAccount:ai-pet-build@${PET_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.builder" \
  --condition=None

gcloud storage buckets add-iam-policy-binding \
  "gs://run-sources-${PET_PROJECT_ID}-${PET_REGION}" \
  --member="serviceAccount:ai-pet-build@${PET_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"
```

Checkpoint: Both IAM updates succeed. Wait a short time for permission propagation, then repeat the deployment command from the application directory.

## The deployed app cannot access the Gemini secret

Check that `gemini-api-key` exists in the deployment project and its version `1` is enabled. The secret's value must be the key alone, without the variable name.

Run in: Google Cloud Shell.

```bash
# Google Cloud Shell
source ~/ai-pet-workshop.env

gcloud secrets versions describe 1 \
  --secret gemini-api-key \
  --project "$PET_PROJECT_ID" \
  --format='value(state)'

gcloud secrets add-iam-policy-binding gemini-api-key \
  --project "$PET_PROJECT_ID" \
  --member="serviceAccount:ai-pet-runtime@${PET_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

Checkpoint: The state is `ENABLED` and the permission update succeeds. Redeploy using the runtime account specified in the walkthrough.

If you replaced the key with a newer secret version, update `--set-secrets` in the deployment command to that enabled version number before deploying. The workshop command explicitly uses version `1`.

## The public homepage loads but chat fails

A loaded homepage only verifies the frontend. Test `/api/chat` using the deployed API request in Step 14. Then read the Cloud Run logs using the log command above.

Checkpoint: The deployed request returns HTTP 200 with `reply` and `mood`. If the interface reports a missing key or an upstream failure, fix the secret or API access before presenting the app as complete.

## My local changes are missing from Cloud Run

Check this sequence:

1. Save the files in Codespaces.
2. Commit and push to your own repository.
3. Pull in Cloud Shell with `git pull --ff-only`.
4. Deploy again from the nested `ai-pet` directory.
5. Refresh the public URL after deployment reports success.

Checkpoint: The latest deployed revision contains your changes. Editing Codespaces or pushing to GitHub does not automatically deploy this workshop setup.

## git clone asks for credentials or says the repository does not exist

Check that the URL belongs to your own repository, the repository name is correct and its visibility is Public. Copy the HTTPS URL from its Code menu again.

If Cloud Shell already contains the repository folder, use Step 15 to pull the existing clone instead of cloning into it again.

Checkpoint: Cloud Shell can read the public repository and `ai-pet/package.json` is present.

## Git reports author identity unknown

Set the identity you want recorded on your workshop commits. Replace both placeholders before running the block. You can use your GitHub-provided no-reply email from GitHub Settings, Emails.

Run in: Codespaces terminal.

```bash
# Codespaces terminal
git config user.name "YOUR_NAME"
git config user.email "YOUR_GITHUB_COMMIT_EMAIL"
```

Checkpoint: Repeat the commit command and it succeeds. These settings apply to this repository.

## The API key file appears in staged changes

Stop before pushing. Remove the local environment file from Git's index while keeping the working file.

Run in: Codespaces terminal.

```bash
# Codespaces terminal
cd "$(git rev-parse --show-toplevel)" &&
git rm --cached --ignore-unmatch ai-pet/.env.local &&
git check-ignore ai-pet/.env.local &&
git diff --cached --stat
```

Checkpoint: `.env.local` is ignored and its contents are absent from the staged changes. If the key was already pushed, revoke it in AI Studio and create a replacement. Ask the facilitator to help update the local file and Secret Manager before continuing.

## Chat does not change the stat bars

That is expected in this workshop version. Feed, Play and Rest perform care actions. Chat uses the pet's current stats and personality to generate its reply and mood.

Checkpoint: Buttons change the stats. Chat replies in character and can reflect hunger or tiredness. Chat-driven care tools are outside this version's instructions.

## Reset a saved pet

In Chrome, open the Codespaces preview or public app you want to reset, then:

1. Open the browser menu, More Tools, Developer Tools.
2. Select the Application tab. It may be inside the tab-overflow menu.
3. Expand Local Storage in the left-hand panel and select the app's origin.
4. Select the row with key `gdgoc-ai-pet-v1` and delete that row.
5. Reload the app and close Developer Tools.

Checkpoint: The pet is Mochi with Happiness 70, Hunger 40 and Energy 80. This clears its saved custom settings for that site. The Codespaces and Cloud Run sites each have separate storage.

## Google Sans fallback-font warning

A warning saying Next.js could not find font override values for Google Sans can appear while generating the fallback font. If the command still exits successfully, continue.

Checkpoint: The production build succeeds and the app loads. An actual font-download failure that stops the build needs a separate network fix or a facilitator-provided fallback.

## Public access is blocked by an organisation policy

If deployment cannot grant unauthenticated access, check whether you created the project inside a managed organisation. Ask the facilitator or organisation administrator to check the policy. Do not change an organisation's security policy during the workshop.

Checkpoint: You either deploy under an account and project approved for public workshop apps or follow an administrator-approved access method.
