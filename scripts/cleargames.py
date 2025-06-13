import csv
from datetime import datetime, timezone, timedelta

INPUT = '../data/sorteddata.csv'
OUTPUT = '../data/sorteddata.csv'

def is_recent_game(game_time_str):
    if not game_time_str or game_time_str == "N/A":
        return True
    try:
        dt = datetime.fromisoformat(game_time_str.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        return dt >= now - timedelta(days=14)
    except Exception:
        return True

with open(INPUT, encoding='utf-8', newline='') as infile, \
     open(OUTPUT, 'w', encoding='utf-8', newline='') as outfile:
    reader = csv.DictReader(infile)
    writer = csv.DictWriter(outfile, fieldnames=reader.fieldnames)
    writer.writeheader()
    for row in reader:
        if is_recent_game(row['GameTime']):
            writer.writerow(row)

print("Old games purged.")