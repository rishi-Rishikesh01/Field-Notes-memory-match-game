import React, { useState, useEffect, useRef, useCallback } from 'react'

const SPECIMENS = [
  { symbol: '🦋', label: 'Monarch' },
  { symbol: '🍄', label: 'Morel' },
  { symbol: '🌿', label: 'Basil' },
  { symbol: '🐌', label: 'Snail' },
  { symbol: '🪲', label: 'Beetle' },
  { symbol: '🌾', label: 'Wheat' },
  { symbol: '🍂', label: 'Maple Leaf' },
  { symbol: '🐝', label: 'Honeybee' },
  { symbol: '🐞', label: 'Ladybird' },
  { symbol: '🍀', label: 'Clover' },
  { symbol: '🌸', label: 'Wild Rose' },
  { symbol: '🐛', label: 'Caterpillar' },
]

const DIFFICULTIES = {
  easy: { key: 'easy', name: 'Easy', cols: 4, pairs: 6 },
  medium: { key: 'medium', name: 'Medium', cols: 4, pairs: 8 },
  hard: { key: 'hard', name: 'Hard', cols: 6, pairs: 12 },
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildDeck(difficulty) {
  const config = DIFFICULTIES[difficulty]
  const chosen = shuffle(SPECIMENS).slice(0, config.pairs)
  const deck = shuffle([...chosen, ...chosen]).map((specimen, i) => ({
    id: i,
    symbol: specimen.symbol,
    label: specimen.label,
    flipped: false,
    matched: false,
  }))
  return deck
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function readBest(difficulty) {
  try {
    const raw = localStorage.getItem(`field-notes-best-${difficulty}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeBest(difficulty, entry) {
  try {
    localStorage.setItem(`field-notes-best-${difficulty}`, JSON.stringify(entry))
  } catch {
    /* localStorage unavailable — ignore */
  }
}

export default function App() {
  const [screen, setScreen] = useState('menu') // menu | playing | won
  const [difficulty, setDifficulty] = useState('medium')
  const [cards, setCards] = useState([])
  const [flippedIds, setFlippedIds] = useState([])
  const [isChecking, setIsChecking] = useState(false)
  const [moves, setMoves] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [bestByDifficulty, setBestByDifficulty] = useState({})
  const [isNewBest, setIsNewBest] = useState(false)

  const timerRef = useRef(null)

  useEffect(() => {
    const all = {}
    Object.keys(DIFFICULTIES).forEach((k) => {
      all[k] = readBest(k)
    })
    setBestByDifficulty(all)
  }, [])

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [isRunning])

  const startGame = useCallback((diff) => {
    setDifficulty(diff)
    setCards(buildDeck(diff))
    setFlippedIds([])
    setIsChecking(false)
    setMoves(0)
    setSeconds(0)
    setIsRunning(false)
    setIsNewBest(false)
    setScreen('playing')
  }, [])

  const restart = useCallback(() => startGame(difficulty), [startGame, difficulty])

  const backToMenu = useCallback(() => {
    clearInterval(timerRef.current)
    setIsRunning(false)
    setScreen('menu')
  }, [])

  const handleCardClick = (id) => {
    if (isChecking) return
    const card = cards.find((c) => c.id === id)
    if (!card || card.flipped || card.matched) return
    if (flippedIds.length >= 2) return

    if (!isRunning) setIsRunning(true)

    const nextCards = cards.map((c) => (c.id === id ? { ...c, flipped: true } : c))
    const nextFlipped = [...flippedIds, id]
    setCards(nextCards)
    setFlippedIds(nextFlipped)

    if (nextFlipped.length === 2) {
      setIsChecking(true)
      setMoves((m) => m + 1)
      const [firstId, secondId] = nextFlipped
      const first = nextCards.find((c) => c.id === firstId)
      const second = nextCards.find((c) => c.id === secondId)
      const isMatch = first.symbol === second.symbol

      setTimeout(() => {
        setCards((prev) =>
          prev.map((c) => {
            if (c.id === firstId || c.id === secondId) {
              return isMatch ? { ...c, matched: true } : { ...c, flipped: false }
            }
            return c
          })
        )
        setFlippedIds([])
        setIsChecking(false)
      }, isMatch ? 500 : 900)
    }
  }

  // check for win
  useEffect(() => {
    if (screen !== 'playing') return
    if (cards.length === 0) return
    if (cards.every((c) => c.matched)) {
      setIsRunning(false)
      clearInterval(timerRef.current)

      const finalMoves = moves
      const finalSeconds = seconds
      const prevBest = bestByDifficulty[difficulty]
      let newBest = false
      if (!prevBest || finalSeconds < prevBest.seconds || (finalSeconds === prevBest.seconds && finalMoves < prevBest.moves)) {
        newBest = true
        const entry = { moves: finalMoves, seconds: finalSeconds }
        writeBest(difficulty, entry)
        setBestByDifficulty((prev) => ({ ...prev, [difficulty]: entry }))
      }
      setIsNewBest(newBest)
      setScreen('won')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards])

  const config = DIFFICULTIES[difficulty]

  return (
    <div className="app">
      <header className="masthead">
        <span className="eyebrow">Field Notes</span>
        <h1 className="title">
          Memory <em>Match</em>
        </h1>
        <p className="subtitle">
          Sixteen specimens, eight pairs, one collector's eye. Turn two cards at a time
          and log every match before the notebook is complete.
        </p>
      </header>

      {screen === 'menu' && (
        <MenuScreen
          bestByDifficulty={bestByDifficulty}
          onSelect={startGame}
        />
      )}

      {screen === 'playing' && (
        <>
          <StatBar
            moves={moves}
            time={formatTime(seconds)}
            best={bestByDifficulty[difficulty]}
            onRestart={restart}
            onMenu={backToMenu}
          />
          <div className="board-wrap">
            <div
              className="board"
              style={{ gridTemplateColumns: `repeat(${config.cols}, 1fr)` }}
            >
              {cards.map((card) => (
                <Card key={card.id} card={card} onClick={() => handleCardClick(card.id)} />
              ))}
            </div>
          </div>
        </>
      )}

      {screen === 'won' && (
        <WinOverlay
          moves={moves}
          time={formatTime(seconds)}
          isNewBest={isNewBest}
          onRestart={restart}
          onMenu={backToMenu}
        />
      )}
    </div>
  )
}

function MenuScreen({ bestByDifficulty, onSelect }) {
  return (
    <div className="menu-card">
      <div className="menu-label">Choose a difficulty</div>
      <div className="difficulty-grid">
        {Object.values(DIFFICULTIES).map((d) => {
          const best = bestByDifficulty[d.key]
          return (
            <button key={d.key} className="difficulty-btn" onClick={() => onSelect(d.key)}>
              <span className="d-name">{d.name}</span>
              <span className="d-sub">{d.pairs} pairs · {d.pairs * 2} cards</span>
              <span className="d-best">
                {best ? `Best · ${formatTime(best.seconds)} / ${best.moves} moves` : 'No record yet'}
              </span>
            </button>
          )
        })}
      </div>
      <div className="specimen-strip" aria-hidden="true">
        {SPECIMENS.map((s) => (
          <span key={s.label}>{s.symbol}</span>
        ))}
      </div>
    </div>
  )
}

function StatBar({ moves, time, best, onRestart, onMenu }) {
  return (
    <div className="stat-bar">
      <div className="stat-pill">
        <div className="s-label">Moves</div>
        <div className="s-value">{moves}</div>
      </div>
      <div className="stat-pill">
        <div className="s-label">Time</div>
        <div className="s-value">{time}</div>
      </div>
      <div className="stat-pill">
        <div className="s-label">Best</div>
        <div className="s-value">{best ? formatTime(best.seconds) : '—:—'}</div>
      </div>
      <button className="icon-btn ghost" onClick={onMenu}>Change</button>
      <button className="icon-btn" onClick={onRestart}>Restart</button>
    </div>
  )
}

function Card({ card, onClick }) {
  const stateClass = card.matched ? 'is-matched' : card.flipped ? 'is-flipped' : ''
  return (
    <div className="card-slot">
      <div
        className={`card ${stateClass}`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={card.flipped || card.matched ? card.label : 'Face-down specimen card'}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
          }
        }}
      >
        <div className="card-face card-back-face" />
        <div className="card-face card-front-face">
          <span className="card-symbol">{card.symbol}</span>
          <span className="card-label">{card.label}</span>
        </div>
      </div>
    </div>
  )
}

function WinOverlay({ moves, time, isNewBest, onRestart, onMenu }) {
  return (
    <div className="overlay">
      <div className="win-card">
        <span className="stamp">Collection Complete</span>
        <h2 className="win-title">Well matched.</h2>
        <p className="win-sub">Every specimen found and logged.</p>
        {isNewBest && <div className="new-best">★ New best record</div>}
        <div className="win-stats">
          <div className="stat-pill">
            <div className="s-label">Moves</div>
            <div className="s-value">{moves}</div>
          </div>
          <div className="stat-pill">
            <div className="s-label">Time</div>
            <div className="s-value">{time}</div>
          </div>
        </div>
        <div className="win-actions">
          <button className="icon-btn ghost" onClick={onMenu}>Change level</button>
          <button className="icon-btn" onClick={onRestart}>Play again</button>
        </div>
      </div>
    </div>
  )
}
