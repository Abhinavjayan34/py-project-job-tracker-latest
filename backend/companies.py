from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum

# Import the applications_db from applications module
import sys
import os
sys.path.append(os.path.dirname(__file__))

app = FastAPI(title="Companies API")

# In-memory storage for company metadata
company_notes: Dict[str, str] = {}
company_contacts: Dict[str, List[dict]] = {}
company_status: Dict[str, str] = {}

# Reference to applications_db (will be imported)
applications_db: List[dict] = []

# Enums
class CompanyStatus(str, Enum):
    dream_company = "dream_company"
    interested = "interested"
    researching = "researching"
    not_interested = "not_interested"

# Pydantic models
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
def get_company_applications(company_name: str) -> List[dict]:
    """Get all applications for a specific company"""
    return [app for app in applications_db 
            if app['company'].lower() == company_name.lower()]

def calculate_company_stats(applications: List[dict]) -> dict:
    """Calculate statistics for a company's applications"""
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
    """Get the most recent application for a company"""
    if not applications:
        return None
    
    # Sort by applied_date and get the latest
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

# API Routes

@app.get("/")
def root():
    """Root endpoint"""
    return {"message": "Companies API", "version": "1.0"}

@app.get("/companies")
def get_companies():
    """
    Get list of all unique companies with aggregated stats
    Returns: company name, application count, rates, latest application
    """
    if not applications_db:
        return {"companies": [], "total": 0}
    
    # Get unique companies using a set
    unique_companies = set(app['company'] for app in applications_db)
    
    companies_list = []
    
    for company_name in unique_companies:
        # Get all applications for this company
        company_apps = get_company_applications(company_name)
        
        # Calculate stats
        stats = calculate_company_stats(company_apps)
        
        # Get latest application
        latest = get_latest_application(company_apps)
        
        # Get company metadata
        notes = company_notes.get(company_name, "")
        status = company_status.get(company_name, None)
        contact_count = len(company_contacts.get(company_name, []))
        
        companies_list.append({
            "company_name": company_name,
            "application_count": stats["application_count"],
            "response_rate": stats["response_rate"],
            "interview_rate": stats["interview_rate"],
            "offer_rate": stats["offer_rate"],
            "latest_application": latest,
            "status": status,
            "has_notes": bool(notes),
            "contact_count": contact_count
        })
    
    # Sort by application count (descending)
    companies_list.sort(key=lambda x: x["application_count"], reverse=True)
    
    return {
        "companies": companies_list,
        "total": len(companies_list)
    }

@app.get("/companies/{company_name}")
def get_company_applications_endpoint(company_name: str):
    """
    Get all applications for a specific company
    """
    company_apps = get_company_applications(company_name)
    
    if not company_apps:
        raise HTTPException(status_code=404, detail="Company not found or no applications exist")
    
    return {
        "company_name": company_name,
        "applications": company_apps,
        "total": len(company_apps)
    }

@app.get("/companies/{company_name}/stats")
def get_company_stats(company_name: str):
    """
    Calculate detailed statistics for a specific company
    """
    company_apps = get_company_applications(company_name)
    
    if not company_apps:
        raise HTTPException(status_code=404, detail="Company not found or no applications exist")
    
    stats = calculate_company_stats(company_apps)
    
    # Additional detailed stats
    status_breakdown = {}
    source_breakdown = {}
    roles_applied = []
    
    for app in company_apps:
        # Count by status
        status = app['status']
        status_breakdown[status] = status_breakdown.get(status, 0) + 1
        
        # Count by source
        source = app['source']
        source_breakdown[source] = source_breakdown.get(source, 0) + 1
        
        # Collect roles
        roles_applied.append({
            "role": app['role'],
            "status": app['status'],
            "applied_date": app['applied_date']
        })
    
    # Sort roles by date
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
    """
    Get all metadata for a specific company (notes, contacts, status)
    """
    company_apps = get_company_applications(company_name)
    
    if not company_apps:
        raise HTTPException(status_code=404, detail="Company not found or no applications exist")
    
    return {
        "company_name": company_name,
        "notes": company_notes.get(company_name, ""),
        "contacts": company_contacts.get(company_name, []),
        "status": company_status.get(company_name, None),
        "application_count": len(company_apps)
    }

@app.put("/companies/{company_name}/notes")
def update_company_notes(company_name: str, notes_data: CompanyNotesUpdate):
    """
    Update notes for a company (stored in-memory)
    """
    # Verify company exists in applications
    company_apps = get_company_applications(company_name)
    
    if not company_apps:
        raise HTTPException(status_code=404, detail="Company not found or no applications exist")
    
    # Update notes in memory
    company_notes[company_name] = notes_data.notes
    
    return {
        "message": "Notes updated successfully",
        "company_name": company_name,
        "notes": notes_data.notes
    }

@app.post("/companies/{company_name}/contacts")
def add_company_contact(company_name: str, contact: CompanyContact):
    """
    Add a contact for a company (stored in-memory)
    """
    # Verify company exists in applications
    company_apps = get_company_applications(company_name)
    
    if not company_apps:
        raise HTTPException(status_code=404, detail="Company not found or no applications exist")
    
    # Initialize contacts list if not exists
    if company_name not in company_contacts:
        company_contacts[company_name] = []
    
    # Add contact
    contact_dict = contact.dict()
    contact_dict['id'] = str(len(company_contacts[company_name]) + 1)
    contact_dict['created_at'] = datetime.now().isoformat()
    
    company_contacts[company_name].append(contact_dict)
    
    return {
        "message": "Contact added successfully",
        "company_name": company_name,
        "contact": contact_dict
    }

@app.delete("/companies/{company_name}/contacts/{contact_id}")
def delete_company_contact(company_name: str, contact_id: str):
    """
    Delete a contact for a company
    """
    if company_name not in company_contacts:
        raise HTTPException(status_code=404, detail="Company has no contacts")
    
    contacts = company_contacts[company_name]
    
    for idx, contact in enumerate(contacts):
        if contact['id'] == contact_id:
            deleted_contact = contacts.pop(idx)
            return {
                "message": "Contact deleted successfully",
                "deleted": deleted_contact
            }
    
    raise HTTPException(status_code=404, detail="Contact not found")

@app.put("/companies/{company_name}/status")
def update_company_status(company_name: str, status_data: CompanyStatusUpdate):
    """
    Update status for a company (stored in-memory)
    """
    # Verify company exists in applications
    company_apps = get_company_applications(company_name)
    
    if not company_apps:
        raise HTTPException(status_code=404, detail="Company not found or no applications exist")
    
    # Update status in memory
    company_status[company_name] = status_data.status.value
    
    return {
        "message": "Status updated successfully",
        "company_name": company_name,
        "status": status_data.status.value
    }

# To integrate with applications.py, add this at the end of applications.py:
# from companies import app as companies_app
# app.mount("/api/companies", companies_app)

# Run standalone with: uvicorn companies:app --reload --port 8001