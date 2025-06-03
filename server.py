from flask import Flask, request, redirect, session, jsonify
import requests
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)  # 로그인 세션용

# ✅ 여기에 너의 클라이언트 정보 입력
CLIENT_ID = '1379450135578411128'
CLIENT_SECRET = 'V9VYFvTM24ApP1ZwueYVBMu-cK55z2sH'
REDIRECT_URI = 'http://localhost:5000/callback'

user_data = {}  # 유저별 돈 저장용

# [1] 디스코드 로그인 버튼 눌렀을 때 이 링크로 보냄
@app.route("/login")
def login():
    return redirect(
        f"https://discord.com/api/oauth2/authorize?client_id={CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}&response_type=code&scope=identify"
    )

# [2] 로그인 완료 후 디스코드가 여길 부름
@app.route("/callback")
def callback():
    code = request.args.get('code')
    data = {
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI,
        'scope': 'identify'
    }
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}

    # 토큰 요청
    res = requests.post('https://discord.com/api/oauth2/token', data=data, headers=headers)
    res.raise_for_status()
    access_token = res.json()['access_token']

    # 유저 정보 요청
    user_info = requests.get(
        'https://discord.com/api/users/@me',
        headers={'Authorization': f'Bearer {access_token}'}
    ).json()

    # 세션 저장
    session['discord_id'] = user_info['id']
    session['username'] = user_info['username']

    return redirect('/play')  # 로그인 성공 후 게임 화면으로 리디렉션

# [3] 테트리스에서 로그인 정보 요청할 때
@app.route("/me")
def me():
    if 'discord_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    return jsonify({
        'id': session['discord_id'],
        'username': session['username']
    })

# [4] 점수 받기 API
@app.route("/api/tetris-score", methods=["POST"])
def tetris_score():
    if 'discord_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401

    data = request.json
    score = int(data['score'])
    earned = (score // 100) * 1000
    user_id = session['discord_id']

    user_data[user_id] = user_data.get(user_id, 0) + earned

    print(f"✅ {user_id}님이 {score}점 → {earned}원 지급 (총 {user_data[user_id]}원)")
    return {"money": user_data[user_id]}

# [5] 정적 파일 서비스 (index.html, script.js 등)
@app.route("/play")
def play_page():
    return redirect("https://tetris-f03d.onrender.com/")

if __name__ == "__main__":
    app.run(port=5000, debug=True)
