# 📸 Instagram Connections Analyzer

A private, client-side web application and CLI tool to analyze your Instagram followers, following lists, and social connections dynamically.

Find out **who doesn't follow you back**, discover your **fans**, see **mutual connections**, and whitelist accounts you don't want to track.

---

## ✨ Features

- **🔒 100% Client-Side & Private**: Runs entirely in the web browser. No data is ever sent to any server, database, or external API.
- **📁 Drag & Drop Support**: Drop your Instagram export folder or JSON files anywhere onto the page to analyze immediately.
- **⚡ Core Analysis**:
  - **Not Following Back**: Accounts you follow who don't follow you back.
  - **Mutual Follows**: Accounts you follow and who follow you back.
  - **Fans**: Accounts that follow you, but you don't follow back.
  - **All Following & All Followers**: Full searchable directories.
  - **Whitelisted / Exceptions**: Star accounts to ignore them in your "Not Following Back" count (saved to `localStorage`).
- **🔍 Fast Search & Sort**: Filter by `@username` or real name; sort alphabetically or by follow date.
- **📋 Copy Utilities**: One-click button to copy individual handles or batch-copy all handles currently filtered.
- **🐍 Python CLI Support**: Companion script (`check.py`) to run follow-back analysis in your terminal.

---

## 🚀 Live Deployment (GitHub Pages)

Because `index.html` is a standalone static file, you can host it for free:

1. Push this repository to GitHub.
2. In your GitHub repository, go to **Settings** → **Pages**.
3. Under **Branch**, select `main` and `/ (root)`, then click **Save**.
4. Your site will be published at `https://<your-username>.github.io/<repo-name>/`.

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

## 💻 Local Usage

### 1. Web Application
Simply open `index.html` in your browser:
```bash
xdg-open index.html   # Linux
open index.html       # macOS
start index.html      # Windows
```

### 2. Python CLI Tool
Run the terminal analyzer:
```bash
python3 check.py
```

Options:
```bash
python3 check.py --open       # View HTML in default browser
python3 check.py --serve      # Start local HTTP server on port 8000
python3 check.py -h           # View all options
```

---

## 📄 License
MIT License. Free to use and customize.
