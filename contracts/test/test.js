const hre=require('hardhat'),{ethers}=require('ethers'),fs=require('fs'),assert=require('assert');
const A=n=>JSON.parse(fs.readFileSync(`build/${n}.json`));
const P=ethers.parseEther('0.1'), CHPATH=process.env.CHARTER||'../../charter/CHARTER.txt';
let pass=0,fail=0;const T=async(name,fn)=>{try{await fn();pass++;console.log('PASS',name)}catch(e){fail++;console.log('FAIL',name,'\n   ',String(e.message).split('\n')[0]);process.exitCode=1}};
// strict: must revert with exactly this custom error
const revertsWith=async(promiseFn,iface,errName)=>{let e;try{const tx=await promiseFn();if(tx&&tx.wait)await tx.wait()}catch(x){e=x}
 if(!e)throw new Error('did not revert');const sel=iface.getError(errName).selector;const d=e.data||e.info?.error?.data||e.error?.data||'';
 assert.ok(String(d).startsWith(sel)||e.revert?.name===errName,`expected ${errName} (${sel}), got data=${String(d).slice(0,12)} msg=${String(e.message).slice(0,90)}`)};
const revertsAny=async(promiseFn)=>{let e;try{const tx=await promiseFn();if(tx&&tx.wait)await tx.wait()}catch(x){e=x}if(!e)throw new Error('did not revert');assert.ok(/revert|invalid|out of gas|function selector|no fallback|non-payable/i.test(String(e.message)),'unexpected failure: '+String(e.message).slice(0,120))};
(async()=>{
 const prov=new ethers.BrowserProvider(hre.network.provider,undefined,{cacheTimeout:-1});
 const S=await Promise.all([...Array(16).keys()].map(i=>prov.getSigner(i)));
 const [deployer,cold,u1,u2,u3,u4]=S; const addr=s=>s.getAddress(); const bal=a=>prov.getBalance(a);
 const sky=A('SkyBuddySoulCharter'); const F=new ethers.ContractFactory(sky.abi,sky.bytecode,deployer);
 const mk=async(n,...a)=>{const x=A(n);const c=await new ethers.ContractFactory(x.abi,x.bytecode,deployer).deploy(...a);await c.waitForDeployment();return c};
 const deploy=async(rec,gen)=>{const c=await F.deploy(rec,gen);const r=await c.deploymentTransaction().wait();return [c,r]};
 const COLD=await addr(cold);
 const [c,rcpt]=await deploy(COLD,COLD); const I=c.interface, CA=await c.getAddress(); const CH=fs.readFileSync(CHPATH,'utf8');
 console.log('deploy gas',rcpt.gasUsed.toString(),'| runtime bytes',(sky.runtime.length-2)/2);

 await T('genesis: #0 to cold wallet, supply 1, locked, events with exact args',async()=>{
  assert.equal(await c.ownerOf(0),COLD);assert.equal(await c.totalSupply(),1n);assert.equal(await c.balanceOf(COLD),1n);assert.equal(await c.locked(0),true);assert.equal(await c.tokenOf(COLD),0n);assert.equal(await c.hasMinted(COLD),true);
  const ev=rcpt.logs.map(l=>I.parseLog(l));assert.equal(ev.length,2);assert.equal(ev[0].name,'Transfer');assert.deepEqual([...ev[0].args],[ethers.ZeroAddress,COLD,0n]);assert.equal(ev[1].name,'Locked');assert.deepEqual([...ev[1].args],[0n]);});
 await T('deployed runtime bytecode equals compiled runtime, every byte, with RECIPIENT filled into the immutable slots',async()=>{
  let exp=sky.runtime.slice(2);const refs=Object.values(sky.immutables).flat();assert.ok(refs.length>=1);const word=ethers.zeroPadValue(COLD,32).slice(2).toLowerCase();
  for(const {start,length} of refs){assert.equal(length,32);exp=exp.slice(0,start*2)+word+exp.slice((start+length)*2)}
  const on=(await prov.getCode(CA)).slice(2).toLowerCase();assert.equal(on,exp.toLowerCase());console.log('   immutable slots',refs.length);});
 await T('charter byte-identical to CHARTER.txt (1632 bytes, no trailing newline), hash matches',async()=>{
  assert.equal(await c.charter(),CH);assert.equal(ethers.toUtf8Bytes(CH).length,1632);assert.ok(!CH.endsWith('\n'));
  assert.equal(await c.charterHash(),ethers.keccak256(ethers.toUtf8Bytes(CH)));assert.equal(await c.charterHash(),'0x236cfb693a5fd5b3f7180a94533d79d3e5a7536e9fcf9ac1c057fa47cdca4b49');});
 await T('constants: price, recipient, name, symbol',async()=>{
  assert.equal(await c.PRICE(),P);assert.equal(await c.RECIPIENT(),COLD);assert.equal(await c.name(),'SkyBuddy Soul Charter');assert.equal(await c.symbol(),'SOUL');});
 await T('mint: exact 0.1 ETH -> #1, payment forwarded, contract balance 0, exact events',async()=>{
  const b0=await bal(COLD);const r=await (await c.connect(u1).mint({value:P})).wait();const a1=await addr(u1);
  assert.equal(await c.ownerOf(1),a1);assert.equal(await c.tokenOf(a1),1n);assert.equal(await c.totalSupply(),2n);assert.equal(await bal(COLD)-b0,P);assert.equal(await bal(CA),0n);
  const ev=r.logs.map(l=>I.parseLog(l));assert.equal(ev.length,2);assert.deepEqual([...ev[0].args],[ethers.ZeroAddress,a1,1n]);assert.deepEqual([...ev[1].args],[1n]);console.log('   mint gas',r.gasUsed.toString());});
 await T('mint: wrong price -> WrongPrice (0, 0.09, 0.11, +-1 wei); nothing changes',async()=>{
  const b0=await bal(COLD);for(const v of [0n,ethers.parseEther('0.09'),ethers.parseEther('0.11'),P-1n,P+1n]) await revertsWith(()=>c.connect(u2).mint({value:v}),I,'WrongPrice');
  assert.equal(await c.hasMinted(await addr(u2)),false);assert.equal(await c.totalSupply(),2n);assert.equal(await bal(COLD),b0);});
 await T('mint: second mint -> AlreadyMinted; genesis holder too',async()=>{
  await revertsWith(()=>c.connect(u1).mint({value:P}),I,'AlreadyMinted');await revertsWith(()=>c.connect(cold).mint({value:P}),I,'AlreadyMinted');assert.equal(await c.totalSupply(),2n);});
 await T('sequential ids across wallets',async()=>{
  await (await c.connect(u2).mint({value:P})).wait();await (await c.connect(u3).mint({value:P})).wait();assert.equal(await c.ownerOf(2),await addr(u2));assert.equal(await c.ownerOf(3),await addr(u3));assert.equal(await c.totalSupply(),4n);});
 await T('soulbound: 5 transfer/approval entry points -> Soulbound; state unchanged',async()=>{
  const a1=await addr(u1),a4=await addr(u4);
  await revertsWith(()=>c.connect(u1).transferFrom(a1,a4,1),I,'Soulbound');
  await revertsWith(()=>c.connect(u1)['safeTransferFrom(address,address,uint256)'](a1,a4,1),I,'Soulbound');
  await revertsWith(()=>c.connect(u1)['safeTransferFrom(address,address,uint256,bytes)'](a1,a4,1,'0x'),I,'Soulbound');
  await revertsWith(()=>c.connect(u1).approve(a4,1),I,'Soulbound');await revertsWith(()=>c.connect(u1).setApprovalForAll(a4,true),I,'Soulbound');
  assert.equal(await c.ownerOf(1),a1);assert.equal(await c.getApproved(1),ethers.ZeroAddress);assert.equal(await c.isApprovedForAll(a1,a4),false);assert.equal(await c.hasMinted(a4),false);});
 await T('nonexistent token / holder: NoSuchToken; balanceOf(0) -> ZeroAddress',async()=>{
  for(const f of ['ownerOf','locked','tokenURI','getApproved']) await revertsWith(()=>c[f](999),I,'NoSuchToken');
  await revertsWith(()=>c.tokenOf(u4.address),I,'NoSuchToken');assert.equal(await c.balanceOf(await addr(u4)),0n);await revertsWith(()=>c.balanceOf(ethers.ZeroAddress),I,'ZeroAddress');});
 await T('plain ETH transfer and unknown selector revert',async()=>{
  await revertsAny(()=>u4.sendTransaction({to:CA,value:P}));await revertsAny(()=>u4.sendTransaction({to:CA,data:'0xdeadbeef'}));assert.equal(await bal(CA),0n);});
 await T('ERC-165: four ids true, others false, each call under 30,000 gas',async()=>{
  for(const id of ['0x01ffc9a7','0x80ac58cd','0x5b5e139f','0xb45a3c0e']){assert.equal(await c.supportsInterface(id),true);const g=await c.supportsInterface.estimateGas(id);assert.ok(g-21000n<30000n,'gas '+g)}
  for(const id of ['0xffffffff','0x780e9d63','0x00000000']) assert.equal(await c.supportsInterface(id),false);});
 await T('ABI: mint is the only non-view function; no receive/fallback; standard events declared',async()=>{
  const nonView=sky.abi.filter(x=>x.type==='function'&&!['view','pure'].includes(x.stateMutability)).map(x=>x.name);assert.deepEqual(nonView,['mint']);
  assert.ok(!sky.abi.some(x=>x.type==='receive'||x.type==='fallback'));
  const names=sky.abi.filter(x=>x.type==='function').map(x=>x.name);for(const bad of ['owner','transferOwnership','pause','burn','withdraw','setPrice','upgradeTo','sweep']) assert.ok(!names.includes(bad));
  const evs=sky.abi.filter(x=>x.type==='event').map(x=>x.name).sort();assert.deepEqual(evs,['Approval','ApprovalForAll','Locked','Transfer','Unlocked']);});
 await T('constructor rejects zero addresses',async()=>{
  await revertsWith(()=>F.deploy(ethers.ZeroAddress,COLD),I,'ZeroAddress');await revertsWith(()=>F.deploy(COLD,ethers.ZeroAddress),I,'ZeroAddress');});
 await T('refusing recipient: real failed tx is fully rolled back; after refusal is lifted the next mint gets id 1',async()=>{
  const tr=await mk('ToggleRecipient');const TA=await tr.getAddress();const [c2]=await deploy(TA,COLD);const C2=await c2.getAddress();const a1=await addr(u1);const b1=await bal(a1);
  await revertsWith(()=>c2.connect(u1).mint.staticCall({value:P}),c2.interface,'PaymentFailed');
  let rc=null,threw=false;try{const tx=await c2.connect(u1).mint({value:P,gasLimit:200000});rc=await tx.wait()}catch(e){threw=true;rc=e.receipt||null}
  assert.ok(threw);if(rc){assert.equal(rc.status,0);assert.equal(rc.logs.length,0)}
  assert.equal(await c2.totalSupply(),1n);assert.equal(await c2.hasMinted(a1),false);await revertsWith(()=>c2.ownerOf(1),c2.interface,'NoSuchToken');assert.equal(await bal(C2),0n);assert.equal(await bal(TA),0n);
  const spent=b1-await bal(a1);assert.ok(spent>0n&&spent<ethers.parseEther('0.01'),'only gas spent: '+spent);
  await (await tr.set(false)).wait();const r=await (await c2.connect(u1).mint({value:P})).wait();assert.equal(await c2.ownerOf(1),a1);assert.equal(await c2.totalSupply(),2n);assert.equal(await bal(TA),P);
  const ev=r.logs.map(l=>c2.interface.parseLog(l));assert.deepEqual([...ev[0].args],[ethers.ZeroAddress,a1,1n]);});
 await T('recipient that mints inside the callback and then reverts: inner and outer mints both undone',async()=>{
  const rr=await mk('ReenterThenRevert');const RA=await rr.getAddress();const [c2]=await deploy(RA,COLD);await (await rr.set(await c2.getAddress())).wait();
  await revertsWith(()=>c2.connect(u1).mint.staticCall({value:P}),c2.interface,'PaymentFailed');
  let threw=false;try{await (await c2.connect(u1).mint({value:P,gasLimit:400000})).wait()}catch(e){threw=true}assert.ok(threw);
  assert.equal(await c2.totalSupply(),1n);assert.equal(await c2.hasMinted(await addr(u1)),false);assert.equal(await c2.hasMinted(RA),false);assert.equal(await bal(RA),0n);assert.equal(await bal(await c2.getAddress()),0n);});
 await T('gas-burning recipient: tx fails on-chain (status 0), nothing minted',async()=>{
  const gb=await mk('GasBurnRecipient');const [c2]=await deploy(await gb.getAddress(),COLD);
  let rc=null,threw=false;try{rc=await (await c2.connect(u1).mint({value:P,gasLimit:300000})).wait()}catch(e){threw=true;rc=e.receipt||null;assert.ok(/revert|out of gas|status|CALL_EXCEPTION/i.test(String(e.message)+String(e.code)),'unexpected: '+String(e.message).slice(0,100))}
  assert.ok(threw);if(rc)assert.equal(rc.status,0);assert.equal(await c2.totalSupply(),1n);assert.equal(await c2.hasMinted(await addr(u1)),false);});
 await T('re-entrant recipient: inner mint gives the recipient its own #2 once; no duplicate, no overwrite',async()=>{
  const re=await mk('ReentrantRecipient');const RA=await re.getAddress();const [c3]=await deploy(RA,COLD);await (await re.set(await c3.getAddress())).wait();
  await (await c3.connect(u1).mint({value:P})).wait();
  assert.equal(await re.tried(),true);assert.equal(await re.innerOk(),true);assert.equal(await c3.totalSupply(),3n);
  assert.equal(await c3.ownerOf(0),COLD);assert.equal(await c3.ownerOf(1),await addr(u1));assert.equal(await c3.ownerOf(2),RA);assert.equal(await c3.tokenOf(RA),2n);
  assert.equal(await bal(await c3.getAddress()),0n);assert.equal(await bal(RA),P); // got 0.1, paid 0.1 to itself via inner mint, received it back
  await revertsWith(()=>c3.connect(u1).mint({value:P}),c3.interface,'AlreadyMinted');
  await (await c3.connect(u2).mint({value:P})).wait();assert.equal(await c3.ownerOf(3),await addr(u2));assert.equal(await c3.totalSupply(),4n);});
 await T('re-entrant recipient that is also genesis holder: inner mint fails, outer succeeds',async()=>{
  const re=await mk('ReentrantRecipient');const RA=await re.getAddress();const [c4]=await deploy(RA,RA);await (await re.set(await c4.getAddress())).wait();
  await (await c4.connect(u1).mint({value:P})).wait();assert.equal(await re.innerOk(),false);assert.equal(await c4.totalSupply(),2n);assert.equal(await c4.ownerOf(1),await addr(u1));});
 await T('forced ETH (SELFDESTRUCT) stays in contract; mint still works and forwards exactly 0.1',async()=>{
  const [c5]=await deploy(COLD,COLD);const a5=await c5.getAddress();await mk('ForceSend',a5,{value:7n});assert.equal(await bal(a5),7n);
  const b0=await bal(COLD);await (await c5.connect(u1).mint({value:P})).wait();assert.equal(await bal(COLD)-b0,P);assert.equal(await bal(a5),7n);assert.equal(await c5.ownerOf(1),await addr(u1));});
 await T('contract holder: can mint once, cannot mint twice, cannot move or approve by any path',async()=>{
  const hldr=await mk('HolderTries');const HA=await hldr.getAddress();await (await hldr.mintIt(CA,{value:P})).wait();const id=await c.tokenOf(HA);
  const res=await hldr.tryMove.staticCall(CA,await addr(u4),id);assert.deepEqual([...res],[false,false,false,false]);await (await hldr.tryMove(CA,await addr(u4),id)).wait();
  assert.equal(await c.ownerOf(id),HA);assert.equal(await c.hasMinted(await addr(u4)),false);await revertsAny(()=>hldr.mintIt(CA,{value:P}));});
 await T('randomized (seeded): 300 wrong values all -> WrongPrice',async()=>{
  let seed=123456789n;const rnd=()=>{seed=(seed*6364136223846793005n+1442695040888963407n)%(1n<<64n);return seed};
  for(let i=0;i<300;i++){let v=rnd()%ethers.parseEther('1');if(v===P)v+=1n;await revertsWith(()=>c.connect(u4).mint.staticCall({value:v}),I,'WrongPrice')}});
 await T('bulk: 10 more wallets; ids unique, sequential, all locked; recipient got exactly 10 x 0.1',async()=>{
  const before=await c.totalSupply();const b0=await bal(COLD);for(const s of S.slice(6,16)) await (await c.connect(s).mint({value:P})).wait();
  const after=await c.totalSupply();assert.equal(after-before,10n);assert.equal(await bal(COLD)-b0,P*10n);assert.equal(await bal(CA),0n);
  const seen=new Set();for(let i=0n;i<after;i++){const o=await c.ownerOf(i);assert.ok(!seen.has(o));seen.add(o);assert.equal(await c.tokenOf(o),i);assert.equal(await c.locked(i),true)}assert.ok(after>=15n);});
 await T('reach 101+ tokens with fresh wallets (for 3-digit ids)',async()=>{
  let n=await c.totalSupply();while(n<=100n){const w=ethers.Wallet.createRandom().connect(prov);await hre.network.provider.send('hardhat_setBalance',[w.address,'0x56BC75E2D63100000']);await (await c.connect(w).mint({value:P})).wait();n++}
  assert.ok(await c.totalSupply()>=101n);assert.equal(await bal(CA),0n);});
 await T('tokenURI: exact canonical base64 of the expected JSON, readable through a real URL parser; ids 0,1,9,10,14,99,100 (length remainders 0,1,2)',async()=>{
  const rem=new Set();for(const n of [0,1,9,10,14,99,100]){const u=await c.tokenURI(n);const pre='data:application/json;base64,';assert.ok(u.startsWith(pre));const b64=u.slice(pre.length);
   const expected=`{"name":"SkyBuddy #${n}","description":"A non-transferable record of the SkyBuddy Soul Charter. The Charter text is stored in this contract; read it with charter()."}`;
   assert.equal(b64,Buffer.from(expected,'utf8').toString('base64'));rem.add(Buffer.byteLength(expected)%3);
   const viaFetch=await (await fetch(u)).json();assert.deepEqual(viaFetch,JSON.parse(expected));assert.equal(viaFetch.name,`SkyBuddy #${n}`);}
  assert.deepEqual([...rem].sort(),[0,1,2]);});
 console.log(`\n${pass} passed, ${fail} failed`);
})().catch(e=>{console.error(e);process.exit(1)});
