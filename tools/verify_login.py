"""
Quick script to verify if login credentials work.
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app import db_mongo as db
from app.auth import verify_password


async def verify_login(email: str, password: str):
    """Verify if email/password combination works."""
    print(f"🔍 Verifying login for: {email}")
    print("-" * 50)
    
    try:
        await db.init_db()
        
        # Get user
        user = await db.get_user_by_email(email)
        
        if not user:
            print(f"✗ User '{email}' not found in database")
            return False
        
        print(f"✓ User found:")
        print(f"  ID: {user.id}")
        print(f"  Email: {user.email}")
        print(f"  Full Name: {user.full_name}")
        print(f"  Role: {user.role}")
        print(f"  Created: {user.created_at}")
        print()
        
        # Verify password
        password_valid = verify_password(password, user.password_hash)
        
        if password_valid:
            print(f"✅ Password is CORRECT")
            print(f"✅ Login should work!")
        else:
            print(f"✗ Password is INCORRECT")
            print(f"✗ The stored hash doesn't match the provided password")
        
        await db.close_db()
        return password_valid
        
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


if __name__ == '__main__':
    # Test credentials
    test_users = [
        ('member@test.com', 'member123!@#'),
        ('admin@test.com', 'admin123!@#'),
        ('manager@test.com', 'manager123!@#'),
    ]
    
    print("=" * 50)
    print("Testing Login Credentials")
    print("=" * 50)
    print()
    
    for email, password in test_users:
        asyncio.run(verify_login(email, password))
        print()
