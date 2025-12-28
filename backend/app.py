import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv
from PIL import Image
import io

load_dotenv()

app = Flask(__name__)
CORS(app)

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Text-only chat endpoint (keeps chat history)
model = genai.GenerativeModel("gemini-2.5-flash")
chat = model.start_chat(history=[])

@app.route('/chat', methods=['POST'])
def chat_endpoint():
    data = request.get_json()
    user_message = data.get('message')
    if not user_message:
        return jsonify({"error": "No message provided"}), 400
    try:
        response = chat.send_message(user_message, stream=True)
        full_response_text = ""
        for chunk in response:
            full_response_text += chunk.text
        return jsonify({"response": full_response_text})
    except Exception as e:
        print(f"Error during Gemini API call: {e}")
        return jsonify({"error": f"Gemini API error: {e}"}), 500

@app.route('/image-chat', methods=['POST'])
def image_chat_endpoint():
    if 'file' not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files['file']
    prompt = request.form.get('prompt', '')

    try:
        image_bytes = file.read()
        image = Image.open(io.BytesIO(image_bytes))
        vision_model = genai.GenerativeModel('gemini-3-flash-preview')
        contents = []
        if prompt:
            contents.append(prompt)
        contents.append(image)
        response = vision_model.generate_content(contents)
        return jsonify({"response": response.text})
    except Exception as e:
        print(f"Error during Gemini Vision API call: {e}")
        return jsonify({"error": f"Gemini Vision API error: {e}"}), 500

@app.route('/generate-image', methods=['POST'])
def generate_image_endpoint():
    data = request.get_json()
    prompt = data.get('prompt')

    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    api_url = f"https://image.pollinations.ai/prompt/{prompt.replace(' ', '%20')}"

    try:
        # The API redirects to the final image URL, so we capture the final URL.
        response = requests.get(api_url) 
        
        if response.status_code == 200:
            return jsonify({"success": True, "imageUrl": response.url})
        else:
            print(f"API request failed with status code {response.status_code}")
            return jsonify({"error": "Failed to generate image."}), 500

    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": f"An error occurred: {e}"}), 500

@app.route('/')
def home():
    return "Flask Backend for Gemini Chat is running!"

if __name__ == '__main__':
    if not os.getenv("GOOGLE_API_KEY"):
        raise ValueError("GOOGLE_API_KEY environment variable not set. Please create a .env file.")
    app.run(debug=True, port=5000)