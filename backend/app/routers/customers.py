from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Customer
from app.schemas import CustomerCreate, CustomerResponse

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def add_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    # Customer emails must be unique for clean order ownership.
    existing = db.query(Customer).filter(Customer.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A customer with email '{payload.email}' already exists",
        )

    # Store the validated customer record.
    new_customer = Customer(
        full_name=payload.full_name,
        email=str(payload.email),
        phone_number=payload.phone_number,
    )
    db.add(new_customer)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Customer email must be unique",
        )
    db.refresh(new_customer)
    return new_customer


@router.get("", response_model=list[CustomerResponse])
def list_customers(db: Session = Depends(get_db)):
    # Return customers alphabetically for easier scanning.
    return db.query(Customer).order_by(Customer.full_name).all()


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    # Fetch one customer for detail views or checks.
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_200_OK)
def remove_customer(customer_id: int, db: Session = Depends(get_db)):
    # Customers with orders stay in place to preserve order history.
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    if customer.orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a customer with existing orders",
        )

    db.delete(customer)
    db.commit()
    return {"message": "Customer deleted successfully"}
