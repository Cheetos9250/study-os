"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"../lib/study-os-course-metadata-home.js"),"utf8");
const model=require("../lib/study-os-course-metadata.js");

function harness({metadata,revision=1,error=null}={}){
  const listeners=new Map();
  function element(id){
    return {id,hidden:true,disabled:false,textContent:"",attrs:{},listeners:{},
      addEventListener(name,callback){this.listeners[name]=callback;},
      setAttribute(name,value){this.attrs[name]=value;},
      removeAttribute(name){delete this.attrs[name];},
      dispatchEvent(event){this.lastEvent=event.type;}};
  }
  const defaults=[
    ["acc","Accounting","original acc","acc.html","COURSE 01"],
    ["eco","Economics","original eco","eco.html","COURSE 02"],
    ["math","Mathematics","original math","math.html","COURSE 03"]
  ];
  const cards=defaults.map(([id,name,description,href,number])=>{
    const card=element(id);
    card.dataset={course:id};card.href=href;
    card.nodes={h3:{textContent:name},p:{textContent:description},".num":{textContent:number}};
    card.querySelector=selector=>card.nodes[selector];
    return card;
  });
  const list={items:[...cards],querySelectorAll(){return cards;},
    append(card){this.items=this.items.filter(other=>other!==card);this.items.push(card);}};
  const load=element("load"),revert=element("revert"),status=element("status"),search=element("search");
  const nodes=new Map([
    ["course-list",list],["course-metadata-apply",load],
    ["course-metadata-default",revert],["course-metadata-status",status],["course-search",search]
  ]);
  let opens=0,reads=0,closes=0;
  const storage={async openCourseMetadata(){
    opens++;
    if(error)throw error;
    return {async read(){reads++;return {revision,metadata:metadata||model.defaultMetadata()};},
      close(){closes++;}};
  }};
  const context={document:{getElementById:id=>nodes.get(id)},
    StudyOSCourseMetadata:model,StudyOSCourseMetadataStore:storage,
    Event:class {constructor(type){this.type=type;}}};
  context.globalThis=context;
  vm.runInNewContext(source,context,{filename:"study-os-course-metadata-home.js"});
  return {load,revert,status,search,cards,list,counts:()=>({opens,reads,closes})};
}

test("homepage does not read storage before explicit click; applies validated display only",async()=>{
  const metadata=model.defaultMetadata();
  metadata.courses.acc.name="บัญชีมหาวิทยาลัย";
  metadata.courses.acc.description="อ่านและทำข้อสอบบัญชี";
  metadata.order=["math","acc","eco"];
  const h=harness({metadata});
  assert.deepEqual(h.counts(),{opens:0,reads:0,closes:0});
  assert.equal(h.load.hidden,false);
  await h.load.listeners.click();
  assert.deepEqual(h.counts(),{opens:1,reads:1,closes:1});
  assert.deepEqual(h.list.items.map(c=>c.dataset.course),["math","acc","eco"]);
  assert.equal(h.cards[0].nodes.h3.textContent,"บัญชีมหาวิทยาลัย");
  assert.equal(h.cards[0].nodes.p.textContent,"อ่านและทำข้อสอบบัญชี");
  assert.equal(h.search.lastEvent,"input");
  for(const id of ["acc","eco","math"]) assert.equal(h.cards.find(c=>c.dataset.course===id).href,id+".html");
  assert.equal(h.revert.hidden,false);
  h.revert.listeners.click();
  assert.deepEqual(h.list.items.map(c=>c.dataset.course),["acc","eco","math"]);
  assert.equal(h.cards[0].nodes.h3.textContent,"Accounting");
  assert.equal(h.revert.hidden,true);
  assert.deepEqual(h.counts(),{opens:1,reads:1,closes:1});
});

test("corrupt metadata fails closed, leaves all original cards and URLs intact",async()=>{
  const broken=model.defaultMetadata();
  broken.order=["acc","acc","eco"];
  const h=harness({metadata:broken});
  await h.load.listeners.click();
  assert.deepEqual(h.list.items.map(c=>c.dataset.course),["acc","eco","math"]);
  assert.equal(h.cards[0].nodes.h3.textContent,"Accounting");
  assert.equal(h.revert.hidden,true);
  assert.match(h.status.textContent,/อ่านชื่อรายวิชา/);
  assert.deepEqual(h.counts(),{opens:1,reads:1,closes:1});
});

test("denied storage fails closed and leaves the retry control enabled",async()=>{
  const h=harness({error:new Error("denied")});
  await h.load.listeners.click();
  assert.equal(h.cards[0].nodes.h3.textContent,"Accounting");
  assert.equal(h.load.disabled,false);
  assert.equal(h.revert.hidden,true);
  assert.equal(h.load.attrs["aria-busy"],undefined);
  assert.deepEqual(h.counts(),{opens:1,reads:0,closes:0});
});
