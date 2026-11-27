// Cloud sync dialog: "Sign in from iPad" on a computer without the key, "Approve a computer" on a device with it.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','scripts/study-cloud.js'),'utf8');
test('dialog offers sign-in, approve, revoke and sign-out, and the session token is stored with its end time',()=>{
 for(const a of ['pair','approve','revoke','logout'])assert.match(src,new RegExp('data-a="'+a+'"'));
 assert.match(src,/'\/pair\/start'/);assert.match(src,/'\/pair\/poll'/);assert.match(src,/'\/pair\/approve'/);
 assert.match(src,/key: r\.token, exp: r\.expires/);
 assert.match(src,/!\(e\.exp && e\.exp < Date\.now\(\)\)/,'an expired session counts as no key');
 assert.match(src,/isSession\(\) \? '<button type="button" data-a="logout"/,'a signed-in computer cannot approve others or change the key');
});
