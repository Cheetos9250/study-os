"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const {SUBJECTS,normalizeMetadata,defaultMetadata}=require("../lib/study-os-course-metadata.js");
const clone = value => JSON.parse(JSON.stringify(value));
test("course metadata defaults keep immutable academic identities",()=>{
  const data=defaultMetadata();
  assert.deepEqual(data.order,["acc","eco","math"]);
  assert.deepEqual(Object.keys(data.courses),SUBJECTS);
  assert.equal(data.courses.acc.name,"Accounting");
});
test("valid presentation edits and reordered cards are normalized without changing IDs",()=>{
  const data=clone(defaultMetadata());
  data.courses.acc.name="  บัญชี  ";
  data.order=["math","acc","eco"];
  const result=normalizeMetadata(data);
  assert.equal(result.courses.acc.name,"บัญชี");
  assert.deepEqual(result.order,["math","acc","eco"]);
  assert.deepEqual(Object.keys(result.courses),SUBJECTS);
});
test("rejects corrupt backups, missing or extra identities, duplicate order and markup",()=>{
  const cases=[
    null,{},[],{...defaultMetadata(),version:2},
    {...defaultMetadata(),courses:{acc:{name:"A",description:""}}},
    {...defaultMetadata(),courses:{...defaultMetadata().courses,eng:{name:"English",description:""}}},
    {...defaultMetadata(),order:["acc","acc","math"]},
    {...defaultMetadata(),order:["acc","eco","eng"]},
    {...defaultMetadata(),order:["acc","eco"]},
    {...defaultMetadata(),extra:"unexpected"},
    {...defaultMetadata(),courses:{...defaultMetadata().courses,acc:{name:"<script>",description:""}}},
    {...defaultMetadata(),courses:{...defaultMetadata().courses,acc:{name:" ",description:""}}},
    {...defaultMetadata(),courses:{...defaultMetadata().courses,acc:{name:"A".repeat(81),description:""}}},
    {...defaultMetadata(),courses:{...defaultMetadata().courses,acc:{name:"A",description:"B".repeat(241)}}},
    {...defaultMetadata(),courses:{...defaultMetadata().courses,acc:{name:"A",description:"",route:"evil.html"}}}
  ];
  for(const candidate of cases) assert.throws(()=>normalizeMetadata(candidate),TypeError);
});
test("normalizing never mutates caller's backup",()=>{
  const input=clone(defaultMetadata());
  const before=JSON.stringify(input);
  const output=normalizeMetadata(input);
  output.courses.acc.name="Changed";
  output.order.reverse();
  assert.equal(JSON.stringify(input),before);
});
