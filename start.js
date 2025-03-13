const concurrently = require('concurrently');
const os = require('os');

const isWindows = os.platform() === 'win32';

const backendCommand = isWindows
  ? "cd backend && python -m venv venv && venv\\Scripts\\pip install -r requirements.txt && venv\\Scripts\\python app.py"
  : "cd backend && python3 -m venv venv && venv/bin/pip install -r requirements.txt && venv/bin/python app.py";

const frontendCommand = "cd frontend && npm install && npm run dev";

// concurrently가 반환하는 객체의 result 프로퍼티에 Promise가 들어있습니다.
const { result } = concurrently([
  { command: backendCommand, name: 'backend', prefixColor: 'blue', shell: true },
  { command: frontendCommand, name: 'frontend', prefixColor: 'green', shell: true }
], {
  killOthers: ['failure', 'success'],
  restartTries: 3
});

result.then(
  () => { console.log('All processes terminated successfully.'); },
  (err) => { console.error('One of the processes failed:', err); }
);
