const uploadButton = document.getElementById("uploadButton");
let resumeText = "";


const savedResumeText = localStorage.getItem("resumeText");

if (savedResumeText) {
    resumeText = savedResumeText;
}

uploadButton.addEventListener("click", async function () {

    const fileInput = document.getElementById("resumeFile");
    const result = document.getElementById("result");
    const loading = document.getElementById("loading");

    if (fileInput.files.length === 0) {
        result.textContent = "Please select a PDF resume.";
        return;
    }

    const file = fileInput.files[0];

    const formData = new FormData();
    formData.append("file", file);

    loading.style.display = "block";
    result.innerHTML = "";

    try {

        const response = await fetch(
            "http://127.0.0.1:8000/upload-resume",
            {
                method: "POST",
                body: formData
            }
        );

        const data = await response.json();


        const analysis = data.analysis;
        resumeText = data.resume_text;
        localStorage.setItem("resumeText", data.resume_text);
        localStorage.setItem(
            "resumeAnalysis",
            JSON.stringify(data.analysis)
        );

        renderResumeAnalysis(analysis);
        updateCareerOverview();
        

        

    } catch (error) {

        result.textContent = "Something went wrong.";

        console.error(error);

    } finally {

        loading.style.display = "none";

    }

});


function createList(items) {

    if (!items || items.length === 0) {
        return "<p>Not available</p>";
    }

    return `
        <ol>
            ${items.map(item => {

                if (typeof item === "object" && item !== null) {
                    return `<li>${item.question || item.text || item.title || JSON.stringify(item)}</li>`;
                }

                return `<li>${item}</li>`;

            }).join("")}
        </ol>
    `;
}
function createQuestionList(items) {

    if (!items || items.length === 0) {
        return "<p>No questions available.</p>";
    }

    return `
        <ol>
            ${items.map(item => {

                if (typeof item === "object" && item !== null) {
                    return `<li>${item.question || item.text || item.title || "Question unavailable"}</li>`;
                }

                return `<li>${item}</li>`;

            }).join("")}
        </ol>
    `;
}
const jobMatchButton = document.getElementById("jobMatchButton");

jobMatchButton.addEventListener("click", async function () {

    const jobDescription =
        document.getElementById("jobDescription").value;

    const jobResult =
        document.getElementById("jobResult");

    if (!resumeText) {
        jobResult.textContent =
            "Please analyse your resume first.";

        return;
    }

    if (!jobDescription.trim()) {
        jobResult.textContent =
            "Please paste a job description.";

        return;
    }

    jobResult.textContent =
        "Analysing job match with AI...";

    try {

        const response = await fetch(
            "http://127.0.0.1:8000/match-job",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    resume_text: resumeText,
                    job_description: jobDescription
                })
            }
        );

        const data = await response.json();
        localStorage.setItem(
            "jobMatch",
            JSON.stringify(data)
        );
        updateCareerOverview();

        jobResult.innerHTML = `
            <div class="job-match-analysis">

                <!-- Header -->
                <div class="job-match-header">

                    <div>
                        <span class="section-eyebrow">
                            AI JOB MATCH ANALYSIS
                        </span>

                        <h2>Job Compatibility</h2>

                        <p>
                            AI-powered comparison between your resume and the job description.
                        </p>
                    </div>

                    <div class="analysis-status">
                        <span class="status-dot"></span>
                        Analysis Complete
                    </div>

                </div>


                <!-- Match Score -->
                <div class="job-match-score-panel">

                    <div class="job-match-score-circle">

                        <span>${data.match_score}</span>
                        <small>% MATCH</small>

                    </div>

                    <div class="job-match-score-info">

                        <span class="score-label">
                            OVERALL JOB MATCH
                        </span>

                        <h3>
                            ${
                                data.match_score >= 80
                                    ? "Excellent Match"
                                    : data.match_score >= 65
                                    ? "Strong Match"
                                    : data.match_score >= 50
                                    ? "Moderate Match"
                                    : "Weak Match"
                            }
                        </h3>

                        <p>
                            Your resume has been compared with the job
                            requirements, skills, education and experience.
                        </p>

                    </div>

                </div>


                <!-- Match Details -->
                <div class="job-match-grid">

                    <!-- Required Skills -->
                    <div class="match-analysis-card">

                        <div class="match-card-header">
                            <span class="match-card-icon">📋</span>

                            <div>
                                <span class="card-label">
                                    JOB REQUIREMENTS
                                </span>

                                <h3>Required Skills</h3>
                            </div>
                        </div>

                        ${createList(data.required_skills)}

                    </div>


                    <!-- Matching Skills -->
                    <div class="match-analysis-card matching-card">

                        <div class="match-card-header">
                            <span class="match-card-icon">✅</span>

                            <div>
                                <span class="card-label">
                                    YOUR STRENGTH
                                </span>

                                <h3>Matching Skills</h3>
                            </div>
                        </div>

                        ${createList(data.matching_skills)}

                    </div>


                    <!-- Missing Skills -->
                    <div class="match-analysis-card missing-card">

                        <div class="match-card-header">
                            <span class="match-card-icon">❌</span>

                            <div>
                                <span class="card-label">
                                    SKILL GAP
                                </span>

                                <h3>Missing Skills</h3>
                            </div>
                        </div>

                        ${createList(data.missing_skills)}

                    </div>


                    <!-- Recommended Actions -->
                    <div class="match-analysis-card action-card">

                        <div class="match-card-header">
                            <span class="match-card-icon">🚀</span>

                            <div>
                                <span class="card-label">
                                    NEXT STEPS
                                </span>

                                <h3>Recommended Actions</h3>
                            </div>
                        </div>

                        ${createList(data.recommended_actions)}

                    </div>

                </div>

            </div>
        `;

    } catch (error) {

        jobResult.textContent =
            "Something went wrong.";

        console.error(error);
    }

});

function renderResumeAnalysis(analysis) {

    const result = document.getElementById("result");

    result.innerHTML = `
        <section class="resume-analysis">

            <!-- Section Header -->
            <div class="analysis-header">

                <div>
                    <span class="section-eyebrow">
                        AI RESUME ANALYSIS
                    </span>

                    <h2>Your Career Profile</h2>

                    <p>
                        AI-powered analysis of your resume,
                        skills and career potential.
                    </p>
                </div>

                <div class="analysis-status">
                    <span class="status-dot"></span>
                    Analysis Complete
                </div>

            </div>


            <!-- Resume Score -->
            <div class="resume-score-panel">

                <div class="resume-score-content">

                    <div class="resume-score-circle">
                        <span>${analysis.resume_score}</span>
                        <small>/100</small>
                    </div>

                    <div class="resume-score-info">

                        <span class="score-label">
                            RESUME SCORE
                        </span>

                        <h3>
                            ${
                                analysis.resume_score >= 80
                                    ? "Excellent Resume"
                                    : analysis.resume_score >= 65
                                    ? "Good Foundation"
                                    : analysis.resume_score >= 50
                                    ? "Needs Improvement"
                                    : "Needs More Work"
                            }
                        </h3>

                        <p>
                            Your resume score is based on
                            skills, projects, education,
                            experience and overall completeness.
                        </p>

                    </div>

                </div>

            </div>


            <!-- Candidate Profile -->
            <div class="analysis-grid">

                <div class="analysis-card candidate-card">

                    <div class="analysis-card-header">
                        <span class="analysis-card-icon">👤</span>

                        <div>
                            <span class="card-label">
                                CANDIDATE
                            </span>

                            <h3>
                                ${analysis.candidate_name || "Not detected"}
                            </h3>
                        </div>
                    </div>

                </div>


                <!-- Education -->
                <div class="analysis-card">

                    <div class="analysis-card-header">
                        <span class="analysis-card-icon">🎓</span>

                        <div>
                            <span class="card-label">
                                EDUCATION
                            </span>

                            <h3>Academic Background</h3>
                        </div>
                    </div>

                    ${createList(analysis.education)}

                </div>


                <!-- Technical Skills -->
                <div class="analysis-card skills-analysis-card">

                    <div class="analysis-card-header">
                        <span class="analysis-card-icon">💻</span>

                        <div>
                            <span class="card-label">
                                SKILLS
                            </span>

                            <h3>Technical Skills</h3>
                        </div>
                    </div>

                    ${createList(analysis.technical_skills)}

                </div>


                <!-- Projects -->
                <div class="analysis-card">

                    <div class="analysis-card-header">
                        <span class="analysis-card-icon">📂</span>

                        <div>
                            <span class="card-label">
                                PROJECTS
                            </span>

                            <h3>Projects</h3>
                        </div>
                    </div>

                    ${createList(analysis.projects)}

                </div>


                <!-- Work Experience -->
                <div class="analysis-card">

                    <div class="analysis-card-header">
                        <span class="analysis-card-icon">💼</span>

                        <div>
                            <span class="card-label">
                                EXPERIENCE
                            </span>

                            <h3>Work Experience</h3>
                        </div>
                    </div>

                    ${createList(analysis.work_experience)}

                </div>


                <!-- Certifications -->
                <div class="analysis-card">

                    <div class="analysis-card-header">
                        <span class="analysis-card-icon">📜</span>

                        <div>
                            <span class="card-label">
                                CERTIFICATIONS
                            </span>

                            <h3>Certifications</h3>
                        </div>
                    </div>

                    ${createList(analysis.certifications)}

                </div>


                <!-- Strengths -->
                <div class="analysis-card strength-analysis-card">

                    <div class="analysis-card-header">
                        <span class="analysis-card-icon">💪</span>

                        <div>
                            <span class="card-label">
                                STRENGTHS
                            </span>

                            <h3>Your Strengths</h3>
                        </div>
                    </div>

                    ${createList(analysis.strengths)}

                </div>


                <!-- Areas to Improve -->
                <div class="analysis-card improvement-analysis-card">

                    <div class="analysis-card-header">
                        <span class="analysis-card-icon">⚠️</span>

                        <div>
                            <span class="card-label">
                                IMPROVEMENT
                            </span>

                            <h3>Areas to Improve</h3>
                        </div>
                    </div>

                    ${createList(analysis.areas_to_improve)}

                </div>


                <!-- Recommended Roles -->
                <div class="analysis-card roles-analysis-card">

                    <div class="analysis-card-header">
                        <span class="analysis-card-icon">🎯</span>

                        <div>
                            <span class="card-label">
                                CAREER DIRECTION
                            </span>

                            <h3>Recommended Roles</h3>
                        </div>
                    </div>

                    ${createList(analysis.recommended_roles)}

                </div>

            </div>

        </section>
    `;
}
const savedAnalysis = localStorage.getItem("resumeAnalysis");

if (savedAnalysis) {
    const analysis = JSON.parse(savedAnalysis);
    renderResumeAnalysis(analysis);
}
// ================================
// INTERVIEW QUESTION SELECTOR
// ================================

const questionSelect =
    document.getElementById("questionSelect");


function populateQuestionSelector(data) {

    questionSelect.innerHTML = `
        <option value="">
            Select an interview question
        </option>
    `;

    const categories = [
        {
            name: "Technical",
            questions: data.technical_questions || []
        },
        {
            name: "HR",
            questions: data.hr_questions || []
        },
        {
            name: "Project",
            questions: data.project_questions || []
        }
    ];

    categories.forEach(category => {

        const group =
            document.createElement("optgroup");

        group.label = category.name;

        category.questions.forEach((item, index) => {

            let question;

            if (typeof item === "object" && item !== null) {

                question =
                    item.question ||
                    item.text ||
                    item.title ||
                    "Question unavailable";

            } else {

                question = item;

            }

            const option =
                document.createElement("option");

            option.value = question;

            option.textContent =
                `${index + 1}. ${question}`;

            group.appendChild(option);

        });

        questionSelect.appendChild(group);

    });
}
// ================================
// INTERVIEW INTELLIGENCE
// ================================

const generateInterviewButton =
    document.getElementById("generateInterviewButton");

generateInterviewButton.addEventListener("click", async function () {

    const interviewResult =
        document.getElementById("interviewResult");

    const technicalQuestions =
        document.getElementById("technicalQuestions");

    const hrQuestions =
        document.getElementById("hrQuestions");

    const projectQuestions =
        document.getElementById("projectQuestions");

    // Check resume
    if (!resumeText) {

        interviewResult.textContent =
            "Please analyse your resume first.";

        return;
    }

    // Get job description
    const jobDescription =
        document.getElementById("jobDescription").value;

    if (!jobDescription.trim()) {

        interviewResult.textContent =
            "Please enter a job description first.";

        return;
    }

    interviewResult.textContent =
        "Generating interview questions with AI...";

    technicalQuestions.innerHTML = "";
    hrQuestions.innerHTML = "";
    projectQuestions.innerHTML = "";

    try {

        const response = await fetch(
            "http://127.0.0.1:8000/generate-interview",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    resume_text: resumeText,
                    job_description: jobDescription
                })
            }
        );

        const data = await response.json();

        console.log("Interview Data:", data);

        // Save interview questions
        localStorage.setItem(
            "interviewQuestions",
            JSON.stringify(data)
        );
        populateQuestionSelector(data);

        interviewResult.textContent =
            "Interview questions generated successfully!";

        // Technical Questions
        technicalQuestions.innerHTML = `
            <div class="card">
                <h2>💻 Technical Questions</h2>
                ${createQuestionList(data.technical_questions)}
            </div>
        `;

        // HR Questions
        hrQuestions.innerHTML = `
            <div class="card">
                <h2>👤 HR Questions</h2>
                ${createQuestionList(data.hr_questions)}
            </div>
        `;

        // Project Questions
        projectQuestions.innerHTML = `
            <div class="card">
                <h2>📂 Project Questions</h2>
                ${createQuestionList(data.project_questions)}   
            </div>
        `;

    } catch (error) {

        interviewResult.textContent =
            "Something went wrong while generating interview questions.";

        console.error(error);

    }
    


});
// ================================
// INTERVIEW ANSWER EVALUATION
// ================================

const evaluateAnswerButton =
    document.getElementById("evaluateAnswerButton");

evaluateAnswerButton.addEventListener("click", async function () {

    const question =
        document.getElementById("questionSelect").value;

    const answer =
        document.getElementById("answerInput").value;

    const evaluationResult =
        document.getElementById("evaluationResult");

    if (!question) {
        evaluationResult.textContent =
            "Please select an interview question.";

        return;
    }

    if (!answer.trim()) {
        evaluationResult.textContent =
            "Please enter your answer.";

        return;
    }

    evaluationResult.textContent =
        "Evaluating your answer with AI...";

    try {

        const jobDescription =
            document.getElementById("jobDescription").value;

        const response = await fetch(
            "http://127.0.0.1:8000/evaluate-answer",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    question: question,
                    answer: answer,
                    resume_text: resumeText,
                    job_description: jobDescription
                })
            }
        );

        const data = await response.json();

        console.log("Evaluation Data:", data);
        // Save evaluation for progress tracking
        const savedEvaluations =
            JSON.parse(
                localStorage.getItem("interviewEvaluations") || "[]"
            );

        savedEvaluations.push({
            question: question,
            score: data.score
        });

        localStorage.setItem(
            "interviewEvaluations",
            JSON.stringify(savedEvaluations)
        );

        updateInterviewProgress();
        updateCareerOverview();

        if (data.error) {
            evaluationResult.textContent =
                "AI evaluation failed.";

            console.error(data);
            return;
        }

        evaluationResult.innerHTML = `
            <div class="card">

                <h2>📊 Evaluation Score</h2>

                <div class="score">
                    ${data.score}/10
                </div>

            </div>

            <div class="card">

                <h2>✅ Strengths</h2>

                ${createList(data.strengths)}

            </div>

            <div class="card">

                <h2>⚠️ Improvements</h2>

                ${createList(data.improvements)}

            </div>

            <div class="card">

                <h2>💡 Better Answer</h2>

                <p>
                    ${data.better_answer}
                </p>

            </div>
        `;

    } catch (error) {

        evaluationResult.textContent =
            "Something went wrong while evaluating the answer.";

        console.error(error);

    }

});
// ================================
// INTERVIEW PROGRESS TRACKING
// ================================

function updateInterviewProgress() {

    const progressResult =
        document.getElementById("progressResult");

    const savedEvaluations =
        JSON.parse(
            localStorage.getItem("interviewEvaluations") || "[]"
        );

    const totalQuestions = 15;
    const answeredQuestions = savedEvaluations.length;

    let averageScore = 0;

    if (answeredQuestions > 0) {

        const totalScore =
            savedEvaluations.reduce(
                (sum, item) => sum + Number(item.score),
                0
            );

        averageScore =
            (totalScore / answeredQuestions).toFixed(1);
    }

    const progress =
        Math.round(
            (answeredQuestions / totalQuestions) * 100
        );

    progressResult.innerHTML = `
        <div class="card">

            <h3>Questions Answered</h3>

            <h2>
                ${answeredQuestions} / ${totalQuestions}
            </h2>

        </div>

        <div class="card">

            <h3>Average Score</h3>

            <h2>
                ${averageScore} / 10
            </h2>

        </div>

        <div class="card">

            <h3>Preparation Progress</h3>

            <h2>
                ${progress}%
            </h2>

        </div>
    `;
}


// Load progress when page opens
updateInterviewProgress();
// ================================
// SKILL GAP ANALYSIS
// ================================

const skillGapButton =
    document.getElementById("skillGapButton");

skillGapButton.addEventListener("click", async function () {

    const skillGapResult =
        document.getElementById("skillGapResult");

    const jobDescription =
        document.getElementById("jobDescription").value;

    if (!resumeText) {
        skillGapResult.textContent =
            "Please analyse your resume first.";
        return;
    }

    if (!jobDescription.trim()) {
        skillGapResult.textContent =
            "Please enter a job description first.";
        return;
    }

    skillGapResult.textContent =
        "Analysing skill gaps with AI...";

    try {

        const response = await fetch(
            "http://127.0.0.1:8000/skill-gap",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    resume_text: resumeText,
                    job_description: jobDescription
                })
            }
        );

        const data = await response.json();

        console.log("Skill Gap Data:", data);

        if (data.error) {
            skillGapResult.textContent =
                "Skill gap analysis failed.";
            console.error(data);
            return;
        }

        skillGapResult.innerHTML = `

            <div class="card">
                <h2>💻 Skills You Have</h2>
                ${createList(data.skills_you_have)}
            </div>

            <div class="card">
                <h2>📋 Required Skills</h2>
                ${createList(data.required_skills)}
            </div>

            <div class="card">
                <h2>❌ Missing Skills</h2>
                ${createList(data.missing_skills)}
            </div>

            <div class="card">
                <h2>🔥 Priority Skills to Learn</h2>
                ${createList(data.priority_skills)}
            </div>

        `;

    } catch (error) {

        skillGapResult.textContent =
            "Something went wrong while analysing skill gaps.";

        console.error(error);

    }

});
// ================================
// AI CAREER ROADMAP
// ================================

const careerRoadmapButton =
    document.getElementById("careerRoadmapButton");

careerRoadmapButton.addEventListener("click", async function () {

    const careerRoadmapResult =
        document.getElementById("careerRoadmapResult");

    const jobDescription =
        document.getElementById("jobDescription").value;

    if (!resumeText) {
        careerRoadmapResult.textContent =
            "Please analyse your resume first.";
        return;
    }

    if (!jobDescription.trim()) {
        careerRoadmapResult.textContent =
            "Please enter a job description first.";
        return;
    }

    careerRoadmapResult.textContent =
        "Generating your AI career roadmap...";

    try {

        const response = await fetch(
            "http://127.0.0.1:8000/career-roadmap",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    resume_text: resumeText,
                    job_description: jobDescription
                })
            }
        );

        const data = await response.json();

        console.log("Career Roadmap Data:", data);

        if (data.error) {
            careerRoadmapResult.textContent =
                "Career roadmap generation failed.";
            console.error(data);
            return;
        }

        careerRoadmapResult.innerHTML = `

            <div class="card">

                <h2>🎯 Career Goal</h2>

                <p>
                    ${data.career_goal}
                </p>

            </div>

            ${data.phases.map((phase, index) => `

                <div class="card">

                    <h2>
                        Phase ${index + 1}: ${phase.phase}
                    </h2>

                    <p>
                        <strong>Duration:</strong>
                        ${phase.duration}
                    </p>

                    <h3>📚 Skills</h3>

                    ${createList(phase.skills)}

                    <h3>🚀 Actions</h3>

                    ${createList(phase.actions)}

                </div>

            `).join("")}

        `;

    } catch (error) {

        careerRoadmapResult.textContent =
            "Something went wrong while generating the roadmap.";

        console.error(error);

    }

});
// ================================
// AI JOB RECOMMENDATIONS
// ================================

const jobRecommendationsButton =
    document.getElementById("jobRecommendationsButton");

jobRecommendationsButton.addEventListener("click", async function () {

    const result =
        document.getElementById("jobRecommendationsResult");

    const jobDescription =
        document.getElementById("jobDescription").value;

    if (!resumeText) {
        result.textContent =
            "Please analyse your resume first.";
        return;
    }

    if (!jobDescription.trim()) {
        result.textContent =
            "Please enter a job description first.";
        return;
    }

    result.textContent =
        "Finding suitable jobs with AI...";

    try {

        const response = await fetch(
            "http://127.0.0.1:8000/job-recommendations",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    resume_text: resumeText,
                    job_description: jobDescription
                })
            }
        );

        const data = await response.json();

        console.log("Job Recommendations:", data);

        if (data.error) {
            result.textContent =
                "Job recommendation failed.";
            console.error(data);
            return;
        }

        result.innerHTML = `

            ${data.recommended_jobs.map((job, index) => `

                <div class="card">

                    <h2>
                        ${index + 1}. ${job.job_title}
                    </h2>

                    <h3>
                        🎯 Match: ${job.match_percentage}%
                    </h3>

                    <p>
                        ${job.reason}
                    </p>

                    <h3>💻 Required Skills</h3>

                    ${createList(job.required_skills)}

                </div>

            `).join("")}

        `;

    } catch (error) {

        result.textContent =
            "Something went wrong while finding recommended jobs.";

        console.error(error);

    }

});
// ================================
// RESUME IMPROVEMENT
// ================================

const resumeImprovementButton =
    document.getElementById("resumeImprovementButton");

resumeImprovementButton.addEventListener("click", async function () {

    const result =
        document.getElementById("resumeImprovementResult");

    const jobDescription =
        document.getElementById("jobDescription").value;

    if (!resumeText) {
        result.textContent =
            "Please analyse your resume first.";
        return;
    }

    if (!jobDescription.trim()) {
        result.textContent =
            "Please enter a job description first.";
        return;
    }

    result.textContent =
        "Analysing your resume for improvements...";

    try {

        const response = await fetch(
            "http://127.0.0.1:8000/resume-improvement",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    resume_text: resumeText,
                    job_description: jobDescription
                })
            }
        );

        const data = await response.json();

        console.log("Resume Improvement Data:", data);

        if (data.error) {
            result.textContent =
                "Resume improvement analysis failed.";
            console.error(data);
            return;
        }

        result.innerHTML = `

            <div class="card">

                <h2>🔴 High Priority</h2>

                ${createList(data.high_priority)}

            </div>

            <div class="card">

                <h2>🟠 Medium Priority</h2>

                ${createList(data.medium_priority)}

            </div>

            <div class="card">

                <h2>🟢 Low Priority</h2>

                ${createList(data.low_priority)}

            </div>

            <div class="card">

                <h2>📋 Overall Summary</h2>

                <p>
                    ${data.summary}
                </p>

            </div>

        `;

    } catch (error) {

        result.textContent =
            "Something went wrong while improving the resume.";

        console.error(error);

    }

});
// ================================
// CAREER REPORT DOWNLOAD
// ================================

const downloadReportButton =
    document.getElementById("downloadReportButton");

downloadReportButton.addEventListener("click", function () {

    const savedAnalysis =
        JSON.parse(
            localStorage.getItem("resumeAnalysis") || "null"
        );

    const savedJobMatch =
        JSON.parse(
            localStorage.getItem("jobMatch") || "null"
        );

    const savedInterview =
        JSON.parse(
            localStorage.getItem("interviewQuestions") || "null"
        );

    const savedEvaluations =
        JSON.parse(
            localStorage.getItem("interviewEvaluations") || "[]"
        );

    if (!savedAnalysis) {
        alert("Please analyse your resume first.");
        return;
    }

    let averageScore = 0;

    if (savedEvaluations.length > 0) {

        const total =
            savedEvaluations.reduce(
                (sum, item) => sum + Number(item.score),
                0
            );

        averageScore =
            (total / savedEvaluations.length).toFixed(1);
    }

    const report = `
<!DOCTYPE html>

<html>

<head>

    <title>CareerAI Career Report</title>

    <style>

        body {
            font-family: Arial, sans-serif;
            max-width: 900px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.6;
        }

        h1 {
            text-align: center;
        }

        h2 {
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
        }

        .card {
            margin-bottom: 25px;
        }

    </style>

</head>

<body>

    <h1>CareerAI Career Report</h1>

    <p>
        AI-Powered Job & Interview Intelligence Platform
    </p>

    <hr>

    <div class="card">

        <h2>📊 Resume Score</h2>

        <h3>
            ${savedAnalysis.resume_score}/100
        </h3>

    </div>


    <div class="card">

        <h2>👤 Candidate</h2>

        <p>
            ${savedAnalysis.candidate_name || "Not available"}
        </p>

    </div>


    <div class="card">

        <h2>💻 Technical Skills</h2>

        ${createList(savedAnalysis.technical_skills)}

    </div>


    <div class="card">

        <h2>📂 Projects</h2>

        ${createList(savedAnalysis.projects)}

    </div>


    <div class="card">

        <h2>💪 Strengths</h2>

        ${createList(savedAnalysis.strengths)}

    </div>


    <div class="card">

        <h2>⚠️ Areas to Improve</h2>

        ${createList(savedAnalysis.areas_to_improve)}

    </div>


    ${
        savedJobMatch
        ? `

        <div class="card">

            <h2>🎯 Job Match</h2>

            <h3>
                ${savedJobMatch.match_score || 0}%
            </h3>

            <h3>Matching Skills</h3>

            ${createList(savedJobMatch.matching_skills)}

            <h3>Missing Skills</h3>

            ${createList(savedJobMatch.missing_skills)}

        </div>

        `
        : ""
    }


    <div class="card">

        <h2>🧠 Interview Progress</h2>

        <p>
            Questions Evaluated:
            ${savedEvaluations.length}
        </p>

        <p>
            Average Score:
            ${averageScore}/10
        </p>

    </div>


    ${
        savedInterview
        ? `

        <div class="card">

            <h2>💻 Technical Interview Questions</h2>

            ${createQuestionList(savedInterview.technical_questions)}

            <h2>👤 HR Interview Questions</h2>

            ${createQuestionList(savedInterview.hr_questions)}

            <h2>📂 Project Interview Questions</h2>

            ${createQuestionList(savedInterview.project_questions)}

        </div>

        `
        : ""
    }


    <hr>

    <p>
        Generated by CareerAI
    </p>

</body>

</html>
`;

    const blob =
        new Blob(
            [report],
            { type: "text/html" }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        "CareerAI-Career-Report.html";

    link.click();

    URL.revokeObjectURL(url);

});
// =========================================
// CAREER OVERVIEW DASHBOARD
// =========================================

function updateCareerOverview() {

    const resumeScoreElement =
        document.getElementById("overviewResumeScore");

    const jobMatchElement =
        document.getElementById("overviewJobMatch");

    const interviewProgressElement =
        document.getElementById("overviewInterviewProgress");

    const skillsElement =
        document.getElementById("overviewSkills");


    // Resume Score
    const savedResumeAnalysis =
        JSON.parse(
            localStorage.getItem("resumeAnalysis") || "null"
        );

    if (savedResumeAnalysis) {

        const score =
            savedResumeAnalysis.resume_score;

        resumeScoreElement.textContent =
            score !== undefined
                ? `${score}/100`
                : "--";
    }


    // Job Match
    const savedJobMatch =
        JSON.parse(
            localStorage.getItem("jobMatch") || "null"
        );

    if (savedJobMatch) {

        const score =
            savedJobMatch.match_score;

        jobMatchElement.textContent =
            score !== undefined
                ? `${score}%`
                : "--";
    }


    // Interview Progress
    const savedEvaluations =
        JSON.parse(
            localStorage.getItem("interviewEvaluations") || "[]"
        );

    const totalQuestions = 15;

    const answeredQuestions =
        savedEvaluations.length;

    const progress =
        Math.min(
            Math.round(
                (answeredQuestions / totalQuestions) * 100
            ),
            100
        );

    interviewProgressElement.textContent =
        `${progress}%`;


    // Skills Detected
    if (savedResumeAnalysis) {

        const skills =
            savedResumeAnalysis.technical_skills || [];

        skillsElement.textContent =
            skills.length;
    }
}


// Update dashboard when page loads
updateCareerOverview();

/* ========================================
   STEP 5 - ACTIVE SIDEBAR NAVIGATION
   ======================================== */

const navItems = document.querySelectorAll(".nav-item");

const sections = [
    document.getElementById("careerOverview"),
    document.getElementById("resumeSection"),
    document.getElementById("interviewSection"),
    document.getElementById("skillGapAnalysis"),
    document.getElementById("careerRoadmap"),
    document.getElementById("jobRecommendations"),
    document.getElementById("resumeImprovement")
].filter(section => section !== null);


function updateActiveNavigation() {

    let currentSection = "";

    sections.forEach(section => {

        const sectionTop =
            section.getBoundingClientRect().top;

        if (sectionTop <= 180) {
            currentSection = section.id;
        }

    });


    navItems.forEach(item => {

        item.classList.remove("active");

        const target =
            item.getAttribute("href");

        if (target === `#${currentSection}`) {
            item.classList.add("active");
        }

    });
}


window.addEventListener(
    "scroll",
    updateActiveNavigation
);

updateActiveNavigation();

function updateCareerReadiness() {

    const resumeAnalysis = JSON.parse(
        localStorage.getItem("resumeAnalysis") || "null"
    );

    const jobMatch = JSON.parse(
        localStorage.getItem("jobMatch") || "null"
    );

    const evaluations = JSON.parse(
        localStorage.getItem("interviewEvaluations") || "[]"
    );

    const resumeScore = resumeAnalysis
        ? Number(resumeAnalysis.resume_score || 0)
        : 0;

    const jobMatchScore = jobMatch
        ? Number(
            jobMatch.overall_match_score ??
            jobMatch.match_score ??
            0
        )
        : 0;

    const totalQuestions = 15;

    const interviewProgress = Math.min(
        Math.round(
            (evaluations.length / totalQuestions) * 100
        ),
        100
    );

    let skillsScore = 0;

    if (resumeAnalysis) {
        const skills = resumeAnalysis.technical_skills || [];

        skillsScore = Math.min(
            Math.round((skills.length / 10) * 100),
            100
        );
    }

    const readiness = Math.round(
        (resumeScore * 0.25) +
        (jobMatchScore * 0.35) +
        (interviewProgress * 0.20) +
        (skillsScore * 0.20)
    );

    document.getElementById("careerReadinessScore").textContent = readiness;

    let level = "Getting Started";

    if (readiness >= 80) {
        level = "Excellent";
    } else if (readiness >= 65) {
        level = "Strong Progress";
    } else if (readiness >= 50) {
        level = "Moderate Progress";
    }

    document.getElementById("careerReadinessLevel").textContent = level;

    document.getElementById("readinessResume").textContent = `${resumeScore}%`;
    document.getElementById("readinessJobMatch").textContent = `${jobMatchScore}%`;
    document.getElementById("readinessInterview").textContent = `${interviewProgress}%`;
    document.getElementById("readinessSkills").textContent = `${skillsScore}%`;

    document.getElementById("readinessResumeBar").style.width = `${resumeScore}%`;
    document.getElementById("readinessJobMatchBar").style.width = `${jobMatchScore}%`;
    document.getElementById("readinessInterviewBar").style.width = `${interviewProgress}%`;
    document.getElementById("readinessSkillsBar").style.width = `${skillsScore}%`;
}

updateCareerReadiness();