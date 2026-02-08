/* eslint-disable no-unused-vars */
import { useState, useMemo } from "react";
import Upload from "./Upload";

const TeacherPanel = () => {
    const [form, setForm] = useState({
        part: "Part A",
        type: "single",
        question: "",
        option_a: "",
        option_b: "",
        option_c: "",
        option_d: "",
        media: ""
    });

    const [correctSelection, setCorrectSelection] = useState([]);
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    // Derived state for the CSV string (e.g., "a, c")
    const derivedAnswer = useMemo(() => {
        return correctSelection.sort().join(", ");
    }, [correctSelection]);

    const toggleAnswer = (key) => {
        if (form.type === "single") {
            setCorrectSelection([key]);
        } else {
            setCorrectSelection(prev =>
                prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
            );
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));

        // Reset selection if type changes
        if (name === "type") setCorrectSelection([]);
    };

    const handleMediaSuccess = (url) => {
        setForm(prev => ({ ...prev, media: url }));
    };

    const submitQuestion = async (e) => {
        e.preventDefault();
        if (correctSelection.length === 0) {
            alert("Select at least one correct answer.");
            return;
        }

        setLoading(true);
        setMessage(null);

        const payload = {
            auth: password,
            ...form,
            correct_answer: derivedAnswer
        };

        try {
            const response = await fetch(import.meta.env.VITE_API_URL, {
                method: "POST",
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (result.result === "success") {
                setMessage({ type: "success", text: `Saved! ID: ${result.id}` });
                // Reset fields
                setForm(prev => ({
                    ...prev, question: "", option_a: "", option_b: "", option_c: "", option_d: "", media: ""
                }));
                setCorrectSelection([]);
            } else {
                setMessage({ type: "error", text: result.message });
            }
        } catch (error) {
            setMessage({ type: "error", text: "Connection failed" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-container">
            <h2>Teacher Exam Creator</h2>
            <div className="auth-box">
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Admin Password: 123"
                />
            </div>

            <form onSubmit={submitQuestion} className="creator-form">
                <div className="form-row">
                    <div className="half">
                        <label>Part</label>
                        <select name="part" value={form.part} onChange={handleInputChange}>
                            <option>Part A</option>
                            <option>Part B</option>
                            <option>Part C</option>
                        </select>
                    </div>
                    <div className="half">
                        <label>Type</label>
                        <div className="radio-group">
                            <label>
                                <input
                                    type="radio" name="type" value="single"
                                    checked={form.type === "single"} onChange={handleInputChange}
                                /> Single
                            </label>
                            <label>
                                <input
                                    type="radio" name="type" value="multiple"
                                    checked={form.type === "multiple"} onChange={handleInputChange}
                                /> Multiple
                            </label>
                        </div>
                    </div>
                </div>

                <label>Question</label>
                <textarea
                    name="question"
                    value={form.question}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter question..."
                />

                {/* Media Section */}
                <div className="media-section">
                    <label>Attachment (Optional)</label>
                    {!form.media ? (
                        <Upload onUploadSuccess={handleMediaSuccess} />
                    ) : (
                        <div className="media-preview-box">
                            <span>Media Attached</span>
                            <button type="button" onClick={() => setForm(p => ({ ...p, media: "" }))} className="remove-btn">
                                ❌ Remove
                            </button>
                        </div>
                    )}
                </div>

                {/* Options */}
                <div className="options-area">
                    <p className="sub-label">Enter Options & Check Correct Answer</p>
                    {['a', 'b', 'c', 'd'].map(key => (
                        <div key={key} className="option-row">
                            <span className="opt-badge">{key.toUpperCase()}</span>
                            <input
                                name={`option_${key}`}
                                value={form[`option_${key}`]}
                                onChange={handleInputChange}
                                required
                                placeholder={`Option ${key.toUpperCase()}`}
                            />
                            <div
                                className={`checker ${correctSelection.includes(key) ? 'active' : ''}`}
                                onClick={() => toggleAnswer(key)}
                            >
                                {correctSelection.includes(key) ? '✔ Correct' : 'Set Correct'}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="preview-info">
                    Answer String: {derivedAnswer || "(None)"}
                </div>

                <button type="submit" disabled={loading} className="save-btn">
                    {loading ? "Saving..." : "Add Question"}
                </button>

                {message && <div className={`msg-box ${message.type}`}>{message.text}</div>}
            </form>
        </div>
    );
};

export default TeacherPanel;