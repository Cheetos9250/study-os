'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../accounting-textbook.html'),'utf8');
function setup(){
 const nodes={answer:{value:'Unpersisted answer'},error:{textContent:'',hidden:true},saveStatus:{textContent:''}};
 const state={nodes,blocked:true,calls:0,saved:null};
 const context=vm.createContext({state,$:id=>nodes[id],clearTimeout(){},Date,localStorage:{getItem(){return state.saved;},setItem(key,value){state.calls++;if(state.blocked)throw Error('QuotaExceededError');state.saved=value;}}});
 const source=['persist','flushNotes','warnUnsaved'].map(name=>{const line=html.split('\n').find(x=>x.startsWith('function '+name+'('));assert.ok(line);return line;}).join('\n');
 vm.runInContext("const PROGRESS_KEY='synthetic',STORAGE_ERROR='Browser storage is full or blocked. Export your answers before leaving this page.';const STORAGE_CONFLICT='Saved answers changed or could not be checked safely';let progressExpected=null,progressReadKnown=true,progressDirty=false,progress={},current={id:'QS-6-1'},saveTimer=null;function error(msg){$('error').textContent=msg;$('error').hidden=!msg;}\n"+source,context);
 return {state,run:code=>vm.runInContext(code,context)};
}
test('failed notes retry without requiring a text edit and preserve working/status',()=>{
 const {state,run}=setup();run("progress[current.id]={status:'doing'};flushNotes()");assert.equal(run('progressDirty'),true);assert.equal(state.saved,null);assert.match(state.nodes.saveStatus.textContent,/Not saved/);
 run('flushNotes()');assert.equal(state.calls,2,'unchanged draft must retry');
 state.blocked=false;run('flushNotes()');assert.equal(state.calls,3);assert.equal(run('progressDirty'),false);assert.equal(JSON.parse(state.saved)['QS-6-1'].notes,'Unpersisted answer');assert.equal(JSON.parse(state.saved)['QS-6-1'].status,'doing');
 assert.equal(state.nodes.error.textContent,'');assert.match(state.nodes.saveStatus.textContent,/Saved on this device/);
 run('flushNotes()');assert.equal(state.calls,3,'clean unchanged notes need no write');
});
test('failed status write retries even when notes remain empty',()=>{
 const {state,run}=setup();state.nodes.answer.value='';run("progress[current.id]={status:'done'};persist()");assert.equal(run('progressDirty'),true);
 state.blocked=false;run('flushNotes()');assert.equal(JSON.parse(state.saved)['QS-6-1'].status,'done');assert.equal(run('progressDirty'),false);
});
test('unsaved warning is active only while a save failure remains',()=>{
 const {state,run}=setup();let prevented=0;state.event={preventDefault(){prevented++;}};
 run('warnUnsaved(state.event)');assert.equal(prevented,0);
 run('flushNotes();warnUnsaved(state.event)');assert.equal(prevented,1);
 state.blocked=false;run('flushNotes();warnUnsaved(state.event)');assert.equal(prevented,1);
 state.nodes.error.textContent='Unrelated PDF error';run("state.nodes.answer.value='Changed';flushNotes()");assert.equal(state.nodes.error.textContent,'Unrelated PDF error','save success must not hide other errors');
});


test('reader retry preserves another tab question and keeps this draft in memory',()=>{
 const {state,run}=setup();run('flushNotes()');state.blocked=false;state.saved=JSON.stringify({'QS-1-2':{notes:'Other tab answer'}});const other=state.saved,calls=state.calls;
 run('flushNotes()');assert.equal(state.saved,other);assert.equal(state.calls,calls);assert.equal(run('progressDirty'),true);assert.match(state.nodes.error.textContent,/Saved answers changed/);assert.equal(run("progress['QS-6-1'].notes"),'Unpersisted answer');
 run('flushNotes()');assert.equal(state.saved,other);assert.equal(state.calls,calls);
});
test('identical saved reader draft clears pending state without rewriting',()=>{
 const {state,run}=setup();run('flushNotes()');state.saved=run('JSON.stringify(progress)');const calls=state.calls;run('flushNotes()');assert.equal(state.calls,calls);assert.equal(run('progressDirty'),false);assert.equal(state.nodes.error.textContent,'');
});
test('reader with unknown baseline cannot overwrite existing or corrupt data',()=>{
 const {state,run}=setup();state.blocked=false;run('progressReadKnown=false');
 for(const value of [JSON.stringify({'QS-1-2':{notes:'Existing'}}),'{broken']){state.saved=value;run('flushNotes()');assert.equal(state.saved,value);assert.equal(state.calls,0);assert.equal(run('progressDirty'),true);}
});
