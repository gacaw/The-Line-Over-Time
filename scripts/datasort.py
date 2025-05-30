import csv
import re
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

def parse_game_time(game_time):
    from datetime import timezone
    try:
        if game_time:
            dt = datetime.fromisoformat(game_time.replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
    except Exception:
        pass
    return datetime.min.replace(tzinfo=timezone.utc)

current_game_time = None
games = {}

with open(INPUT, newline='', encoding='utf-8') as infile:
    reader = csv.DictReader(infile)
    for row in reader:
        teams_raw = row['Teams'].strip()
        if teams_raw.startswith('More wagers'):
            dt = row.get('DateTime', '').strip()
            if dt:
                current_game_time = dt
            continue
        if teams_raw.startswith('same game'):
            continue

        date_recorded = row['DateRecorded'].strip()
        time_recorded = row['TimeRecorded'].strip()
        total = row['Total'].strip()
        total_odds = row['TotalOdds'].strip()
        moneyline = row.get('Moneyline', '').strip()
        spread = row.get('Spread', '').strip()
        spread_odds = row.get('SpreadOdds', '').strip()

        team1, team2 = parse_teams(teams_raw)
        pitcher1, pitcher2 = parse_pitchers(teams_raw)
        sport = detect_sport(teams_raw)
        game_time = current_game_time if current_game_time else ""

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

# Sort games by sport, then by game time
sorted_games = sorted(
    games.values(),
    key=lambda g: (g['Sport'], parse_game_time(g['GameTime']))
)

with open(OUTPUT, 'w', newline='', encoding='utf-8') as outfile:
    fieldnames = [
        'GameTime', 'Sport', 'Teams', 'Pitchers', 'History'
    ]
    writer = csv.DictWriter(outfile, fieldnames=fieldnames)
    writer.writeheader()
    last_sport = None
    for game in sorted_games:
        if last_sport is not None and game['Sport'] != last_sport:
            writer.writerow({fn: "" for fn in fieldnames})
        last_sport = game['Sport']
        history_str = ""
        for dp in game['History']:
            history_str += (
                f"[{dp['DateRecorded']} {dp['TimeRecorded']}] "
                f"Moneyline: {dp['Moneyline']} | Spread: {dp['Spread']} | SpreadOdds: {dp['SpreadOdds']} | "
                f"Total: {dp['Total']} | TotalOdds: {dp['TotalOdds']}; "
            )
        game['History'] = history_str.strip()
        writer.writerow(game)