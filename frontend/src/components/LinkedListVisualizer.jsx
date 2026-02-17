import React, { useState, useRef, useEffect } from 'react'
import { TransitionGroup, CSSTransition } from 'react-transition-group'

function NodeBox({ value, isHead, isTail, highlighted, idx }) {
  return (
    <div className={`node ${highlighted ? 'node-highlight' : ''}`} title={`Index ${idx}`}>
      <div className="node-index">{idx}</div>
      <div className="node-value">{value}</div>
      <div className="node-meta">{isHead ? 'head' : ''}{isTail ? ' → None' : ''}</div>
    </div>
  )
}

export default function LinkedListVisualizer({ initial = ['A','B','C'], externalNodes = null, onChange = null, highlightIndex = null }) {
  const [nodes, setNodes] = useState(initial)
  const [value, setValue] = useState('')
  const [index, setIndex] = useState('')
  const inputRef = useRef(null)
  const [pulseIndex, setPulseIndex] = useState(null)
  const listRowRef = useRef(null)

  const insertAt = (i, v) => {
    const pos = Math.max(0, Math.min(nodes.length, i))
    const next = [...nodes.slice(0,pos), v, ...nodes.slice(pos)]
    setNodes(next)
    onChange?.(next)
    // pulse the arrow just before the inserted node (if any)
    const arrowIdx = pos - 1
    if (arrowIdx >= 0) {
      setPulseIndex(arrowIdx)
      setTimeout(()=>setPulseIndex(null), 520)
    }
  }

  const deleteAt = (i) => {
    if (i < 0 || i >= nodes.length) return
    const next = [...nodes.slice(0,i), ...nodes.slice(i+1)]
    setNodes(next)
    onChange?.(next)
    // pulse the arrow that pointed to the deleted node
    const arrowIdx = Math.max(0, i-1)
    setPulseIndex(arrowIdx)
    setTimeout(()=>setPulseIndex(null), 420)
  }

  const handleInsert = () => {
    const v = value || 'X'
    const i = index === '' ? nodes.length : parseInt(index,10)
    insertAt(isNaN(i) ? nodes.length : i, v)
    setValue('')
    setIndex('')
    inputRef.current?.focus()
  }

  const handleDelete = () => {
    const i = parseInt(index,10)
    if (isNaN(i)) return
    deleteAt(i)
    setIndex('')
  }

  const reset = () => setNodes(initial)
  const randomize = () => setNodes(Array.from({length: Math.floor(Math.random()*6)+1}, (_,i)=>String.fromCharCode(65+Math.floor(Math.random()*26))))

  // Accept external control
  React.useEffect(()=>{
    if (externalNodes && Array.isArray(externalNodes)){
      setNodes(externalNodes)
    }
  }, [externalNodes])

  React.useEffect(()=>{
    onChange?.(nodes)
  }, [nodes])

  // auto-scroll highlighted node into view on small screens
  useEffect(()=>{
    if (highlightIndex == null) return
    const container = listRowRef.current
    if (!container) return
    // find .node elements (they are rendered inside wrappers)
    const nodesEls = container.querySelectorAll('.node')
    const el = nodesEls[highlightIndex]
    if (el && typeof el.scrollIntoView === 'function'){
      el.scrollIntoView({behavior:'smooth', block:'nearest', inline:'center'})
    }
  }, [highlightIndex])

  return (
    <div>
      <div className="controls">
        <input ref={inputRef} placeholder="value" value={value} onChange={e=>setValue(e.target.value)} />
        <input placeholder="index (optional)" value={index} onChange={e=>setIndex(e.target.value)} />
        <button onClick={handleInsert}>Insert</button>
        <button onClick={handleDelete}>Delete</button>
        <button onClick={reset}>Reset</button>
        <button onClick={randomize}>Randomize</button>
      </div>

      <div className="visualizer card">
        <div className="list-row" ref={listRowRef}>
          {nodes.length === 0 && <div className="empty">Empty list → None</div>}
          <TransitionGroup component={null}>
            {nodes.map((n, idx) => (
              <CSSTransition key={n + '_' + idx} timeout={320} classNames="node">
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <NodeBox value={n} isHead={idx===0} isTail={idx===nodes.length-1} highlighted={highlightIndex===idx} idx={idx} />
                  {idx < nodes.length-1 && (
                    <div className={`arrow ${pulseIndex===idx ? 'arrow-pulse' : ''}`} aria-hidden>
                      <svg width="36" height="24" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <linearGradient id={`g-${idx}`} x1="0" x2="1" y1="0" y2="0">
                            <stop offset="0%" stopColor="#bff3c3"/>
                            <stop offset="100%" stopColor="#3da65b"/>
                          </linearGradient>
                        </defs>
                        <path className="arrow-line" d="M2 12 L30 12" stroke={`url(#g-${idx})`} strokeWidth="2.6" strokeLinecap="round" />
                        <path className="arrow-head" d="M24 6 L30 12 L24 18" stroke={`url(#g-${idx})`} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                    </div>
                  )}
                </div>
              </CSSTransition>
            ))}
          </TransitionGroup>
          {nodes.length>0 && <div className="tail">None</div>}
        </div>
      </div>
    </div>
  )
}
