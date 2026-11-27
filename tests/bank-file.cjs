// Writes workers/gemini-mcp/bank.json atomically (tmp file + rename). node --test runs test files in
// parallel processes, and a plain writeFileSync let one file import a half-written bank.json
// ("Unexpected end of JSON input", which failed the Gemini MCP deploy on 27 Nov 2026).
const fs=require('fs'),path=require('path');
const dest=path.join(__dirname,'..','workers/gemini-mcp/bank.json');
function writeBank(){
 const tmp=dest+'.'+process.pid+'.tmp';
 fs.writeFileSync(tmp,JSON.stringify(require('../scripts/build-question-bank.cjs').build()));
 fs.renameSync(tmp,dest);return dest;}
module.exports={writeBank,dest};
