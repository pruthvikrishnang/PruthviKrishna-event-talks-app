# 🚀 BigQuery Release Hub

A premium, real-time Google Cloud BigQuery Release Notes dashboard built with **Python Flask** (backend parser and caching) and a dynamic **HTML5, JavaScript, and CSS3** frontend. It splits compound date updates into fine-grained cards, supports full text searching, and includes a custom Tweet composer modal.

### 🌐 Live Deployment
**View the live static dashboard here:**  
👉 **[https://pruthvikrishnang.github.io/PruthviKrishna-event-talks-app/](https://pruthvikrishnang.github.io/PruthviKrishna-event-talks-app/)** *(No installation or code cloning required!)*

---

## ✨ Features

*   **Timeline Separation:** Parses Google Cloud's composite date-based feed entries and splits them into individual card updates (e.g., separating 1 feature and 1 issue published on the same day into separate cards).
*   **Vibrant Dark UI:** A state-of-the-art interface styled with translucent glassmorphic panels, animated background glow blobs, and interactive timeline grids.
*   **Dynamic Stats Counters:** Computes real-time numbers of matching *Features*, *Issues*, *Announcements*, and *Breaking changes*. Clicking on these grid metrics instantly filters the timeline.
*   **Search & Sort:** Live client-side text query search matching dates, SQL commands, categories, and content. Supports sorting by `Newest First` and `Oldest First`.
*   **Tweet Composer Modal:**
    *   Previews your selected release note card.
    *   Pre-drafts a tweet containing the date, update type, and a snippet.
    *   Simulates Twitter's URL shortening policy (always counts URLs as 23 characters).
    *   Features a character counter that limits you to 280 characters before firing Twitter's official Web Intent composer in a new tab.
*   **Refresh Feed with Shimmer Skeletons:** A prominent refresh button forces a feed updates pull from Google Cloud. While reloading, the feed displays animated shimmer skeleton cards.
*   **Instant Clipboard Copying:** A "Copy Link" action copies direct documentation links to your clipboard with temporary button status updates and toast alerts.

---

## 🏗️ Dual-Compatibility Architecture

To make the application extremely flexible, it supports two running modes:
1.  **Flask Backend Server (Local Host):** Uses [app.py](app.py) to fetch the feed, parse XML tags on the server via `BeautifulSoup`, and cache parsed results in `notes_cache.json`.
2.  **Static Client (GitHub Pages):** If hosted statically (where Python cannot run), [static/js/main.js](static/js/main.js) automatically falls back to fetching the XML feed over a free, raw CORS proxy (`https://api.allorigins.win`) and parses XML data on-the-fly inside the user's browser using `DOMParser`.

---

## 💻 Running the Project Locally

### 1. Flask Development Server (Recommended)
This runs the full backend server with caching capabilities.

```bash
# Clone the repository
git clone https://github.com/pruthvikrishnang/PruthviKrishna-event-talks-app.git
cd PruthviKrishna-event-talks-app

# Install dependencies
pip install -r requirements.txt

# Run the Flask app
python app.py
```

Open your browser and navigate to **[http://127.0.0.1:5000](http://127.0.0.1:5000)**.

### 2. Static HTML Launch
You can also run the interface locally without starting a Python server:
Simply double-click the [index.html](index.html) file to open it in your browser. The JavaScript will detect the lack of a Flask backend and automatically fetch and parse feed elements using the browser-based CORS proxy fallback.

---

## 🛠️ Tech Stack
*   **Backend:** Python 3.14, Flask (v3.0+), requests, BeautifulSoup4
*   **Frontend:** HTML5, CSS3 (Vanilla CSS variables, flexbox, grid, keyframe animations), JavaScript (ES6+), Lucide Icons
*   **Hosting:** GitHub Pages (Static Deployment)
