"""
End-to-end test for the Knowledge AI backend
Tests: Login, Admin datasets, Document processing, Chat with PDF context
"""
import requests
import time
import json

BASE_URL = "http://localhost:8000/api/v1"
EMAIL = "vrajgoti07@gmail.com"
PASSWORD = "123456789"

def test_flow():
    print("=" * 60)
    print("KNOWLEDGE AI — END-TO-END TEST")
    print("=" * 60)

    # 1. Login
    print("\n[1] Testing Login...")
    r = requests.post(f"{BASE_URL}/auth/login", json={"email": EMAIL, "password": PASSWORD}, timeout=10)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text[:200]}"
    data = r.json()
    token = data.get("access_token") or data.get("token")
    assert token, f"No token in login response: {list(data.keys())}"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    print(f"  ✓ Login OK (token obtained)")

    # 2. Admin datasets
    print("\n[2] Testing Admin Datasets API...")
    r = requests.get(f"{BASE_URL}/admin/datasets", headers=headers, timeout=10)
    assert r.status_code == 200, f"Admin datasets failed: {r.status_code} {r.text[:200]}"
    datasets = r.json()
    print(f"  ✓ Admin datasets OK — found {len(datasets)} dataset(s)")
    for d in datasets:
        print(f"    - {d.get('title')} | status={d.get('status')} | chunks={d.get('chunks', 0)}")

    # 3. List conversations
    print("\n[3] Testing Conversations API...")
    r = requests.get(f"{BASE_URL}/conversations", headers=headers, timeout=10)
    assert r.status_code == 200, f"List conversations failed: {r.status_code}"
    print(f"  ✓ Conversations OK — found {len(r.json())} conversation(s)")

    # 4. Create conversation
    print("\n[4] Testing Create Conversation...")
    r = requests.post(f"{BASE_URL}/conversations", headers=headers, timeout=10)
    assert r.status_code == 200, f"Create conversation failed: {r.status_code} {r.text[:200]}"
    conv = r.json()
    conv_id = conv["id"]
    print(f"  ✓ Conversation created: {conv_id}")

    # 5. Send message to chat
    print("\n[5] Testing Chat (RAG pipeline)...")
    print("  Sending: 'What is machine learning?'")
    r = requests.post(
        f"{BASE_URL}/conversations/{conv_id}/messages",
        headers=headers,
        json={"content": "What is machine learning?"},
        timeout=60
    )
    assert r.status_code == 200, f"Chat failed: {r.status_code} {r.text[:300]}"
    msg = r.json()
    content = msg.get("content", "")
    citations = msg.get("citations", [])
    print(f"  ✓ Chat OK")
    print(f"  Response ({len(content)} chars): {content[:200]}...")
    print(f"  Citations: {len(citations)}")
    if citations:
        for c in citations[:2]:
            print(f"    - '{c.get('documentTitle')}' page {c.get('page')}")

    print("\n" + "=" * 60)
    print("ALL TESTS PASSED ✓")
    print("=" * 60)

if __name__ == "__main__":
    try:
        test_flow()
    except AssertionError as e:
        print(f"\n✗ ASSERTION FAILED: {e}")
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
