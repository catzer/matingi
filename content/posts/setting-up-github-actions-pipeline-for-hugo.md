---
title: "Setting Up a GitHub Actions Pipeline for Your Hugo Blog"
date: 2026-09-23T05:16:00-04:00
draft: false
tags: ["GitHub Actions", "CI/CD", "Hugo", "GitHub Pages", "DevOps", "Automation"]
categories: ["DevOps"]
author: "jnziokah@gmail.com"
description: "A deep dive into setting up a GitHub Actions CI/CD pipeline for a Hugo blog — covering every section of the workflow file and what each part does."
showToc: true
---

When you push a new blog post, the last thing you want to do is manually build the site and upload files somewhere. A GitHub Actions pipeline automates all of that — every push to `main` triggers a build and deploys your site automatically. This post walks through how to set it up from scratch and explains every section of the workflow file.

---

## What Is GitHub Actions?

GitHub Actions is a CI/CD (Continuous Integration / Continuous Deployment) platform built directly into GitHub. You define a workflow in a YAML file, and GitHub runs it automatically when specific events happen — like pushing code, opening a pull request, or on a schedule.

For a Hugo blog, the workflow does three things:
1. **Installs Hugo** on a fresh virtual machine
2. **Builds** your Markdown files into a static site
3. **Deploys** the output to GitHub Pages

---

## Step 1: Create the Workflow File

GitHub Actions looks for workflow files in a specific location:

```
.github/workflows/
```

Create the directory and file:

```bash
mkdir -p .github/workflows
touch .github/workflows/hugo.yml
```

The filename (`hugo.yml`) can be anything — GitHub reads all `.yml` files in that folder.

---

## Step 2: The Complete Workflow File

Here is the full workflow. Each section is explained in detail below.

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

## Section Breakdown

### 1. Workflow Name

```yaml
name: Deploy Hugo site to GitHub Pages
```

A human-readable label for the workflow. This is what appears in the **Actions** tab on GitHub. Use something descriptive so you can identify it at a glance.

---

### 2. Triggers (`on`)

```yaml
on:
  push:
    branches: ["main"]
  workflow_dispatch:
```

This defines **when** the pipeline runs. There are two triggers here:

- **`push: branches: ["main"]`** — runs automatically every time you push a commit to the `main` branch. This is the primary trigger for deployments.
- **`workflow_dispatch`** — adds a "Run workflow" button in the GitHub Actions UI, allowing you to trigger the pipeline manually without pushing code. Useful for re-deploying without making a change.

---

### 3. Permissions

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

GitHub Actions runs with a token that has limited permissions by default. This section grants only what the workflow needs:

| Permission | Why it's needed |
|---|---|
| `contents: read` | Allows the workflow to check out your repository code |
| `pages: write` | Allows the workflow to publish to GitHub Pages |
| `id-token: write` | Required for secure, passwordless authentication with GitHub Pages |

Keeping permissions minimal is a security best practice — the workflow can't do anything beyond what's listed here.

---

### 4. Concurrency

```yaml
concurrency:
  group: "pages"
  cancel-in-progress: false
```

This prevents deployment conflicts when multiple pushes happen in quick succession.

- **`group: "pages"`** — all runs of this workflow share the same concurrency group
- **`cancel-in-progress: false`** — if a deployment is already running, new runs will queue rather than cancel the active one

This ensures deployments happen in order and your site is never left in a broken state from a cancelled mid-deploy.

---

### 5. Defaults

```yaml
defaults:
  run:
    shell: bash
```

Sets bash as the default shell for all `run` steps. This ensures consistent behaviour across different runner environments and lets you use bash-specific syntax in your commands.

---

### 6. The Build Job

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    env:
      HUGO_VERSION: 0.166.0
```

- **`runs-on: ubuntu-latest`** — spins up a fresh Ubuntu virtual machine for each run. It's clean, fast, and free.
- **`env: HUGO_VERSION`** — defines the Hugo version as an environment variable so it's easy to update in one place without hunting through the file.

---

### 7. Step: Install Hugo CLI

```yaml
- name: Install Hugo CLI
  run: |
    wget -O ${{ runner.temp }}/hugo.deb \
      https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.deb \
    && sudo dpkg -i ${{ runner.temp }}/hugo.deb
```

The Ubuntu runner doesn't come with Hugo pre-installed, so this step downloads and installs it:

1. `wget` downloads the Hugo Extended `.deb` package from GitHub Releases into a temporary directory
2. `sudo dpkg -i` installs the downloaded package

**Hugo Extended** (not the standard edition) is required because it includes support for SCSS/Sass processing, which PaperMod and many other themes use.

---

### 8. Step: Install Dart Sass

```yaml
- name: Install Dart Sass
  run: sudo snap install dart-sass
```

Some Hugo themes use Sass for styling. This installs [Dart Sass](https://sass-lang.com/dart-sass/) — the primary implementation of Sass — so Hugo can compile `.scss` files during the build. Even if your theme doesn't use Sass today, having it installed prevents build failures if you ever add a theme or custom styles that do.

---

### 9. Step: Checkout

```yaml
- name: Checkout
  uses: actions/checkout@v4
  with:
    submodules: recursive
```

This clones your repository onto the runner so Hugo can access your content and config files.

- **`uses: actions/checkout@v4`** — uses GitHub's official checkout action
- **`submodules: recursive`** — critically important. Your PaperMod theme is a Git submodule. Without `recursive`, the `themes/PaperMod/` directory would be empty and the build would fail with a missing theme error.

---

### 10. Step: Setup Pages

```yaml
- name: Setup Pages
  id: pages
  uses: actions/configure-pages@v5
  with:
    enablement: true
```

This configures GitHub Pages for your repository and retrieves important build information:

- **`enablement: true`** — automatically enables GitHub Pages if it isn't already enabled, rather than failing with a `Not Found` error
- **`id: pages`** — gives this step an ID so later steps can reference its output (specifically the `base_url`)

The `base_url` output from this step is used in the build command to set the correct URL for your site.

---

### 11. Step: Build with Hugo

```yaml
- name: Build with Hugo
  env:
    HUGO_ENVIRONMENT: production
  run: |
    hugo \
      --minify \
      --baseURL "${{ steps.pages.outputs.base_url }}/"
```

This is the core step — it runs Hugo to generate your static site:

- **`HUGO_ENVIRONMENT: production`** — tells Hugo and your theme that this is a production build. Themes use this to enable analytics, disable debug features, etc.
- **`--minify`** — compresses the HTML, CSS, and JavaScript output to reduce file sizes and improve page load speed
- **`--baseURL`** — sets the site's root URL dynamically using the value from the Setup Pages step. This ensures internal links, the sitemap, and RSS feed all use the correct URL

The output is written to the `public/` directory on the runner.

---

### 12. Step: Upload Artifact

```yaml
- name: Upload artifact
  uses: actions/upload-pages-artifact@v3
  with:
    path: ./public
```

This packages the generated `public/` folder as a GitHub Pages artifact and uploads it to GitHub's infrastructure. The artifact is a snapshot of your built site, ready to be deployed.

This step bridges the `build` job and the `deploy` job — the deploy job picks up this artifact and publishes it.

---

### 13. The Deploy Job

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

- **`needs: build`** — this job only starts after the `build` job completes successfully. If the build fails, deployment is skipped entirely.
- **`environment: github-pages`** — links this job to the GitHub Pages deployment environment, enabling deployment history and the live URL display in the Actions UI
- **`actions/deploy-pages@v4`** — takes the artifact uploaded in the previous job and publishes it to GitHub Pages CDN

Once this step completes, your site is live.

---

## How the Two Jobs Relate

```
┌─────────────────────────────┐
│         build job           │
│                             │
│  1. Install Hugo            │
│  2. Install Dart Sass       │
│  3. Checkout code           │
│  4. Configure Pages         │
│  5. Run hugo --minify       │
│  6. Upload public/ artifact │
└──────────────┬──────────────┘
               │ needs: build
               ▼
┌─────────────────────────────┐
│         deploy job          │
│                             │
│  1. Download artifact       │
│  2. Publish to Pages CDN    │
└─────────────────────────────┘
```

Splitting into two jobs is intentional — it separates concerns (building vs. deploying) and means a failed build never results in a broken deployment.

---

## Required GitHub Repository Settings

The workflow alone isn't enough. Two settings must be configured in your repository before the pipeline will work:

**1. Enable GitHub Pages source**
- Go to **Settings → Pages**
- Set Source to **GitHub Actions**

**2. Set workflow permissions**
- Go to **Settings → Actions → General**
- Set **Read and write permissions**

Without these, the pipeline will fail at the `configure-pages` step with a `Not Found` error.

---

## Triggering the Pipeline

| How | When to use |
|---|---|
| `git push` to main | Normal workflow — publish a post or make a change |
| Manual trigger in Actions UI | Re-deploy without changes, or test the pipeline |

---

## Monitoring a Run

1. Go to your repository on GitHub
2. Click the **Actions** tab
3. Click the workflow run to expand it
4. Click any step to see its live or historical logs

A green checkmark means success. A red X means that step failed — click it to read the error message.

---

## Quick Reference

| File | Purpose |
|---|---|
| `.github/workflows/hugo.yml` | The pipeline definition |
| `actions/checkout@v4` | Clones your repo onto the runner |
| `actions/configure-pages@v5` | Sets up GitHub Pages and provides the base URL |
| `actions/upload-pages-artifact@v3` | Packages the built site for deployment |
| `actions/deploy-pages@v4` | Publishes the site to GitHub Pages |
