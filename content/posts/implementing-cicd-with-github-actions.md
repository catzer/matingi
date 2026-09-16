---
title: "Implementing CI/CD with GitHub Actions: A Complete Guide"
date: 2024-03-10T14:30:00-04:00
draft: false
tags: ["CI/CD", "GitHub Actions", "DevOps", "Automation"]
categories: ["DevOps"]
author: "Your Name"
description: "Step-by-step guide to building a production-ready CI/CD pipeline using GitHub Actions"
---

## Introduction

CI/CD pipelines are the backbone of modern software delivery. In this post, I'll show you how to build a complete CI/CD pipeline using GitHub Actions that includes testing, security scanning, and automated deployments.

## Pipeline Overview

Our pipeline will:
1. ✅ Run unit and integration tests
2. 🔒 Perform security scanning (SAST, dependency audit)
3. 🏗️ Build and push Docker images
4. 🚀 Deploy to staging automatically
5. 📦 Deploy to production with approval

## Workflow Configuration

### Basic Workflow Structure

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run unit tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

### Security Scanning

```yaml
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
      
      - name: Dependency audit
        run: npm audit --audit-level=high
```

### Build and Push Docker Image

```yaml
  build:
    needs: [test, security]
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=sha,prefix={{branch}}-
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### Deploy to Staging

```yaml
  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.example.com
    
    steps:
      - name: Deploy to staging
        run: |
          echo "Deploying to staging..."
          # Example: kubectl set image deployment/app app=$IMAGE_TAG
          # Or: aws ecs update-service --cluster staging --service app
```

### Deploy to Production (with approval)

```yaml
  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://example.com
    
    steps:
      - name: Deploy to production
        run: |
          echo "Deploying to production..."
          # Deployment commands here
```

## Advanced Features

### Matrix Testing

Test across multiple versions:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm test
```

### Conditional Deployments

```yaml
- name: Deploy only on version tags
  if: startsWith(github.ref, 'refs/tags/v')
  run: |
    # Production deployment
```

### Slack Notifications

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Best Practices

### 1. Cache Dependencies
```yaml
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

### 2. Use Environments for Protection Rules
- Require manual approval for production
- Set environment secrets separately
- Configure deployment branches

### 3. Secure Secrets Management
- Use GitHub Secrets for sensitive data
- Rotate secrets regularly
- Use environment-specific secrets

### 4. Fail Fast
- Run tests before heavy operations
- Use `needs` to create dependencies
- Set timeouts to prevent hung jobs

## Performance Optimization

Our pipeline improvements:
- **Before**: 12 minutes average
- **After**: 4 minutes average

**Optimizations:**
- Docker layer caching: -3 minutes
- Dependency caching: -2 minutes
- Parallel jobs: -2 minutes
- Optimized test suite: -1 minute

## Monitoring Pipeline Health

Track these metrics:
- Success/failure rate
- Average execution time
- Queue time
- Cost (if using private runners)

## Cost Breakdown

**GitHub Actions pricing (Free tier):**
- Public repos: Unlimited
- Private repos: 2,000 minutes/month free
- Our usage: ~800 minutes/month (within free tier)

## Troubleshooting Common Issues

### Issue: Slow builds
**Solution**: Add caching, use matrix parallelization

### Issue: Intermittent failures
**Solution**: Add retries, check for race conditions

### Issue: Secret not available
**Solution**: Check environment context, verify secret name

## Next Steps

- Implement blue/green deployments
- Add automated rollback
- Set up canary releases

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Awesome Actions](https://github.com/sdras/awesome-actions)

---

*Questions? Leave a comment or open an issue on [GitHub](https://github.com/yourusername/your-blog-repo).*
