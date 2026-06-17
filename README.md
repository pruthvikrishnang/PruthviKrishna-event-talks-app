# 🚀 BigQuery Release Hub

A premium, real-time Google Cloud BigQuery Release Notes dashboard built with **Python Flask** (backend parser and caching) and a dynamic **HTML5, JavaScript, and CSS3** frontend. It splits compound date updates into fine-grained cards, supports full text searching, and includes a custom Tweet composer modal.

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

## 💻 Running the Project Locally

To run the application locally on your machine, follow these instructions:

### 1. Clone the repository
```bash
git clone https://github.com/pruthvikrishnang/PruthviKrishna-event-talks-app.git
cd PruthviKrishna-event-talks-app
```

### 2. Install dependencies
Make sure you have Python 3.x installed, then install the required Python libraries:
```bash
pip install -r requirements.txt
```

### 3. Start the Flask Server
Run the Flask server backend:
```bash
python app.py
```

### 4. Access the Application
Open your browser and navigate to:  
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 🛠️ Tech Stack
*   **Backend:** Python 3.14, Flask (v3.1.3), requests, BeautifulSoup4
*   **Frontend:** HTML5, CSS3 (Vanilla CSS variables, flexbox, grid, keyframe animations), JavaScript (ES6+), Lucide Icons
