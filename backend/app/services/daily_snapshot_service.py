from sqlalchemy.orm import Session
from sqlalchemy import select, distinct
from datetime import datetime, timezone, time
import logging

from app.db.session import SessionLocal
from app.crud import crud_user, crud_portfolio_snapshot, crud_holding
from app.services import portfolio_service
from app.models.holding import Holding

logger = logging.getLogger(__name__)

def _get_end_of_day_timestamp() -> datetime:
    """
    Generates a consistent "end of day" timestamp for today.
    """
    now_utc = datetime.now(timezone.utc)
    eod_time = time(21, 0, 0, tzinfo=timezone.utc)
    return now_utc.replace(hour=eod_time.hour, minute=eod_time.minute, second=eod_time.second, microsecond=eod_time.microsecond)


def generate_daily_snapshots_for_relevant_users(db: Session):
    """
    Generates end-of-day portfolio snapshots for all users who currently have holdings.
    """
    logger.info("Starting daily portfolio snapshot generation...")
    processed_users = 0
    failed_users = 0

    # 1. Get all unique user_ids that have any holdings
    user_ids_with_holdings_stmt = select(distinct(Holding.user_id))
    user_ids_result = db.execute(user_ids_with_holdings_stmt).fetchall()
    user_ids = [uid[0] for uid in user_ids_result]

    if not user_ids:
        logger.info("No users with holdings found. No snapshots to generate.")
        return {"processed": 0, "failed": 0, "total_users_with_holdings": 0}

    logger.info(f"Found {len(user_ids)} users with holdings. Generating snapshots...")
    eod_timestamp = _get_end_of_day_timestamp()

    for user_id in user_ids:
        try:
            user = crud_user.get_user(db=db, user_id=user_id)
            if not user:
                logger.warning(f"User with ID {user_id} found in holdings but not in users table. Skipping.")
                failed_users +=1
                continue

            current_portfolio_details = portfolio_service.get_portfolio(db=db, user=user)
            total_value = current_portfolio_details.total_portfolio_value

            # Create the snapshot with a specific EOD timestamp
            crud_portfolio_snapshot.create_portfolio_snapshot(
                db=db,
                user_id=user.id,
                total_value=total_value,
                snapshot_timestamp=eod_timestamp
            )
            # Commit for each user to isolate failures
            db.commit()
            logger.info(f"Successfully created EOD snapshot for user {user.id}. Value: {total_value:.2f}")
            processed_users += 1
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create EOD snapshot for user {user_id}: {e}", exc_info=True)
            failed_users += 1

    logger.info(f"Daily snapshot generation complete. Processed: {processed_users}, Failed: {failed_users}, Total users with holdings: {len(user_ids)}")
    return {"processed": processed_users, "failed": failed_users, "total_users_with_holdings": len(user_ids)}


def daily_snapshot_job():
    """Job function to be called by the scheduler."""
    logger.info("Scheduler: Starting daily_snapshot_job...")
    db: Session | None = None
    try:
        db = SessionLocal()
        generate_daily_snapshots_for_relevant_users(db)
    except Exception as e:
        logger.error(f"Critical error in daily_snapshot_job: {e}", exc_info=True)
        if db: db.rollback()
    finally:
        if db:
            db.close()
            logger.info("Scheduler: Database session closed for daily_snapshot_job.")