import React from 'react'

export default function Hints({ children, hints = [] }){
  const [open, setOpen] = React.useState(false)
  return (
    <div className="hints-panel card">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <strong>Hints</strong>
        <button onClick={()=>setOpen(o=>!o)}>{open? 'Hide' : 'Show'}</button>
      </div>
      {open && (
        <div style={{marginTop:12}}>
          {hints.length===0 && <div style={{color:'#bfe8c7'}}>No hints provided.</div>}
          <ul>
            {hints.map((h, i)=>(<li key={i} style={{margin:8,color:'#dff5df'}}>{h}</li>))}
          </ul>
          {children}
        </div>
      )}
    </div>
  )
}
