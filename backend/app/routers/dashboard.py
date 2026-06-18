from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import Customer, Order, Product
from app.schemas import DashboardSummary, ProductResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    # Count the main records shown in the dashboard cards.
    total_products = db.query(Product).count()
    total_customers = db.query(Customer).count()
    total_orders = db.query(Order).count()

    # Low stock uses the configurable threshold from environment settings.
    low_stock = (
        db.query(Product)
        .filter(Product.quantity_in_stock <= settings.low_stock_threshold)
        .order_by(Product.quantity_in_stock.asc())
        .all()
    )

    return DashboardSummary(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        low_stock_products=[ProductResponse.model_validate(p) for p in low_stock],
    )
