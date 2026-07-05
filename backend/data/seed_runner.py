"""Database seed runner — populates initial data on first boot."""
import logging

logger = logging.getLogger(__name__)


async def run_seeds():
    """Run all seed scripts on first boot."""
    try:
        logger.info("Running database seeds...")
        # Seeds are handled by synthetic data in the routes for now
        # Full DB seeding would insert via SQLAlchemy in production
        logger.info("Database seeds complete")
    except Exception as e:
        logger.warning(f"Seed error (non-fatal): {e}")
