# Cloud Architecture & DevOps Blog

A technical blog documenting cloud architecture, DevOps practices, and SRE projects built with Hugo and the PaperMod theme.

## 🚀 Quick Start

### Prerequisites
- [Hugo Extended](https://gohugo.io/installation/) v0.166.0 or later
- Git

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/your-blog-repo.git
cd your-blog-repo
```

2. Initialize theme submodule:
```bash
git submodule update --init --recursive
```

3. Start the development server:
```bash
hugo server -D
```

4. Open http://localhost:1313 in your browser

## 📝 Creating Content

### New Blog Post

```bash
hugo new content posts/my-new-post.md
```

This creates a new post with front matter:

```yaml
---
title: "My New Post"
date: 2024-03-15T10:00:00-04:00
draft: true
tags: ["tag1", "tag2"]
categories: ["category"]
author: "Your Name"
description: "Post description"
---
```

### Front Matter Options

- `title`: Post title
- `date`: Publication date
- `draft`: Set to `false` to publish
- `tags`: Array of tags
- `categories`: Array of categories
- `description`: SEO description
- `cover`: Cover image configuration

### Writing Tips

1. **Use code blocks with syntax highlighting:**
````markdown
```python
def hello_world():
    print("Hello, World!")
```
````

2. **Add images:**
```markdown
![Alt text](/images/my-image.png)
```

3. **Internal links:**
```markdown
[Link to another post]({{< ref "posts/other-post.md" >}})
```

## 🎨 Customization

### Site Configuration

Edit `hugo.toml` to customize:
- Site title and description
- Author information
- Social links (GitHub, LinkedIn, etc.)
- Theme colors
- Navigation menu

### Example Configuration

```toml
[params]
  author = "Your Name"
  description = "Your blog description"
  
[[params.socialIcons]]
  name = "github"
  url = "https://github.com/yourusername"

[[params.socialIcons]]
  name = "linkedin"
  url = "https://linkedin.com/in/yourprofile"
```

## 🚢 Deployment

### Option 1: GitHub Pages (Free)

1. Enable GitHub Pages in repository settings
2. Set source to "GitHub Actions"
3. Push to main branch - automatic deployment via `.github/workflows/hugo.yml`

Your site will be available at: `https://yourusername.github.io/your-repo-name/`

### Option 2: Netlify (Free)

1. Sign up at [Netlify](https://netlify.com)
2. Connect your GitHub repository
3. Configure build settings:
   - Build command: `hugo --gc --minify`
   - Publish directory: `public`
   - Hugo version: `0.166.0`

Netlify will auto-deploy on every push to main.

### Option 3: Custom Domain

After deployment, add a custom domain:

**GitHub Pages:**
- Add `CNAME` file with your domain
- Configure DNS A records to GitHub IPs

**Netlify:**
- Add domain in Netlify dashboard
- Update DNS to Netlify nameservers

## 📊 Analytics (Optional)

### Google Analytics

Add to `hugo.toml`:
```toml
[services.googleAnalytics]
  ID = "G-XXXXXXXXXX"
```

### Plausible Analytics

Add to `params` in `hugo.toml`:
```toml
[params]
  plausibleDataDomain = "yourdomain.com"
```

## 🔍 SEO Optimization

The theme includes:
- ✅ Open Graph tags
- ✅ Twitter Cards
- ✅ Schema.org structured data
- ✅ Sitemap generation
- ✅ RSS feed

### Submit to Search Engines

1. Generate sitemap (automatic at `/sitemap.xml`)
2. Submit to [Google Search Console](https://search.google.com/search-console)
3. Submit to [Bing Webmaster Tools](https://www.bing.com/webmasters)

## 📁 Project Structure

```
.
├── .github/
│   └── workflows/
│       └── hugo.yml          # GitHub Actions deployment
├── content/
│   ├── posts/                # Blog posts
│   └── search.md             # Search page
├── themes/
│   └── PaperMod/             # Theme (git submodule)
├── hugo.toml                 # Site configuration
├── netlify.toml              # Netlify configuration
└── README.md                 # This file
```

## 🛠️ Common Tasks

### Update theme

```bash
git submodule update --remote --merge
```

### Build for production

```bash
hugo --minify
```

Output will be in `public/` directory.

### Check for broken links

```bash
hugo --gc --minify
# Then use a link checker on public/ directory
```

### Preview drafts

```bash
hugo server -D
```

## 🎯 Content Ideas

- **Cloud Architecture**: AWS/Azure/GCP tutorials, architecture patterns
- **DevOps**: CI/CD pipelines, Infrastructure as Code, automation
- **SRE**: Monitoring, incident response, reliability engineering
- **Case Studies**: Real-world projects and lessons learned
- **Tutorials**: Step-by-step guides with code examples

## 📚 Resources

- [Hugo Documentation](https://gohugo.io/documentation/)
- [PaperMod Theme Wiki](https://github.com/adityatelange/hugo-PaperMod/wiki)
- [Markdown Guide](https://www.markdownguide.org/)

## 🤝 Contributing

Found a typo or want to suggest improvements?

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

Content: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
Theme: [MIT License](https://github.com/adityatelange/hugo-PaperMod/blob/master/LICENSE)

## 🙋 Support

- Open an issue for bugs or questions
- Star ⭐ the repository if you find it helpful
- Share your blog posts on social media!

---

Built with ❤️ using [Hugo](https://gohugo.io) and [PaperMod](https://github.com/adityatelange/hugo-PaperMod)
