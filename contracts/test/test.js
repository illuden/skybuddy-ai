const hre=require('hardhat'),{ethers}=require('ethers'),fs=require('fs'),assert=require('assert');
const A=n=>JSON.parse(fs.readFileSync(`build/${n}.json`));
const P=ethers.parseEther('0.1');
let pass=0;const T=async(name,fn)=>{try{await fn();pass++;console.log('PASS',name)}catch(e){console.log('FAIL',name,'\n   ',e.message.split('\n')[0]);process.exitCode=1}};
const reverts=async(p,errName,iface)=>{try{await p}catch(e){const d=e.data||e.info?.error?.data||e.error?.data;if(errName){const sel=iface.getError(errName).selector;assert.ok(String(d||e.message).includes(sel.slice(2))||String(e.message).includes(errName),`expected ${errName}, got ${e.message.slice(0,120)}`)}return}throw new Error('did not revert')};
(async()=>{
 const prov=new ethers.BrowserProvider(hre.network.provider,undefined,{cacheTimeout:-1});
 const S=await Promise.all([...Array(12).keys()].map(i=>prov.getSigner(i)));
 const [deployer,cold,u1,u2,u3,u4]=S; const addr=async s=>await s.getAddress();
 const sky=A('SkyBuddySoulCharter'); const F=new ethers.ContractFactory(sky.abi,sky.bytecode,deployer);
 const deploy=async(rec,gen)=>{const c=await F.deploy(rec,gen);const r=await c.deploymentTransaction().wait();return [c,r]};
 const [c,rcpt]=await deploy(await addr(cold),await addr(cold));
 const I=c.interface; const CH=fs.readFileSync('../../charter/CHARTER.txt','utf8');
 console.log('deploy gas',rcpt.gasUsed.toString());

 await T('genesis: token #0 to cold wallet, supply 1, locked',async()=>{
  assert.equal(await c.ownerOf(0),await addr(cold));assert.equal(await c.totalSupply(),1n);assert.equal(await c.balanceOf(await addr(cold)),1n);
  assert.equal(await c.locked(0),true);assert.equal(await c.tokenOf(await addr(cold)),0n);assert.equal(await c.hasMinted(await addr(cold)),true);
  const logs=rcpt.logs.map(l=>I.parseLog(l).name);assert.deepEqual(logs,['Transfer','Locked']);});
 await T('charter text is byte-identical to CHARTER.txt, hash matches',async()=>{
  assert.equal(await c.charter(),CH);assert.equal(await c.charterHash(),ethers.keccak256(ethers.toUtf8Bytes(CH)));assert.equal(ethers.toUtf8Bytes(CH).length,1632);});
 await T('constants: price, recipient, name, symbol',async()=>{
  assert.equal(await c.PRICE(),P);assert.equal(await c.RECIPIENT(),await addr(cold));assert.equal(await c.name(),'SkyBuddy Soul Charter');assert.equal(await c.symbol(),'SOUL');});
 await T('mint: exact 0.1 ETH -> token #1, payment forwarded, contract holds 0',async()=>{
  const b0=await prov.getBalance(await addr(cold));
  const tx=await c.connect(u1).mint({value:P});const r=await tx.wait();
  assert.equal(await c.ownerOf(1),await addr(u1));assert.equal(await c.tokenOf(await addr(u1)),1n);assert.equal(await c.totalSupply(),2n);
  assert.equal((await prov.getBalance(await addr(cold)))-b0,P);assert.equal(await prov.getBalance(await c.getAddress()),0n);
  const ev=r.logs.map(l=>I.parseLog(l));assert.equal(ev[0].name,'Transfer');assert.equal(ev[0].args[0],ethers.ZeroAddress);assert.equal(ev[0].args[2],1n);assert.equal(ev[1].name,'Locked');
  console.log('   mint gas',r.gasUsed.toString());});
 await T('mint: wrong price reverts (0, 0.09, 0.11, 1 wei off)',async()=>{
  for(const v of [0n,ethers.parseEther('0.09'),ethers.parseEther('0.11'),P-1n,P+1n]) await reverts(c.connect(u2).mint({value:v}),'WrongPrice',I);
  assert.equal(await c.hasMinted(await addr(u2)),false);});
 await T('mint: second mint from same wallet reverts; genesis holder cannot mint',async()=>{
  await reverts(c.connect(u1).mint({value:P}),'AlreadyMinted',I);await reverts(c.connect(cold).mint({value:P}),'AlreadyMinted',I);assert.equal(await c.totalSupply(),2n);});
 await T('sequential ids across wallets',async()=>{
  await (await c.connect(u2).mint({value:P})).wait();await (await c.connect(u3).mint({value:P})).wait();
  assert.equal(await c.ownerOf(2),await addr(u2));assert.equal(await c.ownerOf(3),await addr(u3));assert.equal(await c.totalSupply(),4n);});
 await T('soulbound: transferFrom / both safeTransferFrom / approve / setApprovalForAll all revert',async()=>{
  const a1=await addr(u1),a4=await addr(u4);
  await reverts(c.connect(u1).transferFrom(a1,a4,1),'Soulbound',I);
  await reverts(c.connect(u1)['safeTransferFrom(address,address,uint256)'](a1,a4,1),'Soulbound',I);
  await reverts(c.connect(u1)['safeTransferFrom(address,address,uint256,bytes)'](a1,a4,1,'0x'),'Soulbound',I);
  await reverts(c.connect(u1).approve(a4,1),'Soulbound',I);await reverts(c.connect(u1).setApprovalForAll(a4,true),'Soulbound',I);
  assert.equal(await c.ownerOf(1),a1);assert.equal(await c.getApproved(1),ethers.ZeroAddress);assert.equal(await c.isApprovedForAll(a1,a4),false);});
 await T('nonexistent token: ownerOf / locked / tokenURI / getApproved revert; tokenOf(no token) reverts',async()=>{
  for(const f of ['ownerOf','locked','tokenURI','getApproved']) await reverts(c[f](999),'NoSuchToken',I);
  await reverts(c.tokenOf(await addr(u4)),'NoSuchToken',I);assert.equal(await c.balanceOf(await addr(u4)),0n);await reverts(c.balanceOf(ethers.ZeroAddress),'ZeroAddress',I);});
 await T('plain ETH transfer and unknown function call revert (no receive/fallback)',async()=>{
  await reverts(u4.sendTransaction({to:await c.getAddress(),value:P}));await reverts(u4.sendTransaction({to:await c.getAddress(),data:'0xdeadbeef'}));
  assert.equal(await prov.getBalance(await c.getAddress()),0n);});
 await T('interfaces: ERC-165, 721, 721Metadata, 5192 yes; random no',async()=>{
  for(const id of ['0x01ffc9a7','0x80ac58cd','0x5b5e139f','0xb45a3c0e']) assert.equal(await c.supportsInterface(id),true);
  assert.equal(await c.supportsInterface('0xffffffff'),false);assert.equal(await c.supportsInterface('0x780e9d63'),false);});
 await T('tokenURI is valid JSON with the right number',async()=>{
  for(const n of [0,1,3]){const u=await c.tokenURI(n);const p='data:application/json;utf8,';assert.ok(u.startsWith(p));const j=JSON.parse(u.slice(p.length));assert.equal(j.name,`SkyBuddy #${n}`);assert.ok(j.description.includes('charter()'));}});
 await T('ABI: mint is the only state-changing function that can succeed',async()=>{
  const nonView=sky.abi.filter(x=>x.type==='function'&&!['view','pure'].includes(x.stateMutability)).map(x=>x.name);assert.deepEqual(nonView,['mint']);
  assert.ok(!sky.abi.some(x=>x.type==='receive'||x.type==='fallback'));
  const names=sky.abi.filter(x=>x.type==='function').map(x=>x.name);for(const bad of ['owner','transferOwnership','pause','burn','withdraw','setPrice','upgradeTo']) assert.ok(!names.includes(bad));});
 await T('constructor rejects zero addresses',async()=>{
  await reverts(F.deploy(ethers.ZeroAddress,await addr(cold)));await reverts(F.deploy(await addr(cold),ethers.ZeroAddress));});
 await T('recipient that refuses ETH: mint reverts, nothing minted',async()=>{
  const R=A('RejectingRecipient');const rr=await (await new ethers.ContractFactory(R.abi,R.bytecode,deployer).deploy()).waitForDeployment();
  const [c2]=await deploy(await rr.getAddress(),await addr(cold));await reverts(c2.connect(u1).mint({value:P}),'PaymentFailed',c2.interface);
  assert.equal(await c2.totalSupply(),1n);assert.equal(await c2.hasMinted(await addr(u1)),false);});
 await T('re-entrant recipient: inner mint cannot double-mint or corrupt state',async()=>{
  const R=A('ReentrantRecipient');const re=await (await new ethers.ContractFactory(R.abi,R.bytecode,deployer).deploy()).waitForDeployment();
  const [c3]=await deploy(await re.getAddress(),await addr(cold));await (await re.set(await c3.getAddress())).wait();
  await (await c3.connect(u1).mint({value:P})).wait();
  const sup=await c3.totalSupply();assert.equal(await c3.ownerOf(1),await addr(u1));
  // inner call mints one token for the recipient contract itself (it paid 0.1 from what it received) or fails; either way ids stay unique and sequential
  const owners=new Set();for(let i=0n;i<sup;i++){owners.add(await c3.ownerOf(i))}assert.equal(BigInt(owners.size),sup);assert.equal(await prov.getBalance(await c3.getAddress()),0n);
  await reverts(c3.connect(u1).mint({value:P}),'AlreadyMinted',c3.interface);});
 await T('a contract can mint for itself, and still cannot move it',async()=>{
  const M=A('MinterContract');const m=await (await new ethers.ContractFactory(M.abi,M.bytecode,deployer).deploy()).waitForDeployment();
  await (await m.go(await c.getAddress(),{value:P})).wait();assert.equal(await c.hasMinted(await m.getAddress()),true);await reverts(m.go(await c.getAddress(),{value:P}));});
 await T('randomized: 200 random wrong values all revert',async()=>{
  for(let i=0;i<200;i++){let v=BigInt('0x'+ethers.hexlify(ethers.randomBytes(9)).slice(2))%ethers.parseEther('1');if(v===P)v+=1n;
   try{await c.connect(u4).mint.staticCall({value:v});throw new Error('accepted '+v)}catch(e){if(String(e.message).startsWith('accepted'))throw e}}});
 await T('bulk: 6 more wallets mint; ids unique & sequential; recipient got exactly n x 0.1',async()=>{
  const before=await c.totalSupply();const b0=await prov.getBalance(await addr(cold));
  for(const s of S.slice(6,12)) await (await c.connect(s).mint({value:P})).wait();
  const after=await c.totalSupply();assert.equal(after-before,6n);assert.equal((await prov.getBalance(await addr(cold)))-b0,P*6n);
  for(let i=0n;i<after;i++){const o=await c.ownerOf(i);assert.equal(await c.tokenOf(o),i);assert.equal(await c.locked(i),true)}});
 console.log(`\n${pass} passed`);
})().catch(e=>{console.error(e);process.exit(1)});
