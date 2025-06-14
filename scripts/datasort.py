import csv
import re
from datetime import datetime, timezone

INPUT = '../data/linedata.csv'
OUTPUT = '../data/sorteddata.csv'

def parse_line(line):
    pattern = (
        r"(\w+), Timestamp: ([^,]+, [^,]+), Teams: ([^,]+), Gametime: ([^,]+), "
        r"Spread: ([^,]+), SpreadOdds: ([^,]+), Moneyline: ([^,]+), "
        r"O/U: ([^,]+), O/U Odds: ([^\n\r]+)"
    )
    match = re.match(pattern, line.strip())
    if not match:
        return None
    league, date_time_recorded, teams, gametime, spread, spread_odds, moneyline, total, total_odds = match.groups()
    try:
        date_recorded, time_recorded = [x.strip() for x in date_time_recorded.split(',', 1)]
    except Exception:
        date_recorded, time_recorded = date_time_recorded, ""
    return {
        'League': league.strip(),
        'DateRecorded': date_recorded,
        'TimeRecorded': time_recorded,
        'Teams': teams.strip(),
        'GameTime': gametime.strip(),
        'Spread': spread.strip(),
        'SpreadOdds': spread_odds.strip(),
        'Moneyline': moneyline.strip(),
        'Total': total.strip(),
        'TotalOdds': total_odds.strip()
    }

def parse_game_time(game_time):
    try:
        if game_time and game_time != "N/A":
            dt = datetime.fromisoformat(game_time.replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
    except Exception:
        pass
    return datetime.min.replace(tzinfo=timezone.utc)

games = {}

with open(INPUT, encoding='utf-8') as infile:
    for line in infile:
        if not line.strip() or line.startswith("//") or line.startswith("DateRecorded") or line.startswith("League"):
            continue
        parsed = parse_line(line)
        if not parsed:
            continue
        league = parsed['League']
        teams = (parsed['Teams'])
        gametime = parsed['GameTime']
        datapoint = {
            'DateRecorded': parsed['DateRecorded'],
            'TimeRecorded': parsed['TimeRecorded'],
            'Moneyline': parsed['Moneyline'],
            'Spread': parsed['Spread'],
            'SpreadOdds': parsed['SpreadOdds'],
            'Total': parsed['Total'],
            'TotalOdds': parsed['TotalOdds']
        }

        if gametime != "N/A":
            na_key = (league, "N/A", teams)
            real_key = (league, gametime, teams)
            if na_key in games:
                if real_key not in games:
                    games[real_key] = {
                        'League': league,
                        'GameTime': gametime,
                        'Teams': teams,
                        'History': games[na_key]['History']
                    }
                else:
                    games[real_key]['History'].extend(games[na_key]['History'])
                del games[na_key]
            # Now add/update the real key
            if real_key not in games:
                games[real_key] = {
                    'League': league,
                    'GameTime': gametime,
                    'Teams': teams,
                    'History': []
                }
            games[real_key]['History'].append(datapoint)
        else:
            na_key = (league, "N/A", teams)
            if na_key not in games:
                games[na_key] = {
                    'League': league,
                    'GameTime': "N/A",
                    'Teams': teams,
                    'History': []
                }
            games[na_key]['History'].append(datapoint)


def game_sort_key(g):
    dt = parse_game_time(g['GameTime'])
    date = dt.date() if dt != datetime.min.replace(tzinfo=dt.tzinfo) else datetime.min.date()
    return (g['League'], date, dt, g['Teams'])

sorted_games = sorted(
    games.values(),
    key=game_sort_key
)

with open(OUTPUT, 'w', newline='', encoding='utf-8') as outfile:
    fieldnames = [
        'League', 'GameTime', 'Teams', 'History'
    ]
    writer = csv.DictWriter(outfile, fieldnames=fieldnames)
    writer.writeheader()
    last_league = None
    for game in sorted_games:
        if last_league is not None and game['League'] != last_league:
            outfile.write('\n')
        last_league = game['League']
        history_str = ""
        for dp in game['History']:
            try:
                dt = datetime.strptime(dp['DateRecorded'], "%m/%d/%Y")
                date_str = dt.strftime("%m/%d/%Y")
            except Exception:
                date_str = dp['DateRecorded']
            history_str += (
                f"[{date_str} {dp['TimeRecorded']}] "
                f"Moneyline: {dp['Moneyline']} | Spread: {dp['Spread']} | SpreadOdds: {dp['SpreadOdds']} | "
                f"Total: {dp['Total']} | TotalOdds: {dp['TotalOdds']}; "
            )
        game['History'] = history_str.strip()
        writer.writerow(game)