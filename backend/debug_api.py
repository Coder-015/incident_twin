import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_start():
    print("Testing /incident/start...")
    try:
        res = requests.post(f"{BASE_URL}/incident/start", json={"sector": "Finance"})
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            print("Response:", json.dumps(res.json(), indent=2))
            return res.json()
        else:
            print("Error:", res.text)
    except Exception as e:
        print(f"Failed to connect: {e}")

def test_replay():
    print("\nTesting /validation/replay...")
    try:
        res = requests.post(f"{BASE_URL}/validation/replay")
        print(f"Status: {res.status_code}")
        print("Response:", res.text[:200] + "...")
    except Exception as e:
        print(f"Failed to connect: {e}")

if __name__ == "__main__":
    test_start()
    test_replay()
