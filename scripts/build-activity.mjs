// Builds the contribution heatmap from the GitHub GraphQL API, in the portfolio's
// cobalt scale. Runs daily in .github/workflows/activity.yml.
// Token: ACTIVITY_TOKEN (a read-only personal token, so private contributions count when
// "Include private contributions" is on in the profile), else GITHUB_TOKEN (public only).
import { THEMES, fonts, text, measure, labels, svg, save, paperGround } from './lib.mjs';

const LOGIN = process.env.PROFILE_LOGIN || 'jesniemagaling';
const token = process.env.ACTIVITY_TOKEN || process.env.GITHUB_TOKEN;
if (!token) {
  console.log('No ACTIVITY_TOKEN or GITHUB_TOKEN set; keeping the current activity images.');
  process.exit(0);
}

const LEVELS = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const response = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'profile-activity' },
  body: JSON.stringify({
    query: `query($login: String!) { user(login: $login) { contributionsCollection { contributionCalendar {
      totalContributions weeks { contributionDays { date contributionCount contributionLevel weekday } } } } } }`,
    variables: { login: LOGIN },
  }),
});
if (!response.ok) throw new Error(`GitHub responded with HTTP ${response.status}.`);
const calendar = (await response.json())?.data?.user?.contributionsCollection?.contributionCalendar;
if (!calendar) throw new Error('GitHub returned no contribution calendar.');

const weeks = calendar.weeks.map((week) => week.contributionDays.map((day) => ({
  date: day.date, count: day.contributionCount, level: LEVELS[day.contributionLevel] ?? 0, weekday: day.weekday,
})));
const days = weeks.flat();
const total = calendar.totalContributions;
const active = days.filter((day) => day.count > 0).length;
let longest = { days: 0, from: '', to: '' };
let run = 0;
let start = '';
for (const day of days) {
  if (day.count > 0) {
    if (run === 0) start = day.date;
    run += 1;
    if (run > longest.days) longest = { days: run, from: start, to: day.date };
  } else run = 0;
}
let current = 0;
for (let i = days.length - 1; i >= 0; i--) {
  if (days[i].count > 0) current += 1;
  else if (i === days.length - 1) continue;
  else break;
}
const short = (date) => `${MONTHS[Number(date.slice(5, 7)) - 1]} ${Number(date.slice(8, 10))}`;
const monthYear = (date) => `${MONTHS[Number(date.slice(5, 7)) - 1]} ${date.slice(0, 4)}`;
const number = (value) => value.toLocaleString('en-US');

function card(theme) {
  const W = 1200;
  const pad = 40;
  const parts = [];
  parts.push(labels(['GitHub activity', `${monthYear(days[0].date)} — ${monthYear(days.at(-1).date)}`], { x: pad, y: pad + 12, theme, size: 13 }));
  parts.push(text(number(total), { x: pad, y: pad + 92, font: fonts.serif, size: 72, fill: theme.ink }));
  parts.push(text('contributions in the last 12 months, including private work', { x: pad, y: pad + 124, font: fonts.sans, size: 18, fill: theme.soft }));
  const stats = [
    ['ACTIVE DAYS', number(active), ''],
    ['LONGEST STREAK', `${longest.days} days`, longest.days ? `${short(longest.from)} – ${short(longest.to)}` : ''],
    ['CURRENT STREAK', `${current} ${current === 1 ? 'day' : 'days'}`, ''],
  ];
  let sx = W - pad;
  for (const [label, value, note] of [...stats].reverse()) {
    const width = Math.max(measure(label, fonts.mono, 12, 0.06), measure(value, fonts.serif, 30) + (note ? measure(note, fonts.sans, 13) + 8 : 0));
    sx -= width;
    parts.push(text(label, { x: sx, y: pad + 66, font: fonts.mono, size: 12, fill: theme.muted, tracking: 0.06 }));
    parts.push(text(value, { x: sx, y: pad + 104, font: fonts.serif, size: 30, fill: theme.ink }));
    if (note) parts.push(text(note, { x: sx + measure(value, fonts.serif, 30) + 8, y: pad + 104, font: fonts.sans, size: 13, fill: theme.muted }));
    sx -= 48;
  }

  // Heatmap: one column per week, Sunday at the top, like GitHub's own calendar.
  const gridX = pad + 40;
  const gridY = pad + 184;
  const gap = 3;
  const cell = (W - gridX - pad - gap * (weeks.length - 1)) / weeks.length;
  let lastMonth = -1;
  weeks.forEach((week, x) => {
    const month = Number(week[0].date.slice(5, 7)) - 1;
    if (month !== lastMonth && x < weeks.length - 2) {
      parts.push(text(MONTHS[month], { x: gridX + x * (cell + gap), y: gridY - 10, font: fonts.mono, size: 11, fill: theme.muted }));
      lastMonth = month;
    }
    week.forEach((day) => {
      const cx = gridX + x * (cell + gap);
      const cy = gridY + day.weekday * (cell + gap);
      parts.push(`<rect x="${cx.toFixed(2)}" y="${cy.toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}" rx="2" fill="${theme.heat[day.level]}"/>`);
    });
  });
  [['Mon', 1], ['Wed', 3], ['Fri', 5]].forEach(([label, row]) => {
    parts.push(text(label, { x: pad, y: gridY + row * (cell + gap) + cell * 0.75, font: fonts.mono, size: 11, fill: theme.muted }));
  });
  const legendY = gridY + 7 * (cell + gap) + 30;
  parts.push(text(`github.com/${LOGIN}`, { x: pad, y: legendY + 4, font: fonts.sansMedium, size: 16, fill: theme.ink }));
  let lx = W - pad;
  const more = measure('MORE', fonts.mono, 11, 0.04);
  lx -= more;
  parts.push(text('MORE', { x: lx, y: legendY + 4, font: fonts.mono, size: 11, fill: theme.muted, tracking: 0.04 }));
  lx -= 8;
  for (let level = 4; level >= 0; level--) {
    lx -= 13;
    parts.push(`<rect x="${lx}" y="${legendY - 7}" width="12" height="12" rx="2" fill="${theme.heat[level]}"/>`);
    lx -= 3;
  }
  lx -= 8 + measure('LESS', fonts.mono, 11, 0.04);
  parts.push(text('LESS', { x: lx, y: legendY + 4, font: fonts.mono, size: 11, fill: theme.muted, tracking: 0.04 }));

  const H = Math.round(legendY + pad);
  return svg(W, H, theme,
    paperGround(theme, W, H) + `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="4" fill="none" stroke="${theme.rule}"/>` + parts.join(''),
    `GitHub activity: ${number(total)} contributions in the last 12 months on ${active} days. Longest streak ${longest.days} days, current streak ${current} days.`);
}

for (const theme of Object.values(THEMES)) save(`activity-${theme.name}.svg`, card(theme));
console.log(`activity: ${number(total)} contributions, ${active} active days`);
