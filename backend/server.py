from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import bcrypt
import jwt
import secrets
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from groq import Groq

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Groq client
groq_client = Groq(api_key=os.environ.get('GROQ_API_KEY'))

# JWT config
JWT_ALGORITHM = "HS256"

def get_jwt_secret():
    return os.environ["JWT_SECRET"]

# Password helpers
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

# Token helpers
def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=60), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

# Auth dependency
async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Optional auth - returns user or None
async def get_optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

app = FastAPI()
api_router = APIRouter(prefix="/api")

# --- Pydantic Models ---
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class GenerateRequest(BaseModel):
    subject: str
    grade_level: str
    topic: str
    difficulty: str = "medium"

class LessonRequest(BaseModel):
    topic: str
    subject: Optional[str] = ""
    grade_level: Optional[str] = ""

# --- Auth Endpoints ---
@api_router.post("/auth/register")
async def register(req: RegisterRequest, response: Response):
    email = req.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = hash_password(req.password)
    user_doc = {
        "name": req.name,
        "email": email,
        "password_hash": hashed,
        "role": "user",
        "generations_count": 0,
        "plan": "free",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"id": user_id, "name": req.name, "email": email, "role": "user", "plan": "free", "generations_count": 0}

@api_router.post("/auth/login")
async def login(req: LoginRequest, response: Response, request: Request):
    email = req.email.lower().strip()
    # Brute force check
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier}, {"_id": 0})
    if attempt and attempt.get("count", 0) >= 5:
        lockout_until = attempt.get("locked_until")
        if lockout_until and datetime.now(timezone.utc).isoformat() < lockout_until:
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
        else:
            await db.login_attempts.delete_one({"identifier": identifier})

    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(req.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}},
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await db.login_attempts.delete_one({"identifier": identifier})
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {
        "id": user_id,
        "name": user.get("name", ""),
        "email": email,
        "role": user.get("role", "user"),
        "plan": user.get("plan", "free"),
        "generations_count": user.get("generations_count", 0)
    }

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}

@api_router.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    return user

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user_id = str(user["_id"])
        access_token = create_access_token(user_id, user["email"])
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
        return {"message": "Token refreshed"}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# --- Guest tracking ---
GUEST_LIMIT = 5

async def check_guest_limit(request: Request):
    ip = request.client.host if request.client else "unknown"
    guest = await db.guest_usage.find_one({"ip": ip}, {"_id": 0})
    if guest and guest.get("count", 0) >= GUEST_LIMIT:
        raise HTTPException(status_code=403, detail="Guest limit reached. Please sign up for more generations.")
    return ip

async def increment_guest_usage(ip: str):
    await db.guest_usage.update_one(
        {"ip": ip},
        {"$inc": {"count": 1}, "$set": {"last_used": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )

async def increment_user_generations(user_id: str):
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$inc": {"generations_count": 1}})

# --- AI Generation Endpoints ---
def call_groq(system_prompt: str, user_prompt: str) -> str:
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.7,
        max_tokens=4096,
    )
    return response.choices[0].message.content

@api_router.post("/generate/worksheet")
async def generate_worksheet(req: GenerateRequest, request: Request):
    user = await get_optional_user(request)
    if not user:
        ip = await check_guest_limit(request)

    system_prompt = """You are an expert educational content creator. Generate a professional worksheet with the following format:

TITLE: [Subject] - [Topic] Worksheet
Grade Level: [Grade]
Difficulty: [Difficulty]

---

SECTION A: Multiple Choice Questions (7-8 questions)
Format each as:
Q1. [Question text]
   a) [Option]
   b) [Option]
   c) [Option]
   d) [Option]

SECTION B: Short Answer Questions (5-7 questions)
Format each as:
Q[n]. [Question text]

---
ANSWER KEY:
[List all correct answers]

Make the content grade-appropriate, educational, and clearly formatted for printing."""

    user_prompt = f"Create a worksheet for:\nSubject: {req.subject}\nGrade Level: {req.grade_level}\nTopic: {req.topic}\nDifficulty: {req.difficulty}"

    try:
        content = call_groq(system_prompt, user_prompt)
    except Exception as e:
        logging.error(f"Groq API error: {e}")
        raise HTTPException(status_code=500, detail="AI generation failed. Please try again.")

    # Save to history
    gen_doc = {
        "type": "worksheet",
        "subject": req.subject,
        "grade_level": req.grade_level,
        "topic": req.topic,
        "difficulty": req.difficulty,
        "content": content,
        "user_id": user["_id"] if user else None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.generations.insert_one(gen_doc)

    if user:
        await increment_user_generations(user["_id"])
    else:
        await increment_guest_usage(ip)

    return {"content": content, "type": "worksheet"}

@api_router.post("/generate/quiz")
async def generate_quiz(req: GenerateRequest, request: Request):
    user = await get_optional_user(request)
    if not user:
        ip = await check_guest_limit(request)

    system_prompt = """You are an expert educational quiz creator. Generate a professional quiz with the following format:

QUIZ: [Subject] - [Topic]
Grade Level: [Grade]
Difficulty: [Difficulty]
Total Questions: 10-12

---

QUESTIONS:

Q1. [Question text]
   a) [Option]
   b) [Option]
   c) [Option]
   d) [Option]

[Continue for all questions, mix difficulty levels within the set]

---

ANSWER KEY:
Q1: [letter] - [brief explanation]
Q2: [letter] - [brief explanation]
[Continue for all]

---

SCORING:
Each question: [points] points
Total: [total] points
Grade Scale: A (90-100%), B (80-89%), C (70-79%), D (60-69%), F (below 60%)

Make questions progressively harder. Include a mix of recall, comprehension, and application questions."""

    user_prompt = f"Create a quiz for:\nSubject: {req.subject}\nGrade Level: {req.grade_level}\nTopic: {req.topic}\nDifficulty: {req.difficulty}"

    try:
        content = call_groq(system_prompt, user_prompt)
    except Exception as e:
        logging.error(f"Groq API error: {e}")
        raise HTTPException(status_code=500, detail="AI generation failed. Please try again.")

    gen_doc = {
        "type": "quiz",
        "subject": req.subject,
        "grade_level": req.grade_level,
        "topic": req.topic,
        "difficulty": req.difficulty,
        "content": content,
        "user_id": user["_id"] if user else None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.generations.insert_one(gen_doc)

    if user:
        await increment_user_generations(user["_id"])
    else:
        await increment_guest_usage(ip)

    return {"content": content, "type": "quiz"}

@api_router.post("/generate/lesson")
async def generate_lesson(req: LessonRequest, request: Request):
    user = await get_optional_user(request)
    if not user:
        ip = await check_guest_limit(request)

    system_prompt = """You are an expert educator. Create a comprehensive lesson summary with the following structure:

LESSON: [Topic]

---

OVERVIEW:
[2-3 sentence introduction to the topic]

---

KEY CONCEPTS:

1. [Concept Name]
   [Clear explanation in 2-3 sentences]

2. [Concept Name]
   [Clear explanation in 2-3 sentences]

3. [Concept Name]
   [Clear explanation in 2-3 sentences]

[Continue for 4-6 key concepts]

---

REAL-WORLD EXAMPLES:

Example 1: [Title]
[How this concept applies in the real world - 2-3 sentences]

Example 2: [Title]
[How this concept applies in the real world - 2-3 sentences]

Example 3: [Title]
[How this concept applies in the real world - 2-3 sentences]

---

SUMMARY:
[3-4 sentence wrap-up of the key takeaways]

---

DISCUSSION QUESTIONS:
1. [Thought-provoking question]
2. [Thought-provoking question]
3. [Thought-provoking question]

Make the content educational, engaging, and appropriate for classroom use."""

    subject_info = f"\nSubject: {req.subject}" if req.subject else ""
    grade_info = f"\nGrade Level: {req.grade_level}" if req.grade_level else ""
    user_prompt = f"Create a lesson summary for:\nTopic: {req.topic}{subject_info}{grade_info}"

    try:
        content = call_groq(system_prompt, user_prompt)
    except Exception as e:
        logging.error(f"Groq API error: {e}")
        raise HTTPException(status_code=500, detail="AI generation failed. Please try again.")

    gen_doc = {
        "type": "lesson",
        "topic": req.topic,
        "subject": req.subject or "",
        "grade_level": req.grade_level or "",
        "content": content,
        "user_id": user["_id"] if user else None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.generations.insert_one(gen_doc)

    if user:
        await increment_user_generations(user["_id"])
    else:
        await increment_guest_usage(ip)

    return {"content": content, "type": "lesson"}

# --- History ---
@api_router.get("/generations/history")
async def get_history(request: Request):
    user = await get_optional_user(request)
    if not user:
        return {"generations": []}
    generations = await db.generations.find(
        {"user_id": user["_id"]},
        {"_id": 0, "content": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    return {"generations": generations}

@api_router.get("/generations/stats")
async def get_stats(request: Request):
    user = await get_optional_user(request)
    if not user:
        # Get guest stats from IP
        ip = request.client.host if request.client else "unknown"
        guest = await db.guest_usage.find_one({"ip": ip}, {"_id": 0})
        count = guest.get("count", 0) if guest else 0
        return {"total": count, "worksheets": 0, "quizzes": 0, "lessons": 0, "remaining": max(0, GUEST_LIMIT - count), "plan": "guest"}

    pipeline = [
        {"$match": {"user_id": user["_id"]}},
        {"$group": {"_id": "$type", "count": {"$sum": 1}}}
    ]
    results = await db.generations.aggregate(pipeline).to_list(10)
    stats = {r["_id"]: r["count"] for r in results}
    total = sum(stats.values())
    return {
        "total": total,
        "worksheets": stats.get("worksheet", 0),
        "quizzes": stats.get("quiz", 0),
        "lessons": stats.get("lesson", 0),
        "plan": user.get("plan", "free"),
        "remaining": "unlimited" if user.get("plan") == "pro" else max(0, 50 - total)
    }

# --- Startup ---
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.generations.create_index("user_id")
    await db.guest_usage.create_index("ip")
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@eduforge.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "name": "Admin",
            "email": admin_email,
            "password_hash": hashed,
            "role": "admin",
            "plan": "pro",
            "generations_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logging.info(f"Admin user seeded: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})

    # Write test credentials
    os.makedirs("/app/memory", exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write(f"# Test Credentials\n\n")
        f.write(f"## Admin\n- Email: {admin_email}\n- Password: {admin_password}\n- Role: admin\n\n")
        f.write(f"## Auth Endpoints\n- POST /api/auth/register\n- POST /api/auth/login\n- POST /api/auth/logout\n- GET /api/auth/me\n- POST /api/auth/refresh\n\n")
        f.write(f"## Generation Endpoints\n- POST /api/generate/worksheet\n- POST /api/generate/quiz\n- POST /api/generate/lesson\n- GET /api/generations/history\n- GET /api/generations/stats\n")

app.include_router(api_router)

# CORS - must use explicit origin for credentials
frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
cors_origins = os.environ.get('CORS_ORIGINS', '*')
if cors_origins == '*':
    origins = ["*"]
else:
    origins = cors_origins.split(',')

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
