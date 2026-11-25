/* Exams → an .ics calendar file for the iPad Calendar app (owner, 24 Nov 2026).
   All-day events with two alerts (09:00 the day before, 07:00 on the day). Read-only: builds text, stores nothing. */
(function (root) {
  'use strict';
  function esc(s) { return String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1'); }
  function ymd(iso) { return iso.replace(/-/g, ''); }
  function nextDay(iso) { var d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); }
  function stamp(now) { return new Date(now).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
  /* exams: [{id, title, date 'YYYY-MM-DD'}]; only today and later; returns the file text (CRLF line ends) */
  function build(exams, now, today) {
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Study OS//Exams//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Study OS exams'];
    (exams || []).filter(function (e) { return e && /^\d{4}-\d{2}-\d{2}$/.test(e.date) && e.date >= today; })
      .sort(function (a, b) { return a.date.localeCompare(b.date); })
      .forEach(function (e) {
        lines.push('BEGIN:VEVENT', 'UID:' + esc(String(e.id || e.date)) + '@study-os', 'DTSTAMP:' + stamp(now),
          'DTSTART;VALUE=DATE:' + ymd(e.date), 'DTEND;VALUE=DATE:' + ymd(nextDay(e.date)),
          'SUMMARY:' + esc(e.title || 'Exam'), 'DESCRIPTION:' + esc('From Study OS'), 'TRANSP:TRANSPARENT',
          'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc((e.title || 'Exam') + ' tomorrow'), 'TRIGGER:-PT15H', 'END:VALARM',
          'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc((e.title || 'Exam') + ' today'), 'TRIGGER:PT7H', 'END:VALARM',
          'END:VEVENT');
      });
    lines.push('END:VCALENDAR');
    return lines.join('\r\n') + '\r\n';
  }
  var api = { build: build };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.StudyIcs = api;
})(typeof window !== 'undefined' ? window : this);
