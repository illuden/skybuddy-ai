const solc=require('solc'),fs=require('fs');
const input={language:'Solidity',sources:{},settings:{optimizer:{enabled:true,runs:200},viaIR:false,evmVersion:'cancun',outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object','evm.deployedBytecode.immutableReferences']}}}};
for(const f of ['SkyBuddySoulCharter.sol','TestHelpers.sol']) input.sources[f]={content:fs.readFileSync(({'SkyBuddySoulCharter.sol':'../','TestHelpers.sol':'./'})[f]+f,'utf8')};
const out=JSON.parse(solc.compile(JSON.stringify(input)));
let bad=false;for(const e of out.errors||[]){console.log(e.severity,e.formattedMessage);if(e.severity==='error')bad=true}
if(bad)process.exit(1);
fs.mkdirSync('build',{recursive:true});
for(const f in out.contracts)for(const c in out.contracts[f]){const x=out.contracts[f][c];fs.writeFileSync(`build/${c}.json`,JSON.stringify({abi:x.abi,bytecode:'0x'+x.evm.bytecode.object,runtime:'0x'+x.evm.deployedBytecode.object,immutables:x.evm.deployedBytecode.immutableReferences||{}}));console.log(c,'runtime bytes',x.evm.deployedBytecode.object.length/2)}
console.log('solc',solc.version());
