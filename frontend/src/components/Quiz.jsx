import React from 'react'

function Question({ q, onAnswer }){
  const [selected, setSelected] = React.useState(null)
  const submit = () => onAnswer(selected)
  return (
    <div className="quiz-question card">
      <div style={{fontWeight:700}}>{q.prompt}</div>
      <div style={{marginTop:8,display:'flex',flexDirection:'column',gap:8}}>
        {q.options.map((opt, i)=>(
          <label key={i} className={`option ${selected===i? 'option-selected':''}`}>
            <input type="radio" name="opt" value={i} checked={selected===i} onChange={()=>setSelected(i)} /> {opt}
          </label>
        ))}
      </div>
      <div style={{marginTop:10}}>
        <button onClick={submit} disabled={selected===null}>Submit Answer</button>
      </div>
    </div>
  )
}

export default function Quiz({ questions = [], onComplete = null }){
  const [idx, setIdx] = React.useState(0)
  const [score, setScore] = React.useState(0)
  const [done, setDone] = React.useState(false)

  const handleAnswer = (choice) => {
    const q = questions[idx]
    if (q && q.correct === choice) setScore(s=>s+1)
    if (idx + 1 >= questions.length){ setDone(true); onComplete?.({score: score + (q.correct === choice ? 1 : 0), total: questions.length}) }
    else setIdx(i=>i+1)
  }

  if (questions.length===0) return <div className="card">No quiz available.</div>

  return (
    <div>
      {!done ? (
        <Question q={questions[idx]} onAnswer={handleAnswer} />
      ) : (
        <div className="card">
          <h3>Quiz complete</h3>
          <p>Score: {score} / {questions.length}</p>
        </div>
      )}
    </div>
  )
}
