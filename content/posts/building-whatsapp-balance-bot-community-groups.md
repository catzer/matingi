---
title: "Building a WhatsApp Member Balance Bot for Community Groups: A No-Code POC"
date: 2026-10-31T21:50:00-04:00
draft: false
tags: ["WhatsApp", "Twilio", "n8n", "Automation", "Community", "No-Code"]
categories: ["Automation"]
author: "jnziokah@gmail.com"
description: "A step-by-step guide to build a WhatsApp bot that lets community members check their balances instantly using Twilio, n8n, and Google Drive. No coding required."
showToc: true
---

## The Problem

Community welfare groups face a constant headache: members asking "What's my balance?" through calls, texts, emails, and in-person visits. Managing finances manually becomes chaotic fast, especially as groups grow beyond 50–100 members.

What if members could simply text your WhatsApp number and get their balance instantly? No phone calls needed. No admin overhead.

## The Solution: A WhatsApp Bot in 2 Hours

I recently built a working proof-of-concept (POC) that does exactly this. Here's how, step by step.

### Architecture Overview

The flow is simple:

1. Member sends: `balance Jane Doe`
2. Bot receives via Twilio WhatsApp API
3. Bot searches a CSV of members
4. Bot replies with balance + standing status
5. Member is happy. Admin is less stressed.

All orchestrated in **n8n** (open-source workflow automation) with zero custom code.

---

## Prerequisites

You'll need:

- **Twilio account** (free sandbox available; ~$1 USD/month for a production number)
- **Google Drive** (free; store your member CSV there)
- **n8n** (self-hosted on a $5/month VPS, or cloud instance)
- **CSV with members**: id, name, balance

**Total setup time: 1–2 hours.**

---

## Step 1: Set Up Twilio WhatsApp

1. **Create a Twilio account** → https://www.twilio.com/console
2. Go to **Messaging** → **Try it Out** → **Send an SMS**
3. Upgrade to **WhatsApp Sandbox** (free for testing)
4. Scan the QR code to join the sandbox with your personal phone
5. You'll get a Twilio WhatsApp number (e.g., `+1 415 523 8886`)

**Save these credentials:**
- Account SID: `AC...`
- Auth Token: `your_token_here`
- WhatsApp Sandbox Number: `+1 415 523 8886`

---

## Step 2: Prepare Your Member Data

Export or create a CSV with this structure:

```
id,name,balance
1,Jane Njeri,450.0
2,John Karanja,-120.5
3,Grace Wambui,280.0
...
```

Upload it to **Google Drive**. Note the file ID from the URL.

Example URL: `https://drive.google.com/file/d/1uWHA_pOPN83Sl5Ds6wG87684e5-HkrA9/`
File ID: `1uWHA_pOPN83Sl5Ds6wG87684e5-HkrA9`

---

## Step 3: Set Up n8n

### Option A: Self-Hosted (Recommended for Cost)

```bash
docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
```

Access at `http://localhost:5678`

### Option B: n8n Cloud

Free tier available; no credit card needed.

---

## Step 4: Build the Workflow

In n8n, create these nodes in order:

### 1. **WhatsApp Webhook** (Trigger)
- Type: Webhook
- Method: POST
- Path: `/balance-check` (anything you want)
- Save and copy the webhook URL

### 2. **ACK 200** (Response Node)
- Immediately acknowledge Twilio to prevent retries
- Response: "OK"

### 3. **Is Text Message?** (Conditional)
- Filter to text only: `$json.body.MessageType == "text"`

### 4. **Extract Fields** (Set Node)
Create these assignments:
- `senderPhone`: `{{ $json.body.From }}`
- `rawText`: `{{ $json.body.Body }}`
- `messageSid`: `{{ $json.body.MessageSid }}`

And underscore versions for passthrough:
- `_senderPhone`: `{{ $json.body.From }}`
- `_rawText`: `{{ $json.body.Body }}`
- `_messageSid`: `{{ $json.body.MessageSid }}`

### 5. **Set Variables** (Set Node - Optional but Recommended)
Store the extracted values:
- `senderPhone`: `{{ $json._senderPhone }}`
- `rawText`: `{{ $json._rawText }}`
- `messageSid`: `{{ $json._messageSid }}`

### 6. **Download CSV from Google Drive** (Google Drive Node)
- Operation: Download
- File ID: Paste your member CSV file ID
- Format: Auto-detect

### 7. **Parse CSV** (Extract from File)
- Header Row: Yes
- Outputs 1 row per member

### 8. **Fuzzy Lookup + Format Reply** (Code Node)

This is the brain. Paste this JavaScript:

```javascript
const senderPhone = $input.first().json._senderPhone || 'unknown';
const rawText = $input.first().json._rawText || '';
const messageSid = $input.first().json._messageSid || '';

// Collect all CSV members
const MEMBERS = $input.all()
  .filter(item => item.json.id && item.json.name && item.json.balance !== undefined)
  .map(item => ({
    id: parseInt(item.json.id),
    name: String(item.json.name).trim(),
    balance: parseFloat(item.json.balance)
  }));

const MINIMUM = 300; // Your minimum balance threshold

// Check if message contains balance keyword
const BALANCE_RE = /\b(balance|check|account|how much)\b/i;
if (!BALANCE_RE.test(rawText)) {
  return [{
    json: {
      senderPhone, messageSid,
      replyMessage: 'Hi! Send: *balance [your name]*\nExample: balance Jane Njeri'
    }
  }];
}

// Extract name from message
const nameQuery = rawText
  .replace(BALANCE_RE, '')
  .trim();

if (!nameQuery) {
  return [{
    json: {
      senderPhone, messageSid,
      replyMessage: 'Please include your name.\nExample: *balance Jane Njeri*'
    }
  }];
}

// Score and fuzzy-match names
function score(memberName) {
  const ml = memberName.toLowerCase();
  if (ml === nameQuery.toLowerCase()) return 1000;
  let s = 0;
  if (ml.includes(nameQuery.toLowerCase())) s += 10;
  return s;
}

const scored = MEMBERS
  .map(m => ({ ...m, score: score(m.name) }))
  .filter(m => m.score > 0)
  .sort((a, b) => b.score - a.score);

if (scored.length === 0) {
  return [{
    json: {
      senderPhone, messageSid,
      replyMessage: `❌ Could not find member: "${nameQuery}"`
    }
  }];
}

// Format reply with balance and status
const member = scored[0];
const balance = member.balance;
const status = balance >= MINIMUM ? '✅ Good Standing' : '⚠️ Below Minimum';
const balanceStr = balance >= 0 ? `$${balance.toFixed(2)}` : `-$${Math.abs(balance).toFixed(2)}`;

return [{
  json: {
    senderPhone, messageSid,
    replyMessage: `👤 ${member.name}\n💰 Balance: ${balanceStr}\n📋 Status: ${status}`
  }
}];
```

### 9. **Send WhatsApp Message via Twilio** (HTTP Request)

- **Method:** POST
- **URL:** `https://api.twilio.com/2010-04-01/Accounts/{ACCOUNT_SID}/Messages`
- **Authentication:** HTTP Basic Auth
  - Username: `{ACCOUNT_SID}`
  - Password: `{AUTH_TOKEN}`
- **Body (form-urlencoded):**
  - `From`: `whatsapp:+1415238886` (your Twilio number)
  - `To`: `{{ $json.senderPhone }}`
  - `Body`: `{{ $json.replyMessage }}`

---

## Step 5: Connect Twilio to n8n

1. In n8n, get the Webhook URL from step 1
2. In Twilio Console → Phone Numbers → Manage
3. Find your WhatsApp Sandbox number
4. Set **When a message comes in**: POST to your n8n webhook URL
5. Save

---

## Step 6: Test

Send a WhatsApp message to your Twilio number:

```
balance Jane Njeri
```

You should receive:

```
👤 Jane Njeri
💰 Balance: $450.00
📋 Status: ✅ Good Standing
```

---

## What's Next?

This POC is just the beginning. You can extend it:

- **Payment recording**: Members send `pay 100` and it logs pending verification
- **Multiple languages**: Add Swahili or local languages
- **Bulk messaging**: Admin can broadcast announcements
- **Monthly reports**: Auto-generate summaries
- **Event notifications**: Remind members of upcoming meetings

---

## Cost Breakdown

| Component | Cost |
|-----------|------|
| Twilio WhatsApp number | $1/month |
| n8n self-hosted (VPS) | $5/month |
| Google Drive | Free |
| **Total** | **~$6/month** |

For 100+ members, that's roughly 6¢ per member per month.

---

## Troubleshooting

**Bot not responding**
- Check webhook URL is correct in Twilio
- Verify n8n is running
- Check n8n logs for errors

**Member not found**
- Verify CSV spelling matches member input
- The fuzzy matcher is forgiving; try first name only

**Balance showing as $0**
- Check CSV has `balance` column (case-sensitive)
- Ensure values are numbers, not text

---

## Closing Thoughts

Building this took 2 hours — mostly copy-pasting and clicking. No JavaScript experience needed; the logic is straightforward.

The real value? Members get instant answers. Admins spend less time on repetitive questions. Both win.

If your community group struggles with member inquiries, this is a practical weekend project. Start with the POC, get feedback, then expand.

Happy automating!
