import { useState, useEffect, useRef } from 'react'
import Timer from './Timer' 
import Logo from './Logo'
import Scramble from './Scramble'
import Session from './Session'
import PBs from './PBs'
import Popup from './Popup'
import AlgCard from './AlgCard'
import HomePage from './HomePage'
import Progression from './Progression'
import Tutorials from './Tutorials'
import './App.css'

function App() {
    const version = 'v1.2.0-alpha' 
    const [scramble, setScramble] = useState('Loading...')
    const [page, setPage] = useState('home')
    const [algSet, setAlgSet] = useState('PLL')
    const [event, setEvent] = useState('333')
    const [currentSession, setCurrentSession] = useState('My Times')
    const [time, setTime] = useState(() => {
        const saved = localStorage.getItem(currentSession)
        if (saved) {
            return JSON.parse(saved)
        }
        return []
    })
    const [pb, setPb] = useState(() => {
        const savedTimes = localStorage.getItem(currentSession)
        if (!savedTimes) return '-'
        const times = JSON.parse(savedTimes)
        const rawPb = Math.min(...times.map(obj => obj.time))
        return formatTime(rawPb)
    })
    const [showPopup, setShowPopup] = useState(false)
    const [showDelPopup, setShowDelPopup] = useState(false)
    const [addSession, setAddSession] = useState('')
    const [sessions, setSessions] = useState(() => {
        const savedSessions = localStorage.getItem('sessions')
        if (savedSessions) return JSON.parse(savedSessions)
        if (!savedSessions) return ['My Times']
    })
    const nextScrambleRef = useRef(null)
    const isLoadingRef = useRef(false)
    const wakeLockRef = useRef(null)

    async function lockScreen() {
        try {
            if ("wakeLock" in navigator) {
                wakeLockRef.current = await navigator.wakeLock.request("screen")
            }
        } catch (e) {
            
        }
    }
    
    function unlockScreen() {
        if (wakeLockRef.current) {
            wakeLockRef.current.release()
            wakeLockRef.current = null
        }
    }
  
    useEffect(() => {
        async function aLittleAsyncFunction() {
            setScramble('Loading...')
            nextScrambleRef.current = await genScramble()
            setScramble(nextScrambleRef.current)
            nextScrambleRef.current = await genScramble()
        }
        aLittleAsyncFunction()
    }, [event])
  
    useEffect(() => {
        if (isLoadingRef.current) {
            return
        }
        localStorage.setItem(currentSession, JSON.stringify(time))
        findPb(time.map(obj => obj.time))
    }, [time])
    
    useEffect(() => {
        isLoadingRef.current = true
        const saved = localStorage.getItem(currentSession)
        const newTimes = saved ? JSON.parse(saved) : []
        setTime(newTimes)
        findPb(newTimes.map(obj => obj.time))
        isLoadingRef.current = false
    }, [currentSession])
    
    useEffect(() =>{
        localStorage.setItem('sessions', JSON.stringify(sessions))
    }, [sessions])
    
    function formatTime(rawTime) {
        let formatted = ''
        if (!Number.isFinite(rawTime)) {
            formatted = '-'
            return formatted
        }
        let minutes = Math.floor(rawTime / (1000 * 60) % 60)
        let seconds = Math.floor(rawTime / 1000 % 60)
        let ms = Math.floor(rawTime % 1000)

        if (minutes == 0) {
            formatted = `${seconds}.${String(ms).padStart(3, '0')}`
        } else if (minutes >= 1) {
            formatted = `${minutes}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
        }
        return formatted
    }
    
    function handleReset() {
        setShowPopup(false)
        setTime([])
        setPb('-')
    }
    
    function handleStop(newTime) {
        const temporaryTimes = [...time.map(obj => obj.time), newTime]
        let averageOfFive = null
        if (temporaryTimes.length >= 5) {
            averageOfFive = (temporaryTimes.slice(-5).sort((a, b) => a - b).slice(1, 4).reduce((sum, currentTime) => sum + currentTime, 0)) / 3
        }
        const newObj = {
            time: newTime,
            averageOfFive: averageOfFive
        }
        const newTimes = [...time, newObj]
        const onlyTimes = newTimes.map(obj => obj.time)
        setTime(newTimes)
        findPb(onlyTimes)
        preloadScramble()
    }
    
    function handleAddSession() {
        const trimmed = addSession.trim()
        if (!trimmed) return
        if (sessions.includes(trimmed)) return
        setSessions([...sessions, trimmed])
        setCurrentSession(trimmed)
        setAddSession('')
    }
  
    function findPb(newTimes) {
        const rawPb = Math.min(...newTimes)
        setPb(formatTime(rawPb))
    }
    
    function calculateMean() {
        if (time.length === 0) return '-'
        
        const onlyNumbers = time.map(obj => Number(obj.time)).filter(n => Number.isFinite(n))
        if (onlyNumbers.length === 0) return '-'
    
        const sum = onlyNumbers.reduce((a, b) => a + b, 0)
        const meanInMs = sum / onlyNumbers.length
        
        return formatTime(meanInMs)
    }
  
    async function genScramble() {
        const r = await fetch(`/api/scramble?event=${event}`)
        const data = await r.json()
        return data.scramble || "FEHLER: " + data.error
    }
  
    async function preloadScramble() {
        setScramble(nextScrambleRef.current)
        nextScrambleRef.current = await genScramble()
    }

    function getPuzzle() {
        if (event === '222') return '2x2x2'
        if (event === '333') return '3x3x3'
        if (event === '444') return '4x4x4'
        if (event === '555') return '5x5x5'
        if (event === '666') return '6x6x6'
        if (event === '777') return '7x7x7'
        if (event === 'minx') return 'megaminx'
        if (event === 'pyram') return 'pyraminx'
        if (event === 'sq1') return 'square1'
        return event
    }

    function handleDelLast() {
        setTime(previousTimes => previousTimes.slice(0, -1))
    }
    
    lockScreen()
    return (
        <div style={{
            display: 'grid',
            gridTemplateRows: '50px auto',
            backgroundColor: 'black',
            color: 'white',
            width: '100%',
            fontFamily: 'arial',
            height: '100dvh'
        }} translate='no' className='notranslate'>
            {page !== 'home' && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
                    height: 'auto',
                    backgroundColor: 'black',
                    color: 'white',
                    textAlign: 'center',
                    fontSize: '13px',
                    border: 'solid 2px #448888',
                    borderRadius: '2px',
                    gap: '5px',
                    paddingLeft: '5px',
                    paddingRight: '5px'
                }}>
                    <p style={{ textShadow: '0 0 10px #00FFFF, 0 0 20px #00FFFF, 0 0 30px #00FFFF' }} onClick={() => setPage('home')}>Home</p>
                    <p style={{ textShadow: '0 0 10px #01FF24, 0 0 20px #01FF24, 0 0 30px #01FF24' }} onClick={() => setPage('timer')}>Timer</p>
                    <p style={{ textShadow: '0 0 10px #FF0101, 0 0 20px #FF0101, 0 0 30px #FF0101' }} onClick={() => setPage('algorithms')}>Algs</p>
                    <p style={{ textShadow: '0 0 10px #0124FF, 0 0 20px #0124FF, 0 0 30px #0124FF' }} onClick={() => setPage('progression')}>Progression</p>
                    <p style={{ textShadow: '0 0 10px yellow, 0 0 20px yellow, 0 0 30px yellow' }} onClick={() => setPage('tutorials')}>Tutorials</p>
                </div>
            )}
            {page === 'home' && (
                <div style={{
                    textAlign: 'center',
                    backgroundColor: 'black',
                    height: '100dvh'
                }}>
                    <HomePage onTimerClick={() => setPage('timer')} onAlgsClick={() => setPage('algorithms')} onProgressionClick={() => setPage('progression')} onTutorialsClick={() => setPage('tutorials')} version={version} />
                </div>
            )}
            {page === 'timer' && (
                <div onContextMenu={(e) => e.preventDefault()} style={{
                    backgroundColor: 'black',
                    color: 'white',
                    height: 'auto',
                    display: 'grid',
                    gridTemplateRows: 'auto 1fr auto',
                    userSelect: 'none',
                    WebkitUserSelect: 'none'
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        alignItems: 'center',
                        gap: '10px',
                        backgroundColor: '#111111',
                        boxShadow: '0 0 30px #666666',
                        height: '15dvh'
                }}>
                        <Logo />
                        <select className='dropdown' onChange={(e) => setEvent(e.target.value)} value={event}>
                            <option value='222'>2x2x2</option>
                            <option value='333'>3x3x3</option>
                            <option value='444'>4x4x4</option>
                            <option value='555'>5x5x5</option>
                            <option value='666'>6x6x6</option>
                            <option value='777'>7x7x7</option>
                            <option value='skewb'>Skewb</option>
                            <option value='sq1'>Square 1</option>
                            <option value='kilominx'>Kilominx</option>
                            <option value='minx'>Megaminx</option>
                            <option value='pyram'>Pyraminx</option>
                            <option value='clock'>Clock</option>
                            <option value='fto'>FTO</option>
                        </select>
                        <Scramble scramble={scramble} />
                    </div>
                    <Timer onStop={handleStop} key={currentSession} />
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        alignItems: 'space-around',
                        backgroundColor: '#111111',
                        boxShadow: '0 0 30px #666666'
                    }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateRows: 'auto auto'
                        }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateRows: 'auto auto'
                            }}>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'auto auto',
                                    alignSelf: 'center',
                                    justifySelf: 'center',
                                    margin: '3px'
                                }}>
                                    <p style={{ fontSize: '12px', margin: '3px' }}>Session: </p>
                                    <select className='dropdown' value={currentSession} onChange={(e) => setCurrentSession(e.target.value)}>
                                        {sessions.map((session) => {
                                            return <option value={session}>{session}</option>
                                        })}
                                    </select>
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'auto auto',
                                    alignSelf: 'center',
                                    justifySelf: 'center',
                                    margin: '3px'
                                }}>
                                    <p style={{ fontSize: '12px', margin: '3px' }}>Mean: </p>
                                    <p style={{ fontSize: '12px', margin: '3px' }}>{calculateMean()}</p>
                                </div>
                            </div>
                            <Session times={time} />
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateRows: 'auto auto auto',
                            gap: '5px',
                            padding: '3px'
                        }}>
                            <input
                                style={{
                                    height: '17px',
                                    width: '60px',
                                    alignSelf: 'center',
                                    justifySelf: 'center',
                                    textAlign: 'left'
                                }}
                                className='dropdown'
                                type='text'
                                required
                                value={addSession}
                                onChange={(e) => setAddSession(e.target.value)}
                            />
                            <p style={{
                                width: '50px',
                                height: '20px',
                                alignSelf: 'center',
                                justifySelf: 'center',
                                backgroundColor: '#00FF00',
                                border: 'solid 2px #00CC00',
                                borderRadius: '5px',
                                textAlign: 'center',
                                boxShadow: '0 0 10px #00CC00',
                                margin: 0
                            }} onClick={handleAddSession}
                            >Add</p>
                            <p style={{
                                width: '50px',
                                height: '20px',
                                alignSelf: 'center',
                                justifySelf: 'center',
                                backgroundColor: '#FF0000',
                                border: 'solid 2px #CC0000',
                                borderRadius: '5px',
                                textAlign: 'center',
                                boxShadow: '0 0 10px #CC0000',
                                margin: 0
                            }} onClick={() => setShowPopup(true)}>Reset</p>
                            <p style={{
                                width: '50px',
                                height: '20px',
                                alignSelf: 'center',
                                justifySelf: 'center',
                                backgroundColor: '#0000FF',
                                border: 'solid 2px #0000CC',
                                borderRadius: '5px',
                                textAlign: 'center',
                                boxShadow: '0 0 10px #0000CC',
                                margin: 0,
                                fontSize: '11px'
                            }} onClick={preloadScramble}>Next Scr.</p>
                            <p style={{
                                width: '50px',
                                height: '20px',
                                alignSelf: 'center',
                                justifySelf: 'center',
                                backgroundColor: '#00DDDD',
                                border: 'solid 2px #00AAAA',
                                borderRadius: '5px',
                                textAlign: 'center',
                                boxShadow: '0 0 10px #00AAAA',
                                margin: 0,
                            }} onClick={() => setShowDelPopup(true)}>Undo</p>
                        </div>
                        {showPopup && (
                            <Popup title='Reset Session?' message='Are you sure you want to reset this session?' onConfirm={handleReset} onCancel={() => setShowPopup(false)} />
                        )}
                        {showDelPopup && (
                            <Popup title='Delete Last Time?' message='Are you sure you want to delete the last time?' onConfirm={() => {
                                handleDelLast()
                                setShowDelPopup(false)
                            }} onCancel={() => setShowDelPopup(false)} />
                        )}
                        <div style={{
                            display: 'grid',
                            gridTemplateRows: 'auto 1fr'
                        }}>
                            <PBs pb={pb} />
                            <twisty-player style={{ width: '30dvw', height: '17dvh', margin: 0 }} experimental-setup-alg={scramble} control-panel='none' puzzle={getPuzzle()} background='#111111' visualization='3D'></twisty-player>
                        </div>
                    </div>
                </div>
            )}
            {page === 'algorithms' && (
                <div style={{ display: 'grid', gridTemplateRows: 'auto' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        height: 'auto',
                        backgroundColor: 'black',
                        color: 'white',
                        textAlign: 'center',
                        fontSize: '13px',
                        border: 'solid 2px #66AAAA',
                        borderRadius: '2px',
                        gap: '5px',
                        paddingLeft: '5px',
                        paddingRight: '5px',
                        boxShadow: '0 0 30px #666666'
                    }}>
                        <p style={{ color: 'yellow', fontWeight: 'bold' }} onClick={() => setAlgSet('OLL')}>OLL</p>
                        <p style={{ color: 'orange', fontWeight: 'bold' }} onClick={() => setAlgSet('PLL')}>PLL</p>
                        <p style={{ color: 'green', fontWeight: 'bold' }} onClick={() => setAlgSet('PBL')}>PBL</p>
                    </div>
                    {algSet === 'OLL' && (
                        <div style={{
                            height: '86dvh',
                            overflowY: 'auto'
                        }}>
                            <AlgCard alg="R U R' U R U2' R'" name='Cross 1' algSet='OLL' />
                            <AlgCard alg="R U2' R' U' R U' R'" name='Cross 2' algSet='OLL' />
                            <AlgCard alg="R U R' U R U' R' U R U2' R'" name='Cross 3' algSet='OLL' />
                            <AlgCard alg="R U2' R2' U' R2 U' R2' U2' R" name='Cross 4' algSet='OLL' />
                            <AlgCard alg="r U R' U' r' F R F'" name='Cross 5' algSet='OLL' />
                            <AlgCard alg="F R' F' r U R U' r'" name='Cross 6' algSet='OLL' />
                            <AlgCard alg="R2 D R' U2' R D' R' U2 R'" name='Cross 7' algSet='OLL' />
                            <AlgCard alg="R U R' U' R' F R F'" name='T-Shape 1' algSet='OLL' />
                            <AlgCard alg="F R U R' U' F'" name='T-Shape 2' algSet='OLL' />
                            <AlgCard alg="R U R' U' M' U R U' r'" name='Solved Corners 1' algSet='OLL' />
                            <AlgCard alg="r U R' U' r' R U R U' R'" name='Solved Corners 2' algSet='OLL' />
                            <AlgCard alg="r U R' U R U2' r'" name='Lightning Bolt 1' algSet='OLL' />
                            <AlgCard alg="r' U' R U' R' U2' r" name='Lightning Bolt 2' algSet='OLL' />
                            <AlgCard alg="M R U R' U R U2' R' U M'" name='Lightning Bolt 3' algSet='OLL' />
                            <AlgCard alg="M' R' U' R U' R' U2' R U' M" name='Lightning Bolt 4' algSet='OLL' />
                            <AlgCard alg="f R' F' R U R U' R' S'" name='Lightning Bolt 5' algSet='OLL' />
                            <AlgCard alg="f' r U r' U' r' F r S" name='Lightning Bolt 6' algSet='OLL' />
                            <AlgCard alg="r U2' R' U' R U' r'" name='Square 1' algSet='OLL' />
                            <AlgCard alg="r' U2 R U R' U r" name='Square 2' algSet='OLL' />
                            <AlgCard alg="F U R U' R' F'" name='P-Shape 1' algSet='OLL' />
                            <AlgCard alg="F' U' L' U L F" name='P-Shape 2' algSet='OLL' />
                            <AlgCard alg="S R U R' U' R' F R f'" name='P-Shape 3' algSet='OLL' />
                            <AlgCard alg="R' U' F U R U' R' F' R" name='P-Shape 4' algSet='OLL' />
                            <AlgCard alg="F R' F' R U R U' R'" name='Fish 1' algSet='OLL' />
                            <AlgCard alg="R U2' R2' F R F' R U2' R'" name='Fish 2' algSet='OLL' />
                            <AlgCard alg="R U R' U' R' F R2 U R' U' F'" name='Fish 3' algSet='OLL' />
                            <AlgCard alg="R U R' U R' F R F' R U2' R'" name='Fish 4' algSet='OLL' />
                            <AlgCard alg="R' U' R' F R F' U R" name='C-Shape 1' algSet='OLL' />
                            <AlgCard alg="f R f' U' r' U' R U M'" name='C-Shape 2' algSet='OLL' />
                            <AlgCard alg="R U R' U R U' R' U' R' F R F'" name='W-Shape 1' algSet='OLL' />
                            <AlgCard alg="L' U' L U' L' U L U L F' L' F" name='W-Shape 2' algSet='OLL' />
                            <AlgCard alg="F U R U' R' U R U' R' F'" name='Line 1' algSet='OLL' />
                            <AlgCard alg="r U r' U R U' R' M' U R U2' r'" name='Line 2' algSet='OLL' />
                            <AlgCard alg="R' F' U' F U' R U R' U R" name='Line 3' algSet='OLL' />
                            <AlgCard alg="R' F R U R U' R2' F' R2 U' R' U R U R'" name='Line 4' algSet='OLL' />
                            <AlgCard alg="F R U R' U' R U R' U' F'" name='L-Shape 1' algSet='OLL' />
                            <AlgCard alg="F R' F' R U2 R U' R' U R U2' R'" name='L-Shape 2' algSet='OLL' />
                            <AlgCard alg="r U R' U R U' R' U R U2' r'" name='L-Shape 3' algSet='OLL' />
                            <AlgCard alg="r' U' R U' R' U R U' R' U2' r" name='L-Shape 4' algSet='OLL' />
                            <AlgCard alg="r U' r2' U r2 U r2' U' r" name='L-Shape 5' algSet='OLL' />
                            <AlgCard alg="r' U r2 U' r2' U' r2 U r'" name='L-Shape 6' algSet='OLL' />
                            <AlgCard alg="r U r' R U R' U' r U' r'" name='Knight Move 1' algSet='OLL' />
                            <AlgCard alg="R' F' R L' U' L U R' F R" name='Knight Move 2' algSet='OLL' />
                            <AlgCard alg="F U R U' R2' F' R U R U' R'" name='Knight Move 3' algSet='OLL' />
                            <AlgCard alg="R' F R U R' F' R F U' F'" name='Knight Move 4' algSet='OLL' />
                            <AlgCard alg="R U R' U R U2' R' F R U R' U' F'" name='Awkward Shape 1' algSet='OLL' />
                            <AlgCard alg="R' U' F2 u' R U R' D R2 B" name='Awkward Shape 2' algSet='OLL' />
                            <AlgCard alg="F U R U2' R' U' R U2' R' U' F'" name='Awkward Shape 3' algSet='OLL' />
                            <AlgCard alg="r2' D' r U r' D r2 U' r' U' r" name='Awkward Shape 4' algSet='OLL' />
                            <AlgCard alg="R U2' R2' F R F' U2' R' F R F'" name='Dot 1' algSet='OLL' />
                            <AlgCard alg="f U R U' R' S' U R U' R' F'" name='Dot 2' algSet='OLL' />
                            <AlgCard alg="F R' F' R U S' R U' R' S" name='Dot 3' algSet='OLL' />
                            <AlgCard alg="S' R U R' S U' R' F R F'" name='Dot 4' algSet='OLL' />
                            <AlgCard alg="r U R' U R U2' r2' U' R U' R' U2' r" name='Dot 5' algSet='OLL' />
                            <AlgCard alg="R' F2 R2 U2' R' F R U2' R2' F2 R" name='Dot 6' algSet='OLL' />
                            <AlgCard alg="R' F2 R2 U2' R' F' R U2' R2' F2 R" name='Dot 7' algSet='OLL' />
                            <AlgCard alg="S R' U' R U R U R U' R' S'" name='Dot 8' algSet='OLL' />
                        </div>
                    )}
                    {algSet === 'PLL' && (
                        <div style={{
                            height: '86dvh',
                            overflowY: 'auto'
                        }}>
                            <AlgCard alg="R U R' U' R' F R2 U' R' U' R U R' F'" name='T-Perm' algSet='PLL' />
                            <AlgCard alg="R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R" name='F-Perm' algSet='PLL' />
                            <AlgCard alg="x R2' F R F' R U2' r' U r U2' x'" name='Ja-Perm' algSet='PLL' />
                            <AlgCard alg="R U R' F' R U R' U' R' F R2 U' R'" name='Jb-Perm' algSet='PLL' />
                            <AlgCard alg="R U' R' U' R U R D R' U' R D' R' U2' R'" name='Ra-Perm' algSet='PLL' />
                            <AlgCard alg="R' U2 R U2' R' F R U R' U' R' F' R2" name='Rb-Perm' algSet='PLL' />
                            <AlgCard alg="F R U' R' U' R U R' F' R U R' U' R' F R F'" name='Y-Perm' algSet='PLL' />
                            <AlgCard alg="R' U R' U' R D' R' D R3 U D' R2' U' R2 D R2'" name='V-Perm' algSet='PLL' />
                            <AlgCard alg="R U R' U R U R' F' R U R' U' R' F R2 U' R' U2' R U' R'" name='Na-Perm' algSet='PLL' />
                            <AlgCard alg="R' U R U' R' F' U' F R U R' F R' F' R U' R" name='Nb-Perm' algSet='PLL' />
                            <AlgCard alg="x R' U R' D2 R U' R' D2 R2 x'" name='Aa-Perm' algSet='PLL' />
                            <AlgCard alg="x R2' D2 R U R' D2 R U' R x'" name='Ab-Perm' algSet='PLL' />
                            <AlgCard alg="R' U' R' D' R U' R' D R U R' D' R U R' D R2" name='E-Perm' algSet='PLL' />
                            <AlgCard alg="M2' U M U2' M' U M2'" name='Ua-Perm' algSet='PLL' />
                            <AlgCard alg="M2' U' M U2' M' U' M2'" name='Ub-Perm' algSet='PLL' />
                            <AlgCard alg="M2' U' M2' U2' M2' U' M2'" name='H-Perm' algSet='PLL' />
                            <AlgCard alg="M' U' M2' U' M2' U' M' U2' M2'" name='Z-Perm' algSet='PLL' />
                            <AlgCard alg="R2 U R' U R' U' R U' R2 U' D R' U R D'" name='Ga-Perm' algSet='PLL' />
                            <AlgCard alg="D R' U' R U D' R2 U R' U R U' R U' R2'" name='Gb-Perm' algSet='PLL' />
                            <AlgCard alg="R2' F2 R U2 R U2' R' F R U R' U' R' F R2" name='Gc-Perm' algSet='PLL' />
                            <AlgCard alg="R U R' U' D R2 U' R U' R' U R' U R2 D'" name='Gd-Perm' algSet='PLL' />
                        </div>
                    )}
                    {algSet === 'PBL' && (
                        <div style={{
                            height: '86dvh',
                            overflowY: 'auto'
                        }}>
                            <AlgCard alg="R2 U' B2 U2' R2' U' R2" name='adjacent-adjacent' algSet='PBL' />
                            <AlgCard alg="R2 B2 R2'" name='diagonal-diagonal' algSet='PBL' />
                            <AlgCard alg="R U' R F2 R' U R'" name='adjacent-diagonal' algSet='PBL' />
                            <AlgCard alg="R U R' U' R' F R2 U' R' U' R U R' F'" name='adjacent' algSet='PBL' />
                            <AlgCard alg="F R U' R' U' R U R' F' R U R' U' R' F R F'" name='diagonal' algSet='PBL' />
                        </div>
                    )}
                </div>
            )}
            {page === 'progression' && (
                <div style={{ display: 'grid', gridTemplateRows: 'auto' }}>
                    <Progression />
                </div>
            )}
            {page === 'tutorials' && (
                <div style={{ display: 'grid', gridTemplateRows: 'auto' }}>
                    <Tutorials />
                </div>
            )}
        </div>
    )
}

export default App










