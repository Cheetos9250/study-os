/* Study OS review reminders (27 Nov 2026). Opt-in, per device. No server and no push service:
   - A notification appears only while Study OS is open or was just reopened (Today, once a day, 07:00-21:00 Bangkok) and something is due.
   - The app-icon badge (navigator.setAppBadge: Chrome/Android, and the iPad/iPhone Home Screen app on iOS 16.4+) shows the due count
     as of the last time the app was open; it cannot update while the app is closed.
   - Reminders while the app is closed come from the Life OS Telegram 07:00 digest (ecosystem/v1 /digest), not from this file.
   Stores only studyos.remind.v1 = {on, last}: a device setting, never backed up or synced (like studyos.theme.v1). */
(function (root) {
  'use strict';
  var KEY = 'studyos.remind.v1', TZ = 7 * 3600000;
  function dayKey(t) { return new Date(t + TZ).toISOString().slice(0, 10); }
  function hourOf(t) { return new Date(t + TZ).getUTCHours(); }
  function read() { try { var s = JSON.parse(root.localStorage.getItem(KEY) || 'null'); return s && typeof s === 'object' ? { on: s.on === true, last: typeof s.last === 'string' ? s.last : '' } : { on: false, last: '' }; } catch (e) { return { on: false, last: '' }; } }
  function write(s) { try { root.localStorage.setItem(KEY, JSON.stringify({ on: !!s.on, last: s.last || '' })); } catch (e) {} }
  function supported() { return typeof root.Notification === 'function'; }
  function permission() { return supported() ? root.Notification.permission : 'unsupported'; }
  /* pure: should a notification go out now? */
  function shouldNotify(state, perm, total, now) {
    var h = hourOf(now);
    return !!(state && state.on && perm === 'granted' && total > 0 && state.last !== dayKey(now) && h >= 7 && h < 21);
  }
  function text(total, cards, quiz) {
    var parts = [];
    if (cards) parts.push(cards + ' card' + (cards === 1 ? '' : 's'));
    if (quiz) parts.push(quiz + ' question' + (quiz === 1 ? '' : 's'));
    return { title: 'Study OS: ' + total + ' to review', body: parts.join(' and ') + ' due today. A short session keeps them fresh.' };
  }
  function badge(total) {
    try {
      if (total > 0 && root.navigator && root.navigator.setAppBadge) root.navigator.setAppBadge(total);
      else if (root.navigator && root.navigator.clearAppBadge) root.navigator.clearAppBadge();
    } catch (e) {}
  }
  function show(msg) {
    var opt = { body: msg.body, tag: 'studyos-review', icon: 'assets/icon-192.png', data: { url: 'index.html' } };
    try {
      if (root.navigator && root.navigator.serviceWorker && root.navigator.serviceWorker.getRegistration) {
        return root.navigator.serviceWorker.getRegistration().then(function (r) { if (r && r.showNotification) return r.showNotification(msg.title, opt); new root.Notification(msg.title, opt); });
      }
      new root.Notification(msg.title, opt);
    } catch (e) {}
    return Promise.resolve();
  }
  /* call on every Today render with the counts; safe to call often */
  function update(cards, quiz, now) {
    now = now || Date.now(); cards = cards || 0; quiz = quiz || 0;
    var st = read(), total = cards + quiz;
    if (!st.on) return false;
    badge(total);
    if (!shouldNotify(st, permission(), total, now)) return false;
    st.last = dayKey(now); write(st);
    show(text(total, cards, quiz));
    return true;
  }
  /* must run from a tap: asks the browser for permission, then switches on */
  function enable() {
    if (!supported()) return Promise.resolve('unsupported');
    var ask = root.Notification.permission === 'granted' ? Promise.resolve('granted') : Promise.resolve(root.Notification.requestPermission());
    return ask.then(function (p) { if (p === 'granted') write({ on: true, last: read().last }); return p; });
  }
  function disable() { var s = read(); write({ on: false, last: s.last }); badge(0); }
  var api = { KEY: KEY, read: read, supported: supported, permission: permission, shouldNotify: shouldNotify, text: text, update: update, enable: enable, disable: disable, dayKey: dayKey };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.StudyRemind = api;
})(typeof window !== 'undefined' ? window : globalThis);
