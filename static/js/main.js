// Global State
let releaseNotes = [];
let currentFilter = 'all';
let currentSearch = '';
let currentSort = 'newest';
let selectedNoteForTweet = null;

// Document Ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialise UI Elements
    initElements();
    // Fetch release notes
    fetchNotes();
});

// Initialize Event Listeners
function initElements() {
    const btnRefresh = document.getElementById('btn-refresh');
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    const sortSelect = document.getElementById('sort-select');
    const btnResetFilters = document.getElementById('btn-reset-filters');
    const filterChips = document.getElementById('filter-chips');
    
    // Refresh button click
    btnRefresh.addEventListener('click', () => {
        fetchNotes(true);
    });

    // Search input typing
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.trim().toLowerCase();
        if (currentSearch.length > 0) {
            searchClear.style.display = 'flex';
        } else {
            searchClear.style.display = 'none';
        }
        applyFilters();
    });

    // Clear search
    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        currentSearch = '';
        searchClear.style.display = 'none';
        applyFilters();
    });

    // Reset filters empty state button
    btnResetFilters.addEventListener('click', () => {
        searchInput.value = '';
        currentSearch = '';
        searchClear.style.display = 'none';
        
        // Reset category chip UI
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        document.querySelector('.chip[data-filter="all"]').classList.add('active');
        currentFilter = 'all';
        
        // Reset stats grid cards UI
        document.querySelectorAll('.metric-card').forEach(c => c.classList.remove('active'));
        document.getElementById('stat-all').classList.add('active');
        
        applyFilters();
    });

    // Sort order change
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        applyFilters();
    });

    // Category chips selection
    filterChips.addEventListener('click', (e) => {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        
        // Toggle active status
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        
        currentFilter = chip.getAttribute('data-filter');
        
        // Synchronize with stats cards UI
        syncStatsCardsUI(currentFilter);
        
        applyFilters();
    });

    // Stats Grid Click handlers
    document.querySelectorAll('.metric-card').forEach(card => {
        card.addEventListener('click', () => {
            const cardId = card.id;
            let filterVal = 'all';
            
            if (cardId === 'stat-features') filterVal = 'Feature';
            else if (cardId === 'stat-issues') filterVal = 'Issue';
            else if (cardId === 'stat-announcements') filterVal = 'Announcement';
            else if (cardId === 'stat-breaking') filterVal = 'Breaking';
            
            // Sync with Chips UI
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            const targetChip = document.querySelector(`.chip[data-filter="${filterVal}"]`) || document.querySelector('.chip[data-filter="other"]');
            if (targetChip) targetChip.classList.add('active');
            
            currentFilter = filterVal;
            
            // Highlight current stats card
            document.querySelectorAll('.metric-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            
            applyFilters();
        });
    });

    // Tweet Modal event listeners
    document.getElementById('btn-close-modal').addEventListener('click', hideTweetModal);
    document.getElementById('btn-cancel-tweet').addEventListener('click', hideTweetModal);
    document.getElementById('btn-send-tweet').addEventListener('click', executeTweet);
    
    const tweetTextarea = document.getElementById('tweet-textarea');
    tweetTextarea.addEventListener('input', (e) => {
        updateTweetCharCount(e.target.value);
    });

    // Close modal on escape or outer overlay click
    document.getElementById('tweet-modal').addEventListener('click', (e) => {
        if (e.target.id === 'tweet-modal') hideTweetModal();
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideTweetModal();
        }
    });

    // Initialize lucide icons on bootstrap
    lucide.createIcons();
}

// Process fetched release notes data
function handleData(notes, source, isRefresh) {
    // Assign unique IDs to notes to avoid serialization issues in HTML
    releaseNotes = notes.map((note, index) => ({ ...note, id: index }));
    
    // Update metrics counters
    calculateMetrics(releaseNotes);
    
    // Render the filtered/sorted notes
    applyFilters();
    
    if (isRefresh) {
        showToast('Refresh Successful', `Notes successfully fetched from ${source === 'network' ? 'Google Cloud feed' : 'local cache'}.`, 'success');
    }
}

// Fetch Notes from Flask Backend API (with CORS proxy static fallback)
function fetchNotes(forceRefresh = false) {
    const btnRefresh = document.getElementById('btn-refresh');
    const spinner = document.getElementById('spinner-icon');
    
    // Set UI to loading state
    btnRefresh.disabled = true;
    if (spinner) spinner.classList.add('spinning');
    
    // Load skeleton loaders inside container
    renderSkeletons();
    
    // Detect whether we should fetch from Flask local backend or GitHub Pages static host
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocal) {
        let url = '/api/notes';
        if (forceRefresh) {
            url += '?refresh=true';
        }
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Server returned status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    handleData(data.notes, data.source, forceRefresh);
                } else {
                    throw new Error(data.error || 'Failed to fetch release notes.');
                }
            })
            .catch(err => {
                console.warn('Flask local backend failed, falling back to client-side parsing:', err);
                fallbackToClientParsing(forceRefresh);
            });
    } else {
        // GitHub Pages or other static deployment, fetch and parse via CORS proxy
        fallbackToClientParsing(forceRefresh);
    }
}

// Fetch and parse the BigQuery XML feed directly in the browser using a CORS proxy
function fallbackToClientParsing(isRefresh = false) {
    const btnRefresh = document.getElementById('btn-refresh');
    const spinner = document.getElementById('spinner-icon');
    
    const feedUrl = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml";
    // Using AllOrigins (free, fast, no-auth raw CORS proxy)
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`;
    
    fetch(proxyUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`CORS proxy returned status: ${response.status}`);
            }
            return response.text();
        })
        .then(xmlText => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "text/xml");
            
            // Check for parsing errors
            const parseError = xmlDoc.getElementsByTagName("parsererror");
            if (parseError.length > 0) {
                throw new Error("XML parser error in browser");
            }
            
            const entries = xmlDoc.getElementsByTagName("entry");
            const parsedNotes = [];
            
            // Atom namespace might be default, querySelectorAll works well on text/xml docs
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];
                const dateStr = entry.getElementsByTagName("title")[0]?.textContent?.trim() || "";
                const updatedStr = entry.getElementsByTagName("updated")[0]?.textContent?.trim() || "";
                
                // Get alternate link
                let linkHref = "";
                const links = entry.getElementsByTagName("link");
                for (let j = 0; j < links.length; j++) {
                    if (links[j].getAttribute("rel") === "alternate" || !links[j].getAttribute("rel")) {
                        linkHref = links[j].getAttribute("href") || "";
                        break;
                    }
                }
                if (!linkHref && links.length > 0) {
                    linkHref = links[0].getAttribute("href") || "";
                }
                
                const contentElm = entry.getElementsByTagName("content")[0];
                const htmlContent = contentElm ? contentElm.textContent : "";
                
                // Parse the entry's HTML to split it by H3 categories
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = htmlContent;
                
                let currentType = null;
                let currentContent = [];
                
                const saveItem = (cType, cContent) => {
                    const tempContainer = document.createElement('div');
                    cContent.forEach(child => tempContainer.appendChild(child.cloneNode(true)));
                    const contentHtmlStr = tempContainer.innerHTML.trim();
                    if (!contentHtmlStr && !cType) return;
                    
                    const plainText = tempContainer.textContent.trim();
                    const firstA = tempContainer.querySelector('a');
                    let itemLink = firstA ? firstA.getAttribute('href') : linkHref;
                    
                    if (itemLink && itemLink.startsWith('/')) {
                        itemLink = 'https://docs.cloud.google.com' + itemLink;
                    }
                    
                    parsedNotes.push({
                        date: dateStr,
                        updated: updatedStr,
                        type: cType || 'General',
                        content_html: contentHtmlStr,
                        plain_text: plainText,
                        link: itemLink || linkHref
                    });
                };
                
                tempDiv.childNodes.forEach(child => {
                    if (child.nodeName === 'H3') {
                        saveItem(currentType, currentContent);
                        currentContent = [];
                        currentType = child.textContent.trim();
                    } else {
                        currentContent.push(child);
                    }
                });
                
                saveItem(currentType, currentContent);
            }
            
            if (parsedNotes.length === 0) {
                throw new Error("No updates parsed from XML feed.");
            }
            
            // Handle parsed notes data
            handleData(parsedNotes, 'network', isRefresh);
        })
        .catch(err => {
            console.error('Client-side XML parsing failed:', err);
            showToast('Loading Failed', 'Could not fetch or parse notes. Try refreshing again.', 'error');
            if (releaseNotes.length === 0) {
                renderNotes([]);
            } else {
                applyFilters();
            }
        })
        .finally(() => {
            btnRefresh.disabled = false;
            if (spinner) spinner.classList.remove('spinning');
        });
}

// Render Shimmer Skeleton Cards
function renderSkeletons() {
    const container = document.getElementById('notes-container');
    container.innerHTML = '';
    
    for (let i = 0; i < 3; i++) {
        const skel = document.createElement('div');
        skel.className = 'skeleton-card';
        skel.innerHTML = `
            <div class="skeleton-header">
                <div class="skeleton-line short"></div>
                <div class="skeleton-badge"></div>
            </div>
            <div class="skeleton-body">
                <div class="skeleton-line long"></div>
                <div class="skeleton-line medium"></div>
                <div class="skeleton-line short"></div>
            </div>
            <div class="skeleton-footer">
                <div class="skeleton-btn"></div>
                <div class="skeleton-btn"></div>
            </div>
        `;
        container.appendChild(skel);
    }
}

// Calculate and Update Stat Cards
function calculateMetrics(notes) {
    let countAll = notes.length;
    let countFeatures = 0;
    let countIssues = 0;
    let countAnnouncements = 0;
    let countBreaking = 0;
    
    notes.forEach(note => {
        const type = note.type.toLowerCase();
        if (type.includes('feature')) countFeatures++;
        else if (type.includes('issue')) countIssues++;
        else if (type.includes('announcement')) countAnnouncements++;
        else if (type.includes('breaking') || type.includes('deprecation') || type.includes('deprecated')) countBreaking++;
        else countBreaking++; // Anything else (General, others) goes here or we can treat as general
    });
    
    document.getElementById('val-all').textContent = countAll;
    document.getElementById('val-features').textContent = countFeatures;
    document.getElementById('val-issues').textContent = countIssues;
    document.getElementById('val-announcements').textContent = countAnnouncements;
    document.getElementById('val-breaking').textContent = countBreaking;
}

// Synchronize metric cards active border UI with chips selection
function syncStatsCardsUI(activeFilter) {
    document.querySelectorAll('.metric-card').forEach(card => card.classList.remove('active'));
    
    if (activeFilter === 'all') {
        document.getElementById('stat-all').classList.add('active');
    } else if (activeFilter === 'Feature') {
        document.getElementById('stat-features').classList.add('active');
    } else if (activeFilter === 'Issue') {
        document.getElementById('stat-issues').classList.add('active');
    } else if (activeFilter === 'Announcement') {
        document.getElementById('stat-announcements').classList.add('active');
    } else if (activeFilter === 'Breaking') {
        document.getElementById('stat-breaking').classList.add('active');
    } else {
        // 'other'
        document.getElementById('stat-breaking').classList.add('active');
    }
}

// Filtering, Searching, and Sorting logic
function applyFilters() {
    let filtered = [...releaseNotes];
    
    // 1. Apply Category Filter
    if (currentFilter !== 'all') {
        if (currentFilter === 'other') {
            filtered = filtered.filter(item => {
                const t = item.type.toLowerCase();
                return !t.includes('feature') && !t.includes('issue') && !t.includes('announcement') && !t.includes('breaking');
            });
        } else {
            filtered = filtered.filter(item => item.type.toLowerCase().includes(currentFilter.toLowerCase()));
        }
    }
    
    // 2. Apply Text Search
    if (currentSearch) {
        filtered = filtered.filter(item => {
            const dateMatch = item.date.toLowerCase().includes(currentSearch);
            const textMatch = item.plain_text.toLowerCase().includes(currentSearch);
            const typeMatch = item.type.toLowerCase().includes(currentSearch);
            return dateMatch || textMatch || typeMatch;
        });
    }
    
    // 3. Apply Sorting
    filtered.sort((a, b) => {
        const dateA = new Date(a.updated);
        const dateB = new Date(b.updated);
        return currentSort === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    // 4. Render notes
    renderNotes(filtered);
}

// Render Notes Cards HTML
function renderNotes(notes) {
    const container = document.getElementById('notes-container');
    const emptyState = document.getElementById('empty-state');
    
    container.innerHTML = '';
    
    if (notes.length === 0) {
        emptyState.style.display = 'flex';
        container.style.display = 'none';
        return;
    }
    
    emptyState.style.display = 'none';
    container.style.display = 'flex';
    
    notes.forEach((note, index) => {
        const card = document.createElement('article');
        card.className = 'note-card';
        card.style.animationDelay = `${index * 0.05}s`; // Staggered entry animation
        
        // Define badge style
        let badgeClass = 'badge-other';
        const typeLower = note.type.toLowerCase();
        if (typeLower.includes('feature')) badgeClass = 'badge-feature';
        else if (typeLower.includes('issue')) badgeClass = 'badge-issue';
        else if (typeLower.includes('announcement')) badgeClass = 'badge-announcement';
        else if (typeLower.includes('breaking') || typeLower.includes('deprecation')) badgeClass = 'badge-breaking';
        
        // Construct html content
        card.innerHTML = `
            <div class="card-header">
                <div class="card-date">
                    <i data-lucide="calendar"></i>
                    <span>${note.date}</span>
                </div>
                <span class="badge ${badgeClass}">${note.type}</span>
            </div>
            <div class="card-body">
                ${note.content_html}
            </div>
            <div class="card-actions">
                <button class="btn-tweet" onclick="openTweetModal(${note.id})" aria-label="Share this update on Twitter">
                    <i data-lucide="twitter"></i>
                    <span>Tweet Update</span>
                </button>
                <button class="btn-secondary btn-copy" onclick="copyToClipboard('${note.link}', this)" aria-label="Copy update link">
                    <i data-lucide="copy"></i>
                    <span>Copy Link</span>
                </button>
                <a href="${note.link}" target="_blank" rel="noopener" class="btn-secondary" aria-label="View developer documentation">
                    <i data-lucide="external-link"></i>
                    <span>Read Docs</span>
                </a>
            </div>
        `;
        container.appendChild(card);
    });
    
    // Re-bind Lucide Icons
    lucide.createIcons();
}

// Copy link to clipboard helper
function copyToClipboard(text, buttonEl) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Link Copied', 'Direct URL saved to your clipboard.', 'success');
        
        // Visual feedback on the button
        const span = buttonEl.querySelector('span');
        const icon = buttonEl.querySelector('i');
        const originalText = span.textContent;
        
        span.textContent = 'Copied!';
        buttonEl.style.borderColor = '#10b981';
        buttonEl.style.color = '#10b981';
        
        setTimeout(() => {
            span.textContent = originalText;
            buttonEl.style.borderColor = '';
            buttonEl.style.color = '';
        }, 2000);
    }).catch(err => {
        console.error('Clipboard copy failed:', err);
        showToast('Copy Failed', 'Unable to write to clipboard.', 'error');
    });
}

// Custom Tweet Composer Modal controls
function openTweetModal(noteId) {
    const note = releaseNotes.find(n => n.id === noteId);
    if (!note) return;
    
    selectedNoteForTweet = note;
    
    // Show overlay
    const modal = document.getElementById('tweet-modal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Lock scrolling
    
    // Render preview elements
    document.getElementById('tweet-date-badge').textContent = note.date;
    const typeBadge = document.getElementById('tweet-type-badge');
    typeBadge.textContent = note.type;
    
    // Apply type styling to preview badge
    typeBadge.className = 'badge';
    let badgeClass = 'badge-other';
    const typeLower = note.type.toLowerCase();
    if (typeLower.includes('feature')) badgeClass = 'badge-feature';
    else if (typeLower.includes('issue')) badgeClass = 'badge-issue';
    else if (typeLower.includes('announcement')) badgeClass = 'badge-announcement';
    else if (typeLower.includes('breaking') || typeLower.includes('deprecation')) badgeClass = 'badge-breaking';
    typeBadge.classList.add(badgeClass);
    
    document.getElementById('tweet-preview-content').textContent = note.plain_text;
    
    // Populate textarea draft
    const draftText = generateTweetDraft(note);
    const textarea = document.getElementById('tweet-textarea');
    textarea.value = draftText;
    
    updateTweetCharCount(draftText);
}

function hideTweetModal() {
    const modal = document.getElementById('tweet-modal');
    modal.style.display = 'none';
    document.body.style.overflow = ''; // Unlock scrolling
    selectedNoteForTweet = null;
}

// Calculate tweet draft content
function generateTweetDraft(note) {
    const header = `BigQuery ${note.type} (${note.date}): `;
    const footer = `\n\n#BigQuery #GoogleCloud`;
    const url = note.link || "https://cloud.google.com/bigquery";
    
    // Twitter shortening: URLs count as 23 characters.
    const urlLengthForTwitter = 23;
    const reservedLength = header.length + footer.length + urlLengthForTwitter + 2; // + spacing
    const maxTextLength = 280 - reservedLength;
    
    let plainText = note.plain_text;
    // Strip redundant spaces and multiple newlines
    plainText = plainText.replace(/\s+/g, ' ').trim();
    
    let textSnippet = plainText;
    if (textSnippet.length > maxTextLength) {
        textSnippet = textSnippet.substring(0, maxTextLength - 3) + "...";
    }
    
    return `${header}"${textSnippet}"\n\n${url}${footer}`;
}

function updateTweetCharCount(text) {
    const currentCountSpan = document.getElementById('char-current');
    const btnSend = document.getElementById('btn-send-tweet');
    const textCountContainer = document.querySelector('.character-count');
    
    // Twitter treats URLs as 23 characters. Let's do a smart character count simulation!
    // Regex to find urls
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex) || [];
    
    let simulatedLength = text.length;
    urls.forEach(url => {
        simulatedLength = simulatedLength - url.length + 23;
    });
    
    currentCountSpan.textContent = simulatedLength;
    
    // Add warnings if reaching Twitter bounds
    textCountContainer.className = 'character-count';
    if (simulatedLength > 280) {
        textCountContainer.classList.add('danger');
        btnSend.disabled = true;
    } else if (simulatedLength > 250) {
        textCountContainer.classList.add('warning');
        btnSend.disabled = false;
    } else if (simulatedLength === 0) {
        btnSend.disabled = true;
    } else {
        btnSend.disabled = false;
    }
}

// Fire intent tweet to Twitter
function executeTweet() {
    const text = document.getElementById('tweet-textarea').value;
    if (!text) return;
    
    const encodedText = encodeURIComponent(text);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
    
    // Open in a new tab
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    
    // Close modal and send toast
    hideTweetModal();
    showToast('Tweet Intent Opened', 'Twitter web intent loaded in a new tab.', 'info');
}

// Toast Alert notification drawer
function showToast(title, message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Render icon
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    else if (type === 'error') iconName = 'alert-triangle';
    
    toast.innerHTML = `
        <i data-lucide="${iconName}"></i>
        <div class="toast-content">
            <span class="toast-title">${title}</span>
            <span class="toast-message">${message}</span>
        </div>
    `;
    
    container.appendChild(toast);
    lucide.createIcons();
    
    // Trigger animations in next paint
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Auto-remove toast after 4s
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 400);
    }, 4000);
}
