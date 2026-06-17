import os
import json
import requests
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
from flask import Flask, render_template, jsonify, request

app = Flask(__name__, template_folder='.', static_folder='static')
CACHE_FILE = 'notes_cache.json'
FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_notes():
    """Fetches the Google BigQuery release notes XML feed and parses it into individual items."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    response = requests.get(FEED_URL, headers=headers)
    response.raise_for_status()
    
    root = ET.fromstring(response.content)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    entries = root.findall('atom:entry', ns)
    
    parsed_items = []
    
    for entry in entries:
        date_str = entry.find('atom:title', ns).text.strip()
        updated_str = entry.find('atom:updated', ns).text.strip()
        
        link_elm = entry.find('atom:link', ns)
        link_href = link_elm.attrib.get('href') if link_elm is not None else ""
        
        content_elm = entry.find('atom:content', ns)
        html_content = content_elm.text if content_elm is not None else ""
        
        soup = BeautifulSoup(html_content, 'html.parser')
        
        current_type = None
        current_content = []
        
        def save_item(c_type, c_content):
            content_html_str = "".join(str(c) for c in c_content).strip()
            if not content_html_str and not c_type:
                return
            
            item_soup = BeautifulSoup(content_html_str, 'html.parser')
            plain_text = item_soup.get_text().strip()
            
            # Try to get the first link inside the specific update item
            first_a = item_soup.find('a')
            item_link = first_a.get('href') if first_a else link_href
            
            # Ensure links are absolute
            if item_link and item_link.startswith('/'):
                item_link = 'https://docs.cloud.google.com' + item_link
                
            parsed_items.append({
                'date': date_str,
                'updated': updated_str,
                'type': c_type or 'General',
                'content_html': content_html_str,
                'plain_text': plain_text,
                'link': item_link or link_href
            })
            
        # Parse the HTML content and split it by h3 tags (each h3 marks a new category of release note)
        for child in soup.children:
            if child.name == 'h3':
                save_item(current_type, current_content)
                current_content = []
                current_type = child.get_text().strip()
            else:
                current_content.append(child)
                
        # Save any remaining content as the final item for this date
        save_item(current_type, current_content)
        
    # Write to local cache file
    with open(CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump(parsed_items, f, ensure_ascii=False, indent=2)
        
    return parsed_items

def get_notes(force_refresh=False):
    """Retrieves release notes, using cache if available and not forced to refresh."""
    if not force_refresh and os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return fetch_and_parse_notes()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/notes')
def api_notes():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    try:
        notes = get_notes(force_refresh=force_refresh)
        return jsonify({
            'success': True,
            'notes': notes,
            'source': 'network' if force_refresh else 'cache'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Flask application runs on port 5000
    app.run(debug=True, port=5000)
