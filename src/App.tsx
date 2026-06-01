import { useEffect, useRef, useState } from 'react'
import { ChoiceButton } from './components/ChoiceButton'
import { TimerRing } from './components/TimerRing'
import { getItemForLevel, getTimeForLevel, makeChoices } from './gameData'
import type { GameItem } from './types'

const STORAGE_KEY = 'call-me-sharmaine-best-level'
const BGM_SRC = `${import.meta.env.BASE_URL}assets/sharmaine-bgm.mp3`
const TIME_TIERS = [
  { label: 'Level 1-5', time: 5, tone: 'lime' },
  { label: 'Level 6-10', time: 4, tone: 'green' },
  { label: 'Level 11-15', time: 3, tone: 'gold' },
  { label: 'Level 16-20', time: 2, tone: 'red' },
  { label: 'Level 21-25', time: 1, tone: 'pink' },
]

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export default function App() {
  const [bestLevel, setBestLevel] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? Number(stored) : 0
  })
  const [status, setStatus] = useState<'start' | 'playing' | 'correct' | 'gameover' | 'complete'>('start')
  const [level, setLevel] = useState(1)
  const [streak, setStreak] = useState(0)
  const [currentItem, setCurrentItem] = useState<GameItem>(() => getItemForLevel(1))
  const [choices, setChoices] = useState<string[]>(() => makeChoices(currentItem))
  const [secondsLeft, setSecondsLeft] = useState(() => getTimeForLevel(1))
  const [isPaused, setIsPaused] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [actionDisabled, setActionDisabled] = useState(false)
  const correctTimeout = useRef<number | null>(null)
  const bgmRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  const playBgm = () => {
    const bgm = bgmRef.current
    if (!bgm || !bgm.paused) return

    bgm.volume = 0.18
    void bgm.play().catch(() => {
      // Browsers may block autoplay until Play Now is clicked.
    })
  }

  const getAudioContext = () => {
    const audioWindow = window as typeof window & {
      webkitAudioContext?: typeof AudioContext
    }
    const AudioContextConstructor = audioWindow.AudioContext || audioWindow.webkitAudioContext
    if (!AudioContextConstructor) return null

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextConstructor()
    }

    if (audioContextRef.current.state === 'suspended') {
      void audioContextRef.current.resume()
    }

    return audioContextRef.current
  }

  const playTone = (frequency: number, start: number, duration: number, type: OscillatorType, volume: number) => {
    const audioContext = getAudioContext()
    if (!audioContext) return

    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, start)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    oscillator.connect(gain)
    gain.connect(audioContext.destination)
    oscillator.start(start)
    oscillator.stop(start + duration + 0.03)
  }

  const playCorrectSound = () => {
    const audioContext = getAudioContext()
    if (!audioContext) return

    const now = audioContext.currentTime
    playTone(660, now, 0.12, 'sine', 0.12)
    playTone(880, now + 0.09, 0.13, 'sine', 0.13)
    playTone(1320, now + 0.19, 0.18, 'triangle', 0.1)
  }

  const playWrongSound = () => {
    const audioContext = getAudioContext()
    if (!audioContext) return

    const now = audioContext.currentTime
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()
    oscillator.type = 'sawtooth'
    oscillator.frequency.setValueAtTime(210, now)
    oscillator.frequency.exponentialRampToValueAtTime(82, now + 0.34)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38)
    oscillator.connect(gain)
    gain.connect(audioContext.destination)
    oscillator.start(now)
    oscillator.stop(now + 0.42)
  }

  useEffect(() => {
    return () => {
      if (correctTimeout.current) {
        window.clearTimeout(correctTimeout.current)
      }
    }
  }, [])

  useEffect(() => {
    playBgm()
  }, [])

  useEffect(() => {
    if (status !== 'playing' || isPaused) return
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval)
          handleGameOver("Time's up!")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [status, isPaused])

  useEffect(() => {
    if (level > bestLevel) {
      setBestLevel(level)
      localStorage.setItem(STORAGE_KEY, String(level))
    }
  }, [level, bestLevel])

  const startNewGame = () => {
    playBgm()
    getAudioContext()
    const item = getItemForLevel(1)
    setCurrentItem(item)
    setChoices(makeChoices(item))
    setLevel(1)
    setStreak(0)
    setSecondsLeft(getTimeForLevel(1))
    setSelectedAnswer(null)
    setMessage('')
    setIsPaused(false)
    setActionDisabled(false)
    setStatus('playing')
  }

  const handleGameOver = (detail: string, selected?: string) => {
    playWrongSound()
    setStatus('gameover')
    setMessage(detail)
    setSelectedAnswer(selected ?? null)
    setIsPaused(true)
    setActionDisabled(true)
  }

  const handleChoice = (choice: string) => {
    if (status !== 'playing' || actionDisabled) return
    setActionDisabled(true)
    setSelectedAnswer(choice)

    if (choice === currentItem.memeName) {
      playCorrectSound()
      if (level === 26) {
        setStreak((prev) => prev + 1)
        setStatus('complete')
        setIsPaused(true)
        setActionDisabled(true)
        return
      }

      setStatus('correct')
      setIsPaused(true)
      correctTimeout.current = window.setTimeout(() => {
        const nextLevel = level + 1
        const nextItem = getItemForLevel(nextLevel, currentItem.id)
        setLevel(nextLevel)
        setStreak((prev) => prev + 1)
        setCurrentItem(nextItem)
        setChoices(makeChoices(nextItem))
        setSecondsLeft(getTimeForLevel(nextLevel))
        setStatus('playing')
        setIsPaused(false)
        setSelectedAnswer(null)
        setActionDisabled(false)
      }, 600)
      return
    }

    handleGameOver(`You clicked: ${choice}`, choice)
  }

  const handlePauseToggle = () => {
    if (status !== 'playing') return
    setIsPaused((prev) => !prev)
  }

  const isSurpriseTeaser = level >= 26
  const totalTime = getTimeForLevel(level)
  const safeSeconds = clamp(secondsLeft, 0, totalTime)
  const correctImage = currentItem.variants[1] ?? currentItem.image
  const wrongImage = currentItem.variants[2] ?? currentItem.image

  return (
    <main className="app-shell">
      <audio ref={bgmRef} src={BGM_SRC} loop autoPlay preload="auto" />
      <div className="game-frame">
        <header className="top-bar">
          <div className="top-stat">
            <span className="stat-icon" aria-hidden="true">&#127942;</span>
            <span className="top-label">Best Level</span>
            <strong>{bestLevel}</strong>
          </div>

          <div className="level-badge">
            <span>Level</span>
            <strong>{level}</strong>
          </div>

          <div className="top-actions">
            <div className="top-stat top-stat--small">
              <span className="top-label">Streak</span>
              <strong>{streak} <span aria-hidden="true">&#128293;</span></strong>
            </div>
            <button type="button" className="icon-button" onClick={handlePauseToggle} aria-label="Pause game">
              {isPaused ? '>' : 'II'}
            </button>
          </div>
        </header>

        {status === 'start' ? (
          <section className="start-screen">
            <div className="title-shell">
              <span className="title-crown" aria-hidden="true">&#9819;</span>
              <h1>Call Me Sharmaine</h1>
              <p>Don't click what it is. Click what it wants to be.</p>
            </div>
            <button type="button" className="action-button action-button--primary" onClick={startNewGame}>
              Play Now
            </button>
          </section>
        ) : (
          <section className="game-stage">
            <div className="scene-card">
              <div className="time-pill" aria-live="polite">
                <span aria-hidden="true">&#9201;</span>
                <strong>{safeSeconds}.0s</strong>
              </div>
              <TimerRing current={safeSeconds} total={totalTime} />
              <div className={`object-card object-card--${currentItem.id}`}>
                <img src={currentItem.image} alt={currentItem.realName} />
              </div>
            </div>
            <div className="prompt-copy">
              <span>What's its new name?</span>
            </div>

            {isSurpriseTeaser && (
              <div className="teaser-banner">&#128274; Surprise fruits unlocked soon!</div>
            )}

            <div className="choices-grid">
              {choices.map((choice, index) => (
                <ChoiceButton
                  key={choice}
                  label={choice}
                  tone={index}
                  onSelect={() => handleChoice(choice)}
                  disabled={actionDisabled || status !== 'playing' || isPaused}
                  isSelected={selectedAnswer === choice}
                />
              ))}
            </div>

            <section className="speed-guide" aria-label="Time gets faster by level">
              <h2>Time Gets Faster!</h2>
              <div className="speed-grid">
                {TIME_TIERS.map((tier) => (
                  <div className={`speed-tier speed-tier--${tier.tone}`} key={tier.label}>
                    <span>{tier.label}</span>
                    <strong>{tier.time}</strong>
                    <small>sec</small>
                  </div>
                ))}
                <div className="speed-tier speed-tier--lock">
                  <span>Level 26+</span>
                  <strong>&#128274;</strong>
                  <small>surprise fruits</small>
                </div>
              </div>
            </section>
          </section>
        )}

        {status === 'correct' && (
          <div className="popup popup--correct">
            <div className="popup-inner">
              <img className={`popup-art popup-art--image popup-art--${currentItem.id}`} src={correctImage} alt="" aria-hidden="true" />
              <span className="popup-tag">Correct!</span>
              <strong>Call me {currentItem.memeName}!</strong>
              <p className="popup-line">Next Level {level + 1}</p>
            </div>
          </div>
        )}

        {status === 'complete' && (
          <div className="popup popup--complete">
            <div className="popup-inner popup-inner--wide">
              <img className={`popup-art popup-art--image popup-art--${currentItem.id}`} src={currentItem.image} alt="" aria-hidden="true" />
              <span className="popup-tag">Correct!</span>
              <strong>Call me {currentItem.memeName}!</strong>
              <p className="popup-line">Next level coming soon.</p>
              <div className="popup-buttons">
                <button type="button" className="action-button" onClick={startNewGame}>
                  Play Again
                </button>
                <button type="button" className="action-button action-button--secondary" onClick={() => setStatus('start')}>
                  Home
                </button>
              </div>
            </div>
          </div>
        )}

        {status === 'gameover' && (
          <div className="popup popup--gameover">
            <div className="popup-inner popup-inner--wide">
              <img className={`popup-art popup-art--image popup-art--${currentItem.id}`} src={wrongImage} alt="" aria-hidden="true" />
              <h2>Wrong!</h2>
              <p className="popup-line">{message}</p>
              <p className="popup-line">I'm still <strong>{currentItem.realName}</strong></p>
              <p className="popup-line">You reached Level {level}</p>
              <div className="popup-buttons">
                <button type="button" className="action-button" onClick={startNewGame}>
                  Play Again
                </button>
                <button type="button" className="action-button action-button--secondary" onClick={() => setStatus('start')}>
                  Home
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
