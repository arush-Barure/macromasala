import { starter } from './foods.js';
export const KEY = 'macromasala_v2';
export const localDay = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
export const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
export const round = n => Math.round(Number(n) * 10) / 10;
export const totals = logs => logs.reduce((s, l) => { for (const k of ['cal', 'protein', 'carbs', 'fat']) s[k] += Number(l[k]) || 0; return s; }, { cal: 0, protein: 0, carbs: 0, fat: 0 });
export const percentage = (value, target) => target > 0 ? Math.round(value / target * 100) : 0;
export const bmi = (weight, height) => weight > 0 && height > 0 ? round(weight / (height / 100) ** 2) : null;
export function fresh() {
  return { version: 2, foods: starter.map((x, i) => ({ id: 's' + i, name: x[0], unit: x[1], cal: x[2], protein: x[3], carbs: x[4], fat: x[5] })), logs: [], weights: [], workouts: [], profile: { name: '', email: '', weight: '', height: '', age: '', sex: 'male', activity: 1.375, goal: 'maintain', targetWeight: '', waist: '', chest: '', hips: '', proteinGoal: 120, carbsGoal: 230, fatGoal: 67, calorieGoal: 2000 }, settings: { aiEndpoint: '' } };
}
export function migrate(old) {
  const result = fresh();
  if (!old || typeof old !== 'object') throw Error('This is not a MacroMasala backup.');
  for (const k of ['foods', 'logs', 'weights']) if (!Array.isArray(old[k])) throw Error('The backup is missing ' + k + '.');
  if (!old.profile || typeof old.profile !== 'object') throw Error('The backup is missing a profile.');
  result.profile = { ...result.profile, ...old.profile };
  if (old.version !== 2) {
    const p = old.profile;
    const estimated = Math.round((10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === 'male' ? 5 : -161)) * p.activity + Number(p.goal));
    result.profile.calorieGoal = estimated > 0 ? estimated : 2000;
    result.profile.goal = Number(p.goal) < 0 ? 'cut' : Number(p.goal) > 0 ? 'gain' : 'maintain';
    result.profile.fatGoal = Math.round(result.profile.calorieGoal * .3 / 9);
    result.profile.carbsGoal = Math.max(0, Math.round((result.profile.calorieGoal - Number(p.proteinGoal) * 4 - result.profile.fatGoal * 9) / 4));
  }
  for (const k of ['foods', 'logs', 'weights']) result[k] = old[k].map(x => ({ ...x, id: String(x.id || uid()) }));
  result.workouts = (old.workouts || []).map(x => ({ ...x, id: String(x.id || uid()) }));
  result.settings = { aiEndpoint: typeof old.settings?.aiEndpoint === 'string' ? old.settings.aiEndpoint : '' };
  validate(result);
  return result;
}
function finiteRange(n, min, max) { return n !== '' && n !== null && Number.isFinite(Number(n)) && Number(n) >= min && Number(n) <= max; }
export function validDay(day) { return typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day) && !Number.isNaN(Date.parse(day)) && new Date(day).toISOString().slice(0, 10) === day; }
export function validStrava(url) { if (!url) return true; try { const u = new URL(url); return u.protocol === 'https:' && ['strava.com', 'www.strava.com'].includes(u.hostname) && /^\/activities\/\d+\/?$/.test(u.pathname) && !u.username && !u.password; } catch { return false; } }
export function validate(d) {
  for (const list of ['logs', 'foods', 'weights', 'workouts']) if (!Array.isArray(d[list]) || d[list].length > 50000) throw Error('Invalid ' + list + '.');
  for (const x of [...d.logs, ...d.foods]) {
    if (typeof x.name !== 'string' || !x.name.trim() || x.name.length > 300 || typeof x.unit !== 'string') throw Error('A food has an invalid name or serving.');
    for (const k of ['cal', 'protein', 'carbs', 'fat']) if (!finiteRange(x[k], 0, 100000)) throw Error('Invalid nutrition values.');
    if (x.photo && (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(x.photo) || x.photo.length > 3000000)) throw Error('Invalid meal image.');
  }
  for (const x of d.logs) if (!validDay(x.day) || !finiteRange(x.qty, .001, 10000)) throw Error('Invalid meal date or quantity.');
  for (const x of d.weights) if (!validDay(x.day) || !finiteRange(x.weight, 1, 500)) throw Error('Invalid weight entry.');
  for (const x of d.workouts) {
    if (!validDay(x.day) || typeof x.name !== 'string' || !x.name.trim() || !finiteRange(x.minutes, .1, 10080) || !finiteRange(x.distance || 0, 0, 10000) || !finiteRange(x.cal || 0, 0, 100000) || !validStrava(x.stravaUrl)) throw Error('Invalid activity entry.');
  }
  const p = d.profile;
  for (const k of ['proteinGoal', 'carbsGoal', 'fatGoal']) if (!finiteRange(p[k], 0, 2000)) throw Error('Invalid macro goal.');
  if (!finiteRange(p.calorieGoal, 1, 20000) || !['cut', 'gain', 'maintain'].includes(p.goal)) throw Error('Invalid calorie goal.');
  for (const k of ['weight','height','waist','chest','hips','targetWeight','age']) if (p[k] !== '' && !finiteRange(p[k], 1, k === 'age' ? 120 : 500)) throw Error('Invalid body measurement.');
  return d;
}
export function parseCSV(text) {
  const rows = []; let row = [], value = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { value += '"'; i++; } else quoted = !quoted; }
    else if (c === ',' && !quoted) { row.push(value); value = ''; }
    else if ((c === '\n' || c === '\r') && !quoted) { if (c === '\r' && text[i + 1] === '\n') i++; row.push(value); if (row.some(v => v.trim())) rows.push(row); row = []; value = ''; }
    else value += c;
  }
  if (quoted) throw Error('The CSV contains an unclosed quotation mark.');
  row.push(value); if (row.some(v => v.trim())) rows.push(row);
  return rows;
}
export function stravaCSV(text, existing = []) {
  const rows = parseCSV(text.replace(/^\uFEFF/, ''));
  if (rows.length < 2) throw Error('No activities found in this CSV.');
  const header = rows.shift().map(v => v.trim().toLowerCase());
  const get = (row, key) => row[header.indexOf(key)]?.trim() || '';
  for (const h of ['activity id', 'activity date', 'activity name', 'elapsed time']) if (!header.includes(h)) throw Error('Use the activities.csv file from your Strava data export.');
  const ids = new Set(existing.map(x => x.stravaId).filter(Boolean));
  let skipped = 0;
  const workouts = [];
  for (const row of rows) {
    const id = get(row, 'activity id');
    if (ids.has(id)) { skipped++; continue; }
    const rawDate = get(row, 'activity date');
    // Strava CSV dates represent recorded activity dates; preserve their calendar date.
    const parsed = new Date(rawDate);
    const day = /^\d{4}-\d{2}-\d{2}/.test(rawDate) ? rawDate.slice(0, 10) : !Number.isNaN(parsed.getTime()) ? localDay(parsed) : '';
    const minutes = Number(get(row, 'elapsed time')) / 60;
    if (!/^\d+$/.test(id) || !validDay(day) || !finiteRange(minutes, .1, 10080)) { skipped++; continue; }
    // The first Distance column in Strava's activities.csv is in kilometres.
    const distance = Number(get(row, 'distance')) || 0;
    const cal = Number(get(row, 'calories')) || 0;
    if (!finiteRange(distance, 0, 10000) || !finiteRange(cal, 0, 100000)) { skipped++; continue; }
    workouts.push({ id: uid(), stravaId: id, name: (get(row, 'activity name') || 'Strava activity').slice(0, 150), day, type: get(row, 'activity type') || 'Workout', minutes: round(minutes), distance: round(distance), cal: round(cal), stravaUrl: 'https://www.strava.com/activities/' + id, notes: '' }); ids.add(id);
  }
  return { workouts, skipped };
}
