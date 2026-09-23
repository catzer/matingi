---
title: "GitHub Actions Architecture Explained for Beginners"
date: 2026-09-23T06:59:00-04:00
draft: false
tags: ["GitHub Actions", "CI/CD", "DevOps", "Automation", "Beginners"]
categories: ["DevOps"]
author: "jnziokah@gmail.com"
description: "A beginner-friendly step-by-step guide to understanding how GitHub Actions works — covering events, workflows, runners, jobs, steps, actions, and artifacts."
showToc: true
---

If you have ever pushed code to GitHub and watched something automatically happen — tests running, a site deploying, a notification being sent — that was GitHub Actions at work. It is one of the most useful tools in a developer's toolkit, but its architecture can feel confusing at first. This post breaks it down from scratch, piece by piece, so you understand not just what to write but *why* it works the way it does.

---

## What Is GitHub Actions?

GitHub Actions is an **automation platform built directly into GitHub**. It lets you define workflows — sequences of automated tasks — that run in response to events in your repository.

Instead of manually running commands every time you push code, you write a configuration file once and GitHub handles the rest automatically.

**Real-world examples of what it can do:**
- Deploy your website every time you push to `main`
- Run your test suite every time someone opens a pull request
- Send a Slack notification when a new release is published
- Rebuild a Docker image on a schedule every night

You do not need a separate CI/CD tool like Jenkins or CircleCI — it is all built into GitHub and free for public repositories.

---

## The Building Blocks

GitHub Actions has seven core components. They fit together like layers — each one sitting on top of the previous:

```
Events
  └── Workflows
        └── Jobs
              └── Steps
                    └── Actions or Shell Commands
```

Supporting components: **Runners**, **Artifacts**, and **Secrets**.

Let's go through each one.

---

## Step 1: Events — What Triggers Everything

An **event** is something that happens in your repository that kicks off a workflow. Think of it as a signal that says "something changed — go do something about it."

### Common Events

| Event | When it fires |
|---|---|
| `push` | Code is pushed to a branch |
| `pull_request` | A pull request is opened, updated, or merged |
| `workflow_dispatch` | Someone manually clicks "Run workflow" in the UI |
| `schedule` | On a timer, like a cron job |
| `release` | A new GitHub release is published |
| `issues` | An issue is opened or closed |

### How to Define Triggers

In your workflow file, events are defined under the `on:` key:

```yaml
on:
  push:
    branches: ["main"]        # only fire on pushes to main, not other branches
  pull_request:
    branches: ["main"]        # fire when a PR targets main
  workflow_dispatch:           # allow manual trigger from GitHub UI
  schedule:
    - cron: "0 9 * * 1"       # every Monday at 9am UTC
```

You can have one trigger or many. The workflow runs whenever any of the listed events occur.

### Why This Matters

Events are what make automation feel automatic. Instead of remembering to run a script, you define the trigger once and GitHub handles the rest every time that event fires.

---

## Step 2: Workflows — The Automation Blueprint

A **workflow** is a YAML file that defines the full automation process. It is the complete instruction set — it says what to do, when to do it, and in what order.

### Where Workflows Live

Workflows must be placed in a specific folder in your repository:

```
your-repo/
└── .github/
    └── workflows/
        ├── deploy.yml      ← one workflow
        ├── test.yml        ← another workflow
        └── lint.yml        ← another workflow
```

GitHub scans this folder and registers every `.yml` file as a workflow. You can have as many workflows as you need — one for deployment, one for testing, one for notifications, and so on.

### Basic Workflow Structure

Every workflow file follows the same structure:

```yaml
name: My Workflow          # display name in GitHub UI

on:                        # when to run
  push:
    branches: ["main"]

jobs:                      # what to run
  my-job:
    runs-on: ubuntu-latest
    steps:
      - name: Say hello
        run: echo "Hello, World!"
```

That is the minimum. A real workflow adds more jobs and steps, but the structure is always the same.

### Key Things to Know

- The filename does not matter — GitHub reads all `.yml` files in `.github/workflows/`
- One workflow can have multiple jobs
- Workflows are version-controlled alongside your code — you can see the full history of changes to your pipeline
- You can view all workflow runs in the **Actions** tab of your repository

---

## Step 3: Runners — Where Your Code Actually Runs

A **runner** is a virtual machine (VM) that GitHub spins up to execute your jobs. Think of it as a temporary computer that exists only for the duration of your workflow run.

### GitHub-Hosted Runners

GitHub provides free hosted runners on three operating systems:

| Runner label | Operating system |
|---|---|
| `ubuntu-latest` | Ubuntu Linux (most common) |
| `windows-latest` | Windows Server |
| `macos-latest` | macOS |

You specify the runner for each job:

```yaml
jobs:
  my-job:
    runs-on: ubuntu-latest   # use a Linux VM
```

### Important: Runners Are Ephemeral

Every job gets a **brand new, clean runner**. Nothing is installed, nothing is cached, and nothing carries over from previous runs.

```
Run 1:  [fresh Ubuntu VM] → installs tools → runs job → VM is destroyed
Run 2:  [fresh Ubuntu VM] → installs tools → runs job → VM is destroyed
Run 3:  [fresh Ubuntu VM] → installs tools → runs job → VM is destroyed
```

This is why workflows often start with installation steps — the VM starts completely blank every time. The upside is that every run is consistent and reproducible. The downside is that you pay the cost of installing dependencies on every run (though caching can help with this).

### Self-Hosted Runners

If you need more control — specific hardware, private network access, or a custom OS — you can set up a **self-hosted runner** on your own infrastructure. GitHub sends jobs to it instead of spinning up a cloud VM. This is an advanced topic, but good to know it exists.

---

## Step 4: Jobs — Grouping Related Work

A **job** is a collection of steps that run together on the same runner. Every workflow needs at least one job.

### Jobs Run in Parallel by Default

If you define multiple jobs without any dependencies between them, they run **at the same time** on separate VMs:

```yaml
jobs:
  test:                         # starts immediately
    runs-on: ubuntu-latest
    steps:
      - run: echo "Running tests"

  lint:                         # also starts immediately, in parallel
    runs-on: ubuntu-latest
    steps:
      - run: echo "Running linter"
```

Both `test` and `lint` start at the same time on separate VMs. This speeds up your pipeline significantly.

### Creating Job Dependencies with `needs`

Sometimes one job must finish before another can start. Use `needs:` to create a dependency:

```yaml
jobs:
  build:                        # runs first
    runs-on: ubuntu-latest
    steps:
      - run: echo "Building..."

  test:                         # runs after build completes
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: echo "Testing..."

  deploy:                       # runs after test completes
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying..."
```

This creates a sequential pipeline: `build → test → deploy`. If `build` fails, `test` and `deploy` are skipped automatically.

### Why Separate Jobs?

- **Isolation** — each job runs on a clean VM, so a problem in one job does not contaminate another
- **Parallelism** — independent jobs run simultaneously, reducing total pipeline time
- **Clarity** — separating build from deploy makes the pipeline easier to understand and debug

---

## Step 5: Steps — The Individual Tasks

**Steps** are the individual commands or actions within a job. They run **one after the other**, on the same runner, in the order you define them.

```yaml
jobs:
  my-job:
    runs-on: ubuntu-latest
    steps:
      - name: First step
        run: echo "I run first"

      - name: Second step
        run: echo "I run second"

      - name: Third step
        run: echo "I run third"
```

### Two Types of Steps

Every step is one of two things:

**1. A shell command (`run:`)**

Runs any command directly in the terminal:

```yaml
- name: Install a package
  run: sudo apt-get install -y curl

- name: Run a script
  run: |
    echo "Line one"
    echo "Line two"
    ./my-script.sh
```

Use `|` to run multiple lines in one step.

**2. A reusable action (`uses:`)**

Calls a pre-built, community-maintained action from the GitHub Marketplace:

```yaml
- name: Check out code
  uses: actions/checkout@v4

- name: Set up Node.js
  uses: actions/setup-node@v4
  with:
    node-version: "20"
```

### Step Failure Behaviour

By default, if any step fails (exits with a non-zero code), all subsequent steps in that job are skipped and the job is marked as failed. You can override this with `continue-on-error: true` for non-critical steps.

---

## Step 6: Actions — Reusable Building Blocks

An **action** is a pre-packaged, reusable unit of work that you can drop into any workflow. Instead of writing complex shell scripts from scratch, you use actions that the community has already built and tested.

Actions live on GitHub and are referenced with the `uses:` keyword:

```yaml
uses: owner/repo@version
```

### Examples of Popular Actions

| Action | What it does |
|---|---|
| `actions/checkout@v4` | Clones your repository onto the runner |
| `actions/setup-node@v4` | Installs a specific version of Node.js |
| `actions/setup-python@v5` | Installs a specific version of Python |
| `actions/cache@v4` | Caches files between runs to speed up builds |
| `actions/upload-artifact@v4` | Saves files from a job for later use |
| `docker/build-push-action@v5` | Builds and pushes a Docker image |

### Always Pin Action Versions

Notice the `@v4`, `@v5` at the end. Always specify a version:

```yaml
# Good — pinned to a specific version
uses: actions/checkout@v4

# Risky — uses whatever the latest version is
uses: actions/checkout@main
```

Pinning prevents a third-party action update from silently breaking your pipeline.

### Where to Find Actions

Browse the [GitHub Marketplace](https://github.com/marketplace?type=actions) — there are thousands of actions for almost any task you can think of.

---

## Step 7: Artifacts — Passing Files Between Jobs

**Artifacts** are files that one job produces and another job needs to consume. Because each job runs on a separate VM, they cannot share a filesystem directly — artifacts solve this problem.

### How Artifacts Work

```
Job A (build)                    Job B (deploy)
─────────────────                ──────────────────────
Builds the app          →        Downloads the build output
Uploads output folder            Uses it to deploy
as an artifact
```

### Uploading an Artifact

```yaml
- name: Upload build output
  uses: actions/upload-artifact@v4
  with:
    name: my-build
    path: ./dist/        # folder to upload
```

### Downloading an Artifact

```yaml
- name: Download build output
  uses: actions/download-artifact@v4
  with:
    name: my-build
    path: ./dist/
```

### When to Use Artifacts

- Passing a compiled application from a build job to a deploy job
- Saving test reports for later review
- Storing log files from a failed run for debugging

---

## Step 8: Secrets — Keeping Credentials Safe

Most real pipelines need credentials — API keys, passwords, tokens. You should **never** put these directly in your workflow file because it is committed to Git and visible to anyone.

GitHub provides **encrypted secrets** that you store in your repository settings and reference in your workflow:

### Adding a Secret

1. Go to your repository → **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Give it a name (e.g. `API_KEY`) and paste the value
4. Click **Add secret**

### Using a Secret in a Workflow

```yaml
- name: Deploy
  env:
    API_KEY: ${{ secrets.API_KEY }}     # reference the secret
  run: ./deploy.sh
```

The value is masked in logs — if it accidentally gets printed, GitHub replaces it with `***`.

---

## Putting It All Together

Here is a complete, annotated example workflow that uses every concept covered in this post:

```yaml
name: Build and Deploy                  # workflow name

on:                                     # EVENTS
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:                            # least-privilege security
  contents: read
  pages: write
  id-token: write

jobs:

  build:                                # JOB 1
    runs-on: ubuntu-latest              # RUNNER
    steps:

      - name: Checkout code             # STEP using an ACTION
        uses: actions/checkout@v4

      - name: Install dependencies      # STEP using a shell command
        run: npm install

      - name: Run tests                 # STEP using a shell command
        run: npm test

      - name: Build the app             # STEP using a shell command
        run: npm run build

      - name: Upload build output       # STEP — uploads an ARTIFACT
        uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: ./dist/

  deploy:                               # JOB 2
    needs: build                        # depends on build job
    runs-on: ubuntu-latest              # fresh RUNNER
    steps:

      - name: Download build output     # STEP — downloads ARTIFACT from job 1
        uses: actions/download-artifact@v4
        with:
          name: build-output
          path: ./dist/

      - name: Deploy to server          # STEP using a SECRET
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
        run: ./scripts/deploy.sh
```

---

## How Everything Fits Together

```
┌──────────────────────────────────────────────────────┐
│                    GITHUB REPOSITORY                  │
│                                                       │
│  Developer pushes code to main                        │
│           │                                           │
│           ▼                                           │
│        EVENT fires (push)                             │
│           │                                           │
│           ▼                                           │
│      WORKFLOW found (.github/workflows/deploy.yml)    │
│           │                                           │
│    ┌──────┴──────┐                                    │
│    ▼             ▼                                    │
│  JOB 1         JOB 2 (waits for JOB 1)               │
│  (build)       (deploy)                               │
│  RUNNER        RUNNER                                 │
│    │             │                                    │
│  STEP 1        STEP 1                                 │
│  STEP 2   →    STEP 2  (via ARTIFACT)                 │
│  STEP 3        STEP 3                                 │
│    │             │                                    │
│    └──────┬──────┘                                    │
│           ▼                                           │
│      Site is live ✅                                  │
└──────────────────────────────────────────────────────┘
```

---

## Common Beginner Mistakes

| Mistake | What goes wrong | Fix |
|---|---|---|
| Not pinning action versions | Pipeline breaks when an action updates | Always use `@v4`, `@v5` etc. |
| Putting secrets in the YAML file | Credentials exposed in Git history | Use `${{ secrets.MY_SECRET }}` |
| Forgetting `submodules: recursive` | Theme or dependency missing at build time | Add `with: submodules: recursive` to checkout |
| Not setting `needs:` between jobs | Jobs run in parallel when they should be sequential | Add `needs: previous-job-name` |
| Wondering why tools aren't installed | Runner starts completely blank every time | Install everything you need in the workflow |

---

## Summary

| Component | What it is | Analogy |
|---|---|---|
| Event | What triggers the workflow | A doorbell ringing |
| Workflow | The full automation definition | A recipe |
| Runner | The VM that runs your jobs | A kitchen |
| Job | A group of related steps | A course in a meal |
| Step | A single task | One instruction in a recipe |
| Action | A reusable pre-built step | A kitchen appliance |
| Artifact | Files passed between jobs | Handing a dish from one cook to another |
| Secret | Encrypted credentials | A locked ingredient cabinet |

GitHub Actions removes the manual work from software delivery. Once you understand how these eight pieces fit together, you can automate almost anything — from deploying a blog to running a full production release pipeline.
