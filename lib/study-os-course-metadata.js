"use strict";
// Pure metadata validation. Never reads or writes browser storage, course pages or progress.
const SUBJECTS = Object.freeze(["acc","eco","math"]);
const MAX_NAME = 80, MAX_DESCRIPTION = 240;
function plainText(value,max,required) {
  if (typeof value !== "string") throw new TypeError("text must be a string");
  const text = value.trim();
  if ((required && !text) || text.length > max || /[<>\u0000-\u001f\u007f]/u.test(text)) throw new TypeError("invalid metadata text");
  return text;
}
function normalizeMetadata(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new TypeError("invalid metadata");
  if (payload.version !== 1 || !payload.courses || typeof payload.courses !== "object" || Array.isArray(payload.courses)) throw new TypeError("unsupported metadata");
  const keys = Object.keys(payload.courses).sort();
  if (keys.join(",") !== [...SUBJECTS].sort().join(",")) throw new TypeError("course identities must be unchanged");
  const courses = {};
  for (const id of SUBJECTS) {
    const row = payload.courses[id];
    if (!row || typeof row !== "object" || Array.isArray(row) || Object.keys(row).sort().join(",") !== "description,name") throw new TypeError("invalid course fields");
    courses[id] = {name:plainText(row.name,MAX_NAME,true),description:plainText(row.description,MAX_DESCRIPTION,false)};
  }
  if (!Array.isArray(payload.order) || payload.order.length !== SUBJECTS.length || new Set(payload.order).size !== SUBJECTS.length || payload.order.some(id=>!SUBJECTS.includes(id))) throw new TypeError("invalid course order");
  if (Object.keys(payload).sort().join(",") !== "courses,order,version") throw new TypeError("unknown metadata fields");
  return {version:1,courses,order:[...payload.order]};
}
function defaultMetadata() {
  return normalizeMetadata({version:1,courses:{
    acc:{name:"Accounting",description:"บันทึกรายการ ปรับปรุงบัญชี งบทดลอง งบการเงิน และสินค้าคงเหลือ"},
    eco:{name:"Economics",description:"ทบทวนแนวคิดเศรษฐศาสตร์จุลภาคและมหภาค พร้อมแบบฝึกหัด"},
    math:{name:"Mathematics",description:"ทบทวน Math for Life สูตรสำคัญ และฝึกโจทย์คณิตศาสตร์"}
  },order:[...SUBJECTS]});
}
const api = {SUBJECTS,normalizeMetadata,defaultMetadata};
if (typeof module !== "undefined" && module.exports) module.exports = api;
if (typeof globalThis !== "undefined") globalThis.StudyOSCourseMetadata = api;
