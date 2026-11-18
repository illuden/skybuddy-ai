DEPLOY AFTER FIXES

**2. 심각도별 발견 사항**

요청한 네 파일을 모두 검토했습니다. 헌장 바이트·해시·인터페이스 ID를 독립적으로 계산했고, 메타데이터 오류를 재현했습니다. 파일은 수정하지 않았습니다. 현재 환경에 solc·Hardhat·ethers가 없어 컴파일과 기존 EVM 테스트는 재실행하지 못했습니다.

**Critical / High: 발견하지 못했습니다.** 소스 검토상 일반 사용자가 결제를 우회하거나, 같은 주소에 두 번째 토큰을 발행하거나, 기존 토큰을 탈취하는 경로는 없습니다.

**Medium — M1. `tokenURI()`가 표준 URL 처리에서 깨집니다.**

- **위치:** [SkyBuddySoulCharter.sol:180](/D:/Claude/Projects/Claude-Workspace/projects/skybuddy/public/contracts/SkyBuddySoulCharter.sol:180), 180–186행.
- **문제:** JSON을 인코딩 없이 data URI에 넣습니다. 이름의 `#`는 URL에서 fragment 시작 문자입니다. `;utf8`도 표준 `charset=UTF-8` 매개변수 표기가 아닙니다.
- **재현:** 소스에서 구성한 token #0 URI를 Node 표준 `fetch()`로 읽으면 본문이 정확히 `{"name":"SkyBuddy `까지만 반환됩니다. 이후 JSON 파싱이 실패합니다. 지갑·인덱서가 정상적인 URL 처리기를 사용하면 모든 토큰의 메타데이터 표시가 실패할 수 있습니다.
- **수정:** JSON 전체를 Base64로 인코딩해 `data:application/json;base64,...`로 반환하십시오. 또는 JSON 전체를 올바르게 percent-encode하십시오. `#`만 제거하는 수정은 불충분합니다. [data URL 규격](https://www.rfc-editor.org/rfc/rfc2397), [URI 규격](https://www.rfc-editor.org/rfc/rfc3986).

**Low — L1. 강제 송금된 ETH는 영구적으로 잠깁니다.**

- **위치:** [SkyBuddySoulCharter.sol:110](/D:/Claude/Projects/Claude-Workspace/projects/skybuddy/public/contracts/SkyBuddySoulCharter.sol:110), 특히 113행과 회수 함수 부재.
- **문제:** 전달하는 금액은 `msg.value`뿐입니다. 기존 잔액은 남습니다. `receive`/`fallback` 부재가 강제 입금을 막지는 않습니다.
- **시나리오:** 공격자가 별도 계약의 `SELFDESTRUCT` 대상으로 이 계약을 지정해 1 wei를 보냅니다. 이후 정상 mint가 실행되어도 1 wei는 남고 회수할 수 없습니다. 배포 예정 주소에 미리 보낸 ETH도 같은 결과입니다. Cancun 이후에도 `SELFDESTRUCT`의 잔액 이전은 가능합니다. [EIP-6780](https://eips.ethereum.org/EIPS/eip-6780).
- **수정:** 현재 기능 범위를 유지하려면 “계약은 절대 자금을 보유하지 않는다”를 “정상 mint 결제액을 즉시 전달한다; 강제 입금은 회수 불가”로 정정해야 합니다. 회수가 필요하다면 고정 `RECIPIENT`로만 보내는 permissionless sweep 등이 필요하지만, 이는 “상태 변경 함수는 mint만 존재”라는 요구사항 변경입니다. **잔액이 언제나 0이라는 절대 보장은 구현할 수 없습니다.**
- 정상 mint 대금 탈취나 강제 잔액에 의한 mint 중단은 아닙니다.

**Low — L2. mint 가용성이 불변 수취인의 ETH 수신 동작에 종속됩니다.**

- **위치:** [SkyBuddySoulCharter.sol:101](/D:/Claude/Projects/Claude-Workspace/projects/skybuddy/public/contracts/SkyBuddySoulCharter.sol:101), 101–114행.
- **문제:** 수취인이 송금을 거부하거나 가스를 소모하면 모든 mint가 실패합니다. 변경·우회 경로가 없습니다.
- **시나리오:** 잘못 지정한 수취인 계약이 항상 revert하면 처음부터 발행 불가입니다. 처음에는 EOA여도 EIP-7702 위임을 설정하여 ETH 수신 시 revert하는 코드를 실행할 수 있습니다. 컴파일 대상이 Cancun이라는 사실은 배포 체인의 EIP-7702 동작을 차단하지 않습니다. [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702).
- **수정:** 배포 전 실제 수취 주소와 제어권을 검증하고, 전용 EOA의 위임 상태를 확인하십시오. 생성자의 `code.length == 0` 검사는 미래의 위임까지 막지 못합니다. 동시 송금·불변 수취인 요구를 유지한다면 이 가용성 의존성을 받아들여야 합니다.
- 코드 없는 정상 EOA에 대해서는 발견된 공격 경로가 없습니다. **EOA 개인키 분실만으로 mint가 막히지는 않습니다.** 대신 수취한 ETH를 사용할 수 없게 됩니다.

**Informational — I1. 표준 이벤트 선언이 ABI에서 빠져 있습니다.**

- **위치:** [SkyBuddySoulCharter.sol:83](/D:/Claude/Projects/Claude-Workspace/projects/skybuddy/public/contracts/SkyBuddySoulCharter.sol:83), 이벤트 선언.
- **문제:** ERC-721의 `Approval`, `ApprovalForAll`, ERC-5192의 `Unlocked`가 선언되어 있지 않습니다.
- **시나리오:** 이 계약에서 생성한 ABI로 해당 이벤트 필터를 만드는 도구가 실패할 수 있습니다. 실제 승인·잠금 해제가 없으므로 누락된 상태 변화 로그나 자산 탈취 문제는 아닙니다.
- **수정:** 정확한 표준 이벤트 선언을 추가하십시오. 승인이나 잠금 해제 기능을 추가할 필요는 없습니다. 이벤트는 ERC-165 ID 계산에 포함되지 않습니다. [ERC-721](https://eips.ethereum.org/EIPS/eip-721), [ERC-5192](https://eips.ethereum.org/EIPS/eip-5192).

**Informational — I2. 주소에 귀속되며, 사람이나 지갑 제어권에는 귀속되지 않습니다.**

- **위치:** [SkyBuddySoulCharter.sol:112](/D:/Claude/Projects/Claude-Workspace/projects/skybuddy/public/contracts/SkyBuddySoulCharter.sol:112), `_mintTo()`와 영구적인 이전 금지.
- **시나리오:** 소유자가 스마트월렛의 관리자·서명자를 바꾸거나 개인키를 양도하면 토큰 주소는 그대로지만 실질 제어자가 바뀝니다. 반대로 다른 주소로 지갑을 이전하면 기존 토큰은 따라갈 수 없습니다. 일반 mint 라우터를 경유하면 토큰이 사용자 대신 라우터에 귀속됩니다.
- **수정:** 주소당 하나라는 의미와 복구·이전 불가를 명시하고, 프런트엔드가 최종 보유할 계정에서 직접 `mint()`를 호출하도록 해야 합니다. 사람당 하나 또는 지갑 제어권 매매 금지는 이 계약이 보장하지 않습니다.

**3. 요청한 개별 검사**

| 항목 | Yes / No 및 근거 |
|---|---|
| **(a) 정확히 0.1 ETH를 내지 않고 발행 가능한가?** | **Yes — 의도된 생성자 #0 예외만 있습니다.** 배포 후 `mint()`의 금액 검사 우회는 **No**입니다. 모든 성공 호출에 정확히 `100000000000000000` wei가 필요합니다. 다만 `RECIPIENT`가 genesisHolder와 다르면 수취인 자신도 mint할 수 있고 결제액을 돌려받으므로 순비용은 가스뿐입니다. “호출당 정확한 금액 전달”과 “모든 보유자가 순수하게 0.1 ETH를 지출”은 다릅니다. |
| **(b) 한 주소가 두 개 이상 보유·취득 가능한가?** | **No.** `_tokenPlusOne`을 외부 호출 전에 설정하고 지우는 경로가 없습니다. genesisHolder도 다시 발행할 수 없습니다. 여러 주소를 통제하는 것은 가능합니다. |
| **(c) 이전·승인·소각·소유 주소 재지정 가능한가?** | **No.** 다섯 이전·승인 진입점은 무조건 revert합니다. burn, owner 변경, upgrade, delegatecall 경로가 없습니다. 지갑 자체의 제어권 변경은 I2의 별도 한계입니다. |
| **(d) RECIPIENT 또는 다른 경로로 재진입 가능한가?** | **Yes, 수취인이 코드를 실행하면 가능합니다.** 재진입 방지 장치는 없습니다. 그러나 소유권·중복 검사·공급량은 먼저 확정됩니다. 제공된 helper는 아직 토큰이 없는 수취인 주소에 추가 토큰 하나를 정상 발행할 수 있습니다. 동일 주소 중복 발행이나 ID 덮어쓰기는 불가능합니다. 코드 없는 EOA에는 콜백이 없고, 보유자 대상 `onERC721Received` 호출도 없습니다. |
| **(e) ETH가 잠기거나 mint가 영구적으로 막힐 수 있는가?** | **Yes.** 강제 ETH는 영구 잔류합니다. 거부하는 불변 수취인 계약이면 발행이 영구 중단됩니다. EOA 위임에 의한 중단은 수취인 측에서 위임을 수정·해제하면 복구될 수 있으나 이 계약 자체에는 복구 기능이 없습니다. 실패한 mint의 결제와 상태는 함께 되돌려집니다. |
| **(f) 헌장 바이트와 해시가 정확한가?** | **Yes.** 파일 원시 바이트와 소스 문자열을 비교했습니다. 둘 다 **1,632바이트**, BOM 없음, 끝 개행 없음, 완전 일치입니다. 독립 계산한 Keccak-256도 아래 값과 같습니다. |
| **(g) 인터페이스 ID가 정확한가? 호환성 문제가 있는가?** | **ID는 Yes. 문제 존재도 Yes.** 네 ID를 함수 selector XOR로 재계산했습니다. ERC-165 `01ffc9a7`, ERC-721 `80ac58cd`, Metadata `5b5e139f`, ERC-5192 `b45a3c0e` 모두 맞습니다. `ffffffff`와 Enumerable은 false입니다. M1·I1의 호환성 문제가 있고, ERC-5192를 이해하지 못하는 UI는 전송·판매 버튼을 표시했다가 실패할 수 있습니다. |
| **(h) tokenURI가 올바른가? 인젝션 위험이 있는가?** | **URI 정확성 No; 사용자 입력 인젝션 No.** 원문을 잘라 직접 JSON 파싱하면 성공하지만 URL로 처리하면 M1처럼 실패합니다. 동적 값은 십진수 token ID뿐이어서 사용자 제공 HTML·JSON 삽입 경로는 없습니다. |
| **(i) 가스 griefing 또는 DoS가 가능한가?** | **Yes, 실행 코드가 있는 수취인을 통해 조건부 가능합니다.** 수취인 호출에 상당량의 가스가 전달되어 revert·가스 소진으로 mint를 실패시킬 수 있습니다. 정상 EOA 조건에서 일반 공격자가 영구적으로 발행을 막는 경로는 찾지 못했습니다. mint는 공급량을 순회하지 않으며, `_toString` 반복은 최대 78자리로 제한됩니다. |
| **(j) 계약 지갑·계정 추상화 관련 한계가 있는가?** | **Yes.** 스마트계정이 직접 CALL하면 그 계정이 보유자가 되어 정상 작동합니다. 가스 후원만으로 0.1 ETH 결제액이 마련되지는 않습니다. 일반 중계 계약이 직접 호출하면 중계 계약에 귀속됩니다. 계정 주소 변경 시 이전·재발행 복구가 없고, 수신 콜백이 없어 콜백에 의존하는 지갑 모듈은 알림을 받지 못합니다. |

검증된 헌장 해시:

```text
0x236cfb693a5fd5b3f7180a94533d79d3e5a7536e9fcf9ac1c057fa47cdca4b49
```

추가 표준 판단: `locked()`의 존재 확인, 항상 true 반환, 발행 시 `Locked` 이벤트, 이전 함수의 revert는 ERC-5192 동작에 맞습니다. 더 강한 `pure` mutability 자체는 ERC-721 결함이 아닙니다. `image`와 Enumerable 미구현도 필수 기능 누락이 아닙니다. `supportsInterface`는 소스상 단순 상수 비교지만, ERC-165의 **30,000 gas 제한은 실제 바이트코드로 측정하지 못했습니다.** [ERC-5192](https://eips.ethereum.org/EIPS/eip-5192), [ERC-721](https://eips.ethereum.org/EIPS/eip-721), [ERC-165](https://eips.ethereum.org/EIPS/eip-165).

**4. 테스트의 공백**

- **실제 URI 소비 경로 누락:** [test.js:55](/D:/Claude/Projects/Claude-Workspace/projects/skybuddy/public/contracts/test/test.js:55)는 접두사만 잘라 `JSON.parse()`합니다. 이것이 M1을 통과시키는 원인입니다. `fetch(uri).json()` 같은 표준 URL 처리 테스트가 필요합니다.
- **강제 ETH·배포 전 잔액 미검증:** 강제 입금 후 잔액 잔류와 이후 mint의 정상 동작을 확인해야 합니다. 현재 “holds 0” 테스트는 초기 잔액 0인 정상 결제만 검증합니다.
- **재진입 테스트가 지나치게 느슨함:** [test.js:67](/D:/Claude/Projects/Claude-Workspace/projects/skybuddy/public/contracts/test/test.js:67)은 내부 호출이 성공해도 실패해도 통과합니다. 현재 helper에서는 `innerOk == true`, 공급량 3, 수취인이 #2 소유, 정확한 잔액과 이벤트를 검증해야 합니다. 수취인이 genesisHolder인 경우, 같은 주소 반복 진입, 가스 소진, 콜백 후 revert도 추가해야 합니다.
- **실패의 전체 원자성 확인 부족:** 거부 수취인 테스트는 supply와 `hasMinted`만 봅니다. 실제 실패 트랜잭션의 잔액, owner, 이벤트 부재, 다음 성공 시 ID 재사용까지 확인해야 합니다.
- **계약 지갑 테스트 이름과 검증 불일치:** [test.js:75](/D:/Claude/Projects/Claude-Workspace/projects/skybuddy/public/contracts/test/test.js:75)는 계약의 발행과 재발행 실패만 검증합니다. 계약 보유자가 이전을 시도하는 테스트는 없습니다. 스마트계정 직접 실행·라우터 오귀속·서명자 변경도 미검증입니다.
- **일부 실패 판정이 오류 원인을 구분하지 않음:** `reverts()`의 오류명 없는 호출과 무작위 가격 테스트는 일반 RPC 오류도 성공으로 셀 수 있습니다. 트랜잭션 반환 시 receipt까지 기다리지 않는 구조도 실행 환경에 의존합니다. 무작위 입력은 재현 가능한 seed와 `WrongPrice` 검증이 필요합니다.
- **빌드·표준 검증 부족:** ERC-165 가스 제한, 이벤트 전체 인자, 두 자리 이상 tokenURI, 실제 배포 runtime bytecode 일치 검증이 없습니다. 제공 디렉터리에 lockfile이 없고 Hardhat·ethers가 범위 버전입니다. `compile.js`는 runtime bytecode 자체 대신 크기만 저장합니다.

**5. 되돌릴 수 없는 배포 전에 알아야 할 사항**

- **M1은 배포 전에 수정해야 합니다.** 배포 후 원래 계약의 메타데이터 함수를 고칠 수 없습니다. 강제 ETH 및 수취인 의존성은 명시적인 설계 한계로 확정해야 합니다.
- **EOA·genesis 주소의 정확성을 별도로 확인해야 합니다.** 생성자는 0 주소만 거부합니다. 제어권 없는 주소, 잘못된 지갑, 수신 불가 계약은 걸러내지 않습니다. genesis 발행에는 수신 콜백이나 수령 동의 확인도 없습니다.
- **0.8.28의 알려진 컴파일러 버그 검토가 남습니다.** 최신 공식 목록에는 해당 버전에 영향을 주는 버그들이 있습니다. 이 소스에는 `delete`, transient storage, storage array, 내부 상호 재귀가 없어 여러 항목의 발동 조건은 보이지 않습니다. 다만 `SOL-2026-7`은 legacy pipeline의 컴파일러 생성 Yul helper에도 영향을 줄 수 있으므로 “inline assembly가 없다”만으로 배제할 수 없습니다. **이 계약에서 오컴파일을 재현한 것은 아닙니다.** 0.8.28을 유지한다면 생성 코드 검토·최적화 유무에 따른 동작 비교가 필요하고, 수정된 컴파일러를 선택한다면 pragma 변경과 전체 재검증이 필요합니다. [공식 버그 목록](https://raw.githubusercontent.com/ethereum/solidity/develop/docs/bugs.json), [버전별 목록](https://raw.githubusercontent.com/ethereum/solidity/develop/docs/bugs_by_version.json).
- 배포용 Standard JSON, 정확한 compiler build·optimizer·EVM·`viaIR` 설정, 생성자 인자, 최종 bytecode를 고정하십시오. 현재 `compile.js`에는 `viaIR`가 설정되어 있지 않습니다. 배포 후에는 소스 검증과 함께 `RECIPIENT`, #0 소유자, 헌장·해시, runtime bytecode를 확인해야 합니다.
- 고정 가격·무제한 공급·복구 불가가 영구 유지됩니다. 프런트러닝으로 희망 token ID를 선점할 수 있으므로 UI가 발행 전 예상 번호를 보장하면 안 됩니다. 실제 ID는 성공 receipt의 `Transfer` 이벤트에서 읽어야 합니다.

검토 대상 `SkyBuddySoulCharter.sol`의 SHA-256:

```text
5a8dfff48163678e91e212d9c81e58eae8bcb15cd0325d827efc3fe8e30699f1
```