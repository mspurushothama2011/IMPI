"""Test database connectivity and basic operations."""
import pytest


@pytest.mark.asyncio
async def test_database_connection(db):
    """Test database connection and basic operations."""
    # Test inserting a document
    collection = db["test_collection"]
    result = await collection.insert_one({"test": "data"})
    assert result.inserted_id is not None
    
    # Test retrieving the document
    doc = await collection.find_one({"_id": result.inserted_id})
    assert doc is not None
    assert doc["test"] == "data"
    
    # Test document count
    count = await collection.count_documents({})
    assert count == 1
