/**
 * Instagram Connections Analyzer
 * Client-side only. No external requests.
 */

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

// Sample dataset for quick evaluation
const DEMO_DATA = {
  following: [
    { username: 'mk.design', name: 'Maya Korn', href: 'https://www.instagram.com/mk.design/', timestamp: 1787306916, date_str: '2026-08-20 14:15' },
    { username: 'coryjwong', name: 'Cory Wong', href: 'https://www.instagram.com/coryjwong/', timestamp: 1788076352, date_str: '2026-08-29 11:32' },
    { username: 'stephencurry30', name: 'Steph Curry', href: 'https://www.instagram.com/stephencurry30/', timestamp: 1789264292, date_str: '2026-09-12 18:20' },
    { username: 'point_of_view_th', name: 'Point of View', href: 'https://www.instagram.com/point_of_view_th/', timestamp: 1786500000, date_str: '2026-08-10 09:40' },
    { username: 'f1', name: 'Formula 1', href: 'https://www.instagram.com/f1/', timestamp: 1785000000, date_str: '2026-07-25 19:10' },
    { username: 'alex_photo', name: 'Alex Rivera', href: 'https://www.instagram.com/alex_photo/', timestamp: 1790364380, date_str: '2026-09-26 02:26' },
    { username: 'sarah.codes', name: 'Sarah Chen', href: 'https://www.instagram.com/sarah.codes/', timestamp: 1790100000, date_str: '2026-09-23 15:45' },
    { username: 'nat_travels', name: 'Natasha W.', href: 'https://www.instagram.com/nat_travels/', timestamp: 1789000000, date_str: '2026-09-10 12:00' },
    { username: 'vintage.tone', name: 'Vintage Tone', href: 'https://www.instagram.com/vintage.tone/', timestamp: 1787000000, date_str: '2026-08-16 16:30' },
    { username: 'street.bites', name: 'Bangkok Street Food', href: 'https://www.instagram.com/street.bites/', timestamp: 1784000000, date_str: '2026-07-14 20:10' }
  ],
  followers: [
    { username: 'alex_photo', name: 'Alex Rivera', href: 'https://www.instagram.com/alex_photo/', timestamp: 1790365210, date_str: '2026-09-26 02:40' },
    { username: 'sarah.codes', name: 'Sarah Chen', href: 'https://www.instagram.com/sarah.codes/', timestamp: 1790101000, date_str: '2026-09-23 16:00' },
    { username: 'vintage.tone', name: 'Vintage Tone', href: 'https://www.instagram.com/vintage.tone/', timestamp: 1787001000, date_str: '2026-08-16 16:45' },
    { username: 'fan_account_99', name: 'Instagram Fan', href: 'https://www.instagram.com/fan_account_99/', timestamp: 1789500000, date_str: '2026-09-15 10:10' },
    { username: 'music_lover_bkk', name: 'Indie Jams', href: 'https://www.instagram.com/music_lover_bkk/', timestamp: 1788500000, date_str: '2026-09-03 14:22' }
  ],
  exceptNames: ['stephencurry30', 'f1', 'point_of_view_th'],
  closeFriends: [
    { username: 'alex_photo', name: 'Alex Rivera', href: 'https://www.instagram.com/alex_photo/', timestamp: 1790364380, date_str: '2026-09-26' },
    { username: 'sarah.codes', name: 'Sarah Chen', href: 'https://www.instagram.com/sarah.codes/', timestamp: 1790100000, date_str: '2026-09-23' }
  ],
  pendingRequests: [],
  recentRequests: [
    { username: 'music_lover_bkk', name: 'Indie Jams', href: 'https://www.instagram.com/music_lover_bkk/', timestamp: 1788500000, date_str: '2026-09-03' }
  ],
  recentlyUnfollowed: [
    { username: 'crypto_news_daily', name: 'Crypto News', href: 'https://www.instagram.com/crypto_news_daily/', timestamp: 1789900000, date_str: '2026-09-21' }
  ],
  hideStory: [],
  blocked: [],
  removedSuggestions: [],
  generatedAt: 'Sample'
};

let data = JSON.parse(JSON.stringify(DEFAULT_DATA));

let customWhitelist = JSON.parse(localStorage.getItem('instagram_custom_whitelist') || '[]');
let removedFromWhitelist = JSON.parse(localStorage.getItem('instagram_removed_whitelist') || '[]');
let activeWhitelist = new Set();

let followersSet = new Set();
let followingSet = new Set();

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

let activeTab = 'notFollowingBack';
let searchQuery = '';
let sortBy = 'username-asc';

function setStatus(statusText, dateText, isSuccess = true) {
  const statusEl = document.getElementById('load-status');
  if (statusEl) statusEl.textContent = statusText;

  const dateEl = document.getElementById('gen-date');
  if (dateEl && dateText !== undefined) dateEl.textContent = dateText;

  const dotEl = document.getElementById('status-dot');
  if (dotEl) {
    dotEl.classList.toggle('idle', !isSuccess);
  }
}

function rebuildActiveWhitelist() {
  customWhitelist = JSON.parse(localStorage.getItem('instagram_custom_whitelist') || '[]');
  removedFromWhitelist = JSON.parse(localStorage.getItem('instagram_removed_whitelist') || '[]');

  const removedSet = new Set(removedFromWhitelist);
  const base = (data.exceptNames || []).filter(name => !removedSet.has(name));
  activeWhitelist = new Set([...base, ...customWhitelist]);
}

function computeLists() {
  followersSet = new Set((data.followers || []).map(u => u.username));
  followingSet = new Set((data.following || []).map(u => u.username));

  lists.notFollowingBack = (data.following || []).filter(
    u => !followersSet.has(u.username) && !activeWhitelist.has(u.username)
  );

  lists.mutualFollows = (data.following || []).filter(
    u => followersSet.has(u.username)
  );

  lists.fans = (data.followers || []).filter(
    u => !followingSet.has(u.username)
  );

  lists.following = data.following || [];
  lists.followers = data.followers || [];
  lists.closeFriends = data.closeFriends || [];
  lists.pendingRequests = data.pendingRequests || [];
  lists.recentRequests = data.recentRequests || [];
  lists.recentlyUnfollowed = data.recentlyUnfollowed || [];
  lists.hideStory = data.hideStory || [];
  lists.blocked = data.blocked || [];
  lists.removedSuggestions = data.removedSuggestions || [];

  const allWhitelistNames = Array.from(activeWhitelist);
  lists.whitelist = allWhitelistNames.map(name => {
    const found = lists.following.find(u => u.username === name) || lists.followers.find(u => u.username === name);
    return found ? found : {
      username: name,
      name: '',
      href: `https://www.instagram.com/${name}/`,
      timestamp: null,
      date_str: 'N/A'
    };
  });
}

function toggleWhitelist(username) {
  const baseExceptions = data.exceptNames || [];
  if (activeWhitelist.has(username)) {
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
  showToast(activeWhitelist.has(username) ? `Starred @${username}` : `Unstarred @${username}`);
}

function resetCustomWhitelist() {
  if (confirm('Reset custom stars back to default?')) {
    localStorage.removeItem('instagram_custom_whitelist');
    localStorage.removeItem('instagram_removed_whitelist');
    rebuildActiveWhitelist();
    computeLists();
    updateUI();
    showToast('Whitelist reset to default');
  }
}

function loadDemoData() {
  data = JSON.parse(JSON.stringify(DEMO_DATA));
  rebuildActiveWhitelist();
  computeLists();
  initSidebar();
  updateUI();
  setStatus('Loaded sample data (10 following, 5 followers)', 'Sample', true);
  showToast('Loaded sample data');
}

function resetAllData() {
  data = JSON.parse(JSON.stringify(DEFAULT_DATA));
  rebuildActiveWhitelist();
  computeLists();
  initSidebar();
  updateUI();
  setStatus('No data loaded', 'Ready', false);
  showToast('Cleared data');
}

function switchTab(tabId) {
  activeTab = tabId;

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });

  document.querySelectorAll('.stat-card').forEach(card => {
    card.classList.toggle('active', card.getAttribute('data-tab') === tabId);
  });

  clearSearch(false);
  updateUI();
  if (window.matchMedia('(max-width: 768px)').matches) setSidebarOpen(false);
}

function handleSearch(query) {
  searchQuery = query;
  const clearBtn = document.getElementById('search-clear-btn');
  if (clearBtn) {
    clearBtn.style.display = query.trim() ? 'flex' : 'none';
  }
  renderList();
}

function clearSearch(render = true) {
  searchQuery = '';
  const input = document.getElementById('search-input');
  if (input) input.value = '';
  const clearBtn = document.getElementById('search-clear-btn');
  if (clearBtn) clearBtn.style.display = 'none';
  if (render) renderList();
}

function handleSort(sortVal) {
  sortBy = sortVal;
  renderList();
}

function updateUI() {
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
  };

  setVal('val-following', (data.following || []).length);
  setVal('val-followers', (data.followers || []).length);
  setVal('val-not-back', (lists.notFollowingBack || []).length);
  setVal('val-mutual', (lists.mutualFollows || []).length);
  setVal('val-fans', (lists.fans || []).length);

  document.querySelectorAll('.nav-btn').forEach(btn => {
    const tabId = btn.getAttribute('data-tab');
    if (lists[tabId]) {
      const badge = btn.querySelector('.badge');
      if (badge) badge.innerText = lists[tabId].length;
    }
  });

  const totalFollowing = (data.following || []).length;
  const mutualCount = (lists.mutualFollows || []).length;
  let ratioPct = 0;
  if (totalFollowing > 0) {
    ratioPct = Math.round((mutualCount / totalFollowing) * 100);
  }

  const ratioPercentEl = document.getElementById('ratio-percent');
  if (ratioPercentEl) ratioPercentEl.innerText = `${ratioPct}%`;

  const ratioBarFillEl = document.getElementById('ratio-bar-fill');
  if (ratioBarFillEl) ratioBarFillEl.style.width = `${ratioPct}%`;

  const hintNotBack = document.getElementById('hint-not-back');
  if (hintNotBack) {
    const ignored = (data.following || []).length - mutualCount - (lists.notFollowingBack || []).length;
    hintNotBack.innerText = ignored > 0 ? `Excluding ${ignored} starred accounts` : 'Accounts that do not follow back';
  }

  const tabTitles = {
    notFollowingBack: { title: 'Not Following Back', desc: 'Accounts you follow that do not follow you back.' },
    mutualFollows: { title: 'Mutual Follows', desc: 'Accounts where you follow each other.' },
    fans: { title: 'Fans', desc: 'Accounts that follow you, but you do not follow back.' },
    following: { title: 'All Following', desc: 'Every account you follow.' },
    followers: { title: 'All Followers', desc: 'Every account that follows you.' },
    closeFriends: { title: 'Close Friends', desc: 'Accounts on your Close Friends list.' },
    pendingRequests: { title: 'Pending Requests (Sent)', desc: 'Follow requests you sent that are still pending.' },
    recentRequests: { title: 'Recent Follow Requests', desc: 'Recent outgoing follow requests.' },
    recentlyUnfollowed: { title: 'Recently Unfollowed', desc: 'Accounts you unfollowed recently.' },
    hideStory: { title: 'Hidden Story', desc: 'Accounts hidden from your stories.' },
    blocked: { title: 'Blocked Profiles', desc: 'Accounts you have blocked.' },
    removedSuggestions: { title: 'Removed Suggestions', desc: 'Accounts removed from suggestions.' },
    whitelist: { title: 'Whitelisted Accounts', desc: 'Starred accounts ignored from the unfollower list.' }
  };

  const headerInfo = tabTitles[activeTab] || { title: 'Accounts', desc: '' };
  const titleEl = document.getElementById('active-tab-title');
  if (titleEl) titleEl.innerText = headerInfo.title;

  const descEl = document.getElementById('active-tab-desc');
  if (descEl) descEl.innerText = headerInfo.desc;

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

  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    dataset = dataset.filter(u =>
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.name && u.name.toLowerCase().includes(q))
    );
  }

  const counterEl = document.getElementById('results-counter');
  if (counterEl) {
    counterEl.innerText = `Showing ${dataset.length} accounts`;
  }

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
        <div class="hero-dropzone">
          <div class="hero-icon-pulse">
            <svg viewBox="0 0 24 24" width="40" height="40" style="fill: url(#ig-grad);">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
            </svg>
          </div>
          <div>
            <h3>Drop export folder here</h3>
            <p>Drop your <code>followers_and_following</code> folder or select files below.</p>
          </div>

          <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center;">
            <button class="btn btn-primary" onclick="document.getElementById('folder-input').click()">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
              <span>Choose Folder</span>
            </button>
            <button class="btn" onclick="document.getElementById('json-input').click()">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
              <span>Choose JSON</span>
            </button>
            <button class="btn btn-action btn-demo" onclick="loadDemoData()">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <span>Sample Data</span>
            </button>
          </div>

          <div class="hero-steps">
            <div class="step-card">
              <div class="step-num">Step 1</div>
              <div class="step-title">Export on Instagram</div>
              <div class="step-desc">In Accounts Center, request your data in JSON format under "Followers and following".</div>
            </div>
            <div class="step-card">
              <div class="step-num">Step 2</div>
              <div class="step-title">Unzip archive</div>
              <div class="step-desc">Extract the downloaded zip file to access the JSON files.</div>
            </div>
            <div class="step-card">
              <div class="step-num">Step 3</div>
              <div class="step-title">Drop folder</div>
              <div class="step-desc">Drop the folder here. Everything processes locally in memory.</div>
            </div>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          <h4 style="font-size: 1.1rem; font-weight: 700;">No accounts found</h4>
          <p>No results matched "${searchQuery}".</p>
          <button class="btn" onclick="clearSearch()" style="margin-top: 0.5rem;">Clear Search</button>
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
          <a href="${profileUrl}" target="_blank" rel="noopener noreferrer" class="profile-link" title="Open Instagram Profile">
            <span>@${user.username}</span>
            <svg class="external-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
          </a>
          ${nameHTML}
        </div>
        <div class="date-row">
          <svg class="date-icon" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8s8 3.58 8 8s-3.58 8-8 8zm.5-13H11v6l5.25 3.15l.75-1.23l-4.5-2.67z"/></svg>
          <span>Followed: ${user.date_str || 'N/A'}</span>
        </div>
        <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
          ${badgeHTML}
          ${extraBadges}
        </div>
      </div>
      <div class="card-actions">
        <button class="action-btn star-btn ${isWhitelisted ? 'whitelisted' : ''}" onclick="toggleWhitelist('${user.username}')" title="${isWhitelisted ? 'Remove Star' : 'Star account'}">
          ${isWhitelisted ?
            `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2L9.19 8.63L2 9.24l5.46 4.73L5.82 21z"/></svg>` :
            `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M22 9.24l-7.19-.62L12 2L9.19 8.63L2 9.24l5.46 4.73L5.82 21L12 17.27L18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27l1-4.28l-3.32-2.88l4.38-.38L12 6.1l1.71 4.04l4.38.38l-3.32 2.88l1 4.28L12 15.4z"/></svg>`
          }
        </button>
        <button class="action-btn" onclick="copyUsername('${user.username}')" title="Copy Username">
          <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
        </button>
      </div>
    `;
    frag.appendChild(card);
  });

  container.appendChild(frag);
}

function copyUsername(text) {
  const onSuccess = () => showToast(`Copied @${text}`);
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
    showToast('No usernames to copy');
    return;
  }

  const text = dataset.map(u => u.username).join('\n');
  const onSuccess = () => showToast(`Copied ${dataset.length} usernames`);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(onSuccess).catch(() => fallbackCopy(text, onSuccess));
  } else {
    fallbackCopy(text, onSuccess);
  }
}

function exportCurrentListToCSV() {
  let dataset = [...(lists[activeTab] || [])];
  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    dataset = dataset.filter(u =>
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.name && u.name.toLowerCase().includes(q))
    );
  }

  if (dataset.length === 0) {
    showToast('No accounts to export');
    return;
  }

  const header = ['Username', 'Real Name', 'Profile URL', 'Follow Date', 'Category'];
  const rows = dataset.map(u => [
    `"${u.username || ''}"`,
    `"${(u.name || '').replace(/"/g, '""')}"`,
    `"${u.href || `https://www.instagram.com/${u.username}/`}"`,
    `"${u.date_str || ''}"`,
    `"${activeTab}"`
  ]);

  const csvContent = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `instagram_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`Exported ${dataset.length} accounts to CSV`);
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
  }, 2600);
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
    titleOptional.style.display = visibleCount > 0 ? 'flex' : 'none';
  }
  const moreCount = document.getElementById('more-lists-count');
  if (moreCount) moreCount.textContent = String(visibleCount);
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
  const buffer = await file.arrayBuffer();
  const view = new Uint8Array(buffer);
  let text;
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

  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  return JSON.parse(text);
}

async function loadExportFiles(fileList) {
  const files = [...fileList].filter(f => f.name.toLowerCase().endsWith('.json'));
  if (!files.length) {
    showToast('No JSON files found in selection');
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
      throw new Error('Selection must include following.json and followers_*.json');
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

    setStatus(`Loaded ${data.following.length} Following & ${data.followers.length} Followers`, 'Imported', true);
    showToast(`Loaded ${data.following.length} following and ${data.followers.length} followers`);
  } catch (error) {
    console.error(error);
    setStatus(`Error: ${error.message}`, 'Failed', false);
    showToast(`Failed: ${error.message}`);
  }
}

async function getFilesFromDataTransfer(dataTransfer) {
  const files = [];
  const items = dataTransfer.items;
  if (items && items.length > 0 && items[0].webkitGetAsEntry) {
    async function traverseEntry(entry) {
      if (entry.isFile) {
        const file = await new Promise(resolve => entry.file(resolve));
        files.push(file);
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        const entries = await new Promise(resolve => {
          const all = [];
          function readBatch() {
            dirReader.readEntries(batch => {
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

window.addEventListener('dragenter', e => {
  e.preventDefault();
  dragCounter++;
  if (dropOverlay) dropOverlay.classList.add('active');
});

window.addEventListener('dragleave', e => {
  e.preventDefault();
  dragCounter--;
  if (dragCounter <= 0 && dropOverlay) {
    dropOverlay.classList.remove('active');
    dragCounter = 0;
  }
});

window.addEventListener('dragover', e => {
  e.preventDefault();
});

window.addEventListener('drop', async e => {
  e.preventDefault();
  dragCounter = 0;
  if (dropOverlay) dropOverlay.classList.remove('active');
  if (e.dataTransfer) {
    const files = await getFilesFromDataTransfer(e.dataTransfer);
    if (files.length) loadExportFiles(files);
  }
});

const folderInput = document.getElementById('folder-input');
if (folderInput) {
  folderInput.addEventListener('change', e => {
    if (e.target.files.length) loadExportFiles(e.target.files);
  });
}

const jsonInput = document.getElementById('json-input');
if (jsonInput) {
  jsonInput.addEventListener('change', e => {
    if (e.target.files.length) loadExportFiles(e.target.files);
  });
}

function normalizeImportedUsername(value) {
  if (typeof value !== 'string') return null;
  let candidate = value.trim().replace(/^['"`]+|['"`,;]+$/g, '').trim();
  if (!candidate) return null;
  if (/^https?:\/\//i.test(candidate)) {
    try { candidate = new URL(candidate).pathname.split('/').filter(Boolean).pop() || ''; } catch { return null; }
  }
  candidate = candidate.replace(/^@/, '');
  return /^[a-zA-Z0-9._]{1,30}$/.test(candidate) ? candidate : null;
}

function parseWhitelistImport(contents, filename) {
  const usernames = new Set();
  const add = value => {
    const username = normalizeImportedUsername(value);
    if (username) usernames.add(username);
  };
  const collect = value => {
    if (typeof value === 'string') { add(value); return; }
    if (Array.isArray(value)) { value.forEach(collect); return; }
    if (!value || typeof value !== 'object') return;
    ['username', 'user_name', 'title', 'value'].forEach(key => add(value[key]));
    ['href', 'url', 'profile_url'].forEach(key => add(value[key]));
    Object.entries(value).forEach(([key, child]) => {
      if (child && typeof child === 'object') collect(child);
      else if (typeof child === 'string' && /whitelist|usernames|accounts/i.test(key)) add(child);
    });
  };

  if (/\.json$/i.test(filename)) {
    try { collect(JSON.parse(contents)); } catch { /* treat malformed JSON as a text list */ }
  }
  if (!usernames.size) {
    contents.split(/\r?\n/).forEach(line => {
      const firstCell = line.trim().replace(/^\uFEFF/, '').split(/[\t,;]/, 1)[0].trim();
      add(firstCell.replace(/^\d+[.)]\s*/, '').replace(/^[-*]\s*/, ''));
    });
  }
  return [...usernames];
}

const whitelistInput = document.getElementById('whitelist-input');
if (whitelistInput) {
  whitelistInput.addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = parseWhitelistImport(await file.text(), file.name);
      if (!imported.length) {
        showToast('No usernames found. Use one username per line, CSV, or JSON.');
        return;
      }
      customWhitelist = [...new Set([...customWhitelist, ...imported])];
      removedFromWhitelist = removedFromWhitelist.filter(username => !imported.includes(username));
      localStorage.setItem('instagram_custom_whitelist', JSON.stringify(customWhitelist));
      localStorage.setItem('instagram_removed_whitelist', JSON.stringify(removedFromWhitelist));
      rebuildActiveWhitelist();
      computeLists();
      initSidebar();
      updateUI();
      showToast(`Imported ${imported.length} whitelist ${imported.length === 1 ? 'account' : 'accounts'}.`);
    } catch (error) {
      console.error('Whitelist import failed:', error);
      showToast('Could not import this whitelist file.');
    } finally {
      event.target.value = '';
    }
  });
}

document.querySelectorAll('.stat-card').forEach(card => {
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const tab = card.getAttribute('data-tab');
      if (tab) switchTab(tab);
    }
  });
});

function applyTheme(theme, persist = false) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  const button = document.getElementById('theme-toggle');
  const label = document.getElementById('theme-action-label');
  const next = theme === 'dark' ? 'light' : 'dark';
  if (label) label.textContent = `${next[0].toUpperCase()}${next.slice(1)} mode`;
  if (button) button.setAttribute('aria-label', `Switch to ${next} mode`);
  if (persist) {
    try { localStorage.setItem('instagram_theme', theme); } catch { /* storage is optional */ }
  }
}

function setSidebarOpen(open, restoreFocus = true) {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('mobile-nav-toggle');
  const scrim = document.getElementById('sidebar-scrim');
  const panels = [document.querySelector('.dashboard-grid'), document.querySelector('.main-panel')].filter(Boolean);
  if (!sidebar || !toggle || !scrim) return;

  if (!window.matchMedia('(max-width: 768px)').matches) {
    panels.forEach(panel => { panel.inert = false; });
    sidebar.classList.remove('is-open');
    sidebar.removeAttribute('aria-hidden');
    sidebar.removeAttribute('role');
    sidebar.removeAttribute('aria-modal');
    sidebar.inert = false;
    scrim.hidden = true;
    document.body.classList.remove('mobile-nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    return;
  }

  sidebar.classList.toggle('is-open', open);
  sidebar.setAttribute('aria-hidden', String(!open));
  sidebar.inert = !open;
  panels.forEach(panel => { panel.inert = open; });
  scrim.hidden = !open;
  document.body.classList.toggle('mobile-nav-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  if (open) {
    sidebar.setAttribute('role', 'dialog');
    sidebar.setAttribute('aria-modal', 'true');
    document.getElementById('sidebar-close')?.focus();
  } else {
    sidebar.removeAttribute('role');
    sidebar.removeAttribute('aria-modal');
    if (restoreFocus) toggle.focus();
  }
}

function initThemeAndNavigation() {
  const saved = (() => { try { return localStorage.getItem('instagram_theme'); } catch { return null; } })();
  const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  applyTheme(saved || document.documentElement.dataset.theme || system);
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark', true);
  });

  const toggle = document.getElementById('mobile-nav-toggle');
  const sidebar = document.getElementById('sidebar');
  toggle?.addEventListener('click', () => setSidebarOpen(toggle.getAttribute('aria-expanded') !== 'true', false));
  document.getElementById('sidebar-close')?.addEventListener('click', () => setSidebarOpen(false));
  document.getElementById('sidebar-scrim')?.addEventListener('click', () => setSidebarOpen(false));
  sidebar?.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setSidebarOpen(false);
    } else if (event.key === 'Tab' && sidebar.classList.contains('is-open')) {
      const items = [...sidebar.querySelectorAll('button:not([disabled]), summary')]
        .filter(item => item.getClientRects().length);
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });
  window.matchMedia('(max-width: 768px)').addEventListener('change', () => setSidebarOpen(false, false));
  setSidebarOpen(false, false);
}

initThemeAndNavigation();
rebuildActiveWhitelist();
computeLists();
initSidebar();
updateUI();
setStatus('No data loaded', 'Ready', false);
