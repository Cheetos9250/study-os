/* Study OS markdown-lite renderer for textbook practice versions (paragraphs, lists, **bold**, *italic*, pipe tables). Output is escaped. */
(function(root){'use strict';
function sosEsc(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function sosInline(t){return sosEsc(t).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/(^|[^*])\*([^*\s][^*]*?)\*/g,'$1<i>$2</i>');}
function sosCell(c,tag){const v=c.trim(),num=/^[-−(]?\$?[\d,]+(\.\d+)?%?\)?$/.test(v)||v==='—';return '<'+tag+(num?' class="n"':'')+'>'+sosInline(v)+'</'+tag+'>';}
function md(text){const lines=String(text||'').split('\n');let h='',i=0;const row=l=>l.trim().replace(/^\||\|$/g,'').split('|');
 while(i<lines.length){const l=lines[i];
  if(/^\s*\|/.test(l)){const rows=[];while(i<lines.length&&/^\s*\|/.test(lines[i]))rows.push(lines[i++]);let head=null;if(rows.length>1&&/^\s*\|?\s*:?-{2,}/.test(rows[1])){head=rows[0];rows.splice(0,2);}
   h+='<div class="sos-tbl"><table>'+(head?'<thead><tr>'+row(head).map(c=>sosCell(c,'th')).join('')+'</tr></thead>':'')+'<tbody>'+rows.map(r=>'<tr>'+row(r).map(c=>sosCell(c,'td')).join('')+'</tr>').join('')+'</tbody></table></div>';continue;}
  if(/^#{1,4} /.test(l)){h+='<h4>'+sosInline(l.replace(/^#+ /,''))+'</h4>';i++;continue;}
  if(/^\s*([-•]|\d+[.)]|[a-z][.)]) /.test(l)){const ol=/^\s*(\d+|[a-z])[.)] /.test(l);let items='';while(i<lines.length&&/^\s*([-•]|\d+[.)]|[a-z][.)]) /.test(lines[i])){const m=lines[i].match(/^\s*(?:[-•]|(\d+|[a-z])[.)]) (.*)$/);items+='<li'+(m[1]&&ol?' value="'+(isNaN(m[1])?m[1].charCodeAt(0)-96:m[1])+'"':'')+(m[1]&&isNaN(m[1])?' style="list-style-type:lower-alpha"':'')+'>'+sosInline(m[2])+'</li>';i++;}h+=ol?'<ol>'+items+'</ol>':'<ul>'+items+'</ul>';continue;}
  if(!l.trim()){i++;continue;}
  let para=[];while(i<lines.length&&lines[i].trim()&&!/^\s*\|/.test(lines[i])&&!/^#{1,4} /.test(lines[i])&&!/^\s*([-•]|\d+[.)]|[a-z][.)]) /.test(lines[i]))para.push(sosInline(lines[i++]));h+='<p>'+para.join('<br>')+'</p>';}
 return h;}
root.StudySosMd=md;
})(typeof window!=='undefined'?window:globalThis);
