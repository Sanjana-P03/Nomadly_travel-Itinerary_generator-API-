from flask import Flask, jsonify, request
from flask_cors import CORS  # ✅ Import this

app = Flask(__name__)
CORS(app)

# Load your CSV file
df = pd.read_csv("weather-1.csv")

@app.route('/')
def home():
    return jsonify({"message": "Welcome to the Weather Data API"})

# 🟢 Add this route anywhere below the home() function
@app.route('/districts')
def get_districts():
    return jsonify(df['District'].unique().tolist())

@app.route('/weather')
def get_weather():
    district = request.args.get('district')
    if not district:
        return jsonify({"error": "Please provide a district name, e.g. /weather?district=Delhi"}), 400

    # Filter data by district (case-insensitive)
    district_data = df[df['District'].str.lower().str.strip() == district.lower().strip()]

    if district_data.empty:
        return jsonify({"error": f"No data found for district: {district}"}), 404

    data = district_data.iloc[0].to_dict()
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)
