import csv
import re
from collections import defaultdict
from datetime import datetime

INPUT = '../data/linedata.csv'
OUTPUT = '../data/sorteddata.csv'

def parse_teams(teams_str):
    teams = re.findall(r'[A-Z][a-zA-Z .&-]+', teams_str)
    if len(teams) >= 2:
        return teams[0].strip(), teams[1].strip()
    return teams_str.strip(), ""

def parse_pitchers(teams_str):
    pitchers = re.findall(r'[A-Z] [A-Z][a-z-]+', teams_str)
    if len(pitchers) >= 2:
        return pitchers[0].strip(), pitchers[1].strip()
    return "N/A", "N/A"

def detect_sport(teams_str):
    if re.search(r'[A-Z] [A-Z][a-z-]+', teams_str):
        return "Baseball"
    elif "Oilers" in teams_str or "Stars" in teams_str:
        return "Ice Hockey"
    else:
        return "Basketball"

def parse_datetime(dt_str):
    try:
        return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    except Exception:
        return None

games = {}

with open(INPUT, newline='', encoding='utf-8') as infile:
    reader = csv.DictReader(infile)
    for row in reader:
        if not row['Teams'] or row['Teams'].startswith('More wagers') or row['Teams'].startswith('same game'):
            continue

        date_recorded = row['DateRecorded'].strip()
        time_recorded = row['TimeRecorded'].strip()
        teams_raw = row['Teams'].strip()
        game_time = row['DateTime'].strip()
        total = row['Total'].strip()
        total_odds = row['TotalOdds'].strip()
        moneyline = row.get('Moneyline', '').strip()
        spread = row.get('Spread', '').strip()
        spread_odds = row.get('SpreadOdds', '').strip()

        team1, team2 = parse_teams(teams_raw)
        pitcher1, pitcher2 = parse_pitchers(teams_raw)
        sport = detect_sport(teams_raw)
        game_key = (game_time, sport, team1, team2)

        datapoint = {
            'DateRecorded': date_recorded,
            'TimeRecorded': time_recorded,
            'Moneyline': moneyline,
            'Spread': spread,
            'Total': total,
            'TotalOdds': total_odds,
            'SpreadOdds': spread_odds
        }

        if game_key not in games:
            games[game_key] = {
                'GameTime': game_time,
                'Sport': sport,
                'Teams': f"{team1} & {team2}",
                'Pitchers': f"{pitcher1} | {pitcher2}" if pitcher1 != "N/A" else "N/A",
                'History': []
            }
        games[game_key]['History'].append(datapoint)

with open(OUTPUT, 'w', newline='', encoding='utf-8') as outfile:
    fieldnames = [
        'GameTime', 'Sport', 'Teams', 'Pitchers', 'History'
    ]
    writer = csv.DictWriter(outfile, fieldnames=fieldnames)
    writer.writeheader()
    for game in games.values():
        history_str = ""
        for dp in game['History']:
            history_str += (
                f"[{dp['DateRecorded']} {dp['TimeRecorded']}] "
                f"Moneyline: {dp['Moneyline']} | Spread: {dp['Spread']} | SpreadOdds: {dp['SpreadOdds']} | "
                f"Total: {dp['Total']} | TotalOdds: {dp['TotalOdds']}; "
            )
        game['History'] = history_str.strip()
        writer.writerow(game)