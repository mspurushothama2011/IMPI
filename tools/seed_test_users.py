"""
Seed script to create test users in the database.

This script creates three test users:
- Admin: admin@test.com / admin123!@#
- Manager: manager@test.com / manager123!@#
- Member: member@test.com / member123!@#

Usage:
    python tools/seed_test_users.py
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app import db_mongo as db
from app.auth import hash_password


async def seed_test_users():
    """Create test users in the database."""
    print("Seeding test users...")
    print("-" * 50)
    
    # Initialize database connection
    try:
        await db.init_db()
        print("Database connected")
    except Exception as e:
        print(f"✗ Failed to connect to database: {e}")
        return
    
    # Define test users
    users = [
        {
            'email': 'admin@test.com',
            'password': 'admin123!@#',
            'full_name': 'Test Admin',
            'role': 'admin'
        },
        {
            'email': 'manager@test.com',
            'password': 'manager123!@#',
            'full_name': 'Test Manager',
            'role': 'manager'
        },
        {
            'email': 'member@test.com',
            'password': 'member123!@#',
            'full_name': 'Test Member',
            'role': 'member'
        },
    ]
    
    print()
    
    # Create each user
    for user_data in users:
        email = user_data['email']
        
        try:
            # Check if user already exists
            existing = await db.get_user_by_email(email)
            
            if existing:
                print(f"Skipped {user_data['role']:8s} - {email:25s} (already exists)")
            else:
                # Create new user
                user_id = await db.create_user(
                    email=email,
                    password_hash=hash_password(user_data['password']),
                    full_name=user_data['full_name'],
                    role=user_data['role']
                )
                print(f"Created {user_data['role']:8s} - {email:25s} (ID: {user_id})")
                
        except Exception as e:
            print(f"Error creating {email}: {e}")
    
    # Close database connection
    await db.close_db()
    
    print()
    print("-" * 50)
    print("Seeding complete!")
    print()
    print("You can now login with:")
    print("  - admin@test.com / admin123!@#")
    print("  - manager@test.com / manager123!@#")
    print("  - member@test.com / member123!@#")
    print()


if __name__ == '__main__':
    asyncio.run(seed_test_users())
