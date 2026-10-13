// Embedded bundled dataset from project
    const DEFAULT_DATA = {
      following: [],
      followers: [],
      exceptNames: [],
      closeFriends: [],
      pendingRequests: [],
      recentRequests: [],
      recentlyUnfollowed: [],
      hideStory: [],
      blocked: [],
      removedSuggestions: [],
      generatedAt: ''
    };

    let data = JSON.parse(JSON.stringify(DEFAULT_DATA));

    // Retrieve custom whitelist and exclusion lists from localStorage
    let customWhitelist = JSON.parse(localStorage.getItem('instagram_custom_whitelist') || '[]');
    let removedFromWhitelist = JSON.parse(localStorage.getItem('instagram_removed_whitelist') || '[]');
    let activeWhitelist = new Set();

    let followersSet = new Set();
    let followingSet = new Set();

    // Store lists dynamically
    let lists = {
      following: [],
      followers: [],
      notFollowingBack: [],
      mutualFollows: [],
      fans: [],
      closeFriends: [],
      pendingRequests: [],
      recentRequests: [],
      recentlyUnfollowed: [],
      hideStory: [],
      blocked: [],
      removedSuggestions: [],
      whitelist: []
    };

    function setStatus(statusText, dateText, isSuccess = true) {
      const statusEl = document.getElementById('load-status');
      if (statusEl) statusEl.textContent = statusText;
      const dateEl = document.getElementById('gen-date');
      if (dateEl && dateText !== undefined) dateEl.textContent = dateText;
      const dotEl = document.getElementById('status-dot');
      if (dotEl) {
        dotEl.style.backgroundColor = isSuccess ? 'var(--success)' : 'var(--danger)';
        dotEl.style.boxShadow = isSuccess ? '0 0 8px var(--success)' : '0 0 8px var(--danger)';
      }
    }

    function rebuildActiveWhitelist() {
      customWhitelist = JSON.parse(localStorage.getItem('instagram_custom_whitelist') || '[]');
      removedFromWhitelist = JSON.parse(localStorage.getItem('instagram_removed_whitelist') || '[]');

      const removedSet = new Set(removedFromWhitelist);

      // Combine exceptNames (minus removed overrides) plus custom stars
      const base = (data.exceptNames || []).filter(name => !removedSet.has(name));
      activeWhitelist = new Set([...base, ...customWhitelist]);
    }

    function computeLists() {
      followersSet = new Set((data.followers || []).map(u => u.username));
      followingSet = new Set((data.following || []).map(u => u.username));

      // Not Following Back
      lists.notFollowingBack = (data.following || []).filter(
        u => !followersSet.has(u.username) && !activeWhitelist.has(u.username)
      );

      // Mutual
      lists.mutualFollows = (data.following || []).filter(
        u => followersSet.has(u.username)
      );

      // Fans
      lists.fans = (data.followers || []).filter(
        u => !followingSet.has(u.username)
      );

      // Base categories
      lists.following = data.following || [];
      lists.followers = data.followers || [];
      lists.closeFriends = data.closeFriends || [];
      lists.pendingRequests = data.pendingRequests || [];
      lists.recentRequests = data.recentRequests || [];
      lists.recentlyUnfollowed = data.recentlyUnfollowed || [];
      lists.hideStory = data.hideStory || [];
      lists.blocked = data.blocked || [];
      lists.removedSuggestions = data.removedSuggestions || [];

      // Whitelist/ExceptNames representation
      const allWhitelistNames = Array.from(activeWhitelist);
      lists.whitelist = allWhitelistNames.map(name => {
        const found = lists.following.find(u => u.username === name) || lists.followers.find(u => u.username === name);
        return found ? found : { username: name, name: '', href: `https://www.instagram.com/${name}/`, timestamp: null, date_str: 'N/A' };
      });
    }

    function toggleWhitelist(username) {
      const baseExceptions = data.exceptNames || [];
      if (activeWhitelist.has(username)) {
        // Un-whitelist
        if (baseExceptions.includes(username)) {
          if (!removedFromWhitelist.includes(username)) {
            removedFromWhitelist.push(username);
            localStorage.setItem('instagram_removed_whitelist', JSON.stringify(removedFromWhitelist));
          }
        } else {
          customWhitelist = customWhitelist.filter(name => name !== username);
          localStorage.setItem('instagram_custom_whitelist', JSON.stringify(customWhitelist));
        }
      } else {
        // Whitelist
        if (baseExceptions.includes(username)) {
          removedFromWhitelist = removedFromWhitelist.filter(name => name !== username);
          localStorage.setItem('instagram_removed_whitelist', JSON.stringify(removedFromWhitelist));
        } else {
          if (!customWhitelist.includes(username)) {
            customWhitelist.push(username);
            localStorage.setItem('instagram_custom_whitelist', JSON.stringify(customWhitelist));
          }
        }
      }

      rebuildActiveWhitelist();
      computeLists();
      updateUI();
      showToast(activeWhitelist.has(username) ? `Starred & Whitelisted @${username}` : `Unstarred @${username}`);
    }

    function resetCustomWhitelist() {
      if (confirm("Reset all custom whitelisting and exclusions back to default?")) {
        localStorage.removeItem('instagram_custom_whitelist');
        localStorage.removeItem('instagram_removed_whitelist');
        rebuildActiveWhitelist();
        computeLists();
        updateUI();
        showToast("Whitelist reset to default!");
      }
    }

    function resetToBundledData() {
      data = JSON.parse(JSON.stringify(DEFAULT_DATA));
      rebuildActiveWhitelist();
      computeLists();
      initSidebar();
      updateUI();
      setStatus(`Loaded bundled export (${data.following.length} following, ${data.followers.length} followers)`, data.generatedAt || 'Bundled');
      showToast("Reset to bundled project data!");
    }

    let activeTab = 'notFollowingBack';
    let searchQuery = '';
    let sortBy = 'username-asc';

    function switchTab(tabId) {
      activeTab = tabId;

      document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
      });

      document.querySelectorAll('.stat-card').forEach(card => {
        card.classList.toggle('active', card.getAttribute('data-tab') === tabId);
      });

      const searchInput = document.getElementById('search-input');
      if (searchInput) searchInput.value = '';
      searchQuery = '';

      updateUI();
    }

    function handleSearch(query) {
      searchQuery = query;
      renderList();
    }

    function handleSort(sortVal) {
      sortBy = sortVal;
      renderList();
    }

    function updateUI() {
      // Update KPI metrics
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
      };

      setVal('val-following', (data.following || []).length);
      setVal('val-followers', (data.followers || []).length);
      setVal('val-not-back', (lists.notFollowingBack || []).length);
      setVal('val-mutual', (lists.mutualFollows || []).length);
      setVal('val-fans', (lists.fans || []).length);

      // Update nav badges
      document.querySelectorAll('.nav-btn').forEach(btn => {
        const tabId = btn.getAttribute('data-tab');
        if (lists[tabId]) {
          const badge = btn.querySelector('.badge');
          if (badge) badge.innerText = lists[tabId].length;
        }
      });

      // Title descriptions
      const tabTitles = {
        notFollowingBack: { title: "Not Following Back", desc: "Accounts you follow, but they don't follow you back (excluding whitelisted accounts)." },
        mutualFollows: { title: "Mutual Follows", desc: "Accounts you follow, and they follow you back." },
        fans: { title: "Fans", desc: "Accounts that follow you, but you don't follow them back." },
        following: { title: "All Following", desc: "Every account you follow on Instagram." },
        followers: { title: "All Followers", desc: "Every account that follows you on Instagram." },
        closeFriends: { title: "Close Friends", desc: "Accounts on your Instagram Close Friends list." },
        pendingRequests: { title: "Pending Requests (Sent)", desc: "Accounts you requested to follow, but they haven't approved yet." },
        recentRequests: { title: "Recent Follow Requests", desc: "Recent incoming or outgoing follow requests." },
        recentlyUnfollowed: { title: "Recently Unfollowed", desc: "Accounts you unfollowed recently." },
        hideStory: { title: "Hidden Story", desc: "Accounts you blocked from viewing your stories." },
        blocked: { title: "Blocked Profiles", desc: "Accounts you have blocked." },
        removedSuggestions: { title: "Removed Suggestions", desc: "Accounts you removed from your Instagram recommendations." },
        whitelist: { title: "Whitelisted Accounts", desc: "Accounts you ignore from the 'Not Following Back' analysis." }
      };

      const headerInfo = tabTitles[activeTab] || { title: "Accounts", desc: "" };
      const titleEl = document.getElementById('active-tab-title');
      if (titleEl) titleEl.innerText = headerInfo.title;
      const descEl = document.getElementById('active-tab-desc');
      if (descEl) descEl.innerText = headerInfo.desc;

      // Show/hide whitelist reset button
      const resetBtn = document.getElementById('btn-reset-whitelist');
      if (resetBtn) {
        if (activeTab === 'whitelist' && (customWhitelist.length > 0 || removedFromWhitelist.length > 0)) {
          resetBtn.style.display = 'inline-flex';
        } else {
          resetBtn.style.display = 'none';
        }
      }

      renderList();
    }

    function renderList() {
      const container = document.getElementById('profiles-container');
      if (!container) return;
      container.innerHTML = '';

      let dataset = [...(lists[activeTab] || [])];

      // Filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        dataset = dataset.filter(u => 
          (u.username && u.username.toLowerCase().includes(q)) ||
          (u.name && u.name.toLowerCase().includes(q))
        );
      }

      // Sort
      if (sortBy === 'username-asc') {
        dataset.sort((a, b) => a.username.localeCompare(b.username));
      } else if (sortBy === 'username-desc') {
        dataset.sort((a, b) => b.username.localeCompare(a.username));
      } else if (sortBy === 'date-desc') {
        dataset.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      } else if (sortBy === 'date-asc') {
        dataset.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      }

      if (dataset.length === 0) {
        if ((data.following || []).length === 0 && (data.followers || []).length === 0) {
          container.innerHTML = `
            <div class="empty-state" style="padding: 4rem 1rem;">
              <svg viewBox="0 0 24 24" width="48" height="48" style="fill: url(#ig-grad); margin-bottom: 0.5rem;">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
              </svg>
              <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.35rem;">No Instagram Data Loaded Yet</h3>
              <p style="max-width: 440px; line-height: 1.5; color: var(--text-muted); font-size: 0.9rem;">
                Drop your Instagram export folder anywhere on this page, or click <strong>Choose Folder</strong> in the top header to begin analysis.
              </p>
            </div>
          `;
        } else {
          container.innerHTML = `
            <div class="empty-state">
              <svg class="empty-icon" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              <p>No accounts found matching your query.</p>
            </div>
          `;
        }
        return;
      }

      const closeFriendsSet = new Set((data.closeFriends || []).map(u => u.username));
      const blockedSet = new Set((data.blocked || []).map(u => u.username));

      const frag = document.createDocumentFragment();

      dataset.forEach(user => {
        const isWhitelisted = activeWhitelist.has(user.username);
        const isMutual = followersSet.has(user.username) && followingSet.has(user.username);
        const isNotBack = followingSet.has(user.username) && !followersSet.has(user.username) && !isWhitelisted;
        const isFan = followersSet.has(user.username) && !followingSet.has(user.username);

        let badgeHTML = '';
        if (isWhitelisted) {
          badgeHTML = `<span class="badge-pill badge-whitelist">Whitelisted</span>`;
        } else if (isMutual) {
          badgeHTML = `<span class="badge-pill badge-mutual">Mutual</span>`;
        } else if (isNotBack) {
          badgeHTML = `<span class="badge-pill badge-not-back">Doesn't Follow Back</span>`;
        } else if (isFan) {
          badgeHTML = `<span class="badge-pill badge-fan">Fan</span>`;
        }

        let extraBadges = '';
        if (activeTab !== 'closeFriends' && closeFriendsSet.has(user.username)) {
          extraBadges += '<span class="badge-pill badge-close-friend">Close Friend</span>';
        }
        if (activeTab !== 'blocked' && blockedSet.has(user.username)) {
          extraBadges += '<span class="badge-pill badge-blocked">Blocked</span>';
        }

        const firstLetter = (user.username || '?').charAt(0).toUpperCase();
        const profileUrl = user.href && !user.href.includes('/_u/') 
          ? user.href 
          : `https://www.instagram.com/${encodeURIComponent(user.username)}/`;

        const nameHTML = user.name ? `<span class="profile-realname">(${user.name})</span>` : '';

        const card = document.createElement('div');
        card.className = 'profile-card';
        card.innerHTML = `
        <div class="avatar">${firstLetter}</div>
        <div class="profile-info">
          <div class="username-row">
            <a href="${profileUrl}" target="_blank" rel="noopener noreferrer" class="profile-link" title="Open Instagram Profile">@${user.username}</a>
            ${nameHTML}
          </div>
          <div class="date-row">
            <svg class="date-icon" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8s8 3.58 8 8s-3.58 8-8 8zm.5-13H11v6l5.25 3.15l.75-1.23l-4.5-2.67z"/></svg>
            <span>Followed: ${user.date_str || 'N/A'}</span>
          </div>
          <div style="display: flex; gap: 0.3rem; flex-wrap: wrap;">
            ${badgeHTML}
            ${extraBadges}
          </div>
        </div>
        <div class="card-actions">
          <button class="action-btn star-btn ${isWhitelisted ? 'whitelisted' : ''}" onclick="toggleWhitelist('${user.username}')" title="${isWhitelisted ? 'Remove Star (Stop ignoring)' : 'Star (Ignore in Not Following Back list)'}">
            ${isWhitelisted ?
            `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2L9.19 8.63L2 9.24l5.46 4.73L5.82 21z"/></svg>` :
            `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M22 9.24l-7.19-.62L12 2L9.19 8.63L2 9.24l5.46 4.73L5.82 21L12 17.27L18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27l1-4.28l-3.32-2.88l4.38-.38L12 6.1l1.71 4.04l4.38.38l-3.32 2.88l1 4.28L12 15.4z"/></svg>`
          }
          </button>
          <button class="action-btn" onclick="copyUsername('${user.username}')" title="Copy Username">
            <svg viewBox="0 0 24 24" width="13" height="13"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
          </button>
        </div>
      `;
        frag.appendChild(card);
      });

      container.appendChild(frag);
    }

    function copyUsername(text) {
      const onSuccess = () => showToast(`Copied @${text} to clipboard!`);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(onSuccess).catch(() => fallbackCopy(text, onSuccess));
      } else {
        fallbackCopy(text, onSuccess);
      }
    }

    function fallbackCopy(text, cb) {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      try {
        document.execCommand('copy');
        if (cb) cb();
      } catch (e) {}
      document.body.removeChild(el);
    }

    function copyAllUsernames() {
      let dataset = [...(lists[activeTab] || [])];
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        dataset = dataset.filter(u => 
          (u.username && u.username.toLowerCase().includes(q)) ||
          (u.name && u.name.toLowerCase().includes(q))
        );
      }

      if (dataset.length === 0) {
        showToast("No usernames to copy!");
        return;
      }

      const text = dataset.map(u => u.username).join('\n');
      const onSuccess = () => showToast(`Copied all ${dataset.length} usernames!`);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(onSuccess).catch(() => fallbackCopy(text, onSuccess));
      } else {
        fallbackCopy(text, onSuccess);
      }
    }

    let toastTimer = null;
    function showToast(message) {
      const toast = document.getElementById('toast');
      if (!toast) return;
      toast.querySelector('.toast-text').innerText = message;
      toast.classList.add('show');
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toast.classList.remove('show');
      }, 2500);
    }

    function initSidebar() {
      const optionalTabs = ['closeFriends', 'pendingRequests', 'recentRequests', 'recentlyUnfollowed', 'hideStory', 'blocked', 'removedSuggestions'];
      let visibleCount = 0;
      optionalTabs.forEach(tabId => {
        const btn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
        if (btn) {
          const count = (lists[tabId] || []).length;
          if (count === 0) {
            btn.style.display = 'none';
          } else {
            btn.style.display = 'flex';
            visibleCount++;
          }
        }
      });

      const titleOptional = document.getElementById('title-optional');
      if (titleOptional) {
        titleOptional.style.display = visibleCount > 0 ? 'block' : 'none';
      }
    }

    function detailedUsers(json) {
      if (!json) return [];
      const items = Array.isArray(json) ? json : (json?.relationships_following || json?.relationships_followers || []);
      return items.map(item => {
        const entry = item.string_list_data?.[0] || {};
        let username = item.title || entry.value;
        if (!username && entry.href) {
          const parts = entry.href.split('/').filter(p => p && !['http:', 'https:', 'www.instagram.com', '_u'].includes(p));
          if (parts.length) username = parts[parts.length - 1];
        }
        if (!username) return null;
        const timestamp = entry.timestamp || null;
        return {
          username,
          name: '',
          href: entry.href || `https://www.instagram.com/${username}/`,
          timestamp,
          date_str: timestamp ? new Date(timestamp * 1000).toLocaleString() : 'N/A'
        };
      }).filter(Boolean);
    }

    function labelUsers(json) {
      if (!json) return [];
      const items = Array.isArray(json) ? json : (json.label_values ? [json] : Object.values(json).find(Array.isArray) || []);
      return items.map(item => {
        const labels = item.label_values || [];
        const username = labels.find(v => v.label === 'Username')?.value;
        if (!username) return null;
        const name = labels.find(v => v.label === 'Name')?.value || '';
        const urlVal = labels.find(v => v.label === 'URL')?.value;
        return {
          username,
          name,
          href: urlVal || `https://www.instagram.com/${username}/`,
          timestamp: item.timestamp || null,
          date_str: item.timestamp ? new Date(item.timestamp * 1000).toLocaleString() : 'N/A'
        };
      }).filter(Boolean);
    }

    function extractCloseFriendsCustomLists(json) {
      if (!json || !json.label_values) return [];
      const users = [];
      for (const lv of json.label_values) {
        if (Array.isArray(lv.dict)) {
          for (const item of lv.dict) {
            const sub = item.dict || [];
            const u = sub.find(x => x.label === 'Username')?.value;
            const name = sub.find(x => x.label === 'Name')?.value || '';
            if (u) {
              users.push({
                username: u,
                name: name,
                href: `https://www.instagram.com/${u}/`,
                timestamp: null,
                date_str: 'N/A'
              });
            }
          }
        }
      }
      return users;
    }

    async function readJsonFile(file) {
      let text;
      const buffer = await file.arrayBuffer();
      // Detect UTF-16LE / UTF-16BE / UTF-8
      const view = new Uint8Array(buffer);
      if (view.length >= 2 && view[0] === 0xFF && view[1] === 0xFE) {
        text = new TextDecoder('utf-16le').decode(buffer);
      } else if (view.length >= 2 && view[0] === 0xFE && view[1] === 0xFF) {
        text = new TextDecoder('utf-16be').decode(buffer);
      } else {
        try {
          text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
        } catch (e) {
          text = new TextDecoder('utf-16le').decode(buffer);
        }
      }

      // Strip BOM if present
      if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
      return JSON.parse(text);
    }

    async function loadExportFiles(fileList) {
      const files = [...fileList].filter(f => f.name.toLowerCase().endsWith('.json'));
      if (!files.length) {
        showToast("No JSON files found in selection!");
        return;
      }

      const jsonByName = new Map();
      try {
        for (const file of files) {
          const baseName = file.name.split('/').pop().toLowerCase();
          try {
            jsonByName.set(baseName, await readJsonFile(file));
          } catch (err) {
            console.warn(`Could not parse ${file.name}:`, err);
          }
        }

        const get = (...names) => {
          for (const name of names) {
            const target = name.toLowerCase();
            for (const [k, v] of jsonByName.entries()) {
              if (k === target) return v;
            }
          }
          return undefined;
        };

        const hasFollowers = [...jsonByName.keys()].some(k => /^followers(_\d+)?\.json$/.test(k));
        const hasFollowing = get('following.json', 'relationships_following.json') !== undefined;

        if (!hasFollowing || !hasFollowers) {
          throw new Error('Selection must contain following.json and followers_*.json');
        }

        const followingRaw = get('following.json', 'relationships_following.json');
        const followersRaw = [...jsonByName.entries()]
          .filter(([k]) => /^followers(_\d+)?\.json$/.test(k))
          .flatMap(([, v]) => detailedUsers(v));

        const exceptRaw = get('exceptname.json', 'except_names.json', 'whitelist.json');
        let parsedExcept = [];
        if (exceptRaw) {
          parsedExcept = Array.isArray(exceptRaw) ? exceptRaw : (exceptRaw.ExceptName || exceptRaw.whitelist || []);
        } else {
          parsedExcept = data.exceptNames || [];
        }

        let closeFriendsRaw = labelUsers(get('close_friends.json'));
        if (!closeFriendsRaw.length && get('custom_lists.json')) {
          closeFriendsRaw = extractCloseFriendsCustomLists(get('custom_lists.json'));
        }

        data = {
          following: detailedUsers(followingRaw),
          followers: followersRaw,
          exceptNames: parsedExcept,
          closeFriends: closeFriendsRaw,
          pendingRequests: labelUsers(get('pending_follow_requests.json')),
          recentRequests: labelUsers(get('recent_follow_requests.json')),
          recentlyUnfollowed: labelUsers(get('recently_unfollowed_profiles.json')),
          hideStory: labelUsers(get('hide_story_from.json')),
          blocked: labelUsers(get('blocked_profiles.json')),
          removedSuggestions: labelUsers(get('removed_suggestions.json')),
          generatedAt: new Date().toLocaleDateString()
        };

        rebuildActiveWhitelist();
        computeLists();
        initSidebar();
        updateUI();

        setStatus(`Loaded ${data.following.length} Following & ${data.followers.length} Followers`, 'Imported');
        showToast(`Successfully loaded ${data.following.length} following and ${data.followers.length} followers!`);
      } catch (error) {
        console.error(error);
        setStatus(`Error: ${error.message}`, 'Failed', false);
        showToast(`Failed: ${error.message}`);
      }
    }

    // Setup Drag and Drop
    async function getFilesFromDataTransfer(dataTransfer) {
      const files = [];
      const items = dataTransfer.items;
      if (items && items.length > 0 && items[0].webkitGetAsEntry) {
        async function traverseEntry(entry) {
          if (entry.isFile) {
            const file = await new Promise((resolve) => entry.file(resolve));
            files.push(file);
          } else if (entry.isDirectory) {
            const dirReader = entry.createReader();
            const entries = await new Promise((resolve) => {
              const all = [];
              function readBatch() {
                dirReader.readEntries((batch) => {
                  if (!batch.length) resolve(all);
                  else { all.push(...batch); readBatch(); }
                });
              }
              readBatch();
            });
            for (const child of entries) await traverseEntry(child);
          }
        }
        for (let i = 0; i < items.length; i++) {
          const entry = items[i].webkitGetAsEntry();
          if (entry) await traverseEntry(entry);
        }
      } else {
        for (let i = 0; i < dataTransfer.files.length; i++) {
          files.push(dataTransfer.files[i]);
        }
      }
      return files;
    }

    const dropOverlay = document.getElementById('drop-overlay');
    let dragCounter = 0;

    window.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dragCounter++;
      if (dropOverlay) dropOverlay.classList.add('active');
    });

    window.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0 && dropOverlay) {
        dropOverlay.classList.remove('active');
        dragCounter = 0;
      }
    });

    window.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    window.addEventListener('drop', async (e) => {
      e.preventDefault();
      dragCounter = 0;
      if (dropOverlay) dropOverlay.classList.remove('active');
      if (e.dataTransfer) {
        const files = await getFilesFromDataTransfer(e.dataTransfer);
        if (files.length) loadExportFiles(files);
      }
    });

    // File input event listeners
    document.getElementById('folder-input').addEventListener('change', event => {
      if (event.target.files.length) loadExportFiles(event.target.files);
    });
    document.getElementById('json-input').addEventListener('change', event => {
      if (event.target.files.length) loadExportFiles(event.target.files);
    });

    // Initialize UI on load
    rebuildActiveWhitelist();
    computeLists();
    initSidebar();
    updateUI();
    if (data.following.length > 0) {
      setStatus(`Loaded ${data.following.length} Following & ${data.followers.length} Followers`, data.generatedAt || 'Loaded');
    } else {
      setStatus('Import Instagram export folder or JSON files to analyze', 'Ready', false);
    }
