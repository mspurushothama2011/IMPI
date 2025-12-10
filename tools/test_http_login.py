"""
Test login via HTTP to debug the issue.
"""

import requests

def test_login(email, password):
    """Test login endpoint directly."""
    url = "http://localhost:8080/auth/login"
    
    print(f"\n🧪 Testing login: {email}")
    print("-" * 50)
    
    # Create form data (same as frontend)
    form_data = {
        'email': email,
        'password': password
    }
    
    headers = {}
    
    try:
        response = requests.post(url, data=form_data, timeout=5)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"\nResponse Body:")
        
        try:
            json_response = response.json()
            import json
            print(json.dumps(json_response, indent=2))
            
            if response.status_code == 200 and json_response.get('success'):
                print("\n✅ Login SUCCESSFUL!")
                return True
            else:
                print(f"\n❌ Login FAILED: {json_response.get('detail', json_response.get('error', 'Unknown error'))}")
                return False
                
        except Exception as e:
            print(f"Response text: {response.text}")
            print(f"\n❌ Failed to parse JSON: {e}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ ERROR: Cannot connect to backend at http://localhost:8080")
        print("   Make sure the backend server is running!")
        return False
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False


if __name__ == '__main__':
    print("=" * 50)
    print("HTTP Login Test")
    print("=" * 50)
    
    # Test all three users
    test_users = [
        ('member@test.com', 'member123!@#'),
        ('admin@test.com', 'admin123!@#'),
        ('manager@test.com', 'manager123!@#'),
    ]
    
    results = []
    for email, password in test_users:
        success = test_login(email, password)
        results.append((email, success))
    
    print("\n" + "=" * 50)
    print("SUMMARY")
    print("=" * 50)
    for email, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {email}")
    print()
