# Technology Stack - Technical Blog

## Technology Overview

### Stack Summary
- **Static Site Generator**: Hugo v0.166.0 (Extended)
- **Theme**: PaperMod (Git submodule)
- **Content Format**: Markdown with YAML front matter
- **Version Control**: Git + GitHub
- **CI/CD**: GitHub Actions
- **Hosting**: GitHub Pages / Netlify (free tier)
- **Package Manager**: Homebrew (macOS)

## Core Technologies

### Hugo Static Site Generator
**Version**: 0.166.0 (Extended)

**Why Hugo?**
✅ **Blazing fast** - Builds site in milliseconds
✅ **No dependencies** - Single binary, no npm/Ruby/Python
✅ **Markdown-first** - Perfect for developers
✅ **Git-friendly** - Plain text content, version control
✅ **SEO-optimized** - Built-in sitemap, RSS, meta tags
✅ **Theme ecosystem** - Large collection of themes
✅ **Asset pipeline** - Built-in SCSS, minification
✅ **Zero security concerns** - Static output, no database

**Alternatives Considered**:
- **Jekyll** - Ruby dependency, slower builds
- **Gatsby** - JavaScript heavy, complex setup
- **Next.js** - Overkill for static blog
- **Astro** - Newer, less mature ecosystem

**Installation**:
```bash
brew install hugo
hugo version  # v0.166.0+extended
```

**Key Features Used**:
- Content organization (`content/posts/`)
- Markdown rendering with syntax highlighting
- Theme support (PaperMod)
- Shortcodes for custom components
- Asset pipeline (minification)
- Sitemap and RSS generation
- Search index generation (JSON)

### PaperMod Theme
**Repository**: https://github.com/adityatelange/hugo-PaperMod
**Integration**: Git submodule

**Why PaperMod?**
✅ **Clean, minimal design** - Focuses on content
✅ **Fast performance** - Lightweight, optimized
✅ **Dark mode** - Automatic theme switching
✅ **Code highlighting** - Perfect for technical content
✅ **Search built-in** - Client-side search
✅ **Mobile-responsive** - Works on all devices
✅ **SEO-ready** - Meta tags, structured data
✅ **Active maintenance** - Regular updates

**Alternatives Considered**:
- **Terminal** - Too minimalist
- **Anatole** - Less feature-rich
- **Coder** - Not blog-focused

**Theme Configuration** (in `hugo.toml`):
```toml
theme = 'PaperMod'

[params]
  ShowReadingTime = true
  ShowCodeCopyButtons = true
  ShowBreadCrumbs = true
  ShowPostNavLinks = true
```

**Customization Approach**:
- Use theme as-is (git submodule)
- Override specific templates in `layouts/` (if needed)
- Custom CSS in `assets/css/` (if needed)

### Markdown
**Standard**: CommonMark + GitHub Flavored Markdown

**Why Markdown?**
✅ **Developer-friendly** - Plain text, easy to write
✅ **Version control** - Git diffs work perfectly
✅ **Portable** - Can migrate to other platforms
✅ **Readable** - Even in raw form
✅ **Extensible** - Hugo shortcodes for custom components

**Features Used**:
- Headers (`#`, `##`, `###`)
- Code blocks with syntax highlighting
- Lists (ordered, unordered)
- Links and images
- Tables
- Blockquotes
- Front matter (YAML metadata)

**Example Post Structure**:
```markdown
---
title: "Post Title"
date: 2026-09-15T10:00:00-04:00
draft: false
tags: ["AWS", "DevOps"]
---

## Introduction
Content here...

```python
# Code example
def hello():
    print("Hello")
```
```

## Development Tools

### Local Development
- **Text Editor**: Any (VS Code, Sublime, Vim)
- **Terminal**: macOS Terminal / iTerm2
- **Hugo Server**: `hugo server -D` (live reload)
- **Browser**: Chrome/Firefox/Safari (dev tools)

### Version Control
- **Git**: Version control
- **GitHub**: Remote repository + CI/CD + hosting
- **Git Submodules**: Theme management

### Package Management
- **Homebrew**: Hugo installation on macOS
- **No npm/yarn**: Hugo is self-contained

### Code Quality
- **Markdown Linting**: (Optional) markdownlint
- **Link Checking**: (Future) Check for broken links
- **Spell Checking**: Built into editors

## Deployment Stack

### CI/CD: GitHub Actions
**Workflow**: `.github/workflows/hugo.yml`

**Pipeline Steps**:
1. **Trigger**: Push to `main` branch
2. **Checkout**: Clone repository with submodules
3. **Install Hugo**: Download v0.166.0
4. **Build**: Run `hugo --minify`
5. **Deploy**: Upload to GitHub Pages

**Build Time**: ~2 minutes
**Cost**: Free (GitHub Actions free tier)

**Workflow Configuration**:
```yaml
on:
  push:
    branches: ["main"]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Install Hugo
        run: |
          wget -O hugo.deb \
            https://github.com/gohugoio/hugo/releases/download/v0.166.0/hugo_extended_0.166.0_linux-amd64.deb
          sudo dpkg -i hugo.deb
      
      - name: Build
        run: hugo --minify
      
      - name: Deploy
        uses: actions/deploy-pages@v4
```

### Hosting: GitHub Pages
**URL Structure**: `https://username.github.io/matingi/`
**Custom Domain**: (Future) Point DNS to GitHub Pages

**Why GitHub Pages?**
✅ **Free hosting** - No cost
✅ **Automatic HTTPS** - SSL included
✅ **CDN** - Fast global delivery
✅ **Integrated CI/CD** - With GitHub Actions
✅ **Custom domains** - Supported

**Alternatives**:
- **Netlify** - Alternative free hosting (configured)
- **Vercel** - Similar to Netlify
- **AWS S3 + CloudFront** - More control, more complex
- **Self-hosted** - VPS with Nginx

**Current Setup**:
- Primary: GitHub Pages (via Actions)
- Backup: Netlify (configured, ready to use)

### Alternative: Netlify
**Configuration**: `netlify.toml`

**Auto-deploy on**:
- Push to any branch
- Pull request (preview deploy)

**Build Settings**:
```toml
[build]
  command = "hugo --gc --minify"
  publish = "public"
  
[build.environment]
  HUGO_VERSION = "0.166.0"
```

**Why Netlify?**
✅ **Zero config** - Auto-detects Hugo
✅ **Deploy previews** - Test PRs before merge
✅ **Branch deploys** - Test different branches
✅ **Form handling** - (Future) Contact forms
✅ **Analytics** - Built-in (paid tier)

## Performance Optimizations

### Build Performance
- **Hugo caching** - Incremental builds
- **Git submodules** - Shallow clone theme
- **Minification** - HTML/CSS/JS compression

### Runtime Performance
- **Static HTML** - No server processing
- **Minified assets** - Smaller file sizes
- **Image optimization** - (Manual) Compress images before upload
- **CDN delivery** - GitHub Pages / Netlify CDN
- **Browser caching** - Headers in `netlify.toml`

### SEO Optimizations
- **Sitemap.xml** - Auto-generated by Hugo
- **RSS feed** - Auto-generated
- **Meta tags** - Provided by theme
- **Structured data** - Schema.org markup
- **Mobile-friendly** - Responsive design
- **Fast load times** - Static site advantage

## Security Considerations

### Threats (Minimal for Static Site)
- ❌ **No SQL injection** - No database
- ❌ **No XSS attacks** - No user input
- ❌ **No authentication** - Public site
- ❌ **No server vulnerabilities** - Static files

### Security Measures
✅ **HTTPS enforced** - GitHub Pages default
✅ **No exposed secrets** - No API keys in static site
✅ **Content security** - Headers in `netlify.toml`
✅ **Dependency management** - Git submodule for theme
✅ **Version pinning** - Hugo v0.166.0 specified

### Security Headers (Netlify)
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

## Monitoring & Analytics

### Current State
- No analytics installed (privacy-first approach)

### Future Options
1. **Google Analytics 4**
   - Industry standard
   - Free
   - Detailed metrics
   - Privacy concerns

2. **Plausible Analytics**
   - Privacy-friendly
   - GDPR compliant
   - Lightweight
   - Paid ($9/month)

3. **Cloudflare Analytics**
   - Free with Cloudflare
   - Privacy-friendly
   - Basic metrics

4. **Self-hosted Umami**
   - Full privacy control
   - Open source
   - Requires hosting

**Decision**: Start without analytics, add later if needed

## Backup & Disaster Recovery

### Data Backup
- **Source control**: GitHub (primary)
- **Local copies**: Developer machines
- **Git history**: Full version history

### Recovery Scenarios
1. **Lost local files**: `git clone` from GitHub
2. **Corrupted theme**: `git submodule update --force`
3. **GitHub unavailable**: Switch to Netlify deployment
4. **Both down**: Deploy `public/` folder anywhere

### Theme Updates
```bash
# Update theme to latest
git submodule update --remote --merge

# Rollback if broken
git submodule update --init
```

## Development Dependencies

### Required
- **Hugo Extended** v0.166.0+
- **Git** 2.0+
- **Text editor** (any)

### Optional
- **Node.js** (if adding npm packages later)
- **ImageOptim** (image compression)
- **markdownlint** (Markdown linting)

### Not Needed
- ❌ Database
- ❌ Web server (for development)
- ❌ Backend language runtime
- ❌ Build tools (webpack, gulp, etc.)

## Technology Decisions

### Why Static Site?
✅ **Security** - No attack surface
✅ **Performance** - Instant page loads
✅ **Cost** - Free hosting
✅ **Simplicity** - No backend to maintain
✅ **Reliability** - CDN uptime
✅ **Scalability** - Handles any traffic
✅ **Portability** - Easy to migrate

### Why Not WordPress?
❌ Database maintenance
❌ Security patches
❌ Plugin conflicts
❌ Slower performance
❌ Hosting costs
❌ Over-engineered for blog

### Why Not Headless CMS?
❌ Unnecessary complexity
❌ Additional cost
❌ Markdown in Git is simpler
❌ Version control built-in

## Future Technology Additions

### Planned
- **Google Analytics** - Traffic insights
- **Giscus Comments** - GitHub-based comments
- **Image CDN** - Cloudinary or imgix
- **Newsletter** - Buttondown or Substack integration

### Considered
- **React components** - Interactive demos
- **Web vitals monitoring** - Performance tracking
- **A/B testing** - Content experiments
- **Progressive Web App** - Offline support

### Not Planned
- Database - Stays static
- Server-side rendering - Not needed
- Authentication - Public blog
- CMS - Markdown is sufficient

## Technology Risks & Mitigation

### Risk: Hugo Breaking Changes
**Mitigation**: Pin Hugo version in CI/CD (v0.166.0)

### Risk: Theme Abandonment
**Mitigation**: Git submodule = frozen in time, can fork

### Risk: GitHub Pages Deprecation
**Mitigation**: Netlify configured as backup

### Risk: Vendor Lock-in
**Mitigation**: Standard Markdown, easily portable

## Development Environment

### macOS Setup
```bash
# Install Hugo
brew install hugo

# Clone repository
git clone https://github.com/username/matingi.git
cd matingi

# Initialize theme
git submodule update --init --recursive

# Start development server
hugo server -D
```

### Windows Setup
```powershell
# Install Hugo (via Chocolatey)
choco install hugo-extended

# Same git commands as macOS
```

### Linux Setup
```bash
# Download Hugo binary
wget https://github.com/gohugoio/hugo/releases/download/v0.166.0/hugo_extended_0.166.0_Linux-64bit.tar.gz
tar -xzf hugo_extended_0.166.0_Linux-64bit.tar.gz
sudo mv hugo /usr/local/bin/

# Same git commands
```

---

*Last Updated: September 16, 2026*
