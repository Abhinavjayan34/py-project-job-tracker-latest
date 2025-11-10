from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime, timedelta
from enum import Enum
from collections import defaultdict
import json
import os

app = FastAPI(title="Job Applications API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# File path for persistent storage
DATA_FILE = "applications_data.json"

# In-memory storage
applications_db: List[dict] = []
company_notes: Dict[str, str] = {}
company_contacts: Dict[str, List[dict]] = {}
company_status: Dict[str, str] = {}

# Define Enums for status and source
class ApplicationStatus(str, Enum):
    applied = "applied"
    phone_screen = "phone_screen"
    interview = "interview"
    rejected = "rejected"
    offer = "offer"

class ApplicationSource(str, Enum):
    linkedin = "LinkedIn"
    indeed = "Indeed"
    company_website = "Company Website"
    referral = "Referral"
    other = "Other"

# Pydantic models
class ApplicationBase(BaseModel):
    company: str = Field(..., min_length=1, max_length=200)
    role: str = Field(..., min_length=1, max_length=200)
    status: ApplicationStatus
    source: ApplicationSource
    location: Optional[str] = None
    salary_range: Optional[str] = None
    notes: Optional[str] = None

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    status: Optional[ApplicationStatus] = None
    source: Optional[ApplicationSource] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    notes: Optional[str] = None

class Application(ApplicationBase):
    id: str
    applied_date: str
    last_updated: str

# ============================================
# PERSISTENCE FUNCTIONS
# ============================================

def save_data():
    """Save all data to JSON file"""
    data = {
        "applications": applications_db,
        "company_notes": company_notes,
        "company_contacts": company_contacts,
        "company_status": company_status
    }
    try:
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"✅ Data saved to {DATA_FILE}")
    except Exception as e:
        print(f"❌ Error saving data: {e}")

def load_data():
    """Load data from JSON file"""
    global applications_db, company_notes, company_contacts, company_status
    
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                applications_db = data.get("applications", [])
                company_notes = data.get("company_notes", {})
                company_contacts = data.get("company_contacts", {})
                company_status = data.get("company_status", {})
            print(f"✅ Loaded {len(applications_db)} applications from {DATA_FILE}")
        except Exception as e:
            print(f"❌ Error loading data: {e}")
            # Initialize with empty data if load fails
            applications_db = []
            company_notes = {}
            company_contacts = {}
            company_status = {}
    else:
        print(f"ℹ️ No existing data file found. Starting fresh.")

# Load data on startup
@app.on_event("startup")
def startup_event():
    """Load data when app starts"""
    load_data()
    print("🚀 Job Applications API started!")

# Helper functions
def generate_id() -> str:
    """Generate unique ID for application"""
    if not applications_db:
        return "1"
    max_id = max(int(app['id']) for app in applications_db)
    return str(max_id + 1)

def get_week_start(date_str: str) -> str:
    """Get the start of week (Monday) for a given date"""
    dt = datetime.fromisoformat(date_str)
    week_start = dt - timedelta(days=dt.weekday())
    return week_start.strftime('%Y-%m-%d')

# ============================================
# APPLICATION ENDPOINTS
# ============================================

@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Job Applications API", 
        "version": "1.0",
        "total_applications": len(applications_db)
    }

@app.get("/applications", response_model=List[Application])
def get_applications(
    company: Optional[str] = Query(None, description="Filter by company name (partial match)"),
    status: Optional[ApplicationStatus] = Query(None, description="Filter by status"),
    source: Optional[ApplicationSource] = Query(None, description="Filter by application source"),
    search: Optional[str] = Query(None, description="Search by role or keywords")
):
    """Get all applications with optional filters"""
    filtered_apps = applications_db.copy()
    
    if company:
        filtered_apps = [app for app in filtered_apps 
                        if company.lower() in app['company'].lower()]
    
    if status:
        filtered_apps = [app for app in filtered_apps 
                        if app['status'] == status.value]
    
    if source:
        filtered_apps = [app for app in filtered_apps 
                        if app['source'] == source.value]
    
    if search:
        search_lower = search.lower()
        filtered_apps = [app for app in filtered_apps 
                        if search_lower in app['role'].lower() 
                        or search_lower in app['company'].lower()
                        or (app.get('notes') and search_lower in app['notes'].lower())]
    
    return filtered_apps

@app.get("/applications/{application_id}", response_model=Application)
def get_application(application_id: str):
    """Get a specific application by ID"""
    for app in applications_db:
        if app['id'] == application_id:
            return app
    
    raise HTTPException(status_code=404, detail="Application not found")

@app.post("/applications", response_model=Application, status_code=201)
def create_application(application: ApplicationCreate):
    """Create a new application"""
    new_app = application.dict()
    new_app['id'] = generate_id()
    new_app['applied_date'] = datetime.now().isoformat()
    new_app['last_updated'] = datetime.now().isoformat()
    
    applications_db.append(new_app)
    save_data()  # Save after creating
    
    return new_app

@app.put("/applications/{application_id}", response_model=Application)
def update_application(application_id: str, application: ApplicationUpdate):
    """Update an existing application"""
    for idx, app in enumerate(applications_db):
        if app['id'] == application_id:
            update_data = application.dict(exclude_unset=True)
            for key, value in update_data.items():
                app[key] = value
            
            app['last_updated'] = datetime.now().isoformat()
            applications_db[idx] = app
            save_data()  # Save after updating
            return app
    
    raise HTTPException(status_code=404, detail="Application not found")

@app.delete("/applications/{application_id}")
def delete_application(application_id: str):
    """Delete an application"""
    for idx, app in enumerate(applications_db):
        if app['id'] == application_id:
            deleted_app = applications_db.pop(idx)
            save_data()  # Save after deleting
            return {"message": "Application deleted successfully", "deleted": deleted_app}
    
    raise HTTPException(status_code=404, detail="Application not found")

# ============================================
# ANALYTICS ENDPOINTS
# ============================================

@app.get("/analytics/dashboard")
def get_dashboard_stats():
    """Calculate dashboard statistics"""
    if not applications_db:
        return {
            "total_applications": 0,
            "response_rate": 0.0,
            "interview_rate": 0.0,
            "offer_rate": 0.0,
            "applications_this_week": 0
        }
    
    total = len(applications_db)
    responded = sum(1 for app in applications_db 
                   if app['status'] in ['phone_screen', 'interview', 'offer'])
    interviewed = sum(1 for app in applications_db 
                     if app['status'] in ['interview', 'offer'])
    offers = sum(1 for app in applications_db if app['status'] == 'offer')
    
    response_rate = (responded / total * 100) if total > 0 else 0.0
    interview_rate = (interviewed / total * 100) if total > 0 else 0.0
    offer_rate = (offers / total * 100) if total > 0 else 0.0
    
    week_ago = datetime.now() - timedelta(days=7)
    applications_this_week = sum(1 for app in applications_db 
                                if datetime.fromisoformat(app['applied_date']) >= week_ago)
    
    return {
        "total_applications": total,
        "response_rate": round(response_rate, 2),
        "interview_rate": round(interview_rate, 2),
        "offer_rate": round(offer_rate, 2),
        "applications_this_week": applications_this_week
    }

@app.get("/analytics/funnel")
def get_funnel_data():
    """Calculate application funnel stages"""
    if not applications_db:
        return {"stages": [], "total": 0}
    
    total = len(applications_db)
    applied = total
    phone_screen = sum(1 for app in applications_db 
                      if app['status'] in ['phone_screen', 'interview', 'offer'])
    interview = sum(1 for app in applications_db 
                   if app['status'] in ['interview', 'offer'])
    offer = sum(1 for app in applications_db if app['status'] == 'offer')
    
    stages = [
        {"stage": "Applied", "count": applied, "percentage": 100.0},
        {"stage": "Phone Screen", "count": phone_screen, "percentage": round((phone_screen / total * 100) if total > 0 else 0, 2)},
        {"stage": "Interview", "count": interview, "percentage": round((interview / total * 100) if total > 0 else 0, 2)},
        {"stage": "Offer", "count": offer, "percentage": round((offer / total * 100) if total > 0 else 0, 2)}
    ]
    
    return {"stages": stages, "total": total}

@app.get("/analytics/sources")
def get_source_analytics():
    """Group applications by source and calculate success rates"""
    if not applications_db:
        return {"sources": []}
    
    source_data = defaultdict(lambda: {"total": 0, "responded": 0, "interviewed": 0, "offers": 0})
    
    for app in applications_db:
        source = app['source']
        status = app['status']
        
        source_data[source]["total"] += 1
        if status in ['phone_screen', 'interview', 'offer']:
            source_data[source]["responded"] += 1
        if status in ['interview', 'offer']:
            source_data[source]["interviewed"] += 1
        if status == 'offer':
            source_data[source]["offers"] += 1
    
    sources = []
    for source, data in source_data.items():
        total = data["total"]
        sources.append({
            "source": source,
            "total_applications": total,
            "response_rate": round((data["responded"] / total * 100) if total > 0 else 0, 2),
            "interview_rate": round((data["interviewed"] / total * 100) if total > 0 else 0, 2),
            "offer_rate": round((data["offers"] / total * 100) if total > 0 else 0, 2)
        })
    
    sources.sort(key=lambda x: x["total_applications"], reverse=True)
    return {"sources": sources}

@app.get("/analytics/status-distribution")
def get_status_distribution():
    """Count applications by status"""
    if not applications_db:
        return {"distribution": [], "total": 0}
    
    total = len(applications_db)
    status_count = {}
    for app in applications_db:
        status = app['status']
        status_count[status] = status_count.get(status, 0) + 1
    
    distribution = []
    for status, count in status_count.items():
        distribution.append({
            "status": status,
            "count": count,
            "percentage": round((count / total * 100) if total > 0 else 0, 2)
        })
    
    distribution.sort(key=lambda x: x["count"], reverse=True)
    return {"distribution": distribution, "total": total}

# ============================================
# COMPANY ENDPOINTS
# ============================================

@app.get("/companies")
def get_companies():
    """Get all companies with stats"""
    if not applications_db:
        return {"companies": []}
    
    company_data = defaultdict(lambda: {
        "applications": [],
        "total": 0,
        "responded": 0,
        "interviewed": 0,
        "offers": 0
    })
    
    for app in applications_db:
        company = app['company']
        status = app['status']
        
        company_data[company]["applications"].append(app)
        company_data[company]["total"] += 1
        
        if status in ['phone_screen', 'interview', 'offer']:
            company_data[company]["responded"] += 1
        if status in ['interview', 'offer']:
            company_data[company]["interviewed"] += 1
        if status == 'offer':
            company_data[company]["offers"] += 1
    
    companies = []
    for company_name, data in company_data.items():
        total = data["total"]
        latest_app = max(data["applications"], key=lambda x: x['applied_date'])
        
        companies.append({
            "company_name": company_name,
            "application_count": total,
            "response_rate": round((data["responded"] / total * 100) if total > 0 else 0, 2),
            "interview_rate": round((data["interviewed"] / total * 100) if total > 0 else 0, 2),
            "offer_rate": round((data["offers"] / total * 100) if total > 0 else 0, 2),
            "latest_application": latest_app,
            "status": company_status.get(company_name, "")
        })
    
    companies.sort(key=lambda x: x["application_count"], reverse=True)
    return {"companies": companies}

@app.get("/companies/{company_name}/stats")
def get_company_stats(company_name: str):
    """Get detailed stats for a specific company"""
    company_apps = [app for app in applications_db if app['company'] == company_name]
    
    if not company_apps:
        raise HTTPException(status_code=404, detail="Company not found")
    
    total = len(company_apps)
    responded = sum(1 for app in company_apps if app['status'] in ['phone_screen', 'interview', 'offer'])
    interviewed = sum(1 for app in company_apps if app['status'] in ['interview', 'offer'])
    offers = sum(1 for app in company_apps if app['status'] == 'offer')
    
    status_breakdown = {}
    for app in company_apps:
        status = app['status']
        status_breakdown[status] = status_breakdown.get(status, 0) + 1
    
    return {
        "company_name": company_name,
        "overview": {
            "application_count": total,
            "response_rate": round((responded / total * 100) if total > 0 else 0, 2),
            "interview_rate": round((interviewed / total * 100) if total > 0 else 0, 2),
            "offer_rate": round((offers / total * 100) if total > 0 else 0, 2)
        },
        "status_breakdown": status_breakdown,
        "roles_applied": company_apps,
        "first_application": min(company_apps, key=lambda x: x['applied_date'])['applied_date']
    }

@app.put("/companies/{company_name}/status")
def update_company_status(company_name: str, status_update: dict):
    """Update company status (dream_company, interested, etc.)"""
    company_status[company_name] = status_update.get("status", "")
    save_data()  # Save after updating
    return {"company_name": company_name, "status": company_status[company_name]}

# Run with: uvicorn applications:app --reload