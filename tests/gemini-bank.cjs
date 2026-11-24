// Shared by the Gemini Worker tests: builds workers/gemini-mcp/bank.json atomically (temp file + rename), because
// node --test runs test files in parallel and a half-written bank.json would fail another file's import.
const fs=require('fs'),path=require('path');
module.exports=function writeBank(){
 const bank=require('../scripts/build-question-bank.cjs').build(),dest=path.join(__dirname,'..','workers/gemini-mcp/bank.json');
 const tmp=dest+'.'+process.pid+'.'+Math.random().toString(36).slice(2)+'.tmp';
 fs.writeFileSync(tmp,JSON.stringify(bank));fs.renameSync(tmp,dest);return bank;
};
