import React, { useState, useRef, useEffect } from 'react'
import LinkedListVisualizer from './components/LinkedListVisualizer'
import Quiz from './components/Quiz'
import Hints from './components/Hints'
import logo from './logo.svg'

export default function App(){
  const [nodes, setNodes] = useState(["1","2","3"])
  const [highlightIndex, setHighlightIndex] = useState(null)
  const [tutorialRunning, setTutorialRunning] = useState(false)
  const [activeTab, setActiveTab] = useState('visualizer')
  const fileRef = useRef(null)
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('flowlens_theme') || 'dark' } catch(e){ return 'dark' } })
  const [cloudStatus, setCloudStatus] = useState(null)
  const [savedId, setSavedId] = useState(null)
  const [loadId, setLoadId] = useState('')

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ list: nodes }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'linked_list.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importJSON = (file) => {
    const reader = new FileReader()
    reader.onload = e => {
      try{
        const obj = JSON.parse(e.target.result)
        if (Array.isArray(obj.list)) setNodes(obj.list.map(String))
      }catch(e){console.warn('Invalid JSON')}
    }
    reader.readAsText(file)
  }

  const sleep = (ms) => new Promise(r=>setTimeout(r, ms))

  const runTutorial = async () => {
    if (tutorialRunning) return
    setTutorialRunning(true)
    const original = [...nodes]
    setNodes(['A','B','C'])
    await sleep(600)
    setHighlightIndex(0)
    await sleep(700)
    setHighlightIndex(1)
    await sleep(600)
    // insert X at index 1
    setNodes(prev=>[prev[0],'X',...prev.slice(1)])
    setHighlightIndex(1)
    await sleep(900)
    // delete original index 2 (now at 2)
    setNodes(prev=>[prev[0],prev[1],...prev.slice(3)])
    setHighlightIndex(2)
    await sleep(900)
    setHighlightIndex(null)
    await sleep(400)
    setTutorialRunning(false)
    // leave modified list; or restore original if you prefer
    // setNodes(original)
  }

  useEffect(()=>{
    try{
      if (theme === 'light') document.documentElement.classList.add('light-theme')
      else document.documentElement.classList.remove('light-theme')
      localStorage.setItem('flowlens_theme', theme)
    }catch(e){}
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  const saveToCloud = async () => {
    setCloudStatus('saving')
    try{
      const res = await fetch('/api/save', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ list: nodes }) })
      const body = await res.json()
      if (!res.ok) throw new Error(body.detail || JSON.stringify(body))
      setSavedId(body.id)
      setCloudStatus(`saved (${body.storage})`)
    }catch(e){
      setCloudStatus('error: '+String(e))
    }
  }

  const loadFromCloud = async (id) => {
    const target = id || loadId
    if (!target) { setCloudStatus('no id'); return }
    setCloudStatus('loading')
    try{
      const res = await fetch(`/api/load/${encodeURIComponent(target)}`)
      const body = await res.json()
      if (!res.ok) throw new Error(body.detail || JSON.stringify(body))
      if (body.list && Array.isArray(body.list)){
        setNodes(body.list.map(String))
        setCloudStatus('loaded')
      }else{
        setCloudStatus('invalid payload')
      }
    }catch(e){ setCloudStatus('error: '+String(e)) }
  }

  const uploadDirectToS3 = async () => {
    setCloudStatus('getting url')
    try{
      const res = await fetch('/api/s3/presign', { method: 'POST' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.detail || JSON.stringify(body))
      const blob = new Blob([JSON.stringify({ list: nodes }, null, 2)], { type: 'application/json' })
      setCloudStatus('uploading')
      const put = await fetch(body.url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: blob })
      if (!put.ok) throw new Error('Upload failed')
      setSavedId(body.key)
      setCloudStatus('uploaded (s3)')
    }catch(e){ setCloudStatus('error: '+String(e)) }
  }

  const exampleQuestions = [
    { prompt: 'What is the head of the list after inserting 5 at head?', options: ['Tail','Head','Middle','None'], correct: 1 },
    { prompt: 'Which operation takes O(1) time on a singly linked list?', options: ['Insert at head','Delete by value','Reverse list','Find middle'], correct: 0 }
  ]

  return (
    <div className="app">
      <header>
        <div className="logo logo-glow">
          <lottie-player src="https://assets6.lottiefiles.com/packages/lf20_jtbfg2nb.json"  background="transparent"  speed="1"  style={{width:72,height:72}}  loop  autoplay></lottie-player>
        </div>
        <div style={{flex:1}}>
          <h1>FlowLens</h1>
          <p>Visual linked lists — learn and share.</p>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">{theme === 'dark' ? '☀️' : '🌙'}</button>
        </div>
      </header>

      <section className="card about">
        <div className="about-left">
          <h2>About FlowLens</h2>
          <p>FlowLens makes linked lists intuitive with interactive visuals and gentle animations.</p>
        </div>
        <div className="about-right">
          <h3>Mission</h3>
          <p>Demystify data structures through beautiful visuals.</p>
        </div>
      </section>

      <div className="tab-bar card" style={{display:'flex',gap:8,alignItems:'center'}}>
        <button className={`tab-button ${activeTab==='visualizer'?'tab-active':''}`} onClick={()=>setActiveTab('visualizer')}>Visualizer</button>
        <button className={`tab-button ${activeTab==='quiz'?'tab-active':''}`} onClick={()=>setActiveTab('quiz')}>Quiz</button>
        <button className={`tab-button ${activeTab==='hints'?'tab-active':''}`} onClick={()=>setActiveTab('hints')}>Hints & Tips</button>
        <div style={{flex:1}} />
        <div style={{fontSize:13,color:'var(--muted-text)'}}>Mode: {activeTab}</div>
      </div>

      <section className="card">
        {activeTab === 'visualizer' && (
          <>
            <h2>Linked List Visualizer</h2>
            <p>Use the controls to insert/delete nodes. Click "Start tutorial" for a short guided demo.</p>
            <div className="controls" style={{marginBottom:12}}>
              <button onClick={exportJSON}>Export JSON</button>
              <input ref={fileRef} type="file" accept="application/json" style={{display:'none'}} onChange={e=>importJSON(e.target.files[0])} />
              <button onClick={()=>fileRef.current?.click()}>Import JSON</button>
              <button onClick={runTutorial} disabled={tutorialRunning} style={{marginLeft:12}}>{tutorialRunning ? 'Running...' : 'Start tutorial'}</button>
              <button onClick={saveToCloud} style={{marginLeft:12}}>Save to Cloud</button>
              <button onClick={uploadDirectToS3} style={{marginLeft:8}}>Upload Direct to S3</button>
              <input placeholder="load id" value={loadId} onChange={e=>setLoadId(e.target.value)} style={{width:220,marginLeft:8,padding:8,borderRadius:8}} />
              <button onClick={()=>loadFromCloud()} style={{marginLeft:6}}>Load by ID</button>
            </div>
            <LinkedListVisualizer initial={nodes} externalNodes={nodes} highlightIndex={highlightIndex} onChange={setNodes} />
            <div className="hints" style={{marginTop:12}}>
              <strong>Quick tips:</strong>
              <ul>
                <li>Type a value then index and press <em>Insert</em> to place a node.</li>
                <li>Leave index empty to append to the end.</li>
                <li>Use <em>Randomize</em> to generate sample lists quickly.</li>
              </ul>
            </div>
            <div style={{marginTop:10,display:'flex',alignItems:'center',gap:10}}>
              <div className="cloud-status">{cloudStatus || (savedId ? `Saved id: ${savedId}` : 'Not saved')}</div>
              {savedId && <button onClick={()=>{navigator.clipboard?.writeText(savedId); setCloudStatus('copied')}}>Copy ID</button>}
              {savedId && <button onClick={()=>loadFromCloud(savedId)}>Load Saved</button>}
            </div>
          </>
        )}

        {activeTab === 'quiz' && (
          <div style={{marginTop:6}}>
            <h2>Quick Quiz</h2>
            <Quiz questions={exampleQuestions} onComplete={(r)=>alert(`Score ${r.score}/${r.total}`)} />
          </div>
        )}

        {activeTab === 'hints' && (
          <div>
            <h2>Hints & Teaching Notes</h2>
            <Hints hints={[
              'Traverse nodes by following arrows.',
              'Insert at head is O(1); insert at tail is O(n) without tail pointer.',
              'Practice by resetting and randomizing lists.'
            ]} />
          </div>
        )}
      </section>
    </div>
  )
}
