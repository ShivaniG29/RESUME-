export default function ScoreCard({ score, breakdown }) {
  const values = [
    ["Skills relevance", breakdown?.skills_relevance],
    ["Structure", breakdown?.resume_structure],
    ["Experience", breakdown?.experience_presentation],
    ["Education", breakdown?.education_information],
    ["ATS readability", breakdown?.ats_readability],
  ];

  return (
    <section className="card score-card" aria-label="Resume score">
      <div className="score-heading">
        <div>
          <p className="eyebrow">YOUR RESUME SCORE</p>
          <h2>Room to grow, ready to go</h2>
        </div>
        <div className="score-number" aria-label={`Score ${score} out of 100`}>
          <strong>{score ?? 0}</strong><span>/100</span>
        </div>
      </div>
      <div className="score-track" role="progressbar" aria-valuenow={score ?? 0} aria-valuemin="0" aria-valuemax="100">
        <div className="score-fill" style={{ width: `${score ?? 0}%` }} />
      </div>
      <div className="score-breakdown">
        {values.map(([label, value]) => (
          <div className="score-row" key={label}>
            <span>{label}</span><strong>{value ?? 0}%</strong>
          </div>
        ))}
      </div>
      <p className="muted small">{breakdown?.explanation || "A guidance score, not a hiring decision or ATS guarantee."}</p>
    </section>
  );
}
