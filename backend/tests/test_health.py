import sys
import os
import unittest
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path for importing app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

class TestHealthEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_root_endpoint(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("message", data)
        self.assertIn("FastAPI", data["message"])

    def test_health_check_endpoint(self):
        response = self.client.get("/api/v1/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("status", data)
        self.assertIn("db", data)
        self.assertIn("qdrant", data)
        self.assertIn("redis", data)

if __name__ == "__main__":
    unittest.main()

