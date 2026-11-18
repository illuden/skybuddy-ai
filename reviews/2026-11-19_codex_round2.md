DEPLOY AFTER FIXES

**2. M1은 소스 수준에서 완전히 수정됐습니다.**

계약 SHA-256은 제공된 `aa580b5f…56800f`와 일치합니다. 새 계약 취약점은 발견하지 못했습니다. 위 판정은 **5번의 배포 검증 공백을 보완해야 한다는 의미**입니다. 현재 환경에 solc·Hardhat·ethers와 빌드 산출물이 없어 컴파일과 23개 EVM 테스트를 재실행하지 못했습니다. 파일은 수정하지 않았습니다.

[_base64():244](/D:/Claude/Projects/Claude-Workspace/projects/skybuddy/public/contracts/SkyBuddySoulCharter.sol:244)를 직접 검산했습니다.

| 입력 | 본문 루프 종료 `i` | `len - i` | 출력 | 출력 길이 |
|---|---:|---:|---|---:|
| 빈 바이트열 | 0 | 0 | 빈 문자열 | 0 |
| `f` — 1바이트 | 0 | 1 | `Zg==` | 4 |
| `fo` — 2바이트 | 0 | 2 | `Zm8=` | 4 |
| `foo` — 3바이트 | 3 | 0 | `Zm9v` | 4 |
| `foob` — 4바이트 | 3 | 1 | `Zm9vYg==` | 8 |

수작업으로 계산한 테이블 인덱스는 `f → [25,32]`, `fo → [25,38,60]`, `foo → [25,38,61,47]`, 마지막 `b → [24,32]`입니다. 표준 테스트 벡터와 일치합니다. [RFC 4648](https://www.rfc-editor.org/rfc/rfc4648.html#section-10)

실제 소스의 JSON 문자열을 그대로 구성한 결과입니다.

| 토큰 | JSON 바이트 수 | 본문 처리 | 남은 바이트 | 마지막 출력 묶음 | Base64 길이 |
|---|---:|---|---|---|---:|
| #0 | 163 | 54회, `i=162`, `j=216` | `7d` — `}` | `fQ==` | 220 |
| #10 | 164 | 54회, `i=162`, `j=216` | `22 7d` — `"}` | `In0=` | 220 |

두 URI 모두 접두사 포함 **249자**입니다. 표준 Base64 인코더와 전체 문자열이 일치했고, Node `fetch(uri)`가 원래 JSON을 정확히 복원했습니다. URI fragment는 비어 있어 기존 `#` 문제도 제거됐습니다.

경계·산술 검증 결과:

- `len = 3q + r`이면 본문 루프는 정확히 `q`회 실행하고 `i=3q`에서 끝납니다. 따라서 `0 ≤ len-i ≤ 2`이며 **뺄셈 underflow가 없습니다**.
- `i + 2 < len`이 참일 때만 `data[i]`, `data[i+1]`, `data[i+2]`를 읽습니다. 나머지 분기도 존재하는 바이트만 읽습니다.
- 출력 할당량은 정확히 `4 × ceil(len/3)`입니다. 마지막 `j++`는 마지막 유효 인덱스에 쓰고 종료하므로 출력 범위를 넘지 않습니다.
- 테이블은 정확한 64자 표준 알파벳이고 모든 조회 인덱스는 `& 63`으로 제한됩니다. 패딩용 하위 비트도 0으로 채워집니다.
- 시프트 전에 `uint256`으로 확장하며 `n ≤ 0xffffff`입니다. 유일한 호출자인 `tokenURI()`의 JSON은 uint256의 최대 78자리까지 가정해도 **240바이트 이하**입니다. 따라서 `len+2`, `i+2`, `i+=3`, 출력 크기 계산에 overflow가 없습니다.

추가로 동일 알고리즘의 별도 JavaScript 재현을 표준 인코더와 **66,305개 입력**에서 대조했습니다. 모든 1·2바이트 조합과 길이 0~512의 재현 가능한 입력을 포함합니다. 이는 Solidity 바이트코드 실행 검증과는 구분됩니다.

**3. 변경으로 도입된 새로운 계약 취약점: 발견하지 못했습니다.**

Critical / High / Medium / Low에 해당하는 새 공격 시나리오는 확인되지 않았습니다.

- `Approval`, `ApprovalForAll`, `Unlocked` 선언은 인자와 `indexed` 구성이 정확합니다. 선언만으로 승인·해제 경로가 생기지 않습니다. 실제 상태 변화가 없으므로 해당 이벤트를 방출할 필요도 없습니다.
- 추가된 메타데이터 처리는 메모리만 사용하며 외부 호출이나 저장 상태 변경이 없습니다.
- 현재 공식 버전별 목록에서 **0.8.38의 알려진 버그는 빈 목록**입니다. 1차 리뷰에서 우려한 `SOL-2026-7`도 0.8.38에서 수정됐습니다. [버전별 목록](https://raw.githubusercontent.com/ethereum/solidity/develop/docs/bugs_by_version.json), [버그 상세](https://raw.githubusercontent.com/ethereum/solidity/develop/docs/bugs.json)

강제 ETH 잔류와 수취인 수신 의존성은 README에 명시된 수용된 설계 한계로 처리했습니다.

**4. 전체 계약 재검토**

| 항목 | 판단과 근거 |
|---|---|
| 정확한 결제 없이 mint | **배포 후 우회 경로 없음.** [117행](/D:/Claude/Projects/Claude-Workspace/projects/skybuddy/public/contracts/SkyBuddySoulCharter.sol:117)이 정확히 `10^17 wei`를 요구합니다. 기존 계약 잔액도 이 검사를 대신하지 못합니다. 무료 #0은 의도된 생성자 예외입니다. |
| 주소당 두 개 이상 | **경로 없음.** `_tokenPlusOne`을 외부 호출 전에 설정하고 지우는 함수가 없습니다. `RECIPIENT == genesisHolder`이면 수취인도 이미 #0을 보유하므로 추가 발행이 거부됩니다. |
| 이전·승인·소각 | **경로 없음.** [209행부터](/D:/Claude/Projects/Claude-Workspace/projects/skybuddy/public/contracts/SkyBuddySoulCharter.sol:209) 다섯 진입점이 무조건 revert합니다. burn, 관리자, 업그레이드, delegatecall, fallback이 없습니다. |
| 재진입 | **진입 가능성과 악용 가능성을 구분해야 합니다.** 코드 없는 EOA 수취인에는 콜백이 없습니다. 수취인이 향후 코드를 실행하더라도 소유권·공급량 갱신이 선행하며, 같은 주소 재발행은 차단됩니다. 다른 주소를 통한 중첩 호출도 각각 정확한 결제와 주소별 제한을 받습니다. 외부 송금 실패 시 전체 호출이 revert합니다. |
| 상태 손상 | **발견 없음.** 토큰 ID는 증가하는 `_supply`에서만 할당됩니다. 덧셈은 checked arithmetic이며 wraparound로 ID를 덮어쓰지 않습니다. `tokenOf()`의 뺄셈은 0 검사 뒤에 실행됩니다. `_toString()`의 자릿수 감소도 기록할 숫자가 남아 있는 동안만 실행됩니다. |
| 인터페이스 | selector XOR를 독립 재계산해 ERC-165 `01ffc9a7`, ERC-721 `80ac58cd`, Metadata `5b5e139f`, ERC-5192 `b45a3c0e`를 확인했습니다. `ffffffff`, Enumerable은 false입니다. 이벤트 추가는 ID에 영향을 주지 않습니다. |
| 헌장 | 소스 문자열과 `CHARTER.txt` 원시 바이트가 **1,632바이트로 완전 일치**합니다. BOM·끝 개행이 없고, 독립 재계산한 Keccak-256도 `236cfb69…47cdca4b49`와 일치합니다. |

존재하지 않는 토큰 조회의 revert, 발행 시 `Locked`, 항상 true인 잠금 상태도 적절합니다. 이전·승인 함수를 항상 거부하는 정책 자체는 표준상 결함이 아닙니다. [ERC-721](https://eips.ethereum.org/EIPS/eip-721), [ERC-5192](https://eips.ethereum.org/EIPS/eip-5192)

**5. 되돌릴 수 없는 배포 전에 남은 중요한 테스트 공백**

1. **바이트코드 일치 테스트가 실제로는 길이만 비교합니다.**  
   [test.js:24](/D:/Claude/Projects/Claude-Workspace/projects/skybuddy/public/contracts/test/test.js:24)의 이름은 “equals compiled runtime”이지만 검사는 길이뿐입니다. 같은 길이의 다른 코드도 통과합니다. `evm.deployedBytecode.immutableReferences`를 출력하고, `RECIPIENT`를 반영한 기대 runtime과 **전체 바이트를 비교**해야 합니다. 실제 배포에 사용할 Standard JSON·정확한 compiler build·생성자 인자도 함께 고정해야 합니다. 현재 `compile.js`의 optimizer 200·viaIR false·Cancun 설정은 요청과 일치합니다.

2. **Base64 테스트에 정규 인코딩 전체 비교와 나머지 0 경로가 없습니다.**  
   [test.js:96](/D:/Claude/Projects/Claude-Workspace/projects/skybuddy/public/contracts/test/test.js:96)의 토큰들은 JSON 길이 나머지가 1 또는 2뿐입니다. #100처럼 나머지 0인 경우를 추가하고, 정확한 기대 JSON에 대해 `b64 === Buffer.from(expectedJson).toString('base64')`를 검사해야 합니다. 현재 99행의 재인코딩 결과가 비어 있지 않다는 검사는 정확성을 보장하지 않습니다. 가능하면 EVM에서도 길이 0~4 및 `0x00`, `0xff`, `+`·`/`를 생성하는 입력을 직접 검증하십시오.

3. **거부 수취인의 “완전한 원자성” 테스트가 `staticCall`뿐입니다.**  
   [test.js:64](/D:/Claude/Projects/Claude-Workspace/projects/skybuddy/public/contracts/test/test.js:64)는 revert 데이터는 확인하지만, `eth_call`은 원래 상태를 영속화하지 않습니다. 이후 상태가 그대로라는 검사만으로 실제 실패 트랜잭션의 rollback을 입증할 수 없습니다. 실제 트랜잭션을 실행해 실패 receipt·로그 부재·owner/supply/잔액 복구를 확인하고, 테스트용 수취인의 거부를 해제한 뒤 **같은 배포에서 다음 ID가 재사용되는지** 확인해야 합니다. 발신자 잔액은 가스비를 제외해 비교해야 합니다.

4. **중첩 mint 성공 후 바깥 수취인 호출이 revert하는 경우가 없습니다.**  
   [TestHelpers.sol:10](/D:/Claude/Projects/Claude-Workspace/projects/skybuddy/public/contracts/test/TestHelpers.sol:10)의 helper는 내부 mint 후 정상 반환합니다. 내부 발행까지 수행한 뒤 revert하는 helper로 **안팎 토큰·수급·ETH·이벤트 전체가 되돌려지는지** 확인하십시오. 기존 재진입 테스트에도 정확한 이벤트 순서·인자가 빠져 있습니다. 가스 소진 테스트의 무조건적인 `catch` 성공 판정도 실행 실패와 RPC 오류를 구분하도록 좁혀야 합니다.

보완된 테스트는 최종 배포와 동일한 컴파일 설정으로 실행해야 합니다. **현재 검토에서 계약 소스의 추가 수정 필요성은 발견하지 못했지만, 최종 실행 코드와 테스트 통과를 독립 확인한 상태는 아닙니다.**