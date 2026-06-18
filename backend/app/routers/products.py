from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Product
from app.schemas import ProductCreate, ProductResponse, ProductUpdate

router = APIRouter(prefix="/products", tags=["Products"])


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def add_product(payload: ProductCreate, db: Session = Depends(get_db)):
    # Reject duplicate SKUs before the database constraint is hit.
    existing = db.query(Product).filter(Product.sku == payload.sku).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A product with SKU '{payload.sku}' already exists",
        )

    # Create the product after validation passes.
    new_product = Product(
        name=payload.name,
        sku=payload.sku,
        price=payload.price,
        quantity_in_stock=payload.quantity_in_stock,
    )
    db.add(new_product)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product SKU must be unique",
        )
    db.refresh(new_product)
    return new_product


@router.get("", response_model=list[ProductResponse])
def list_products(db: Session = Depends(get_db)):
    # Return products alphabetically for a predictable table.
    return db.query(Product).order_by(Product.name).all()


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    # Look up a single product by ID.
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    # Update only the fields that the client sent.
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    update_data = payload.model_dump(exclude_unset=True)

    if "sku" in update_data and update_data["sku"] != product.sku:
        # A changed SKU must still be unique.
        duplicate = db.query(Product).filter(Product.sku == update_data["sku"]).first()
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A product with SKU '{update_data['sku']}' already exists",
            )

    if "quantity_in_stock" in update_data and update_data["quantity_in_stock"] < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product quantity cannot be negative",
        )

    for field, value in update_data.items():
        # Apply validated fields to the existing row.
        setattr(product, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product SKU must be unique",
        )
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_200_OK)
def remove_product(product_id: int, db: Session = Depends(get_db)):
    # Products used in orders are protected from accidental deletion.
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    if product.order_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a product that has been ordered. Consider updating stock instead.",
        )

    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}
