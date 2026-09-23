---
title: "GitHub Actions: Architecture, Pipeline Setup, and Deployment for Beginners"
date: 2026-09-23T05:16:00-04:00
draft: false
tags: ["GitHub Actions", "CI/CD", "Hugo", "GitHub Pages", "DevOps", "Automation", "Beginners"]
categories: ["DevOps"]
author: "jnziokah@gmail.com"
description: "A complete beginner-friendly guide to GitHub Actions — covering how it works, its core architecture, and a step-by-step walkthrough of setting up a deployment pipeline for a Hugo blog."
showToc: true
---

If you have ever pushed code to GitHub and watched something automatically happen — a site deploying, tests running, a notification being sent — that was GitHub Actions at work. This post explains how GitHub Actions works from the ground up, then walks through every line of a real deployment pipeline for a Hugo blog.

By the end, you will understand not just what to write but *why* it works the way it does.

---

## What Is GitHub Actions?

GitHub Actions is an **automation platform built directly into GitHub**. It lets you define workflows — sequences of automated tasks — that run in response to events in your repository.

Instead of manually running commands every time you push code, you write a configuration file once and GitHub handles everything automatically.

**What it can do:**
- Deploy your website every time you push to `main`
- Run your test suite every time someone opens a pull request
- Send a Slack notification when a new release is published
- Rebuild a Docker image on a schedule every night

You do not need a separate CI/CD tool like Jenkins or CircleCI — it is all built into GitHub and free for public repositories.

---

## Part 1: The Architecture

GitHub Actions is built around eight core components. Understanding each one makes reading and writing workflows much easier.

### The Component Hierarchy

```
Events  (what triggers everything)
  └── Workflows  (the automation blueprint)
        └── Jobs  (groups of related work)
              └── Steps  (individual tasks)
                    └── Actions or Shell Commands  (the actual work)

Supporting components:
  ├── Runners   (the VMs that execute jobs)
  ├── Artifacts (files passed between jobs)
  └── Secrets   (encrypted credentials)
```

---

### Component 1: Events

An **event** is something that happens in your repository that kicks off a workflow. Think of it as a signal that says "something changed — go do something about it."

**Common events:**

| Event | When it fires |
|---|---|
| `push` | Code is pushed to a branch |
| `pull_request` | A pull request is opened, updated, or merged |
| `workflow_dispatch` | Someone manually clicks "Run workflow" in the UI |
| `schedule` | On a timer, like a cron job |
| `release` | A new GitHub release is published |

Events are defined under the `on:` key in your workflow file:

```yaml
on:
  push:
    branches: ["main"]        # fires only on pushes to main
  pull_request:
    branches: ["main"]        # fires when a PR targets main
  workflow_dispatch:           # allow manual trigger from the GitHub UI
  schedule:
    - cron: "0 9 * * 1"       # every Monday at 9am UTC
```

---

### Component 2: Workflows

A **workflow** is a YAML file that contains the full automation definition. It lives in a specific location in your repository:

```
your-repo/
└── .github/
    └── workflows/
        ├── deploy.yml      ← deployment workflow
        ├── test.yml        ← testing workflow
        └── lint.yml        ← linting workflow
```

GitHub scans this folder and registers every `.yml` file as a separate workflow. You can have as many as you need.

Every workflow follows the same basic structure:

```yaml
name: My Workflow      # display name in the Actions tab

on:                    # when to run (events)
  push:
    branches: ["main"]

jobs:                  # what to run
  my-job:
    runs-on: ubuntu-latest
    steps:
      - name: Say hello
        run: echo "Hello, World!"
```

---

### Component 3: Runners

A **runner** is a virtual machine (VM) that GitHub spins up to execute your jobs. Think of it as a temporary computer that exists only for the duration of one job.

**GitHub-hosted runners:**

| Label | Operating system |
|---|---|
| `ubuntu-latest` | Ubuntu Linux (most common) |
| `windows-latest` | Windows Server |
| `macos-latest` | macOS |

You specify the runner for each job with `runs-on:`:

```yaml
jobs:
  my-job:
    runs-on: ubuntu-latest
```

**Important — runners are ephemeral.** Every job gets a brand new, completely blank VM. Nothing carries over between runs:

```
Run 1:  [fresh Ubuntu VM] → installs tools → runs job → VM destroyed
Run 2:  [fresh Ubuntu VM] → installs tools → runs job → VM destroyed
Run 3:  [fresh Ubuntu VM] → installs tools → runs job → VM destroyed
```

This is why workflows always include installation steps — there is nothing pre-installed. The upside is that every run is consistent and reproducible.

---

### Component 4: Jobs

A **job** is a collection of steps that run together on the same runner. Every workflow needs at least one job.

**Jobs run in parallel by default.** If you define multiple jobs with no dependencies, they start simultaneously on separate VMs:

```yaml
jobs:
  test:                        # starts immediately
    runs-on: ubuntu-latest
    steps:
      - run: echo "Running tests"

  lint:                        # also starts immediately, in parallel
    runs-on: ubuntu-latest
    steps:
      - run: echo "Running linter"
```

**Use `needs:` to create sequential dependencies:**

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Building..."

  test:
    needs: build               # waits for build to finish
    runs-on: ubuntu-latest
    steps:
      - run: echo "Testing..."

  deploy:
    needs: test                # waits for test to finish
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying..."
```

This creates the pipeline `build → test → deploy`. If `build` fails, `test` and `deploy` are automatically skipped.

---

### Component 5: Steps

**Steps** are the individual tasks within a job. They run sequentially — one after the other — on the same runner. If any step fails, the remaining steps are skipped.

Every step is one of two things:

**1. A shell command (`run:`)** — runs anything in the terminal:

```yaml
- name: Install a package
  run: sudo apt-get install -y curl

- name: Run multiple commands
  run: |
    echo "Line one"
    echo "Line two"
    ./my-script.sh
```

**2. A reusable action (`uses:`)** — calls a pre-built action from the GitHub Marketplace:

```yaml
- name: Check out code
  uses: actions/checkout@v4

- name: Set up Node.js
  uses: actions/setup-node@v4
  with:
    node-version: "20"
```

---

### Component 6: Actions

An **action** is a pre-packaged, reusable unit of work published to the [GitHub Marketplace](https://github.com/marketplace?type=actions). Instead of writing complex scripts yourself, you use actions the community has already built and tested.

**Popular actions:**

| Action | What it does |
|---|---|
| `actions/checkout@v4` | Clones your repository onto the runner |
| `actions/setup-node@v4` | Installs a specific version of Node.js |
| `actions/cache@v4` | Caches files between runs to speed up builds |
| `actions/upload-artifact@v4` | Saves files from a job for later use |
| `docker/build-push-action@v5` | Builds and pushes a Docker image |

**Always pin action versions.** Use `@v4`, `@v5`, never `@main`:

```yaml
# Good — pinned, predictable
uses: actions/checkout@v4

# Risky — breaks if the action updates
uses: actions/checkout@main
```

---

### Component 7: Artifacts

**Artifacts** are files that one job produces and another job needs. Because each job runs on a separate VM, they cannot share a filesystem — artifacts bridge that gap.

**Uploading from the build job:**

```yaml
- name: Upload build output
  uses: actions/upload-artifact@v4
  with:
    name: my-build
    path: ./dist/
```

**Downloading in the deploy job:**

```yaml
- name: Download build output
  uses: actions/download-artifact@v4
  with:
    name: my-build
    path: ./dist/
```

---

### Component 8: Secrets

Most real pipelines need credentials — API keys, passwords, tokens. **Never** put these directly in your workflow file — it is committed to Git and visible to anyone.

GitHub provides encrypted secrets you store in repository settings and reference in workflows:

**Adding a secret:**
1. Go to **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Enter a name (e.g. `API_KEY`) and paste the value

**Using a secret in a workflow:**

```yaml
- name: Deploy
  env:
    API_KEY: ${{ secrets.API_KEY }}
  run: ./deploy.sh
```

Secret values are masked in logs — GitHub replaces them with `***` if they appear in output.

---

### How All Eight Components Fit Together

```
┌────────────────────────────────────────────────────────┐
│                   GITHUB REPOSITORY                    │
│                                                        │
│  Developer pushes code to main                         │
│            │                                           │
│            ▼                                           │
│     EVENT fires (push to main)                         │
│            │                                           │
│            ▼                                           │
│     WORKFLOW found in .github/workflows/               │
│            │                                           │
│     ┌──────┴──────────┐                                │
│     ▼                 ▼                                │
│   JOB 1             JOB 2 (waits for JOB 1)           │
│   RUNNER            RUNNER                             │
│     │                 │                                │
│   STEP 1            STEP 1                             │
│   STEP 2   ──────►  STEP 2  (via ARTIFACT)             │
│   STEP 3            STEP 3  (uses SECRET)              │
│     │                 │                                │
│     └──────┬──────────┘                                │
│            ▼                                           │
│       Pipeline complete ✅                             │
└────────────────────────────────────────────────────────┘
```

---

## Part 2: Setting Up a Pipeline for a Hugo Blog

Now that you understand the architecture, let's apply it to a real example — deploying a Hugo blog to GitHub Pages. This is a complete walkthrough of the actual workflow file used in this blog.

### Step 1: Create the Workflow File

GitHub Actions reads workflow files from a specific location. Create the directory and file:

```bash
mkdir -p .github/workflows
touch .github/workflows/hugo.yml
```

The filename can be anything — GitHub reads all `.yml` files in that folder.

---

### Step 2: The Complete Workflow File

Here is the full pipeline. The sections below explain every part in detail.

```yaml
name: Deploy Hugo site to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

defaults:
  run:
    shell: bash

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      HUGO_VERSION: 0.166.0
    steps:
      - name: Install Hugo CLI
        run: |
          wget -O ${{ runner.temp }}/hugo.deb \
            https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.deb \
          && sudo dpkg -i ${{ runner.temp }}/hugo.deb

      - name: Install Dart Sass
        run: sudo snap install dart-sass

      - name: Checkout
        uses: actions/checkout@v4
        with:
          submodules: recursive

      - name: Setup Pages
        id: pages
        uses: actions/configure-pages@v5
        with:
          enablement: true

      - name: Build with Hugo
        env:
          HUGO_ENVIRONMENT: production
        run: |
          hugo \
            --minify \
            --baseURL "${{ steps.pages.outputs.base_url }}/"

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./public

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

### Step 3: Pipeline Design

Here is how the workflow is structured and how all the pieces connect:

```
┌─────────────────────────────────────────────────────────────────┐
│                          TRIGGER                                │
│                                                                 │
│    git push to main  ──OR──  Manual trigger (workflow_dispatch) │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BUILD JOB                               │
│                         (ubuntu-latest)                         │
│                                                                 │
│  Step 1 ── Install Hugo Extended v0.166.0                       │
│               │                                                 │
│               ▼                                                 │
│  Step 2 ── Install Dart Sass                                    │
│               │                                                 │
│               ▼                                                 │
│  Step 3 ── Checkout code + PaperMod submodule                   │
│               │                                                 │
│               ▼                                                 │
│  Step 4 ── Configure GitHub Pages → outputs base_url            │
│               │                                                 │
│               ▼                                                 │
│  Step 5 ── hugo --minify --baseURL <base_url>                   │
│               │   generates public/ directory                   │
│               ▼                                                 │
│  Step 6 ── Upload public/ as Pages artifact                     │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                       needs: build
                 (only runs if build passes)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DEPLOY JOB                               │
│                        (ubuntu-latest)                          │
│                                                                 │
│  Step 1 ── Download artifact from build job                     │
│               │                                                 │
│               ▼                                                 │
│  Step 2 ── Publish to GitHub Pages CDN                          │
│               │                                                 │
│               ▼                                                 │
│           Site is live at                                       │
│           YOUR-USERNAME.github.io/YOUR-REPO-NAME                │
└─────────────────────────────────────────────────────────────────┘
```

**Key design decisions:**

- **Two separate jobs** — if the Hugo build fails, the deploy job never runs, so your live site is never overwritten with a broken version
- **`needs: build`** — the deploy job waits for the build job to complete successfully before starting
- **Dynamic `baseURL`** — the workflow fetches the correct GitHub Pages URL at runtime from the `configure-pages` action, making the workflow portable across repositories
- **Artifact handoff** — `public/` is passed between jobs as an artifact since each job runs on a separate VM with no shared filesystem
- **Pinned Hugo version** — `HUGO_VERSION: 0.166.0` is defined once and reused, preventing surprise build failures from upstream Hugo updates

---

### Step 4: Section-by-Section Explanation

#### Workflow Name

```yaml
name: Deploy Hugo site to GitHub Pages
```

The display name shown in the **Actions** tab on GitHub.

---

#### Triggers

```yaml
on:
  push:
    branches: ["main"]
  workflow_dispatch:
```

- `push: branches: ["main"]` — runs automatically on every push to `main`
- `workflow_dispatch` — adds a "Run workflow" button in the GitHub UI for manual deploys

---

#### Permissions

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

| Permission | Why it is needed |
|---|---|
| `contents: read` | Allows the workflow to check out your code |
| `pages: write` | Allows publishing to GitHub Pages |
| `id-token: write` | Required for secure, passwordless authentication with Pages |

This follows the principle of least privilege — the token can only do exactly what is listed here.

---

#### Concurrency

```yaml
concurrency:
  group: "pages"
  cancel-in-progress: false
```

Prevents conflicts when multiple pushes happen quickly. New runs queue behind the current one rather than cancelling it, so deployments always complete in order.

---

#### Defaults

```yaml
defaults:
  run:
    shell: bash
```

Sets bash as the default shell for all `run` steps across both jobs.

---

#### Build Job Setup

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    env:
      HUGO_VERSION: 0.166.0
```

Spins up a fresh Ubuntu VM. `HUGO_VERSION` is set once as an environment variable so it is easy to update in a single place.

---

#### Step: Install Hugo CLI

```yaml
- name: Install Hugo CLI
  run: |
    wget -O ${{ runner.temp }}/hugo.deb \
      https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.deb \
    && sudo dpkg -i ${{ runner.temp }}/hugo.deb
```

Downloads and installs Hugo Extended from GitHub Releases. **Hugo Extended** is required (not the standard edition) because it includes SCSS/Sass processing support used by PaperMod and many other themes.

---

#### Step: Install Dart Sass

```yaml
- name: Install Dart Sass
  run: sudo snap install dart-sass
```

Installs [Dart Sass](https://sass-lang.com/dart-sass/) so Hugo can compile `.scss` files during the build. Required by themes that use Sass for styling.

---

#### Step: Checkout

```yaml
- name: Checkout
  uses: actions/checkout@v4
  with:
    submodules: recursive
```

Clones your repository onto the runner. `submodules: recursive` is critical — without it, the `themes/PaperMod/` directory would be empty and the build would fail with a missing theme error.

---

#### Step: Setup Pages

```yaml
- name: Setup Pages
  id: pages
  uses: actions/configure-pages@v5
  with:
    enablement: true
```

Configures GitHub Pages for your repository and outputs the `base_url` used in the build step. `enablement: true` automatically enables GitHub Pages rather than failing if it is not already configured. The `id: pages` allows the next step to reference its output.

---

#### Step: Build with Hugo

```yaml
- name: Build with Hugo
  env:
    HUGO_ENVIRONMENT: production
  run: |
    hugo \
      --minify \
      --baseURL "${{ steps.pages.outputs.base_url }}/"
```

The core step. Hugo reads your Markdown content and generates the static site into `public/`:

- `HUGO_ENVIRONMENT: production` — tells Hugo this is a production build, enabling analytics and disabling debug features
- `--minify` — compresses HTML, CSS, and JS to reduce file sizes and improve load times
- `--baseURL` — uses the URL dynamically from the Setup Pages step to ensure all internal links, sitemaps, and RSS feeds are correct

---

#### Step: Upload Artifact

```yaml
- name: Upload artifact
  uses: actions/upload-pages-artifact@v3
  with:
    path: ./public
```

Packages the generated `public/` folder and uploads it to GitHub's infrastructure. This bridges the build job and the deploy job.

---

#### Deploy Job

```yaml
deploy:
  environment:
    name: github-pages
    url: ${{ steps.deployment.outputs.page_url }}
  runs-on: ubuntu-latest
  needs: build
  steps:
    - name: Deploy to GitHub Pages
      id: deployment
      uses: actions/deploy-pages@v4
```

- `needs: build` — only runs if the build job succeeded
- `environment: github-pages` — links to the GitHub Pages deployment environment, showing deployment history and the live URL in the Actions UI
- `actions/deploy-pages@v4` — takes the uploaded artifact and publishes it to the GitHub Pages CDN

---

### Step 5: Required GitHub Repository Settings

The workflow file alone is not enough. Two settings must be configured in your repository settings before the pipeline will work:

**1. Enable GitHub Pages**
- Go to **Settings → Pages**
- Under "Build and deployment", set Source to **GitHub Actions**
- Click **Save**

**2. Set workflow permissions**
- Go to **Settings → Actions → General**
- Scroll to "Workflow permissions"
- Select **Read and write permissions**
- Click **Save**

Without these, the pipeline will fail at the `configure-pages` step with a `Not Found` error.

---

### Step 6: Triggering and Monitoring

**Triggering the pipeline:**

| Method | When to use |
|---|---|
| `git push` to main | Normal workflow — publishing a post or making a change |
| Manual trigger in Actions UI | Re-deploying without code changes |

**Monitoring a run:**

1. Go to your repository on GitHub
2. Click the **Actions** tab
3. Click the running or completed workflow
4. Click any step to see its live or historical logs

A green checkmark means success. A red X means that step failed — click it to read the exact error message.

---

## Common Mistakes

| Mistake | What goes wrong | Fix |
|---|---|---|
| Not pinning action versions | Pipeline breaks when an action updates | Always use `@v4`, `@v5` etc. |
| Putting secrets in the YAML file | Credentials exposed in Git history | Use `${{ secrets.MY_SECRET }}` |
| Forgetting `submodules: recursive` | Theme missing, build fails | Add `with: submodules: recursive` to checkout step |
| Not setting `needs:` between jobs | Jobs run in parallel when they should be sequential | Add `needs: previous-job-name` |
| GitHub Pages source not set | `Not Found` error at configure-pages step | Settings → Pages → Source → GitHub Actions |
| Workflow permissions too restrictive | `HttpError: Not Found` during deploy | Settings → Actions → Read and write permissions |

---

## Quick Reference

| Component | What it is |
|---|---|
| Event | What triggers the workflow |
| Workflow | The full automation definition (YAML file) |
| Runner | The VM that executes jobs |
| Job | A group of steps on one runner |
| Step | A single task within a job |
| Action | A reusable pre-built step |
| Artifact | Files passed between jobs |
| Secret | Encrypted credentials |

| File | Purpose |
|---|---|
| `.github/workflows/hugo.yml` | The pipeline definition |
| `actions/checkout@v4` | Clones your repo onto the runner |
| `actions/configure-pages@v5` | Sets up GitHub Pages, outputs base URL |
| `actions/upload-pages-artifact@v3` | Packages the built site for deployment |
| `actions/deploy-pages@v4` | Publishes the site to GitHub Pages CDN |
