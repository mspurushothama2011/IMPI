"""
Pytest configuration and fixtures for IMIP tests.
"""
import os
import pytest
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import Config

@pytest.fixture(scope="session")
def config():
    """Return test configuration."""
    return Config(
        MONGODB_URI=os.getenv("MONGODB_URI", "mongodb://test:test123@localhost:27017/test_db?authSource=admin"),
        ENVIRONMENT="test"
    )

@pytest.fixture(scope="session")
async def db_client(config):
    """Create a test database client."""
    client = AsyncIOMotorClient(config.MONGODB_URI)
    try:
        # Test the connection
        await client.admin.command('ping')
        yield client
    finally:
        # Cleanup
        await client.drop_database('test_db')
        client.close()

@pytest.fixture(scope="function")
async def db(db_client):
    """Get a test database instance with automatic cleanup."""
    db = db_client.get_database('test_db')
    try:
        yield db
    finally:
        # Clean up collections after each test
        collections = await db.list_collection_names()
        for collection_name in collections:
            await db.drop_collection(collection_name)
