/**
 * Reads the private usage report. The key lives in a variable for as long as the tab is
 * open and is never written to storage, so closing the tab ends the session.
 *
 * Everything is built with createElement and textContent rather than innerHTML: the
 * numbers come from a server, and a dashboard is not worth an injection route.
 */
(() => {
  const el = (id) => document.getElementById(id);
  let key = '';
  let report = null;

  const metrics = (data) => [
    ['Visiting browsers', data.visitors],
    ['Active today', data.activeToday],
    ['Active, last 7 days', data.active7d],
    ['Active, last 30 days', data.active30d],
    ['Returning browsers', data.returning],
    ['Home-screen browsers', data.standalone],
    ['Weekly retention', data.priorWeekActive
      ? `${Math.round((data.retainedFromPriorWeek / data.priorWeekActive) * 100)}% (${data.retainedFromPriorWeek}/${data.priorWeekActive})`
      : 'Not enough history']
  ];

  const card = (label, value) => {
    const box = document.createElement('div');
    box.className = 'metric';
    const name = document.createElement('span');
    name.textContent = label;
    const figure = document.createElement('strong');
    figure.textContent = String(value);
    box.append(name, figure);
    return box;
  };

  const row = (values) => {
    const tr = document.createElement('tr');
    for (const value of values) {
      const td = document.createElement('td');
      td.textContent = String(value);
      tr.append(td);
    }
    return tr;
  };

  const draw = () => {
    el('metrics').replaceChildren(...metrics(report).map(([label, value]) => card(label, value)));
    // Newest first: the day you are asking about is almost always today.
    el('rows').replaceChildren(...[...report.daily].reverse().map((day) => row([day.date, day.visitors, day.active, day.standalone])));
    el('status').textContent = `Updated ${new Date(report.generatedAt).toLocaleString()}`;
  };

  async function load() {
    el('status').textContent = 'Loading…';
    el('refresh').disabled = true;
    try {
      const response = await fetch('/.netlify/functions/usage', {
        headers: { Authorization: `Bearer ${key}` }, cache: 'no-store', credentials: 'omit'
      });
      if (response.status === 401) throw new Error('That key was not accepted.');
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'The dashboard is unavailable right now.');
      report = await response.json();
      el('login').hidden = true;
      el('results').hidden = false;
      el('key').value = '';
      draw();
    } catch (error) {
      el('status').textContent = error.message;
    } finally {
      el('refresh').disabled = false;
    }
  }

  el('login').addEventListener('submit', (event) => {
    event.preventDefault();
    key = el('key').value.trim();
    void load();
  });

  el('refresh').addEventListener('click', () => void load());

  el('logout').addEventListener('click', () => {
    key = '';
    report = null;
    el('results').hidden = true;
    el('login').hidden = false;
    el('metrics').replaceChildren();
    el('rows').replaceChildren();
    el('status').textContent = 'Locked.';
    el('key').focus();
  });

  el('export').addEventListener('click', () => {
    if (!report) return;
    const csv = [
      'date_utc,visiting_browsers,active_browsers,home_screen_browsers',
      ...report.daily.map((day) => [day.date, day.visitors, day.active, day.standalone].join(','))
    ].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `zikr-usage-${report.generatedAt.slice(0, 10)}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
})();
