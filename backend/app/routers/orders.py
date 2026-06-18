from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Customer, Order, OrderItem, Product
from app.schemas import OrderCreate, OrderResponse, OrderItemResponse

router = APIRouter(prefix="/orders", tags=["Orders"])


def _build_order_response(order: Order) -> OrderResponse:
    # Flatten ORM relationships into the response shape used by React.
    return OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=order.customer.full_name,
        total_amount=order.total_amount,
        status=order.status,
        created_at=order.created_at,
        items=[
            OrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                product_name=item.product.name,
                product_sku=item.product.sku,
                quantity=item.quantity,
                unit_price=item.unit_price,
                line_total=item.line_total,
            )
            for item in order.items
        ],
    )


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def place_order(payload: OrderCreate, db: Session = Depends(get_db)):
    # Orders must belong to an existing customer.
    customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    # Load all requested products in one query.
    product_ids = [item.product_id for item in payload.items]
    products = db.query(Product).filter(Product.id.in_(product_ids)).all()
    products_by_id = {product.id: product for product in products}

    if len(products_by_id) != len(product_ids):
        missing_ids = set(product_ids) - set(products_by_id.keys())
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Products not found: {sorted(missing_ids)}",
        )

    for line in payload.items:
        # Stop the order if any product does not have enough stock.
        product = products_by_id[line.product_id]
        if product.quantity_in_stock < line.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient stock for '{product.name}' (SKU: {product.sku}). "
                    f"Available: {product.quantity_in_stock}, requested: {line.quantity}"
                ),
            )

    # The backend owns totals so users cannot submit fake amounts.
    order_total = Decimal("0.00")
    order_items = []

    for line in payload.items:
        # Capture item prices and reduce stock in the same transaction.
        product = products_by_id[line.product_id]
        line_total = (product.price * line.quantity).quantize(Decimal("0.01"))
        order_total += line_total

        order_items.append(
            OrderItem(
                product_id=product.id,
                quantity=line.quantity,
                unit_price=product.price,
                line_total=line_total,
            )
        )
        product.quantity_in_stock -= line.quantity

    new_order = Order(
        customer_id=customer.id,
        total_amount=order_total,
        items=order_items,
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    loaded_order = (
        db.query(Order)
        .options(joinedload(Order.customer), joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == new_order.id)
        .first()
    )
    return _build_order_response(loaded_order)


@router.get("", response_model=list[OrderResponse])
def list_orders(db: Session = Depends(get_db)):
    # Eager-load related data to avoid extra queries per order row.
    orders = (
        db.query(Order)
        .options(joinedload(Order.customer), joinedload(Order.items).joinedload(OrderItem.product))
        .order_by(Order.created_at.desc())
        .all()
    )
    return [_build_order_response(order) for order in orders]


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    # Return one complete order for the detail page.
    order = (
        db.query(Order)
        .options(joinedload(Order.customer), joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return _build_order_response(order)


@router.delete("/{order_id}", status_code=status.HTTP_200_OK)
def cancel_order(order_id: int, db: Session = Depends(get_db)):
    # Cancelling an order gives the stock back to inventory.
    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    for item in order.items:
        item.product.quantity_in_stock += item.quantity

    db.delete(order)
    db.commit()
    return {"message": "Order cancelled and stock restored"}
