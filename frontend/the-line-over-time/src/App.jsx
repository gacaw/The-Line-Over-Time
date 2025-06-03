import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";

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
          {game.Teams}
        </button>
      ))}
    </div>
  );
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

  return (
    <div>
      <h2>{game.Teams}</h2>
      <pre>{game.History}</pre>
      {/* graph spot */}
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
        {/* add game stuff later */}
      </Routes>
    </Router>
  );
}

function LeaguePage() {
  const { league } = useParams();
  return <GameList league={league} />;
}

export default App;