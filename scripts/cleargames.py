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

with open(INPUT, encoding='utf-8', newline='') as infile:
    # Read the first line to check for headers
    first_line = infile.readline()
    if not first_line.strip():
        print("Input file is empty. Nothing to purge.")
    else:
        infile.seek(0)
        reader = csv.DictReader(infile)
        if not reader.fieldnames:
            print("No header found in input file. Nothing to purge.")
        else:
            with open(OUTPUT, 'w', encoding='utf-8', newline='') as outfile:
                writer = csv.DictWriter(outfile, fieldnames=reader.fieldnames)
                writer.writeheader()
                for row in reader:
                    if is_recent_game(row['GameTime']):
                        writer.writerow(row)
            print("Old games purged.")