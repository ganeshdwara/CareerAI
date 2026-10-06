from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
from dotenv import load_dotenv
from google import genai
import json

# Load environment variables
load_dotenv()

# Create Gemini client
client = genai.Client()

app = FastAPI()

# Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "CareerAI backend is running"}
def calculate_resume_score(analysis):

    score = 0

    # Education - 20 points
    if analysis.get("education"):
        score += 20

    # Technical Skills - 25 points
    skills = analysis.get("technical_skills", [])

    if len(skills) >= 10:
        score += 25
    elif len(skills) >= 7:
        score += 20
    elif len(skills) >= 4:
        score += 15
    elif len(skills) >= 1:
        score += 10

    # Projects - 25 points
    projects = analysis.get("projects", [])

    if len(projects) >= 3:
        score += 25
    elif len(projects) == 2:
        score += 20
    elif len(projects) == 1:
        score += 15

    # Work Experience - 10 points
    experience = analysis.get("work_experience", [])

    if len(experience) >= 2:
        score += 10
    elif len(experience) == 1:
        score += 7

    # Certifications - 10 points
    certifications = analysis.get("certifications", [])

    if len(certifications) >= 3:
        score += 10
    elif len(certifications) == 2:
        score += 7
    elif len(certifications) == 1:
        score += 4

    # Profile completeness - 10 points
    completeness_items = [
        analysis.get("candidate_name"),
        analysis.get("education"),
        analysis.get("technical_skills"),
        analysis.get("projects"),
        analysis.get("strengths")
    ]

    completed = sum(bool(item) for item in completeness_items)

    score += completed * 2

    return min(score, 100)
from pydantic import BaseModel


class JobMatchRequest(BaseModel):
    resume_text: str
    job_description: str
@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):

    # Read PDF
    reader = PdfReader(file.file)

    text = ""

    for page in reader.pages:
        text += page.extract_text() or ""

    # Clean extracted text
    text = " ".join(text.split())

    prompt = f"""
You are an AI career assistant.

Analyse the following resume.

Resume:
{text}

Return ONLY valid JSON.

Do not use markdown.
Do not use ```json.
Do not add any explanation outside the JSON.

Use exactly this structure:

{{
    "candidate_name": "",
    "education": [],
    "technical_skills": [],
    "projects": [],
    "work_experience": [],
    "certifications": [],
    "strengths": [],
    "areas_to_improve": [],
    "recommended_roles": [],
    "resume_score": 0
}}

Rules:
- resume_score must be a number from 0 to 100.
- Use empty arrays when information is not available.
- Do not invent information.
- Keep each item concise.
"""

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt
    )

    # Get Gemini response
    ai_text = response.text.strip()

    # Convert Gemini JSON text into Python dictionary
    try:
        analysis = json.loads(ai_text)
        analysis["resume_score"] = calculate_resume_score(analysis)
    except json.JSONDecodeError:
        analysis = {
            "error": "AI returned an invalid JSON response",
            "raw_response": ai_text
        }

    return {
        "filename": file.filename,
        "resume_text": text,
        "analysis": analysis
    }
@app.post("/match-job")
async def match_job(request: JobMatchRequest):

    prompt = f"""
You are an advanced AI job matching system.

Your task is to carefully compare a candidate's resume with a job description.

CANDIDATE RESUME:
{request.resume_text}

JOB DESCRIPTION:
{request.job_description}

Analyse the candidate using these factors:

1. Technical skill match
2. Education match
3. Work experience match
4. Project relevance
5. Relevant keywords and concepts
6. Transferable/related skills

Important rules:

- Only consider skills clearly supported by the resume.
- Do not assume the candidate knows a technology just because it is related to another technology.
- Distinguish between exact matches and related skills.
- Identify important missing skills.
- Give more importance to skills that are clearly important in the job description.
- Consider the overall context of the resume, not just keyword counting.
- Be realistic for a fresher.
- Do not invent experience, projects, education or skills.

Return ONLY valid JSON.
Do not use markdown.
Do not use ```json.
Do not add any explanation outside the JSON.

Use EXACTLY this structure:

{{
    "overall_match_score": 0,

    "match_level": "",

    "skills_match_score": 0,
    "education_match_score": 0,
    "experience_match_score": 0,
    "project_match_score": 0,

    "required_skills": [],

    "matching_skills": [],

    "missing_skills": [],

    "related_skills": [],

    "education_match": "",
    "experience_match": "",
    "project_relevance": "",

    "match_reasons": [],

    "score_reducing_factors": [],

    "recommended_actions": []
}}

Rules for scores:

- All scores must be numbers from 0 to 100.
- overall_match_score must represent the overall suitability of the candidate.
- skills_match_score represents technical skill alignment.
- education_match_score represents how well the candidate's education matches the job.
- experience_match_score represents relevant work experience.
- project_match_score represents how relevant the candidate's projects are.

Match level must be exactly one of:

"Excellent Match"
"Strong Match"
"Moderate Match"
"Weak Match"

Keep every list concise and useful.
"""

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt
    )

    ai_text = response.text.strip()

    try:

        match_data = json.loads(ai_text)

        # Keep backward compatibility with the existing frontend.
        match_data["match_score"] = match_data.get(
            "overall_match_score",
            0
        )

    except json.JSONDecodeError:

        match_data = {
            "error": "AI returned invalid JSON",
            "raw_response": ai_text
        }

    return match_data
class InterviewRequest(BaseModel):
    resume_text: str
    job_description: str


@app.post("/generate-interview")
async def generate_interview(request: InterviewRequest):

    prompt = f"""
You are an AI interview preparation assistant.

Generate interview questions for the candidate based on their resume
and the target job description.

RESUME:
{request.resume_text}

JOB DESCRIPTION:
{request.job_description}

Return ONLY valid JSON.

Do not use markdown.
Do not use ```json.
Do not add any explanation outside the JSON.

Use exactly this structure:

{{
    "technical_questions": [],
    "hr_questions": [],
    "project_questions": []
}}

Rules:

- technical_questions = 5 technical questions relevant to the job.
- hr_questions = 5 common HR questions suitable for this candidate.
- project_questions = 5 questions based on projects mentioned in the resume.
- Questions should be suitable for a fresher.
- Make questions specific to the candidate's resume and job description.
- Do not invent projects or technologies that are not mentioned in the resume.
"""

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt
    )

    ai_text = response.text.strip()

    try:

        interview_data = json.loads(ai_text)

    except json.JSONDecodeError:

        interview_data = {
            "error": "AI returned invalid JSON",
            "raw_response": ai_text
        }

    return interview_data

class AnswerEvaluationRequest(BaseModel):
    question: str
    answer: str
    resume_text: str
    job_description: str


@app.post("/evaluate-answer")
async def evaluate_answer(request: AnswerEvaluationRequest):

    prompt = f"""
You are an AI interview evaluator.

Evaluate the candidate's answer to the interview question.

INTERVIEW QUESTION:
{request.question}

CANDIDATE ANSWER:
{request.answer}

CANDIDATE RESUME:
{request.resume_text}

JOB DESCRIPTION:
{request.job_description}

Return ONLY valid JSON.

Do not use markdown.
Do not use ```json.
Do not add explanations outside the JSON.

Use exactly this structure:

{{
    "score": 0,
    "strengths": [],
    "improvements": [],
    "better_answer": ""
}}

Rules:
- score must be a number from 0 to 10.
- strengths = specific things the candidate did well.
- improvements = specific things the candidate should improve.
- better_answer = a concise example of a stronger answer.
- Evaluate the answer based on correctness, relevance, clarity, and completeness.
- Do not judge grammar too harshly.
"""

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt
    )

    ai_text = response.text.strip()

    try:

        evaluation = json.loads(ai_text)

    except json.JSONDecodeError:

        evaluation = {
            "error": "AI returned invalid JSON",
            "raw_response": ai_text
        }

    return evaluation
# ================================
# SKILL GAP ANALYSIS
# ================================

class SkillGapRequest(BaseModel):
    resume_text: str
    job_description: str


@app.post("/skill-gap")
async def skill_gap(request: SkillGapRequest):

    prompt = f"""
You are an AI career skill-gap analyst.

Analyse the candidate's resume against the target job description.

RESUME:
{request.resume_text}

JOB DESCRIPTION:
{request.job_description}

Return ONLY valid JSON.

Do not use markdown.
Do not use ```json.
Do not add explanations outside the JSON.

Use exactly this structure:

{{
    "skills_you_have": [],
    "required_skills": [],
    "missing_skills": [],
    "priority_skills": []
}}

Rules:

- skills_you_have = relevant skills clearly present in the resume.
- required_skills = important skills required by the job description.
- missing_skills = required skills that are not clearly present in the resume.
- priority_skills = the most important missing skills the candidate should learn first.
- Do not invent skills from the resume.
- Keep the lists concise.
"""

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt
    )

    ai_text = response.text.strip()

    try:

        skill_gap_data = json.loads(ai_text)

    except json.JSONDecodeError:

        skill_gap_data = {
            "error": "AI returned invalid JSON",
            "raw_response": ai_text
        }

    return skill_gap_data
# ================================
# AI CAREER ROADMAP
# ================================

class CareerRoadmapRequest(BaseModel):
    resume_text: str
    job_description: str


@app.post("/career-roadmap")
async def career_roadmap(request: CareerRoadmapRequest):

    prompt = f"""
You are an AI career roadmap advisor.

Create a practical career roadmap for the candidate based on their
resume and target job description.

RESUME:
{request.resume_text}

JOB DESCRIPTION:
{request.job_description}

Return ONLY valid JSON.

Do not use markdown.
Do not use ```json.
Do not add explanations outside the JSON.

Use exactly this structure:

{{
    "career_goal": "",
    "phases": [
        {{
            "phase": "",
            "duration": "",
            "skills": [],
            "actions": []
        }}
    ]
}}

Rules:

- Create 4 practical career phases.
- Each phase should have a realistic duration.
- skills = skills the candidate should learn or improve.
- actions = practical things the candidate should do.
- Make the roadmap relevant to the target job.
- Consider the candidate's current skills.
- Focus on skills and actions that improve job readiness.
- Do not invent experience the candidate does not have.
"""

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt
    )

    ai_text = response.text.strip()

    try:

        roadmap_data = json.loads(ai_text)

    except json.JSONDecodeError:

        roadmap_data = {
            "error": "AI returned invalid JSON",
            "raw_response": ai_text
        }

    return roadmap_data
# ================================
# AI JOB RECOMMENDATIONS
# ================================

class JobRecommendationRequest(BaseModel):
    resume_text: str
    job_description: str


@app.post("/job-recommendations")
async def job_recommendations(request: JobRecommendationRequest):

    prompt = f"""
You are an AI career recommendation assistant.

Recommend suitable job roles for the candidate based on their resume
and target job description.

RESUME:
{request.resume_text}

TARGET JOB:
{request.job_description}

Return ONLY valid JSON.

Do not use markdown.
Do not use ```json.
Do not add explanations outside the JSON.

Use exactly this structure:

{{
    "recommended_jobs": [
        {{
            "job_title": "",
            "match_percentage": 0,
            "reason": "",
            "required_skills": []
        }}
    ]
}}

Rules:

- Recommend exactly 5 suitable job roles.
- match_percentage must be between 0 and 100.
- reason should briefly explain why the role suits the candidate.
- required_skills should contain important skills for that role.
- Base recommendations on the candidate's actual resume skills.
- Do not invent skills or experience.
- Include entry-level/fresher-friendly roles where appropriate.
"""

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt
    )

    ai_text = response.text.strip()

    try:

        recommendation_data = json.loads(ai_text)

    except json.JSONDecodeError:

        recommendation_data = {
            "error": "AI returned invalid JSON",
            "raw_response": ai_text
        }

    return recommendation_data
# ================================
# RESUME IMPROVEMENT
# ================================

class ResumeImprovementRequest(BaseModel):
    resume_text: str
    job_description: str


@app.post("/resume-improvement")
async def resume_improvement(request: ResumeImprovementRequest):

    prompt = f"""
You are an AI resume improvement assistant.

Analyse the candidate's resume against the target job description
and provide practical suggestions to improve the resume.

RESUME:
{request.resume_text}

TARGET JOB:
{request.job_description}

Return ONLY valid JSON.

Do not use markdown.
Do not use ```json.
Do not add explanations outside the JSON.

Use exactly this structure:

{{
    "high_priority": [],
    "medium_priority": [],
    "low_priority": [],
    "summary": ""
}}

Rules:

- high_priority = the most important changes needed.
- medium_priority = useful improvements that can strengthen the resume.
- low_priority = minor improvements such as formatting or wording.
- summary = a short overall assessment.
- Suggestions must be specific to the candidate's resume and target job.
- Do not invent experience, projects, skills, or achievements.
- Keep suggestions practical and concise.
"""

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt
    )

    ai_text = response.text.strip()

    try:

        improvement_data = json.loads(ai_text)

    except json.JSONDecodeError:

        improvement_data = {
            "error": "AI returned invalid JSON",
            "raw_response": ai_text
        }

    return improvement_data

