from dotenv import load_dotenv
from google import genai

# Load API key from .env
load_dotenv()

# Create Gemini client
client = genai.Client()

# Send a simple test request
response = client.models.generate_content(
    model="gemini-3.8-flash",
    contents="Say hello to CareerAI in one sentence."
)

print(response.text)