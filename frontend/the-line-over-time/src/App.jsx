import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import GameChart from './GameCharts';

function LeagueSelector() {
  const leagues = ["MLB", "NBA", "NHL"];
  const navigate = useNavigate();
  return (
    <div>
      <h2>Select a League</h2>
      {leagues.map(league => (
        <button key={league} onClick={() => navigate(`/league/${league}`)}>
          {league}
        </button>
      ))}
    </div>
  );
}

function GameList({ league }) {
  const [games, setGames] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    fetch("/sortedbutjson.json")
      .then(res => res.json())
      .then(data => setGames(data.filter(game => game.League === league)));
  }, [league]);
  return (
    <div>
      <h2>{league} Games</h2>
      {games.map((game, idx) => (
        <button
          key={idx}
          style={{ display: "block", margin: "8px 0" }}
          onClick={() => navigate(`/league/${league}/game/${idx}`)}
        >
          {game.Teams} — {new Date(game.GameTime).toLocaleString()}
        </button>
      ))}
    </div>
  );
}

function parseHistory(historyStr) {
  return historyStr.split(";").filter(Boolean).map(entry => {
    const timeMatch = entry.match(/\[(.*?)\]/);
    const time = timeMatch ? timeMatch[1] : "";
    const moneyline = Number(entry.match(/Moneyline: ([+-]?\d+|N\/A)/)?.[1]);
    const spread = entry.match(/Spread: ([+-]?\d+(\.\d+)?|N\/A)/)?.[1];
    const spreadOdds = Number(entry.match(/SpreadOdds: ([+-]?\d+|N\/A)/)?.[1]);
    const total = entry.match(/Total: O ([+-]?\d+(\.\d+)?|N\/A)/)?.[1];
    const totalOdds = Number(entry.match(/TotalOdds: ([+-]?\d+|N\/A)/)?.[1]);
    return {
      time,
      moneyline: isNaN(moneyline) ? null : moneyline,
      spread: spread === "N/A" ? null : Number(spread),
      spreadOdds: isNaN(spreadOdds) ? null : spreadOdds,
      total: total === "N/A" ? null : Number(total),
      totalOdds: isNaN(totalOdds) ? null : totalOdds,
    };
  });
}


function GameDetail() {
  const { league, gameIdx } = useParams();
  const [game, setGame] = useState(null);

  useEffect(() => {
    fetch("/sortedbutjson.json")
      .then(res => res.json())
      .then(data => {
        const games = data.filter(g => g.League === league);
        setGame(games[gameIdx]);
      });
  }, [league, gameIdx]);

  if (!game) return <div>Loading...</div>;

  const chartData = parseHistory(game.History);

  return (
    <div>
      <h2>{game.Teams}</h2>
      <GameChart data={chartData} />
      <pre>{game.History}</pre>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LeagueSelector />} />
        <Route path="/league/:league" element={<LeaguePage />} />
        <Route path="/league/:league/game/:gameIdx" element={<GameDetail />} />
      </Routes>
    </Router>
  );
}

function LeaguePage() {
  const { league } = useParams();
  return <GameList league={league} />;
}

export default App;