# Instagram Connections Analyzer

A client-side tool to find who doesn't follow you back on Instagram. Reads Instagram's official data export directly in your browser. No login, no password, and no data leaves your machine.

## Features

- **Not Following Back**: Accounts you follow that do not follow you back.
- **Mutuals**: Accounts where you follow each other.
- **Fans**: Accounts following you that you do not follow back.
- **Whitelist**: Star accounts (creators, brands, public figures) to exclude them from the unfollower list. Saves to localStorage.
- **Export & Copy**: Copy usernames to your clipboard or download the active list as a CSV file.

## How to get your Instagram data

1. Open Instagram on web or mobile:
   - Go to **Settings** > **Accounts Center** > **Your information and permissions** > **Export your information**.
2. Select:
   - **Some of your information** > **Followers and following**.
   - Format: **JSON**.
   - Date range: **All time**.
3. Download and unzip the archive.
4. Drop the extracted `followers_and_following` folder onto the page (or click **Choose Folder**).

## Deploy to Vercel

Deploy via CLI:
```bash
npx vercel
```

Or connect the repository on [vercel.com](https://vercel.com). The project is pure static HTML/CSS/JS and requires no build step.

## License

MIT
