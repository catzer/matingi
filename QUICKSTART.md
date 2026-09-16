# Quick Start Guide

## 🚀 View Your Blog Locally

```bash
hugo server -D
```

Then open: **http://localhost:1313**

## ✍️ Create a New Post

```bash
hugo new content posts/my-new-post.md
```

Edit the file in `content/posts/my-new-post.md`, set `draft: false` when ready to publish.

## 📦 Build for Production

```bash
hugo --minify
```

Output will be in the `public/` directory.

## 🌐 Deploy

### GitHub Pages
1. Push to GitHub
2. Enable GitHub Pages in repo settings
3. Set source to "GitHub Actions"
4. The workflow in `.github/workflows/hugo.yml` will deploy automatically

### Netlify
1. Sign up at netlify.com
2. Connect your GitHub repo
3. Netlify will auto-detect Hugo and deploy

## 🎨 Customize

- **Site info**: Edit `hugo.toml`
- **Home page**: Modify `[params.homeInfoParams]` in `hugo.toml`
- **Social links**: Update `[[params.socialIcons]]` in `hugo.toml`
- **Author name**: Change `author` field in post front matter

## 📝 Writing Tips

### Add Code Blocks
````markdown
```python
def hello():
    print("Hello World")
```
````

### Add Images
1. Put images in `static/images/`
2. Reference: `![Alt text](/images/my-image.png)`

### Add Tags
```yaml
---
tags: ["AWS", "DevOps", "Kubernetes"]
categories: ["Cloud Architecture"]
---
```

## 🔍 Key Files

- `hugo.toml` - Main configuration
- `content/posts/` - Your blog posts
- `themes/PaperMod/` - Theme (git submodule)
- `public/` - Generated site (don't edit)

## ⚡ Quick Commands

```bash
# Start dev server
hugo server -D

# Build production site
hugo --minify

# Create new post
hugo new content posts/post-name.md

# Update theme
git submodule update --remote --merge
```

## 📚 Sample Posts Included

1. **Building Scalable AWS Architecture** - Cloud architecture patterns
2. **CI/CD with GitHub Actions** - DevOps automation
3. **Kubernetes Monitoring** - SRE and observability

## 🛠️ Troubleshooting

**Port already in use?**
```bash
hugo server -D -p 1314
```

**Theme not showing?**
```bash
git submodule update --init --recursive
```

**Build errors?**
```bash
hugo --gc --minify --verbose
```

## 🎯 Next Steps

1. Update `baseURL` in `hugo.toml` with your domain
2. Change social links (GitHub, LinkedIn)
3. Replace "Your Name" with your actual name
4. Write your first post about your projects!
5. Push to GitHub and deploy

---

**Need help?** Check the full README.md for detailed documentation.
