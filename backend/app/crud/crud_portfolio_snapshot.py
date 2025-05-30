from sqlalchemy.orm import Session
from app.models.portfolio_snapshot import PortfolioSnapshot
import decimal
from datetime import datetime, timezone
from typing import List, Optional

def create_portfolio_snapshot(
    db: Session,
    user_id: int,
    total_value: decimal.Decimal,
    snapshot_timestamp: Optional[datetime] = None
) -> PortfolioSnapshot:
    """
    Creates a new portfolio snapshot for a user.
    """
    if snapshot_timestamp and snapshot_timestamp.tzinfo is None:
        snapshot_timestamp = snapshot_timestamp.replace(tzinfo=timezone.utc)

    db_snapshot = PortfolioSnapshot(
        user_id=user_id,
        total_value=total_value,
        # Only set timestamp if provided, otherwise let server_default work
        **(dict(timestamp=snapshot_timestamp) if snapshot_timestamp else {})
    )
    db.add(db_snapshot)
    db.flush()
    db.refresh(db_snapshot)
    return db_snapshot


def get_portfolio_snapshots_for_user(
    db: Session,
    user_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: Optional[int] = 1000
) -> List[PortfolioSnapshot]:
    """
    Retrieves portfolio snapshots for a given user, optionally filtered
    by date range and limited. Snapshots are ordered by timestamp ascending.
    """
    query = db.query(PortfolioSnapshot).filter(PortfolioSnapshot.user_id == user_id)

    if start_date:
        query = query.filter(PortfolioSnapshot.timestamp >= start_date)
    if end_date:
        query = query.filter(PortfolioSnapshot.timestamp <= end_date)

    query = query.order_by(PortfolioSnapshot.timestamp.asc())

    if limit:
        query = query.limit(limit)

    return query.all()