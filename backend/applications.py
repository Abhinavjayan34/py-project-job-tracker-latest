from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime, timedelta
from enum import Enum
from collections import defaultdict

app = FastAPI(title="Job Applications API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage
applications_db: List[dict] = []
company_notes: Dict[str, str] = {}
company_contacts: Dict[str, List[dict]] = {}
company_status: Dict[str, str] = {}

# Enums
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

class CompanyStatus(str, Enum):
    dream_company = "dream_company"
    interested = "interested"
    researching = "researching"
    not_interested = "not_interested"

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

class CompanyNotesUpdate(BaseModel):
    notes: str = Field(..., max_length=2000)

class CompanyContact(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    notes: Optional[str] = None

class CompanyStatusUpdate(BaseModel):
    status: CompanyStatus

# Helper functions
def generate_id() -> str:
    if not applications_db:
        return "1"
    max_id = max(int(app['id']) for app in applications_db)
    return str(max_id + 1)

def get_week_start(date_str: str) -> str:
    dt = datetime.fromisoformat(date_str)
    week_start = dt - timedelta(days=dt.weekday())
    return week_start.strftime('%Y-%m-%d')

def get_company_applications(company_name: str) -> List[dict]:
    return [app for app in applications_db 
            if app['company'].lower() == company_name.lower()]

def calculate_company_stats(applications: List[dict]) -> dict:
    if not applications:
        return {
            "application_count": 0,
            "response_rate": 0.0,
            "interview_rate": 0.0,
            "offer_rate": 0.0
        }
    
    total = len(applications)
    responded = sum(1 for app in applications 
                   if app['status'] in ['phone_screen', 'interview', 'offer'])
    interviewed = sum(1 for app in applications 
                     if app['status'] in ['interview', 'offer'])
    offers = sum(1 for app in applications if app['status'] == 'offer')
    
    return {
        "application_count": total,
        "response_rate": round((responded / total * 100) if total > 0 else 0, 2),
        "interview_rate": round((interviewed / total * 100) if total > 0 else 0, 2),
        "offer_rate": round((offers / total * 100) if total > 0 else 0, 2)
    }

def get_latest_application(applications: List[dict]) -> Optional[dict]:
    if not applications:
        return None
    sorted_apps = sorted(applications, 
                        key=lambda x: datetime.fromisoformat(x['applied_date']), 
                        reverse=True)
    latest = sorted_apps[0]
    return {
        "role": latest['role'],
        "status": latest['status'],
        "applied_date": latest['applied_date'],
        "application_id": latest['id']
    }

# ============================================
# APPLICATIONS ENDPOINTS
# ============================================

@app.get("/")
def root():
    return {"message": "Job Applications API", "version": "1.0"}

@app.get("/applications", response_model=List[Application])
def get_applications(
    company: Optional[str] = Query(None),
    status: Optional[ApplicationStatus] = Query(None),
    source: Optional[ApplicationSource] = Query(None),
    search: Optional[str] = Query(None)
):
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
    for app in applications_db:
        if app['id'] == application_id:
            return app
    raise HTTPException(status_code=404, detail="Application not found")

@app.post("/applications", response_model=Application, status_code=201)
def create_application(application: ApplicationCreate):
    new_app = application.dict()
    new_app['id'] = generate_id()
    new_app['applied_date'] = datetime.now().isoformat()
    new_app['last_updated'] = datetime.now().isoformat()
    applications_db.append(new_app)
    return new_app

@app.put("/applications/{application_id}", response_model=Application)
def update_application(application_id: str, application: ApplicationUpdate):
    for idx, app in enumerate(applications_db):
        if app['id'] == application_id:
            update_data = application.dict(exclude_unset=True)
            for key, value in update_data.items():
                app[key] = value
            app['last_updated'] = datetime.now().isoformat()
            applications_db[idx] = app
            return app
    raise HTTPException(status_code=404, detail="Application not found")

@app.delete("/applications/{application_id}")
def delete_application(application_id: str):
    for idx, app in enumerate(applications_db):
        if app['id'] == application_id:
            deleted_app = applications_db.pop(idx)
            return {"message": "Application deleted successfully", "deleted": deleted_app}
    raise HTTPException(status_code=404, detail="Application not found")

@app.get("/applications/stats/summary")
def get_stats():
    if not applications_db:
        return {"total": 0, "by_status": {}, "by_source": {}}
    
    status_count = {}
    source_count = {}
    for app in applications_db:
        status = app['status']
        source = app['source']
        status_count[status] = status_count.get(status, 0) + 1
        source_count[source] = source_count.get(source, 0) + 1
    
    return {
        "total": len(applications_db),
        "by_status": status_count,
        "by_source": source_count
    }

# ============================================
# ANALYTICS ENDPOINTS
# ============================================

@app.get("/analytics/dashboard")
def get_dashboard_stats():
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
        {"stage": "Phone Screen", "count": phone_screen, 
         "percentage": round((phone_screen / total * 100) if total > 0 else 0, 2)},
        {"stage": "Interview", "count": interview, 
         "percentage": round((interview / total * 100) if total > 0 else 0, 2)},
        {"stage": "Offer", "count": offer, 
         "percentage": round((offer / total * 100) if total > 0 else 0, 2)}
    ]
    
    return {"stages": stages, "total": total}

@app.get("/analytics/sources")
def get_source_analytics():
    if not applications_db:
        return {"sources": []}
    
    source_data = defaultdict(lambda: {
        "total": 0, "responded": 0, "interviewed": 0, "offers": 0
    })
    
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

@app.get("/analytics/weekly-trends")
def get_weekly_trends():
    if not applications_db:
        return {"weeks": []}
    
    weekly_data = defaultdict(lambda: {"total": 0, "responded": 0})
    
    for app in applications_db:
        week = get_week_start(app['applied_date'])
        status = app['status']
        weekly_data[week]["total"] += 1
        if status in ['phone_screen', 'interview', 'offer']:
            weekly_data[week]["responded"] += 1
    
    weeks = []
    for week, data in sorted(weekly_data.items()):
        total = data["total"]
        weeks.append({
            "week_start": week,
            "applications": total,
            "responses": data["responded"],
            "response_rate": round((data["responded"] / total * 100) if total > 0 else 0, 2)
        })
    
    return {"weeks": weeks}

@app.get("/analytics/response-timeline")
def get_response_timeline():
    if not applications_db:
        return {"timeline": []}
    
    weekly_stats = defaultdict(lambda: {
        "total": 0, "responded": 0, "interviewed": 0, "offers": 0
    })
    
    for app in applications_db:
        week = get_week_start(app['applied_date'])
        status = app['status']
        weekly_stats[week]["total"] += 1
        if status in ['phone_screen', 'interview', 'offer']:
            weekly_stats[week]["responded"] += 1
        if status in ['interview', 'offer']:
            weekly_stats[week]["interviewed"] += 1
        if status == 'offer':
            weekly_stats[week]["offers"] += 1
    
    timeline = []
    for week, stats in sorted(weekly_stats.items()):
        total = stats["total"]
        timeline.append({
            "week_start": week,
            "total_applications": total,
            "response_rate": round((stats["responded"] / total * 100) if total > 0 else 0, 2),
            "interview_rate": round((stats["interviewed"] / total * 100) if total > 0 else 0, 2),
            "offer_rate": round((stats["offers"] / total * 100) if total > 0 else 0, 2)
        })
    
    return {"timeline": timeline}

# ============================================
# COMPANIES ENDPOINTS
# ============================================

@app.get("/companies")
def get_companies():
    if not applications_db:
        return {"companies": [], "total": 0}
    
    unique_companies = set(app['company'] for app in applications_db)
    companies_list = []
    
    for company_name in unique_companies:
        company_apps = get_company_applications(company_name)
        stats = calculate_company_stats(company_apps)
        latest = get_latest_application(company_apps)
        
        companies_list.append({
            "company_name": company_name,
            "application_count": stats["application_count"],
            "response_rate": stats["response_rate"],
            "interview_rate": stats["interview_rate"],
            "offer_rate": stats["offer_rate"],
            "latest_application": latest,
            "status": company_status.get(company_name, None),
            "has_notes": bool(company_notes.get(company_name, "")),
            "contact_count": len(company_contacts.get(company_name, []))
        })
    
    companies_list.sort(key=lambda x: x["application_count"], reverse=True)
    return {"companies": companies_list, "total": len(companies_list)}

@app.get("/companies/{company_name}")
def get_company_applications_endpoint(company_name: str):
    company_apps = get_company_applications(company_name)
    if not company_apps:
        raise HTTPException(status_code=404, detail="Company not found")
    return {"company_name": company_name, "applications": company_apps, "total": len(company_apps)}

@app.get("/companies/{company_name}/stats")
def get_company_stats(company_name: str):
    company_apps = get_company_applications(company_name)
    if not company_apps:
        raise HTTPException(status_code=404, detail="Company not found")
    
    stats = calculate_company_stats(company_apps)
    status_breakdown = {}
    source_breakdown = {}
    roles_applied = []
    
    for app in company_apps:
        status = app['status']
        source = app['source']
        status_breakdown[status] = status_breakdown.get(status, 0) + 1
        source_breakdown[source] = source_breakdown.get(source, 0) + 1
        roles_applied.append({
            "role": app['role'],
            "status": app['status'],
            "applied_date": app['applied_date']
        })
    
    roles_applied.sort(key=lambda x: datetime.fromisoformat(x['applied_date']), reverse=True)
    
    return {
        "company_name": company_name,
        "overview": stats,
        "status_breakdown": status_breakdown,
        "source_breakdown": source_breakdown,
        "roles_applied": roles_applied,
        "first_application": company_apps[-1]['applied_date'] if company_apps else None,
        "latest_application": company_apps[0]['applied_date'] if company_apps else None
    }

@app.get("/companies/{company_name}/details")
def get_company_details(company_name: str):
    company_apps = get_company_applications(company_name)
    if not company_apps:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return {
        "company_name": company_name,
        "notes": company_notes.get(company_name, ""),
        "contacts": company_contacts.get(company_name, []),
        "status": company_status.get(company_name, None),
        "application_count": len(company_apps)
    }

@app.put("/companies/{company_name}/notes")
def update_company_notes(company_name: str, notes_data: CompanyNotesUpdate):
    company_apps = get_company_applications(company_name)
    if not company_apps:
        raise HTTPException(status_code=404, detail="Company not found")
    
    company_notes[company_name] = notes_data.notes
    return {"message": "Notes updated", "company_name": company_name, "notes": notes_data.notes}

@app.post("/companies/{company_name}/contacts")
def add_company_contact(company_name: str, contact: CompanyContact):
    company_apps = get_company_applications(company_name)
    if not company_apps:
        raise HTTPException(status_code=404, detail="Company not found")
    
    if company_name not in company_contacts:
        company_contacts[company_name] = []
    
    contact_dict = contact.dict()
    contact_dict['id'] = str(len(company_contacts[company_name]) + 1)
    contact_dict['created_at'] = datetime.now().isoformat()
    company_contacts[company_name].append(contact_dict)
    
    return {"message": "Contact added", "company_name": company_name, "contact": contact_dict}

@app.delete("/companies/{company_name}/contacts/{contact_id}")
def delete_company_contact(company_name: str, contact_id: str):
    if company_name not in company_contacts:
        raise HTTPException(status_code=404, detail="Company has no contacts")
    
    contacts = company_contacts[company_name]
    for idx, contact in enumerate(contacts):
        if contact['id'] == contact_id:
            deleted_contact = contacts.pop(idx)
            return {"message": "Contact deleted", "deleted": deleted_contact}
    
    raise HTTPException(status_code=404, detail="Contact not found")

@app.put("/companies/{company_name}/status")
def update_company_status(company_name: str, status_data: CompanyStatusUpdate):
    company_apps = get_company_applications(company_name)
    if not company_apps:
        raise HTTPException(status_code=404, detail="Company not found")
    
    company_status[company_name] = status_data.status.value
    return {"message": "Status updated", "company_name": company_name, "status": status_data.status.value}

# Run with: uvicorn applications:app --reload