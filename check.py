#!/usr/bin/env python3
"""
Instagram Follow Back Analyzer & Report Generator
Compares your following and followers, accounts for whitelists,
and can launch or update the interactive HTML dashboard.
"""

import os
import sys
import json
import glob
import webbrowser
import http.server
import socketserver
import argparse
from datetime import datetime

# Resolve default paths relative to script location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DATA_DIR = os.path.join(SCRIPT_DIR, "followers_and_following")
DEFAULT_EXCEPT_FILE = os.path.join(SCRIPT_DIR, "ExceptName.json")
REPORT_HTML_FILE = os.path.join(SCRIPT_DIR, "instagram_report.html")


def read_json_safe(file_path):
    """Read a JSON file safely, handling UTF-8, UTF-16LE, and BOM."""
    if not os.path.exists(file_path):
        return None
    try:
        with open(file_path, "rb") as f:
            raw = f.read()

        if raw.startswith(b"\xff\xfe"):
            text = raw.decode("utf-16le")
        elif raw.startswith(b"\xfe\xff"):
            text = raw.decode("utf-16be")
        else:
            try:
                text = raw.decode("utf-8")
            except UnicodeDecodeError:
                text = raw.decode("utf-16le")

        text = text.lstrip("\ufeff")
        return json.loads(text)
    except Exception as e:
        print(f"Warning: Could not read {file_path}: {e}", file=sys.stderr)
        return None


def get_except_names(file_path=DEFAULT_EXCEPT_FILE):
    """Retrieve whitelisted names from ExceptName.json or fallback paths."""
    if not os.path.exists(file_path):
        # Fallback check in data dir
        alt = os.path.join(DEFAULT_DATA_DIR, "ExceptName.json")
        if os.path.exists(alt):
            file_path = alt

    data = read_json_safe(file_path)
    if isinstance(data, dict):
        return set(data.get("ExceptName", []))
    elif isinstance(data, list):
        return set(data)
    return set()


def extract_detailed_users(data):
    """Extract users from following.json or followers_*.json."""
    if not data:
        return []
    items = []
    if isinstance(data, dict):
        items = data.get("relationships_following") or data.get("relationships_followers") or []
    elif isinstance(data, list):
        items = data

    users = []
    for item in items:
        sld = (item.get("string_list_data") or [{}])[0]
        username = item.get("title") or sld.get("value")
        href = sld.get("href")

        if not username and href:
            parts = [p for p in href.split("/") if p and p not in ("https:", "http:", "www.instagram.com", "_u")]
            if parts:
                username = parts[-1]

        if username:
            ts = sld.get("timestamp")
            date_str = datetime.fromtimestamp(ts).strftime("%Y-%m-%d %H:%M") if ts else "N/A"
            users.append({
                "username": username,
                "href": f"https://www.instagram.com/{username}/",
                "timestamp": ts,
                "date_str": date_str
            })
    return users


def extract_label_users(data):
    """Extract users from label_values format (close friends, requests, etc.)."""
    if not data:
        return []
    items = data if isinstance(data, list) else [data]
    users = []
    for item in items:
        labels = item.get("label_values") or []
        u = next((x["value"] for x in labels if x.get("label") == "Username"), None)
        name = next((x["value"] for x in labels if x.get("label") == "Name"), None)
        if not u:
            continue
        ts = item.get("timestamp")
        date_str = datetime.fromtimestamp(ts).strftime("%Y-%m-%d %H:%M") if ts else "N/A"
        users.append({
            "username": u,
            "name": name or "",
            "href": f"https://www.instagram.com/{u}/",
            "timestamp": ts,
            "date_str": date_str
        })
    return users


def load_dataset(data_dir=DEFAULT_DATA_DIR, except_path=DEFAULT_EXCEPT_FILE):
    """Load and process all available Instagram export JSON files."""
    # Find following file
    following_candidates = glob.glob(os.path.join(data_dir, "*following*.json")) + glob.glob(os.path.join(SCRIPT_DIR, "*following*.json"))
    following_data = []
    if following_candidates:
        following_data = extract_detailed_users(read_json_safe(following_candidates[0]))

    # Find followers files
    followers_candidates = glob.glob(os.path.join(data_dir, "followers*.json")) + glob.glob(os.path.join(SCRIPT_DIR, "followers*.json"))
    followers_data = []
    for f in followers_candidates:
        followers_data.extend(extract_detailed_users(read_json_safe(f)))

    # Deduplicate followers
    unique_followers = {}
    for u in followers_data:
        unique_followers[u["username"]] = u
    followers_data = list(unique_followers.values())

    # Whitelist
    whitelist = get_except_names(except_path)

    # Optional lists
    def load_opt(name):
        p1 = os.path.join(data_dir, name)
        p2 = os.path.join(SCRIPT_DIR, name)
        target = p1 if os.path.exists(p1) else (p2 if os.path.exists(p2) else None)
        return extract_label_users(read_json_safe(target)) if target else []

    close_friends = load_opt("close_friends.json")
    if not close_friends:
        # Check custom_lists.json
        cl_path = os.path.join(data_dir, "custom_lists.json")
        if os.path.exists(cl_path):
            cl_raw = read_json_safe(cl_path)
            if cl_raw and isinstance(cl_raw, dict):
                for lv in cl_raw.get("label_values", []):
                    if "dict" in lv:
                        for itm in lv["dict"]:
                            sub = itm.get("dict", [])
                            u = next((x["value"] for x in sub if x.get("label") == "Username"), None)
                            name = next((x["value"] for x in sub if x.get("label") == "Name"), None)
                            if u:
                                close_friends.append({"username": u, "name": name or "", "href": f"https://www.instagram.com/{u}/", "timestamp": None, "date_str": "N/A"})

    return {
        "following": following_data,
        "followers": followers_data,
        "whitelist": whitelist,
        "closeFriends": close_friends,
        "recentRequests": load_opt("recent_follow_requests.json"),
        "recentlyUnfollowed": load_opt("recently_unfollowed_profiles.json"),
        "removedSuggestions": load_opt("removed_suggestions.json"),
        "pendingRequests": load_opt("pending_follow_requests.json"),
        "hideStory": load_opt("hide_story_from.json"),
        "blocked": load_opt("blocked_profiles.json"),
    }


def analyze(data):
    """Compute follow-back relations."""
    following_map = {u["username"]: u for u in data["following"]}
    followers_set = {u["username"] for u in data["followers"]}
    whitelist = data["whitelist"]

    following_set = set(following_map.keys())

    mutuals = following_set & followers_set
    fans = followers_set - following_set
    not_back_all = following_set - followers_set
    not_back_filtered = not_back_all - whitelist

    return {
        "total_following": len(following_set),
        "total_followers": len(followers_set),
        "mutuals": len(mutuals),
        "fans": len(fans),
        "whitelisted": len(whitelist),
        "not_back_all": len(not_back_all),
        "not_back": sorted(list(not_back_filtered)),
        "not_back_users": [following_map[u] for u in sorted(list(not_back_filtered))]
    }


def print_cli_report(stats):
    """Print clean terminal report."""
    cyan = "\033[96m"
    green = "\033[92m"
    yellow = "\033[93m"
    red = "\033[91m"
    bold = "\033[1m"
    reset = "\033[0m"

    print(f"\n{bold}{cyan}==================================================={reset}")
    print(f"{bold}{cyan}        Instagram Connections Analysis            {reset}")
    print(f"{bold}{cyan}==================================================={reset}\n")

    print(f"  {bold}Following:{reset}          {stats['total_following']}")
    print(f"  {bold}Followers:{reset}          {stats['total_followers']}")
    print(f"  {green}Mutual Follows:{reset}     {stats['mutuals']}")
    print(f"  {cyan}Fans (Follow you):{reset}  {stats['fans']}")
    print(f"  {yellow}Whitelisted:{reset}        {stats['whitelisted']}")
    print(f"  {red}{bold}Not Following Back:{reset} {bold}{red}{len(stats['not_back'])}{reset}")
    print(f"  (Ignored {stats['not_back_all'] - len(stats['not_back'])} accounts in whitelist)")

    print(f"\n{bold}{red}--- Accounts Not Following You Back ({len(stats['not_back'])}) ---{reset}\n")

    if not stats["not_back"]:
        print(f"  {green}All non-whitelisted accounts follow you back!{reset}")
    else:
        for idx, u in enumerate(stats["not_back_users"], start=1):
            date_info = f" (followed: {u['date_str']})" if u.get("date_str") != "N/A" else ""
            print(f"  {idx:2d}. {bold}@{u['username']:<25}{reset} {cyan}{u['href']}{reset}{date_info}")

    print(f"\n{bold}{cyan}==================================================={reset}\n")


def serve_report(port=8000):
    """Serve directory via simple HTTP server and launch browser."""
    os.chdir(SCRIPT_DIR)
    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("", port), handler) as httpd:
        url = f"http://localhost:{port}/instagram_report.html"
        print(f"Starting server at {url}")
        print("Press Ctrl+C to stop.")
        webbrowser.open(url)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")


def main():
    parser = argparse.ArgumentParser(description="Instagram Follow Back Analyzer")
    parser.add_argument("--open", "-o", action="store_true", help="Open instagram_report.html in default browser")
    parser.add_argument("--serve", "-s", type=int, nargs="?", const=8000, help="Run local HTTP server (default port 8000)")
    parser.add_argument("--data-dir", "-d", default=DEFAULT_DATA_DIR, help="Path to followers_and_following folder")
    parser.add_argument("--except-file", "-e", default=DEFAULT_EXCEPT_FILE, help="Path to ExceptName.json")
    args = parser.parse_args()

    dataset = load_dataset(args.data_dir, args.except_file)
    stats = analyze(dataset)
    print_cli_report(stats)

    if args.serve is not None:
        serve_report(args.serve)
    elif args.open:
        if os.path.exists(REPORT_HTML_FILE):
            webbrowser.open(f"file://{REPORT_HTML_FILE}")
        else:
            print(f"Report file not found: {REPORT_HTML_FILE}", file=sys.stderr)


if __name__ == "__main__":
    main()
