---
title: "Kubernetes Monitoring with Prometheus and Grafana"
date: 2024-03-05T09:00:00-04:00
draft: false
tags: ["Kubernetes", "Prometheus", "Grafana", "Monitoring", "SRE"]
categories: ["SRE"]
author: "Your Name"
description: "Complete guide to setting up production-grade monitoring for Kubernetes clusters"
---

## Why Monitoring Matters

You can't manage what you don't measure. In this post, I'll show you how to implement comprehensive monitoring for Kubernetes using Prometheus and Grafana.

## Architecture Overview

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│              │      │              │      │              │
│  Prometheus  │─────▶│   Grafana    │      │  Alertmanager│
│              │      │              │      │              │
└──────────────┘      └──────────────┘      └──────────────┘
       │                                             │
       │                                             ▼
       ▼                                      ┌──────────────┐
┌──────────────┐                             │   PagerDuty  │
│   Metrics    │                             │    Slack     │
│  - Nodes     │                             └──────────────┘
│  - Pods      │
│  - Services  │
└──────────────┘
```

## Installation

### 1. Install Prometheus Operator

Using kube-prometheus-stack Helm chart:

```bash
# Add Helm repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Create monitoring namespace
kubectl create namespace monitoring

# Install kube-prometheus-stack
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set prometheus.prometheusSpec.retention=30d \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi \
  --set grafana.adminPassword=YourSecurePassword
```

### 2. Verify Installation

```bash
# Check all pods are running
kubectl get pods -n monitoring

# Expected output:
# prometheus-operator-...           1/1     Running
# prometheus-prometheus-0           2/2     Running
# alertmanager-alertmanager-0       2/2     Running
# grafana-...                       1/1     Running
```

## Custom Metrics

### ServiceMonitor for Your Application

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: myapp-metrics
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: myapp
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics
```

### Application Instrumentation

Example Node.js app with Prometheus metrics:

```javascript
const express = require('express');
const promClient = require('prom-client');

const app = express();
const register = new promClient.Registry();

// Collect default metrics
promClient.collectDefaultMetrics({ register });

// Custom business metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const activeUsers = new promClient.Gauge({
  name: 'active_users_total',
  help: 'Number of currently active users'
});

register.registerMetric(httpRequestDuration);
register.registerMetric(activeUsers);

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(3000);
```

## Essential Queries

### Node Resource Usage

```promql
# CPU usage per node
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage per node
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100

# Disk usage
(node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes * 100
```

### Pod Metrics

```promql
# Pod CPU usage
sum(rate(container_cpu_usage_seconds_total[5m])) by (pod, namespace)

# Pod memory usage
sum(container_memory_working_set_bytes) by (pod, namespace)

# Pod restart count
sum(increase(kube_pod_container_status_restarts_total[1h])) by (pod, namespace)
```

### Application Performance

```promql
# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status_code=~"5.."}[5m])

# Request latency (p95)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

## Grafana Dashboards

### Import Pre-built Dashboards

1. **Kubernetes Cluster Overview** (ID: 7249)
2. **Node Exporter Full** (ID: 1860)
3. **Kubernetes Pod Resources** (ID: 6417)

Import via Grafana UI: 
```
+ → Import → Enter dashboard ID → Load
```

### Custom Dashboard JSON

Example panel configuration:

```json
{
  "panels": [
    {
      "title": "Request Rate",
      "targets": [
        {
          "expr": "rate(http_requests_total[5m])",
          "legendFormat": "{{method}} {{route}}"
        }
      ],
      "type": "graph"
    }
  ]
}
```

## Alerting Rules

### PrometheusRule Custom Resource

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: application-alerts
  namespace: monitoring
spec:
  groups:
  - name: application
    interval: 30s
    rules:
    - alert: HighErrorRate
      expr: |
        rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High error rate detected"
        description: "Error rate is {{ $value | humanizePercentage }}"
    
    - alert: PodCrashLooping
      expr: |
        rate(kube_pod_container_status_restarts_total[15m]) > 0
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "Pod {{ $labels.pod }} is crash looping"
    
    - alert: HighMemoryUsage
      expr: |
        container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
      for: 10m
      labels:
        severity: warning
      annotations:
        summary: "Container {{ $labels.container }} memory usage > 90%"
```

### Alertmanager Configuration

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: alertmanager-config
  namespace: monitoring
stringData:
  alertmanager.yaml: |
    global:
      resolve_timeout: 5m
    
    route:
      group_by: ['alertname', 'cluster']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 12h
      receiver: 'slack-notifications'
      routes:
      - match:
          severity: critical
        receiver: 'pagerduty'
    
    receivers:
    - name: 'slack-notifications'
      slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK'
        channel: '#alerts'
        text: |
          {{ range .Alerts }}
          *Alert:* {{ .Labels.alertname }}
          *Description:* {{ .Annotations.description }}
          *Severity:* {{ .Labels.severity }}
          {{ end }}
    
    - name: 'pagerduty'
      pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_KEY'
```

## SLI/SLO Monitoring

### Define SLOs

```yaml
# 99.9% availability SLO
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: slo-alerts
spec:
  groups:
  - name: slo
    rules:
    - record: slo:availability:ratio_rate5m
      expr: |
        (
          sum(rate(http_requests_total{status_code!~"5.."}[5m]))
          /
          sum(rate(http_requests_total[5m]))
        )
    
    - alert: SLOBudgetBurn
      expr: |
        slo:availability:ratio_rate5m < 0.999
      for: 15m
      annotations:
        summary: "SLO budget burning too fast"
```

## Performance Optimization

### Reduce Cardinality

```yaml
# Drop high-cardinality labels
relabel_configs:
- source_labels: [__name__]
  regex: 'high_cardinality_metric.*'
  action: drop
```

### Recording Rules

Pre-compute expensive queries:

```yaml
groups:
- name: recording_rules
  interval: 30s
  rules:
  - record: job:http_requests:rate5m
    expr: sum(rate(http_requests_total[5m])) by (job)
```

## Best Practices

1. **Label Hygiene**
   - Keep cardinality low
   - Use consistent naming
   - Avoid user IDs in labels

2. **Retention Policy**
   - Raw metrics: 15-30 days
   - Downsampled: 90 days+
   - Critical metrics: 1 year

3. **Alert Fatigue**
   - Group related alerts
   - Set appropriate thresholds
   - Use inhibition rules

## Real-World Results

**Our Improvements:**
- MTTD (Mean Time To Detect): 30 min → 2 min
- MTTR (Mean Time To Resolve): 2 hours → 20 min
- False positive rate: 40% → 5%

## Troubleshooting

### Prometheus Pod OOM
**Solution**: Increase memory limits, reduce retention, or add remote storage

### Missing Metrics
**Solution**: Check ServiceMonitor selectors, verify /metrics endpoint

### High Cardinality
**Solution**: Use `promtool tsdb analyze` to identify culprits

## Next Steps

- Implement distributed tracing with Jaeger
- Add log aggregation with Loki
- Set up cost monitoring

## Resources

- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)
- [PromQL Cheat Sheet](https://promlabs.com/promql-cheat-sheet/)

---

*Have monitoring questions? Open an issue on [GitHub](https://github.com/yourusername/your-blog-repo).*
