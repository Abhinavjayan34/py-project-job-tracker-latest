from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime, timedelta
from enum import Enum
from collections import defaultdict

app = FastAPI(title="Job Applications API")

# In-memory storage using list and dict
applications_db: List[dict] = []

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

# API Routes

@app.get("/")
def root():
    """Root endpoint"""
    return {"message": "Job Applications API", "version": "1.0"}

@app.get("/applications", response_model=List[Application])
def get_applications(
    company: Optional[str] = Query(None, description="Filter by company name (partial match)"),
    status: Optional[ApplicationStatus] = Query(None, description="Filter by status"),
    source: Optional[ApplicationSource] = Query(None, description="Filter by application source"),
    search: Optional[str] = Query(None, description="Search by role or keywords")
):
    """
    Get all applications with optional filters
    - **company**: Filter by company name (case-insensitive partial match)
    - **status**: Filter by application status
    - **source**: Filter by application source
    - **search**: Search in role, company, or notes
    """
    filtered_apps = applications_db.copy()
    
    # Apply filters
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
    # Create new application
    new_app = application.dict()
    new_app['id'] = generate_id()
    new_app['applied_date'] = datetime.now().isoformat()
    new_app['last_updated'] = datetime.now().isoformat()
    
    applications_db.append(new_app)
    
    return new_app

@app.put("/applications/{application_id}", response_model=Application)
def update_application(application_id: str, application: ApplicationUpdate):
    """Update an existing application"""
    for idx, app in enumerate(applications_db):
        if app['id'] == application_id:
            # Update only provided fields
            update_data = application.dict(exclude_unset=True)
            for key, value in update_data.items():
                app[key] = value
            
            app['last_updated'] = datetime.now().isoformat()
            applications_db[idx] = app
            return app
    
    raise HTTPException(status_code=404, detail="Application not found")

@app.delete("/applications/{application_id}")
def delete_application(application_id: str):
    """Delete an application"""
    for idx, app in enumerate(applications_db):
        if app['id'] == application_id:
            deleted_app = applications_db.pop(idx)
            return {"message": "Application deleted successfully", "deleted": deleted_app}
    
    raise HTTPException(status_code=404, detail="Application not found")

@app.get("/applications/stats/summary")
def get_stats():
    """Get statistics about applications"""
    if not applications_db:
        return {
            "total": 0,
            "by_status": {},
            "by_source": {}
        }
    
    # Calculate stats using dictionaries
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
    """
    Calculate dashboard statistics from in-memory applications
    Returns: total apps, response rate, interview rate, offer rate, weekly apps
    """
    if not applications_db:
        return {
            "total_applications": 0,
            "response_rate": 0.0,
            "interview_rate": 0.0,
            "offer_rate": 0.0,
            "applications_this_week": 0
        }
    
    total = len(applications_db)
    
    # Count applications with responses (phone_screen, interview, or offer)
    responded = sum(1 for app in applications_db 
                   if app['status'] in ['phone_screen', 'interview', 'offer'])
    
    # Count applications with interviews
    interviewed = sum(1 for app in applications_db 
                     if app['status'] in ['interview', 'offer'])
    
    # Count applications with offers
    offers = sum(1 for app in applications_db if app['status'] == 'offer')
    
    # Calculate rates
    response_rate = (responded / total * 100) if total > 0 else 0.0
    interview_rate = (interviewed / total * 100) if total > 0 else 0.0
    offer_rate = (offers / total * 100) if total > 0 else 0.0
    
    # Count applications this week
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
    """
    Calculate application funnel stages: applied → phone_screen → interview → offer
    Returns counts and percentages for each stage
    """
    if not applications_db:
        return {
            "stages": [],
            "total": 0
        }
    
    total = len(applications_db)
    
    # Count each stage
    applied = total  # All applications start as applied
    phone_screen = sum(1 for app in applications_db 
                      if app['status'] in ['phone_screen', 'interview', 'offer'])
    interview = sum(1 for app in applications_db 
                   if app['status'] in ['interview', 'offer'])
    offer = sum(1 for app in applications_db if app['status'] == 'offer')
    
    stages = [
        {
            "stage": "Applied",
            "count": applied,
            "percentage": 100.0
        },
        {
            "stage": "Phone Screen",
            "count": phone_screen,
            "percentage": round((phone_screen / total * 100) if total > 0 else 0, 2)
        },
        {
            "stage": "Interview",
            "count": interview,
            "percentage": round((interview / total * 100) if total > 0 else 0, 2)
        },
        {
            "stage": "Offer",
            "count": offer,
            "percentage": round((offer / total * 100) if total > 0 else 0, 2)
        }
    ]
    
    return {
        "stages": stages,
        "total": total
    }

@app.get("/analytics/sources")
def get_source_analytics():
    """
    Group applications by source and calculate success rates
    Returns: source name, count, response rate, interview rate
    """
    if not applications_db:
        return {"sources": []}
    
    # Group by source
    source_data = defaultdict(lambda: {
        "total": 0,
        "responded": 0,
        "interviewed": 0,
        "offers": 0
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
    
    # Calculate rates
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
    
    # Sort by total applications
    sources.sort(key=lambda x: x["total_applications"], reverse=True)
    
    return {"sources": sources}

@app.get("/analytics/status-distribution")
def get_status_distribution():
    """
    Count applications by status
    Returns: status name, count, percentage
    """
    if not applications_db:
        return {"distribution": [], "total": 0}
    
    total = len(applications_db)
    
    # Count by status
    status_count = {}
    for app in applications_db:
        status = app['status']
        status_count[status] = status_count.get(status, 0) + 1
    
    # Create distribution list
    distribution = []
    for status, count in status_count.items():
        distribution.append({
            "status": status,
            "count": count,
            "percentage": round((count / total * 100) if total > 0 else 0, 2)
        })
    
    # Sort by count
    distribution.sort(key=lambda x: x["count"], reverse=True)
    
    return {
        "distribution": distribution,
        "total": total
    }

@app.get("/analytics/weekly-trends")
def get_weekly_trends():
    """
    Group applications by week and show trends
    Returns: week, applications count, response rate
    """
    if not applications_db:
        return {"weeks": []}
    
    # Group by week
    weekly_data = defaultdict(lambda: {
        "total": 0,
        "responded": 0
    })
    
    for app in applications_db:
        week = get_week_start(app['applied_date'])
        status = app['status']
        
        weekly_data[week]["total"] += 1
        
        if status in ['phone_screen', 'interview', 'offer']:
            weekly_data[week]["responded"] += 1
    
    # Create weeks list
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
    """
    Calculate weekly response rates over time
    Returns: week, response rate, interview rate, offer rate
    """
    if not applications_db:
        return {"timeline": []}
    
    # Group by week
    weekly_stats = defaultdict(lambda: {
        "total": 0,
        "responded": 0,
        "interviewed": 0,
        "offers": 0
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
    
    # Create timeline
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

# Run with: uvicorn applications:app --reload