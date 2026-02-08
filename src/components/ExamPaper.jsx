/* eslint-disable no-unused-vars */
import { useState, useEffect, useMemo } from "react";

const ExamPaper = () => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userAnswers, setUserAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(import.meta.env.VITE_API_URL);
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();

                // Process data
                const processed = data.map(row => ({
                    ...row,
                    correct_answer_clean: String(row.correct_answer).split(',').map(s => s.trim().toLowerCase())
                }));

                // Init answers
                const initialAnswers = {};
                processed.forEach(q => {
                    initialAnswers[q.id] = q.type === 'multiple' ? [] : '';
                });

                setQuestions(processed);
                setUserAnswers(initialAnswers);
            } catch (err) {
                setError("Error loading exam.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Group by Part
    const questionsByPart = useMemo(() => {
        const groups = {};
        questions.forEach(q => {
            if (!groups[q.part]) groups[q.part] = [];
            groups[q.part].push(q);
        });
        return groups;
    }, [questions]);

    // Handle Input Logic
    const handleAnswerChange = (qId, type, value) => {
        if (submitted) return;

        setUserAnswers(prev => {
            if (type === 'single') {
                return { ...prev, [qId]: value };
            } else {
                // Multiple choice logic
                const current = prev[qId] || [];
                if (current.includes(value)) {
                    return { ...prev, [qId]: current.filter(item => item !== value) };
                } else {
                    return { ...prev, [qId]: [...current, value] };
                }
            }
        });
    };

    const isCorrect = (q) => {
        const correct = q.correct_answer_clean;
        const userAns = userAnswers[q.id];

        if (q.type === 'single') return userAns === correct[0];

        if (!Array.isArray(userAns)) return false;
        return userAns.length === correct.length && userAns.every(val => correct.includes(val));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        let tempScore = 0;
        questions.forEach(q => {
            if (isCorrect(q)) tempScore++;
        });
        setScore(tempScore);
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetExam = () => {
        setSubmitted(false);
        setScore(0);
        const resetAns = {};
        questions.forEach(q => {
            resetAns[q.id] = q.type === 'multiple' ? [] : '';
        });
        setUserAnswers(resetAns);
        window.scrollTo(0, 0);
    };

    if (loading) return <div className="state-msg">Loading...</div>;
    if (error) return <div className="state-msg error">{error}</div>;

    return (
        <div className="exam-container">
            <header className="exam-header">
                <h1>Elementary English Exam</h1>
                {submitted && (
                    <div className="result-banner">
                        <h2>Score: {score} / {questions.length}</h2>
                        <button onClick={resetExam} className="retry-btn">Retake Exam</button>
                    </div>
                )}
            </header>

            <form onSubmit={handleSubmit}>
                {Object.keys(questionsByPart).map(partName => (
                    <div key={partName} className="exam-part">
                        <h2 className="part-title">{partName}</h2>

                        {questionsByPart[partName].map(q => {
                            const qCorrect = submitted && isCorrect(q);
                            const qWrong = submitted && !isCorrect(q);

                            return (
                                <div key={q.id} className={`question-card ${qCorrect ? 'correct-border' : ''} ${qWrong ? 'wrong-border' : ''}`}>
                                    <p className="question-text">
                                        <strong>{q.id}.</strong> {q.question}
                                    </p>

                                    {/* Media Display */}
                                    {q.media && (
                                        <div className="question-media">
                                            {q.media.match(/\.(mp4)$/i) ? (
                                                <video controls src={q.media} className="exam-video" />
                                            ) : q.media.match(/\.(mp3)$/i) ? (
                                                <audio controls src={q.media} className="exam-audio" />
                                            ) : (
                                                <img src={q.media} alt="Attachment" className="exam-img" />
                                            )}
                                        </div>
                                    )}

                                    <div className="options-grid">
                                        {['a', 'b', 'c', 'd'].map(optKey => {
                                            const isSelected = q.type === 'single'
                                                ? userAnswers[q.id] === optKey
                                                : userAnswers[q.id]?.includes(optKey);

                                            const isAnsCorrect = q.correct_answer_clean.includes(optKey);

                                            let labelClass = "";
                                            if (submitted) {
                                                if (isAnsCorrect) labelClass = "highlight-green";
                                                else if (isSelected && !isAnsCorrect) labelClass = "highlight-red";
                                            }

                                            return (
                                                <div key={optKey} className="option-wrapper">
                                                    <label className={labelClass}>
                                                        <input
                                                            type={q.type === 'single' ? 'radio' : 'checkbox'}
                                                            name={`q-${q.id}`}
                                                            value={optKey}
                                                            checked={isSelected}
                                                            onChange={() => handleAnswerChange(q.id, q.type, optKey)}
                                                            disabled={submitted}
                                                        />
                                                        <span className="opt-letter">{optKey.toUpperCase()})</span>
                                                        {q[`option_${optKey}`]}
                                                    </label>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {submitted && !qCorrect && (
                                        <div className="feedback text-red">
                                            ❌ Answer: {q.correct_answer_clean.join(', ').toUpperCase()}
                                        </div>
                                    )}
                                    {submitted && qCorrect && (
                                        <div className="feedback text-green">✅ Correct</div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                ))}
                {!submitted && <button type="submit" className="submit-btn">Submit Exam</button>}
            </form>
        </div>
    );
};

export default ExamPaper;