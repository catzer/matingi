---
title: "How to Deploy a Hugo Blog to GitHub Pages Using GitHub Actions"
date: 2026-09-21T07:56:00-04:00
draft: false
tags: ["Hugo", "GitHub Actions", "GitHub Pages", "CI/CD", "DevOps"]
categories: ["DevOps"]
author: "jnziokah@gmail.com"
description: "A complete step-by-step guide to creating a Hugo blog with the PaperMod theme and deploying it automatically to GitHub Pages using GitHub Actions."
showToc: true
---

This guide walks you through everything you need to create a Hugo blog from scratch and deploy it to GitHub Pages using GitHub Actions — from initial setup to publishing your first live post.

## Prerequisites

Make sure you have the following installed on your machine:

- **Hugo Extended** — install on macOS with `brew install hugo`, or see the [Hugo installation docs](https://gohugo.io/installation/) for Windows/Linux
- **Git** — comes with macOS, or download from [git-scm.com](https://git-scm.com)
- **A GitHub account** — sign up free at [github.com](https://github.com)

Verify Hugo is installed correctly:

```bash
hugo version
# Expected output: hugo v0.166.0+extended (or later)
```

---

## Part 1: Create Your Hugo Site

### 1. Create a New Hugo Site

```bash
hugo new site my-blog
cd my-blog
git init
```

Replace `my-blog` with whatever you want to name your project.

### 2. Add the PaperMod Theme

[PaperMod](https://github.com/adityatelange/hugo-PaperMod) is a clean, fast, and feature-rich Hugo theme. Add it as a Git submodule so you can easily update it later:

```bash
git submodule add --depth=1 https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod
```

### 3. Configure Your Site

Open `hugo.toml` and replace its contents with this base configuration:

```toml
baseURL = 'https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/'
locale = 'en-us'
title = 'Your Blog Title'
theme = 'PaperMod'
paginate = 10

enableRobotsTXT = true
buildDrafts = false
buildFuture = false
buildExpired = false

[minify]
disableXML = true
minifyOutput = true

[params]
env = "production"
author = "Your Name"
description = "Your blog description"
defaultTheme = "auto"
ShowReadingTime = true
ShowPostNavLinks = true
ShowBreadCrumbs = true
ShowCodeCopyButtons = true
showtoc = true

[params.homeInfoParams]
Title = "Welcome to My Blog 👋"
Content = "A short intro about yourself and what you write about."

[[params.socialIcons]]
name = "github"
url = "https://github.com/YOUR-USERNAME"

[[params.socialIcons]]
name = "linkedin"
url = "https://linkedin.com/in/YOUR-PROFILE"

[[params.socialIcons]]
name = "rss"
url = "/index.xml"

[[menu.main]]
identifier = "posts"
name = "Posts"
url = "/posts/"
weight = 10

[[menu.main]]
identifier = "tags"
name = "Tags"
url = "/tags/"
weight = 20

[[menu.main]]
identifier = "search"
name = "Search"
url = "/search/"
weight = 30

[outputs]
home = ["HTML", "RSS", "JSON"]

[markup.highlight]
noClasses = false
codeFences = true
guessSyntax = true
lineNos = true
style = "monokai"
```

Replace the following placeholders with your own values:
- `YOUR-USERNAME` — your GitHub username
- `YOUR-REPO-NAME` — the name of your GitHub repository
- `Your Blog Title`, `Your Name`, `Your blog description` — your details

### 4. Add a Search Page

PaperMod's search feature requires a dedicated page:

```bash
cat > content/search.md << 'EOF'
---
title: "Search"
layout: "search"
summary: "search"
placeholder: "Search posts..."
---
EOF
```

### 5. Add a .gitignore

```bash
cat > .gitignore << 'EOF'
/public/
/resources/_gen/
.hugo_build.lock
.DS_Store
EOF
```

### 6. Test Locally

```bash
hugo server -D
```

Open http://localhost:1313 in your browser. You should see your blog running. Press `Ctrl+C` to stop.

---

## Part 2: Set Up GitHub

### 7. Create a GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Name it the same as your project folder (e.g. `my-blog`)
3. Set it to **Public** (required for free GitHub Pages)
4. Do **not** add a README, .gitignore, or license — you already have these locally
5. Click **Create repository**

### 8. Push Your Code

```bash
git add .
git commit -m "Initial Hugo site setup"
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git push -u origin main
```

---

## Part 3: GitHub Repository Settings

These settings only need to be configured once. Skipping either of them is the most common reason the pipeline fails.

### 9. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings → Pages**
3. Under **"Build and deployment"**, set the Source to **GitHub Actions**
4. Click **Save**

> Without this, the deployment action will throw a `Not Found` error and the pipeline fails.

### 10. Set Workflow Permissions

1. Go to **Settings → Actions → General**
2. Scroll down to **"Workflow permissions"**
3. Select **Read and write permissions**
4. Click **Save**

> This gives the GitHub Actions token permission to deploy your site to GitHub Pages.

---

## Part 4: Add the GitHub Actions Workflow

### 11. Create the Workflow File

```bash
mkdir -p .github/workflows
```

Create `.github/workflows/hugo.yml` with the following content:

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

### 12. Commit and Push the Workflow

```bash
git add .github/workflows/hugo.yml
git commit -m "Add GitHub Actions deployment workflow"
git push
```

This push will trigger the pipeline for the first time.

---

## Part 5: Monitor and View Your Site

### 13. Watch the Pipeline

- Go to your repository on GitHub
- Click the **Actions** tab
- Click the running workflow to see live logs
- It takes approximately 2 minutes to complete

### 14. View the Live Site

Once the pipeline shows a green checkmark, your site is live at:

```
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/
```

---

## Part 6: Writing and Publishing Posts

### 15. Create a New Post

```bash
hugo new content posts/my-post-title.md
```

### 16. Edit the Post

Open the file in any text editor. The front matter at the top controls the post metadata:

```yaml
---
title: "My Post Title"
date: 2026-09-21T07:00:00-04:00
draft: true
tags: ["tag1", "tag2"]
categories: ["Category"]
description: "A brief description for SEO"
---

Your content here in Markdown...
```

### 17. Preview Your Draft

```bash
hugo server -D
```

Visit http://localhost:1313. The `-D` flag includes posts with `draft: true`.

### 18. Publish the Post

Change `draft: true` to `draft: false`, then push:

```bash
git add content/posts/my-post-title.md
git commit -m "Publish: my post title"
git push
```

The pipeline runs automatically and the post is live within ~2 minutes.

---

## Part 7: Ongoing Maintenance

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

Output is written to `public/`. This folder is gitignored — GitHub Actions builds it fresh on every deploy.

---

## How the Pipeline Works

Here is what happens end-to-end every time you push to `main`:

```
Push to main branch
       ↓
GitHub Actions triggers hugo.yml
       ↓
Ubuntu runner installs Hugo Extended
       ↓
Checks out repo + PaperMod submodule
       ↓
Runs: hugo --minify --baseURL <your-pages-url>
       ↓
Uploads public/ as a GitHub Pages artifact
       ↓
Deploys artifact to GitHub Pages CDN
       ↓
Site goes live
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
| Blank site / theme missing | Submodule not initialized | `git submodule update --init --recursive` |
| Build fails on content | Invalid front matter YAML | Check the `---` block at the top of your post |
| `baseURL` wrong | Placeholder not replaced in `hugo.toml` | Update `baseURL` to your actual GitHub Pages URL |
