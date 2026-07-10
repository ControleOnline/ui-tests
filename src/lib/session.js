const SESSION_STORAGE_KEY = 'session';

function readLocalStorageValue(key) {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalStorageValue(key, value) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(key, value);
}

function removeLocalStorageValue(key) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.removeItem(key);
}

export function readStoredSession() {
  const raw = readLocalStorageValue(SESSION_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    removeLocalStorageValue(SESSION_STORAGE_KEY);
    return null;
  }
}

export function writeStoredSession(session) {
  if (!session || typeof session !== 'object') {
    removeLocalStorageValue(SESSION_STORAGE_KEY);
    return;
  }

  writeLocalStorageValue(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  removeLocalStorageValue(SESSION_STORAGE_KEY);
}

export function getStoredSessionApiKey(session = readStoredSession()) {
  return String(session?.api_key || session?.token || '').trim();
}

export function hasStoredSession(session = readStoredSession()) {
  if (!session || typeof session !== 'object') {
    return false;
  }

  const isActive = session.active === 1 || session.active === true;
  return isActive && getStoredSessionApiKey(session) !== '';
}
