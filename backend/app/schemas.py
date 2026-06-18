from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class ProductCreate(BaseModel):
    # Required payload for adding a product.
    name: str = Field(..., min_length=1, max_length=200)
    sku: str = Field(..., min_length=1, max_length=50)
    price: Decimal = Field(..., gt=0)
    quantity_in_stock: int = Field(..., ge=0)


class ProductUpdate(BaseModel):
    # Optional fields allow partial product updates.
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    sku: Optional[str] = Field(None, min_length=1, max_length=50)
    price: Optional[Decimal] = Field(None, gt=0)
    quantity_in_stock: Optional[int] = Field(None, ge=0)


class ProductResponse(BaseModel):
    # Product shape returned to the frontend.
    id: int
    name: str
    sku: str
    price: Decimal
    quantity_in_stock: int
    created_at: datetime

    model_config = {"from_attributes": True}


class CustomerCreate(BaseModel):
    # Required payload for adding a customer.
    full_name: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    phone_number: str = Field(..., min_length=7, max_length=30)


class CustomerResponse(BaseModel):
    # Customer shape returned to the frontend.
    id: int
    full_name: str
    email: str
    phone_number: str
    created_at: datetime

    model_config = {"from_attributes": True}


class OrderItemCreate(BaseModel):
    # One product line inside an order request.
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0)


class OrderCreate(BaseModel):
    # Order request with one customer and one or more product lines.
    customer_id: int = Field(..., gt=0)
    items: list[OrderItemCreate] = Field(..., min_length=1)

    @field_validator("items")
    @classmethod
    def check_unique_products(cls, items: list[OrderItemCreate]) -> list[OrderItemCreate]:
        # Keep each product on a single line to avoid confusing stock checks.
        product_ids = [item.product_id for item in items]
        if len(product_ids) != len(set(product_ids)):
            raise ValueError("Each product can only appear once per order")
        return items


class OrderItemResponse(BaseModel):
    # Expanded order item details for tables and order detail pages.
    id: int
    product_id: int
    product_name: str
    product_sku: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    # Full order response with customer name and item breakdown.
    id: int
    customer_id: int
    customer_name: str
    total_amount: Decimal
    status: str
    created_at: datetime
    items: list[OrderItemResponse]

    model_config = {"from_attributes": True}


class DashboardSummary(BaseModel):
    # Numbers and low-stock rows shown on the dashboard.
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_products: list[ProductResponse]


class MessageResponse(BaseModel):
    # Simple success message response.
    message: str
