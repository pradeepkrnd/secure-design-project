'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { server, CSP } = require('../server.js');
(async () => {
  const log=[];
  await new Promise(resolve => server.listen(3000, '127.0.0.1', resolve));
  try {
    const base='http://127.0.0.1:3000';
    for (const route of ['/secure','/secure.js','/safe.js']) {
      const res=await fetch(base+route);
      assert.equal(res.status,200);
      assert.equal(res.headers.get('content-security-policy'),CSP);
      log.push('PASS: '+route+' returns 200 with enforced CSP');
    }
    assert.equal((await fetch(base+'/vulnerable')).headers.get('content-security-policy'),null);
    log.push('PASS: vulnerable lab route has no CSP');
    assert.equal((await fetch(base+'/unknown')).status,404);
    log.push('PASS: unknown route is rejected with 404');
    // Mocked DOM: verifies handler logic, not HTML parsing or browser CSP.
    function context() {
      const elements={};
      for (const id of ['#comment','#preview','#expression','#result','#marker','#render','#calculate']) {
        elements[id]={value:'',textContent:'',addEventListener:(_,fn)=>{elements[id].click=fn;}};
      }
      return {elements, ctx:vm.createContext({document:{querySelector:id=>elements[id]}})};
    }
    const vulnerable=context();
    vm.runInContext(fs.readFileSync('public/vulnerable.js','utf8'),vulnerable.ctx);
    vulnerable.elements['#expression'].value='2+3';
    vulnerable.elements['#calculate'].click();
    assert.equal(vulnerable.elements['#result'].textContent,'5');
    log.push('PASS: eval handler returns 5 for normal arithmetic in VM');
    const attack=`document.querySelector('#marker').textContent='EVAL executed'; 5`;
    vulnerable.elements['#expression'].value=attack;
    vulnerable.elements['#calculate'].click();
    assert.equal(vulnerable.elements['#marker'].textContent,'EVAL executed');
    log.push('PASS: eval handler executes injected marker mutation in VM');
    const secure=context();
    vm.runInContext(fs.readFileSync('public/safe.js','utf8'),secure.ctx);
    vm.runInContext(fs.readFileSync('public/secure.js','utf8'),secure.ctx);
    secure.elements['#expression'].value=attack;
    secure.elements['#calculate'].click();
    assert.equal(secure.elements['#result'].textContent,'Enter a valid JSON object.');
    assert.equal(secure.elements['#marker'].textContent,'');
    log.push('PASS: secure handler rejects script without marker mutation in VM');
    secure.elements['#comment'].value='<img src=x onerror=alert(1)>';
    secure.elements['#render'].click();
    assert.equal(secure.elements['#preview'].textContent,secure.elements['#comment'].value);
    assert.equal(secure.elements['#preview'].innerHTML,undefined);
    log.push('PASS: secure handler assigns textContent and does not assign innerHTML in mocked DOM');
    fs.writeFileSync('evidence/integration-results.txt',log.join('\n')+'\n');
    console.log(log.join('\n'));
  } finally {await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
