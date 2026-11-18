DEPLOY AFTER FIXES

이번 변경 자체에서 새 자금 탈취·결제 우회 취약점은 발견하지 못했습니다. 판정 이유는 아래 **테스트 오검증과 문서의 과도한 보장**입니다. 요청한 SHA-256은 일치하며, 파일은 수정하지 않았습니다.

**2. 전체 잔액 전송의 영향**

- **(a) 재진입·잔액:** 기존 강제 입금액을 `B`, 가격을 `P=0.1 ETH`라 하면, 바깥 mint 진입 시 계약 잔액은 `B+P`, 수취인 콜백 시작 시에는 `0`입니다. 새 주소가 중첩 mint하면 다시 `P`를 보내야 하며, 계약 잔액은 `P→0`이 됩니다. 바깥 호출은 복귀 후 다시 송금하지 않습니다. 따라서 **성공한 mint가 수취인을 0 ETH로 호출하는 경로는 없고**, `mint{value:0}`도 즉시 거부됩니다. 소유권·공급량은 외부 호출 전에 갱신되어 중복 발행도 막힙니다. [mint 코드](/D:/Claude/Projects/Claude-Workspace/projects/skybuddy/public/contracts/SkyBuddySoulCharter.sol:116)
  
  **순지출 0.1 ETH까지 보장하지는 않습니다.** 수취인이 환급하거나 새 보조 주소에 자금을 주어 mint시키면 그 주소는 자기 자금 없이 토큰을 얻을 수 있습니다. 기존 구현에서도 가능했던 수취인의 자발적 후원입니다. `RECIPIENT == genesisHolder`이므로 수취인 자신의 추가 mint는 거부됩니다. 계약의 송금 목적지는 항상 `RECIPIENT`지만, 수취인이 받은 ETH를 다른 곳으로 보내는 행위까지 제한하지는 않습니다.

- **(b) 강제 ETH의 결제 대체:** 불가능합니다. 첫 검사인 `msg.value != PRICE`는 기존 잔액과 무관합니다. 배포 주소에 미리 보낸 ETH도 동일합니다.

- **(c) griefing/DoS:** 코드 없는 EOA에는 새 경로가 없습니다. 다만 수취인 코드가 **정확히 `P`만 수신하도록 제한한다면**, 공격자가 1 wei를 강제 입금해 이후 송금액을 `P+1`로 만들고 모든 mint를 실패시킬 수 있습니다. 이는 전체 잔액 전송으로 생기는 **조건부 DoS**입니다. 실패하면 발행과 송금은 롤백되고 기존 강제 잔액은 남습니다. Cancun에서도 강제 잔액 이전은 가능합니다. [EIP-6780](https://eips.ethereum.org/EIPS/eip-6780)

- **(d) 다른 회계 가정:** 없습니다. ETH 잔액을 이용하는 다른 계산·분기·예치금 장부가 없으며, `balanceOf()`는 토큰 보유 여부입니다.

- **(e) 코드 없는 EOA:** 충분한 가스의 정상 mint라면 `B+P`를 수신하고 계약 잔액은 0이 됩니다. 콜백이나 재진입은 없습니다.

**3. 주석·README 정확성**

[README의 동작 설명](/D:/Claude/Projects/Claude-Workspace/projects/skybuddy/public/contracts/README.md:20)은 대체로 정확하지만, “다음 mint”는 **“다음 성공한 mint의 송금 시점”**으로 한정하는 편이 정확합니다.

[상단 주석](/D:/Claude/Projects/Claude-Workspace/projects/skybuddy/public/contracts/SkyBuddySoulCharter.sol:8)의 “mint 후 아무것도 보유하지 않는다”는 일반적으로 참이 아닙니다. 수취인 콜백이 송금 후 ETH를 강제로 되돌려 넣으면 **성공한 mint 종료 시에도 잔액이 남습니다.** 코드 없는 EOA라는 현재 전제에서는 발생하지 않습니다.

**4. 강제 ETH 테스트는 충분한가?**

[현재 테스트](/D:/Claude/Projects/Claude-Workspace/projects/skybuddy/public/contracts/test/test.js:95)는 정상 sweep과 강제 잔액 `P`가 있어도 무결제 mint가 거부됨을 확인합니다. 다음 보완이 필요합니다.

- **부분 결제 검사가 잘못된 시점에 있습니다.** 98행의 `P−7 wei` 검사는 이미 7 wei를 sweep한 뒤 실행됩니다. **잔액 7 wei가 남아 있을 때** 실행해야 대체 결제 시도를 직접 검증합니다.
- 배포 주소 사전 입금, 강제 잔액이 있는 상태의 송금 실패·롤백, 재진입 시 각 호출의 송금액, 콜백 중 강제 재입금은 미검증입니다.
- **기존 중첩 롤백 테스트도 의도한 경로를 검증하지 못합니다.** [ReenterThenRevert](/D:/Claude/Projects/Claude-Workspace/projects/skybuddy/public/contracts/test/TestHelpers.sol:44)는 내부 mint의 수취 콜백에서도 또 mint합니다. 이 호출이 `AlreadyMinted`로 실패하면서 내부 mint 자체가 롤백됩니다. 따라서 “내부 mint 성공 후 바깥 콜백 revert”를 입증하지 못합니다. 재진입 깊이 가드로 두 번째 수취 콜백을 정상 반환시키고, 내부 mint 성공 확인 후 바깥에서 revert하도록 보완해야 합니다. README의 “네 항목 모두 보완” 주장도 현재는 부정확합니다.

**5. 불가역 배포에 중요한 나머지**

EOA도 나중에 EIP-7702 위임으로 코드를 실행할 수 있으므로, 현재의 무코드 전제가 영구 보장은 아닙니다. [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702)

이번 검토는 소스·테스트 정적 검토입니다. 환경에 solc·Hardhat·ethers가 없어 실행 검증은 하지 못했습니다. 위 테스트를 보완한 뒤 지정된 컴파일 설정으로 재실행하고, 실제 배포 주소·생성자 인자·최종 바이트코드를 확인해야 합니다.