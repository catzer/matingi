---
title: "How to Deploy a Hugo Blog to GitHub Pages Using GitHub Actions"
date: 2026-09-21T07:56:00-04:00
draft: false
tags: ["Hugo", "GitHub Actions", "GitHub Pages", "CI/CD", "DevOps"]
categories: ["DevOps"]
author: "jnziokah@gmail.com"
description: "A complete step-by-step guide to setting up a Hugo blog with the PaperMod theme and deploying it automatically to GitHub Pages using GitHub Actions."
showToc: true
---

This guide walks you through everything you need to get a Hugo blog set up locally and deployed to GitHub Pages using GitHub Actions — from cloning the repo to your first live post.

## Prerequisites

Make sure you have the following installed on your machine:

- **Hugo Extended** — install on macOS with `brew install hugo`
- **Git** — comes with macOS, or install with `brew install git`

Verify Hugo is installed correctly:

```bash
hugo version
# Expected: hugo v0.166.0+extended
```

---

## Part 1: Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/catzer/matingi.git
cd matingi
```

### 2. Initialize the Theme Submodule

This blog uses [PaperMod](https://github.com/adityatelange/hugo-PaperMod) as a Git submodule. Without initializing it, Hugo has no theme and the build will fail.

```bash
git submodule update --init --recursive
```

### 3. Start the Local Development Server

```bash
hugo server -D
```

The `-D` flag includes draft posts in the preview. Open http://localhost:1313 in your browser — you should see the blog running locally. Press `Ctrl+C` to stop the server.

---

## Part 2: GitHub Repository Settings

These settings only need to be configured once. Skipping either of them is the most common reason the pipeline fails.

### 4. Enable GitHub Pages

1. Go to your repository's **Settings → Pages**
   - Direct link: `https://github.com/catzer/matingi/settings/pages`
2. Under **"Build and deployment"**, set the Source to **GitHub Actions**
3. Click **Save**

> Without this, the `configure-pages` action will throw a `Not Found` error and the entire pipeline fails.

### 5. Set Workflow Permissions

1. Go to **Settings → Actions → General**
   - Direct link: `https://github.com/catzer/matingi/settings/actions`
2. Scroll down to **"Workflow permissions"**
3. Select **Read and write permissions**
4. Click **Save**

> This gives the GitHub Actions token permission to interact with the Pages API and deploy your site.

---

## Part 3: Deploying the Site

### 6. Push to Main

Every push to the `main` branch automatically triggers the deployment pipeline:

```bash
git add .
git commit -m "Initial deployment"
git push
```

### 7. Monitor the Pipeline

- Go to `https://github.com/catzer/matingi/actions`
- Click the running workflow to watch the live logs
- The pipeline takes approximately 2 minutes to complete

### 8. View the Live Site

Once the pipeline shows a green checkmark, your site is live at:

```
https://catzer.github.io/matingi/
```

---

## Part 4: Writing and Publishing Posts

### 9. Create a New Post

```bash
hugo new content posts/my-post-title.md
```

Hugo creates the file at `content/posts/my-post-title.md` with pre-filled front matter.

### 10. Edit the Post

Open the file in any text editor. The front matter at the top controls the post metadata:

```yaml
---
title: "My Post Title"
date: 2026-09-21T07:00:00-04:00
draft: true
tags: ["AWS", "DevOps"]
categories: ["Cloud Architecture"]
description: "A brief description for SEO"
---

Your content here in Markdown...
```

### 11. Preview Your Draft

```bash
hugo server -D
```

Visit http://localhost:1313 to preview the post before publishing. The `-D` flag is required to see posts with `draft: true`.

### 12. Publish the Post

When you are ready to publish, change `draft: true` to `draft: false` in the front matter, then push:

```bash
git add content/posts/my-post-title.md
git commit -m "Publish: my post title"
git push
```

The pipeline runs automatically and the post is live within ~2 minutes.

---

## Part 5: Ongoing Maintenance

### Updating the PaperMod Theme

```bash
git submodule update --remote --merge
git add themes/PaperMod
git commit -m "Update PaperMod theme"
git push
```

### Testing a Production Build Locally

```bash
hugo --minify
```

Output is written to the `public/` directory. This folder is gitignored — GitHub Actions builds it fresh on every deployment.

---

## How the Pipeline Works

Here is what happens end-to-end every time you push to `main`:

```
Push to main branch
       ↓
GitHub Actions triggers .github/workflows/hugo.yml
       ↓
Ubuntu runner installs Hugo Extended v0.166.0
       ↓
Checks out repository + PaperMod submodule
       ↓
Runs: hugo --minify --baseURL https://catzer.github.io/matingi/
       ↓
Uploads public/ folder as a GitHub Pages artifact
       ↓
Deploys artifact to GitHub Pages CDN
       ↓
Site live at https://catzer.github.io/matingi/
```

The workflow file lives at `.github/workflows/hugo.yml`. The key steps are:

```yaml
- name: Install Hugo CLI
  run: |
    wget -O ${{ runner.temp }}/hugo.deb \
      https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.deb \
    && sudo dpkg -i ${{ runner.temp }}/hugo.deb

- name: Build with Hugo
  run: |
    hugo --minify --baseURL "${{ steps.pages.outputs.base_url }}/"

- name: Deploy to GitHub Pages
  uses: actions/deploy-pages@v4
```

---

## Quick Reference

| Task | Command |
|---|---|
| Start local server | `hugo server -D` |
| Create a new post | `hugo new content posts/title.md` |
| Test production build | `hugo --minify` |
| Deploy | `git add . && git commit -m "msg" && git push` |
| Update theme | `git submodule update --remote --merge` |

---

## Common Errors and Fixes

| Error | Cause | Fix |
|---|---|---|
| `Get Pages site failed` | GitHub Pages source not set to GitHub Actions | Settings → Pages → Source → GitHub Actions |
| `HttpError: Not Found` | Workflow permissions too restrictive | Settings → Actions → Read and write permissions |
| Theme missing / blank site | Submodule not initialized | `git submodule update --init --recursive` |
| Build fails on content | Post has invalid front matter | Check YAML syntax in the post's `---` block |
