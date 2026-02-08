import { Routes, Route, Link } from "react-router-dom";
import ExamPaper from "./components/ExamPaper";
import TeacherPanel from "./components/TeacherPanel";
import "./App.css"; // We will put all CSS here for simplicity

function App() {
  return (
    <>
      <nav className="main-nav">
        <Link to="/">Student Exam</Link> | <Link to="/admin">Teacher Panel</Link>
      </nav>

      <Routes>
        <Route path="/" element={<ExamPaper />} />
        <Route path="/admin" element={<TeacherPanel />} />
      </Routes>
    </>
  );
}

export default App;