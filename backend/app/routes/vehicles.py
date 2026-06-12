from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
import csv
import io
from datetime import datetime, date

from app.database import get_db
from app.models import Vehicle, User
from app.schemas import VehicleResponse, VehicleCreate, VehicleUpdate, PaginatedVehicles
from app.auth import require_admin, require_officer, get_current_user

router = APIRouter(prefix="/vehicles", tags=["vehicles"])

@router.get("", response_model=PaginatedVehicles)
def get_vehicles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_officer), # Officers & Admins can read
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    vehicle_type: Optional[str] = None
):
    query = db.query(Vehicle).filter(Vehicle.deleted_at == None)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Vehicle.vehicle_number.ilike(search_pattern),
                Vehicle.owner_name.ilike(search_pattern),
                Vehicle.email.ilike(search_pattern),
                Vehicle.phone.ilike(search_pattern)
            )
        )
        
    if status_filter:
        query = query.filter(Vehicle.status == status_filter)
        
    if vehicle_type:
        query = query.filter(Vehicle.vehicle_type == vehicle_type)
        
    total = query.count()
    vehicles = query.order_by(Vehicle.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "vehicles": [VehicleResponse.model_validate(v) for v in vehicles]
    }

@router.get("/all-numbers", response_model=List[str])
def get_all_vehicle_numbers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_officer)
):
    """
    Returns lists of all vehicle numbers for fast lookup selectors.
    """
    vehicles = db.query(Vehicle.vehicle_number).filter(Vehicle.deleted_at == None).all()
    return [v.vehicle_number for v in vehicles]

@router.post("", response_model=VehicleResponse)
def add_vehicle(
    vehicle_in: VehicleCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    # Enforce upper case for numbers
    number = vehicle_in.vehicle_number.strip().upper()
    existing = db.query(Vehicle).filter(Vehicle.vehicle_number == number, Vehicle.deleted_at == None).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Vehicle number {number} is already registered.")
        
    vehicle = Vehicle(
        vehicle_number=number,
        owner_name=vehicle_in.owner_name,
        email=vehicle_in.email,
        phone=vehicle_in.phone,
        address=vehicle_in.address,
        vehicle_type=vehicle_in.vehicle_type.upper(),
        registration_date=vehicle_in.registration_date or date.today(),
        status=vehicle_in.status,
        created_by=admin.id
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(
    vehicle_id: int,
    vehicle_update: VehicleUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.deleted_at == None).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
        
    for field, value in vehicle_update.dict(exclude_unset=True).items():
        if field == "vehicle_type":
            setattr(vehicle, field, value.upper())
        else:
            setattr(vehicle, field, value)
            
    vehicle.updated_by = admin.id
    vehicle.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.deleted_at == None).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
        
    # Soft delete
    vehicle.deleted_at = datetime.utcnow()
    db.commit()
    return None

@router.post("/bulk-delete", status_code=status.HTTP_204_NO_CONTENT)
def bulk_delete_vehicles(
    ids: List[int],
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    vehicles = db.query(Vehicle).filter(Vehicle.id.in_(ids), Vehicle.deleted_at == None).all()
    for vehicle in vehicles:
        vehicle.deleted_at = datetime.utcnow()
    db.commit()
    return None

@router.post("/import", response_model=dict)
async def import_vehicles_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Imports vehicles from a CSV upload.
    Header format: vehicle_number,owner_name,email,phone,address,vehicle_type,registration_date,status
    """
    contents = await file.read()
    buffer = io.StringIO(contents.decode('utf-8'))
    reader = csv.DictReader(buffer)
    
    success_count = 0
    error_count = 0
    errors = []
    
    for row_idx, row in enumerate(reader):
        try:
            num = row.get("vehicle_number", "").strip().upper()
            if not num:
                raise ValueError("vehicle_number is required")
                
            # Check duplicates
            existing = db.query(Vehicle).filter(Vehicle.vehicle_number == num, Vehicle.deleted_at == None).first()
            if existing:
                # Update existing records
                existing.owner_name = row.get("owner_name", existing.owner_name)
                existing.email = row.get("email", existing.email)
                existing.phone = row.get("phone", existing.phone)
                existing.address = row.get("address", existing.address)
                existing.vehicle_type = row.get("vehicle_type", existing.vehicle_type).upper()
                existing.status = row.get("status", existing.status)
                existing.updated_by = admin.id
                existing.updated_at = datetime.utcnow()
            else:
                reg_date_str = row.get("registration_date")
                reg_date = datetime.strptime(reg_date_str, "%Y-%m-%d").date() if reg_date_str else date.today()
                
                vehicle = Vehicle(
                    vehicle_number=num,
                    owner_name=row.get("owner_name", "Unknown"),
                    email=row.get("email", "unknown@email.com"),
                    phone=row.get("phone", "0000000000"),
                    address=row.get("address", ""),
                    vehicle_type=row.get("vehicle_type", "MOTORCYCLE").upper(),
                    registration_date=reg_date,
                    status=row.get("status", "ACTIVE"),
                    created_by=admin.id
                )
                db.add(vehicle)
            success_count += 1
        except Exception as e:
            error_count += 1
            errors.append(f"Row {row_idx + 1}: {str(e)}")
            
    db.commit()
    return {
        "success": success_count,
        "failed": error_count,
        "errors": errors[:10]  # Return first 10 errors
    }

@router.get("/export")
def export_vehicles_csv(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Streams the vehicle registry as a CSV file.
    """
    vehicles = db.query(Vehicle).filter(Vehicle.deleted_at == None).all()
    
    def generate():
        # Setup headers
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["vehicle_number", "owner_name", "email", "phone", "address", "vehicle_type", "registration_date", "status"])
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)
        
        for v in vehicles:
            writer.writerow([
                v.vehicle_number,
                v.owner_name,
                v.email,
                v.phone,
                v.address or "",
                v.vehicle_type,
                v.registration_date.strftime("%Y-%m-%d") if v.registration_date else "",
                v.status
            ])
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)
            
    headers = {
        'Content-Disposition': 'attachment; filename="vehicle_registry.csv"',
        'Content-Type': 'text/csv'
    }
    return StreamingResponse(generate(), headers=headers)
