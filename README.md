# 📸 Instagram Connections Analyzer

A 100% private, client-side web application to analyze your Instagram followers, following lists, and social connections dynamically.

Find out **who doesn't follow you back**, discover your **fans**, see **mutual connections**, and whitelist accounts you don't want to track.

---

## ✨ Features

- **🔒 100% Client-Side & Private**: Runs entirely in the visitor's web browser. No data is ever sent to any server, database, or external API.
- **📁 Drag & Drop Support**: Drop your Instagram export folder or JSON files anywhere onto the page to analyze immediately.
- **⚡ Core Analysis**:
  - **Not Following Back**: Accounts you follow who don't follow you back.
  - **Mutual Follows**: Accounts you follow and who follow you back.
  - **Fans**: Accounts that follow you, but you don't follow back.
  - **All Following & All Followers**: Full searchable directories.
  - **Whitelisted / Exceptions**: Star accounts to ignore them in your "Not Following Back" count (saved to `localStorage`).
- **🔍 Fast Search & Sort**: Filter by `@username` or real name; sort alphabetically or by follow date.
- **📋 Copy Utilities**: One-click button to copy individual handles or batch-copy all handles currently filtered.

---

## 🚀 Deploy to Vercel

### Option 1: Vercel CLI (10 seconds)
```bash
npx vercel
```
Follow the quick CLI prompts to deploy directly.

### Option 2: Connect Git to Vercel Dashboard
1. Push this repository to GitHub/GitLab/Bitbucket.
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import this repository.
4. Click **Deploy** (zero configuration needed).

---

## 📥 How to Get Your Instagram Data

1. Open Instagram on web or mobile:
   - Go to **Settings** → **Accounts Center** → **Your information and permissions** → **Export your information**.
2. Select:
   - **Some of your information** → **Followers and following**.
   - Format: **JSON**.
   - Date range: **All time**.
3. Download and extract the `.zip` file from Instagram.
4. Drag and drop the extracted `followers_and_following` folder onto the web app (or click **Choose Folder**).

---

## 📄 License
MIT License. Free to use and customize.
