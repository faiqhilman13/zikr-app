import json
import time
import os
import subprocess

# Set XSKILL_API_KEY env var before running this script
auth_token = os.environ["XSKILL_API_KEY"]
BASE_URL = "https://api.xskill.ai/api/v3"
HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {auth_token}"
}
OUT_DIR = os.path.join(os.path.dirname(__file__), "screenshots")
os.makedirs(OUT_DIR, exist_ok=True)

SCREENSHOTS = [
    {
        "filename": "01_hero_counter.png",
        "prompt": (
            "App Store marketing screenshot, iPhone 15 Pro showing a minimalist Islamic dhikr counter app. "
            "Deep royal blue background (#1E3A8A). Center: large glowing gold circular orb button with subtle pulse glow, tap to count. "
            "Above orb: Arabic calligraphy text 'سبحان الله' in ivory white. Below orb: count '67' in large gold numerals. "
            "Top: circular arc progress ring in gold showing 67% filled, label '67 / 100'. "
            "Caption overlay at top in bold ivory text: 'Your daily dhikr, beautifully simple'. "
            "Ivory (#FAF8F5) UI text. Clean dark navy card UI. Professional product screenshot, subtle vignette."
        ),
        "aspect_ratio": "9:16",
        "resolution": "2K"
    },
    {
        "filename": "02_streaks_rewards.png",
        "prompt": (
            "App Store marketing screenshot, iPhone 15 Pro showing an Islamic dhikr app rewards screen. "
            "Royal blue background. Top section: streak counter showing '7 🔥 Day Streak' in large gold text with flame icon. "
            "Multiplier badge: 'x4 XP Multiplier' in amber. Below: XP progress bar in gold, 'Level 3 · 750 XP'. "
            "Badge grid showing unlocked badges: 'First Light ☀️', 'Flame Streak 🔥', 'Week of Noor ✨', 'Thousand Club ⭐'. "
            "Each badge in a rounded ivory card with gold border. "
            "Caption overlay: 'Build your streak. Earn rewards.' in bold ivory text at top. "
            "Clean dark navy cards, professional App Store screenshot style."
        ),
        "aspect_ratio": "9:16",
        "resolution": "2K"
    },
    {
        "filename": "03_dhikr_presets.png",
        "prompt": (
            "App Store marketing screenshot, iPhone 15 Pro showing an Islamic dhikr preset selector carousel. "
            "Royal blue background. Horizontally scrollable pill-shaped preset cards: "
            "'Tasbih' (indigo), 'Salawat' (rose), 'Tahlil' (emerald), 'Takbir' (amber), 'Alhamdulillah' (teal). "
            "Selected card 'Tasbih' highlighted with gold border and glow. "
            "Below: large Arabic text 'سبحان الله' in ivory. Transliteration 'SubhanAllah' in smaller ivory text. "
            "Below that: a '+1  +5  +10' quick-add button row in gold. "
            "Caption overlay: 'Choose your dhikr. Count with intention.' in bold ivory at top. "
            "Professional App Store screenshot, clean UI."
        ),
        "aspect_ratio": "9:16",
        "resolution": "2K"
    },
    {
        "filename": "04_history_stats.png",
        "prompt": (
            "App Store marketing screenshot, iPhone 15 Pro showing an Islamic dhikr app history and stats view. "
            "Royal blue background. Top: weekly bar chart in gold bars showing dhikr counts per day, "
            "today's bar tallest with a gold glow. Below: stat cards row — 'Total Today: 234', 'Best Streak: 12 days', 'Total All Time: 4,821'. "
            "Each stat in an ivory rounded card with royal blue text. "
            "Below: calendar heatmap view with gold dots for completed days. "
            "Caption overlay: 'See your progress. Stay consistent.' in bold ivory at top. "
            "Clean dark navy UI, professional App Store screenshot style."
        ),
        "aspect_ratio": "9:16",
        "resolution": "2K"
    },
    {
        "filename": "05_reminders.png",
        "prompt": (
            "App Store marketing screenshot, iPhone 15 Pro showing an Islamic dhikr app smart reminders settings screen. "
            "Royal blue background. Toggle rows: 'Daily Reminder 9:00 PM' toggled on in gold. "
            "'Smart Nudges' section with times 1:00 PM, 5:30 PM, 8:30 PM — pauses automatically when goal is met. "
            "'Prayer Time Reminders' section listing Fajr 5:30, Dhuhr 1:10, Asr 4:30, Maghrib 7:20, Isha 8:45, each with a small toggle. "
            "Ivory text on dark navy cards, gold toggles. "
            "Caption overlay: 'Never miss a moment of remembrance.' in bold ivory at top. "
            "Professional App Store screenshot, clean UI, subtle gold accents."
        ),
        "aspect_ratio": "9:16",
        "resolution": "2K"
    },
]

def curl_post(url, payload):
    result = subprocess.run(
        ["curl", "-s", "-X", "POST", url,
         "-H", "Content-Type: application/json",
         "-H", f"Authorization: Bearer {auth_token}",
         "-d", json.dumps(payload)],
        capture_output=True, text=True, check=True
    )
    parsed = json.loads(result.stdout)
    if "detail" in parsed:
        raise RuntimeError(f"API error: {parsed['detail']}")
    return parsed

def curl_download(url, path):
    subprocess.run(["curl", "-s", "-L", "-o", path, url], check=True)

def create_task(prompt, aspect_ratio, resolution):
    payload = {
        "model": "fal-ai/nano-banana-2",
        "params": {
            "prompt": prompt,
            "num_images": 1,
            "aspect_ratio": aspect_ratio,
            "resolution": resolution,
            "output_format": "png",
            "safety_tolerance": "4"
        }
    }
    result = curl_post(f"{BASE_URL}/tasks/create", payload)
    return result["data"]["task_id"]

def poll_task(task_id, timeout=240):
    start = time.time()
    while time.time() - start < timeout:
        result = curl_post(f"{BASE_URL}/tasks/query", {"task_id": task_id})
        data = result["data"]
        status = data["status"]
        if status in ("completed", "success"):
            return data["output"]["images"][0]["url"]
        elif status in ("failed", "error"):
            raise RuntimeError(f"Task failed: {data.get('error')}")
        print(f"  [{task_id[:12]}] status={status}, waiting...")
        time.sleep(4)
    raise TimeoutError(f"Task {task_id} timed out")

def download(url, path):
    curl_download(url, path)
    size = os.path.getsize(path)
    print(f"  Saved -> {os.path.basename(path)} ({size//1024} KB)")

if __name__ == "__main__":
    # Submit all tasks first
    tasks = []
    for s in SCREENSHOTS:
        print(f"Submitting: {s['filename']}...")
        task_id = create_task(s["prompt"], s["aspect_ratio"], s["resolution"])
        tasks.append((s, task_id))
        print(f"  task_id={task_id}")

    # Poll and download
    for s, task_id in tasks:
        print(f"\nPolling: {s['filename']} ({task_id[:12]})...")
        try:
            img_url = poll_task(task_id)
            print(f"  URL: {img_url[:80]}...")
            out_path = os.path.join(OUT_DIR, s["filename"])
            download(img_url, out_path)
        except Exception as e:
            print(f"  ERROR: {e}")

    print("\nDone.")
