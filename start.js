const concurrently = require('concurrently');
const os = require('os');

const isWindows = os.platform() === 'win32';

// backend: create virtual environment, install dependencies & watch for changes in backend files
const backendCommand = isWindows
  ? "cd backend && python -m venv venv && venv\\Scripts\\pip install -r requirements.txt && venv\\Scripts\\watchmedo auto-restart --patterns=*.py --recursive -- venv\\Scripts\\python app.py"
  : "cd backend && python3 -m venv venv && venv/bin/pip install -r requirements.txt && venv/bin/watchmedo auto-restart --patterns=*.py --recursive -- venv/bin/python app.py";

// frontend: npm install & nodemon to watch for changes in frontend files
const frontendCommand = "cd frontend && npm install && npx nodemon --watch . --exec \"npm run dev\"";

// concurrently to run both backend and frontend commands
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
