// 게임 상태 관리를 위한 전역 객체
const gameState = {
    // 플레이어 정보
    player: {
        money: 100000,      // 소지금
        bankMoney: 0,       // 은행 예금
        loan: 0,            // 대출금
        interestRate: 0.1,  // 이자율 (10%)
        assets: []          // 보유 자산
    },
    
    // 게임 시간 관리
    time: {
        day: 1,             // 날짜
        hour: 12,           // 시간
        minute: 0           // 분
    },
    
    // 현재 선택된 게임
    currentGame: null,
    
    // 현재 접속한 앱
    currentApp: null,
    
    // 게임 저장 키
    saveKey: 'casinoGameSave',
    
    // 게임 저장 가능 여부
    canSave: true
};

// DOM 요소 참조
const elements = {
    // 화면 컨테이너
    loadingScreen: document.getElementById('loading-screen'),
    startScreen: document.getElementById('start-screen'),
    gameContainer: document.getElementById('game-container'),
    
    // 상태 표시 요소
    moneyDisplay: document.getElementById('money-display'),
    dateDisplay: document.getElementById('date-display'),
    timeDisplay: document.getElementById('time-display'),
    phoneTime: document.getElementById('phone-time'),
    
    // 게임 화면 요소
    casinoLobby: document.getElementById('casino-lobby'),
    blackjackGame: document.getElementById('blackjack-game'),
    slotGame: document.getElementById('slot-game'),
    rouletteGame: document.getElementById('roulette-game'),
    pokerGame: document.getElementById('poker-game'),
    
    // 휴대폰 인터페이스
    phoneInterface: document.getElementById('phone-interface'),
    bankApp: document.getElementById('bank-app'),
    loansApp: document.getElementById('loans-app'),
    shopApp: document.getElementById('shop-app'),
    assetsApp: document.getElementById('assets-app'),
    
    // 모달 요소
    modalOverlay: document.getElementById('modal-overlay'),
    modalTitle: document.getElementById('modal-title'),
    modalBody: document.getElementById('modal-body'),
    modalConfirmBtn: document.getElementById('modal-confirm-btn'),
    modalCancelBtn: document.getElementById('modal-cancel-btn'),
    
    // 메뉴 오버레이
    menuOverlay: document.getElementById('menu-overlay'),
    
    // 알림 요소
    notification: document.getElementById('notification'),
    notificationMessage: document.getElementById('notification-message'),
    
    // 파산 화면
    bankruptcyScreen: document.getElementById('bankruptcy-screen')
};

// 게임 초기화 함수
function initGame() {
    // 초기 로딩 화면 표시 (2초)
    setTimeout(() => {
        elements.loadingScreen.classList.add('hidden');
        elements.startScreen.classList.remove('hidden');
    }, 2000);
    
    // 이벤트 리스너 설정
    setupEventListeners();
}

// 새 게임 시작 함수
function startNewGame() {
    // 초기 상태로 설정
    gameState.player.money = 100000;
    gameState.player.bankMoney = 0;
    gameState.player.loan = 0;
    gameState.player.assets = [];
    gameState.time.day = 1;
    gameState.time.hour = 12;
    gameState.time.minute = 0;
    
    // 시작 화면 숨기고 게임 화면 표시
    elements.startScreen.classList.add('hidden');
    elements.gameContainer.classList.remove('hidden');
    
    // 게임 상태 초기화
    updateGameState();
    
    // 마지막 저장 시간 초기화
    gameState.lastSaveTime = Date.now();
    
    // 시간 진행 타이머 시작
    startGameTimer();
    
    // 로비 화면 표시
    showLobby();
    
    // 게임 시작 알림
    showNotification('새로운 게임이 시작되었습니다!');
}

// 게임 저장 함수
function saveGame() {
    try {
        // 저장할 게임 데이터
        const saveData = {
            player: gameState.player,
            time: gameState.time
        };
        
        // 로컬 스토리지에 저장
        localStorage.setItem(gameState.saveKey, JSON.stringify(saveData));
        
        // 저장 시간 기록
        gameState.lastSaveTime = Date.now();
        
        showNotification('게임이 저장되었습니다.');
        return true;
    } catch (error) {
        console.error('게임 저장 실패:', error);
        showNotification('게임 저장에 실패했습니다.');
        return false;
    }
}

// 게임 불러오기 함수
function loadGame() {
    try {
        // 로컬 스토리지에서 데이터 불러오기
        const saveData = localStorage.getItem(gameState.saveKey);
        
        if (saveData) {
            // 데이터 파싱 및 적용
            const parsedData = JSON.parse(saveData);
            
            // 플레이어 데이터 복원
            gameState.player = parsedData.player;
            gameState.time = parsedData.time;
            
            // 시작 화면 숨기고 게임 화면 표시
            elements.startScreen.classList.add('hidden');
            elements.gameContainer.classList.remove('hidden');
            
            // 게임 상태 업데이트
            updateGameState();
            
            // 시간 진행 타이머 시작
            startGameTimer();
            
            // 로비 화면 표시
            showLobby();
            
            // 로딩 성공 알림
            showNotification('저장된 게임을 불러왔습니다.');
            return true;
        } else {
            showNotification('저장된 게임이 없습니다.');
            return false;
        }
    } catch (error) {
        console.error('게임 불러오기 실패:', error);
        showNotification('게임 불러오기에 실패했습니다.');
        return false;
    }
}

// 게임 시간 진행 타이머
function startGameTimer() {
    // 기존 타이머가 있으면 제거
    if (gameState.gameTimer) {
        clearInterval(gameState.gameTimer);
    }
    
    // 시간 진행 타이머 설정 (5초마다 10분 진행)
    gameState.gameTimer = setInterval(() => {
        advanceTime(10);
        
        // 자동 이자 계산 (6시간마다)
        if (gameState.time.hour % 6 === 0 && gameState.time.minute === 0) {
            calculateInterest();
        }
        
        // 자산 가치 변동 (매일 자정)
        if (gameState.time.hour === 0 && gameState.time.minute === 0) {
            updateAssetValues();
        }
        
        // 자동 저장 (30분마다)
        if (gameState.time.minute % 30 === 0 && gameState.canSave) {
            saveGame();
        }
    }, 5000);
}

// 게임 시간 진행 함수
function advanceTime(minutes) {
    gameState.time.minute += minutes;
    
    // 시간 계산
    while (gameState.time.minute >= 60) {
        gameState.time.minute -= 60;
        gameState.time.hour++;
        
        // 날짜 계산
        if (gameState.time.hour >= 24) {
            gameState.time.hour = 0;
            gameState.time.day++;
        }
    }
    
    // 시간 표시 업데이트
    updateTimeDisplay();
}

// 시간 표시 업데이트
function updateTimeDisplay() {
    // 시간 형식 생성
    const hour = String(gameState.time.hour).padStart(2, '0');
    const minute = String(gameState.time.minute).padStart(2, '0');
    const timeString = `${hour}:${minute}`;
    
    // 시간 표시 업데이트
    elements.timeDisplay.textContent = timeString;
    elements.phoneTime.textContent = timeString;
    
    // 날짜 표시 업데이트
    elements.dateDisplay.textContent = `${gameState.time.day}일차`;
}

// 이자 계산 함수
function calculateInterest() {
    if (gameState.player.loan > 0) {
        // 이자 계산 (일일 이자율로 변환)
        const dailyInterestRate = gameState.player.interestRate / 24;
        const interest = Math.floor(gameState.player.loan * dailyInterestRate);
        
        // 이자 추가
        gameState.player.loan += interest;
        
        // 이자 적용 알림
        showNotification(`대출 이자 ${formatMoney(interest)}원이 추가되었습니다.`);
        
        // 파산 여부 확인
        checkBankruptcy();
    }
    
    // 은행 예금 이자 계산 (은행 이자율은 대출 이자율의 1/2)
    if (gameState.player.bankMoney > 0) {
        const dailyBankInterestRate = (gameState.player.interestRate / 2) / 24;
        const bankInterest = Math.floor(gameState.player.bankMoney * dailyBankInterestRate);
        
        // 이자 추가
        gameState.player.bankMoney += bankInterest;
        
        // 은행 잔액 업데이트 (뱅크 앱이 열려있을 경우)
        if (!elements.bankApp.classList.contains('hidden')) {
            document.getElementById('bank-balance').textContent = formatMoney(gameState.player.bankMoney) + '원';
        }
    }
    
    // 대출 정보 업데이트 (대출 앱이 열려있을 경우)
    if (!elements.loansApp.classList.contains('hidden')) {
        document.getElementById('loan-amount').textContent = formatMoney(gameState.player.loan) + '원';
    }
}

// 자산 가치 변동 함수
function updateAssetValues() {
    if (gameState.player.assets.length === 0) return;
    
    gameState.player.assets.forEach(asset => {
        // 변동률 계산 (-5% ~ +10% 랜덤)
        const changeRate = (Math.random() * 0.15) - 0.05;
        
        // 원래 가치
        const originalValue = asset.value;
        
        // 새 가치 계산
        asset.value = Math.floor(asset.value * (1 + changeRate));
        
        // 변동 금액
        const changeAmount = asset.value - originalValue;
        
        // 자산 가치 변동이 큰 경우 알림 (±5% 이상)
        if (Math.abs(changeRate) >= 0.05) {
            const changeText = changeAmount > 0 ? '상승' : '하락';
            showNotification(`${asset.name}의 가치가 ${formatMoney(Math.abs(changeAmount))}원 ${changeText}했습니다.`);
        }
    });
    
    // 자산 앱이 열려있으면 정보 업데이트
    if (!elements.assetsApp.classList.contains('hidden')) {
        updateAssetsList();
    }
}

// 소지금 업데이트 함수
function updateMoney(amount) {
    gameState.player.money += amount;
    elements.moneyDisplay.textContent = formatMoney(gameState.player.money) + '원';
    
    // 파산 여부 확인
    checkBankruptcy();
}

// 파산 여부 확인 함수
function checkBankruptcy() {
    // 자산 총 가치 계산
    const totalAssetValue = calculateTotalAssetValue();
    
    // 파산 조건: 소지금 + 은행예금 + 자산가치 < 대출금
    if (gameState.player.money + gameState.player.bankMoney + totalAssetValue < gameState.player.loan && gameState.player.loan > 0) {
        // 파산 처리
        declareBankruptcy();
    }
}

// 파산 처리 함수
function declareBankruptcy() {
    // 게임 타이머 중지
    clearInterval(gameState.gameTimer);
    
    // 파산 화면 표시
    elements.bankruptcyScreen.classList.remove('hidden');
    
    // 저장 불가능하게 설정
    gameState.canSave = false;
}

// 파산 후 재시작
function restartAfterBankruptcy() {
    // 파산 화면 숨기기
    elements.bankruptcyScreen.classList.add('hidden');
    
    // 게임 화면 숨기기
    elements.gameContainer.classList.add('hidden');
    
    // 시작 화면 표시
    elements.startScreen.classList.remove('hidden');
    
    // 저장 가능하게 설정
    gameState.canSave = true;
}

// 자산 총 가치 계산 함수
function calculateTotalAssetValue() {
    return gameState.player.assets.reduce((total, asset) => total + asset.value, 0);
}

// 게임 상태 업데이트 함수
function updateGameState() {
    // 소지금 업데이트
    elements.moneyDisplay.textContent = formatMoney(gameState.player.money) + '원';
    
    // 시간 표시 업데이트
    updateTimeDisplay();
}

// 돈 형식 포맷 함수
function formatMoney(amount) {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// 알림 메시지 표시 함수
function showNotification(message) {
    elements.notificationMessage.textContent = message;
    elements.notification.classList.remove('hidden');
    
    // 3초 후 알림 숨김
    setTimeout(() => {
        elements.notification.classList.add('hidden');
    }, 3000);
}

// 모달 창 표시 함수
function showModal(title, body, confirmCallback, cancelCallback = null) {
    elements.modalTitle.textContent = title;
    elements.modalBody.textContent = body;
    
    // 확인 버튼 콜백 설정
    elements.modalConfirmBtn.onclick = () => {
        hideModal();
        if (confirmCallback) confirmCallback();
    };
    
    // 취소 버튼 콜백 설정
    elements.modalCancelBtn.onclick = () => {
        hideModal();
        if (cancelCallback) cancelCallback();
    };
    
    // 모달 표시
    elements.modalOverlay.classList.remove('hidden');
}

// 모달 창 숨김 함수
function hideModal() {
    elements.modalOverlay.classList.add('hidden');
}

// 로비 화면 표시
function showLobby() {
    // 모든 게임 화면 숨기기
    hideAllGameSections();
    
    // 로비 표시
    elements.casinoLobby.classList.remove('hidden');
    
    // 현재 게임 설정
    gameState.currentGame = null;
}

// 모든 게임 섹션 숨기기
function hideAllGameSections() {
    elements.casinoLobby.classList.add('hidden');
    elements.blackjackGame.classList.add('hidden');
    elements.slotGame.classList.add('hidden');
    elements.rouletteGame.classList.add('hidden');
    elements.pokerGame.classList.add('hidden');
}

// 모든 앱 화면 숨기기
function hideAllAppScreens() {
    elements.bankApp.classList.add('hidden');
    elements.loansApp.classList.add('hidden');
    elements.shopApp.classList.add('hidden');
    elements.assetsApp.classList.add('hidden');
}

// 휴대폰 인터페이스 토글
function togglePhone() {
    // 휴대폰 화면 토글
    elements.phoneInterface.classList.toggle('hidden');
    
    // 모든 앱 화면 숨기기
    hideAllAppScreens();
    
    // 현재 앱 초기화
    gameState.currentApp = null;
}

// 앱 화면 표시
function showApp(appName) {
    // 모든 앱 화면 숨기기
    hideAllAppScreens();
    
    // 현재 앱 설정
    gameState.currentApp = appName;
    
    // 앱 화면 표시
    switch (appName) {
        case 'bank':
            elements.bankApp.classList.remove('hidden');
            document.getElementById('bank-balance').textContent = formatMoney(gameState.player.bankMoney) + '원';
            break;
            
        case 'loans':
            elements.loansApp.classList.remove('hidden');
            document.getElementById('loan-amount').textContent = formatMoney(gameState.player.loan) + '원';
            document.getElementById('interest-rate').textContent = (gameState.player.interestRate * 100) + '%';
            break;
            
        case 'shop':
            elements.shopApp.classList.remove('hidden');
            showShopCategory('cars');
            break;
            
        case 'assets':
            elements.assetsApp.classList.remove('hidden');
            updateAssetsList();
            break;
    }
}

// 자산 목록 업데이트 함수
function updateAssetsList() {
    const assetList = document.getElementById('asset-list');
    const totalAssetsValue = document.getElementById('total-assets-value');
    
    // 자산 목록 초기화
    assetList.innerHTML = '';
    
    // 자산이 없는 경우
    if (gameState.player.assets.length === 0) {
        assetList.innerHTML = '<div class="empty-state">보유한 자산이 없습니다.</div>';
        totalAssetsValue.textContent = '0원';
        return;
    }
    
    // 총 자산 가치 계산
    let totalValue = 0;
    
    // 자산 목록 생성
    gameState.player.assets.forEach((asset, index) => {
        // 총 가치에 추가
        totalValue += asset.value;
        
        // 자산 항목 생성
        const assetItem = document.createElement('div');
        assetItem.className = 'asset-item';
        assetItem.innerHTML = `
            <div class="asset-item-icon">${asset.icon}</div>
            <div class="asset-item-info">
                <div class="asset-item-name">${asset.name}</div>
                <div class="asset-item-value">${formatMoney(asset.value)}원</div>
            </div>
            <button class="asset-item-btn" data-asset-index="${index}">판매</button>
        `;
        
        // 자산 판매 버튼 이벤트 추가
        assetItem.querySelector('.asset-item-btn').addEventListener('click', () => {
            sellAsset(index);
        });
        
        assetList.appendChild(assetItem);
    });
    
    // 총 자산 가치 표시
    totalAssetsValue.textContent = formatMoney(totalValue) + '원';
}

// 자산 판매 함수
function sellAsset(assetIndex) {
    // 판매할 자산 가져오기
    const asset = gameState.player.assets[assetIndex];
    
    // 판매 확인 모달
    showModal(
        '자산 판매',
        `${asset.name}을(를) ${formatMoney(asset.value)}원에 판매하시겠습니까?`,
        () => {
            // 판매 처리
            updateMoney(asset.value);
            
            // 자산 목록에서 제거
            gameState.player.assets.splice(assetIndex, 1);
            
            // 자산 목록 업데이트
            updateAssetsList();
            
            // 판매 완료 알림
            showNotification(`${asset.name}을(를) ${formatMoney(asset.value)}원에 판매했습니다.`);
        }
    );
}

// 상점 카테고리 표시 함수
function showShopCategory(category) {
    // 모든 카테고리 버튼 비활성화
    document.querySelectorAll('.shop-category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 선택한 카테고리 버튼 활성화
    document.querySelector(`.shop-category-btn[data-category="${category}"]`).classList.add('active');
    
    // 상품 컨테이너 가져오기
    const itemsContainer = document.getElementById('shop-items-container');
    
    // 상품 컨테이너 초기화
    itemsContainer.innerHTML = '';
    
    // 카테고리별 상품 목록 생성
    let items = [];
    
    switch (category) {
        case 'cars':
            items = [
                { name: '중고 소형차', price: 1000000, icon: '🚗', type: 'car' },
                { name: '준중형 세단', price: 3000000, icon: '🚙', type: 'car' },
                { name: '중형 SUV', price: 5000000, icon: '🚚', type: 'car' },
                { name: '고급 세단', price: 10000000, icon: '🏎️', type: 'car' },
                { name: '스포츠카', price: 30000000, icon: '🏎️', type: 'car' }
            ];
            break;
            
        case 'houses':
            items = [
                { name: '원룸 아파트', price: 5000000, icon: '🏢', type: 'house' },
                { name: '투룸 아파트', price: 10000000, icon: '🏢', type: 'house' },
                { name: '전원주택', price: 20000000, icon: '🏡', type: 'house' },
                { name: '고급 아파트', price: 50000000, icon: '🏙️', type: 'house' },
                { name: '펜트하우스', price: 100000000, icon: '🏙️', type: 'house' }
            ];
            break;
            
        case 'luxury':
            items = [
                { name: '디자이너 시계', price: 500000, icon: '⌚', type: 'luxury' },
                { name: '명품 가방', price: 1000000, icon: '👜', type: 'luxury' },
                { name: '명품 시계', price: 3000000, icon: '⌚', type: 'luxury' },
                { name: '다이아몬드 반지', price: 5000000, icon: '💍', type: 'luxury' },
                { name: '고급 요트', price: 50000000, icon: '⛵', type: 'luxury' }
            ];
            break;
            
        case 'gold':
            items = [
                { name: '금 1g', price: 80000, icon: '🪙', type: 'gold' },
                { name: '금 10g', price: 800000, icon: '🪙', type: 'gold' },
                { name: '금 100g', price: 8000000, icon: '🪙', type: 'gold' },
                { name: '금괴 1kg', price: 80000000, icon: '🪙', type: 'gold' }
            ];
            break;
    }
    
    // 상품 목록 생성
    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'shop-item';
        itemElement.innerHTML = `
            <div class="shop-item-icon">${item.icon}</div>
            <div class="shop-item-info">
                <div class="shop-item-name">${item.name}</div>
                <div class="shop-item-price">${formatMoney(item.price)}원</div>
            </div>
            <button class="shop-item-btn">구매</button>
        `;
        
        // 구매 버튼 이벤트 추가
        itemElement.querySelector('.shop-item-btn').addEventListener('click', () => {
            buyItem(item);
        });
        
        itemsContainer.appendChild(itemElement);
    });
}

// 상품 구매 함수
function buyItem(item) {
    // 소지금 확인
    if (gameState.player.money < item.price) {
        showNotification('소지금이 부족합니다.');
        return;
    }
    
    // 구매 확인 모달
    showModal(
        '상품 구매',
        `${item.name}을(를) ${formatMoney(item.price)}원에 구매하시겠습니까?`,
        () => {
            // 구매 처리
            updateMoney(-item.price);
            
            // 자산 추가
            gameState.player.assets.push({
                name: item.name,
                icon: item.icon,
                value: item.price,
                type: item.type
            });
            
            // 구매 완료 알림
            showNotification(`${item.name}을(를) 구매했습니다.`);
        }
    );
}

// 은행 입금 처리
function depositMoney() {
    // 입금 금액 입력 모달
    showModal(
        '은행 입금',
        `입금할 금액을 입력하세요. (현재 소지금: ${formatMoney(gameState.player.money)}원)`,
        () => {
            const inputAmount = document.getElementById('input-amount');
            const amount = parseInt(inputAmount.value);
            
            if (isNaN(amount) || amount <= 0) {
                showNotification('유효한 금액을 입력하세요.');
                return;
            }
            
            if (amount > gameState.player.money) {
                showNotification('소지금이 부족합니다.');
                return;
            }
            
            // 입금 처리
            gameState.player.money -= amount;
            gameState.player.bankMoney += amount;
            
            // 화면 업데이트
            elements.moneyDisplay.textContent = formatMoney(gameState.player.money) + '원';
            document.getElementById('bank-balance').textContent = formatMoney(gameState.player.bankMoney) + '원';
            
            // 입금 완료 알림
            showNotification(`${formatMoney(amount)}원을 입금했습니다.`);
        },
        null,
        'number'
    );
    
    // 금액 입력 필드 생성
    elements.modalBody.innerHTML = `
        <p>입금할 금액을 입력하세요. (현재 소지금: ${formatMoney(gameState.player.money)}원)</p>
        <input type="number" id="input-amount" min="1" max="${gameState.player.money}" class="modal-input">
    `;
}

// 은행 출금 처리
function withdrawMoney() {
    // 출금 금액 입력 모달
    showModal(
        '은행 출금',
        `출금할 금액을 입력하세요. (현재 잔액: ${formatMoney(gameState.player.bankMoney)}원)`,
        () => {
            const inputAmount = document.getElementById('input-amount');
            const amount = parseInt(inputAmount.value);
            
            if (isNaN(amount) || amount <= 0) {
                showNotification('유효한 금액을 입력하세요.');
                return;
            }
            
            if (amount > gameState.player.bankMoney) {
                showNotification('잔액이 부족합니다.');
                return;
            }
            
            // 출금 처리
            gameState.player.money += amount;
            gameState.player.bankMoney -= amount;
            
            // 화면 업데이트
            elements.moneyDisplay.textContent = formatMoney(gameState.player.money) + '원';
            document.getElementById('bank-balance').textContent = formatMoney(gameState.player.bankMoney) + '원';
            
            // 출금 완료 알림
            showNotification(`${formatMoney(amount)}원을 출금했습니다.`);
        },
        null,
        'number'
    );
    
    // 금액 입력 필드 생성
    elements.modalBody.innerHTML = `
        <p>출금할 금액을 입력하세요. (현재 잔액: ${formatMoney(gameState.player.bankMoney)}원)</p>
        <input type="number" id="input-amount" min="1" max="${gameState.player.bankMoney}" class="modal-input">
    `;
}

// 대출 받기
function getLoan() {
    // 최대 대출 가능 금액 계산 (현재 자산의 3배까지)
    const totalAssetValue = calculateTotalAssetValue() + gameState.player.money + gameState.player.bankMoney;
    const maxLoanAmount = Math.max(0, (totalAssetValue * 3) - gameState.player.loan);
    
    if (maxLoanAmount <= 0) {
        showNotification('더 이상 대출을 받을 수 없습니다.');
        return;
    }
    
    // 대출 금액 입력 모달
    showModal(
        '대출 신청',
        `대출 받을 금액을 입력하세요. (최대: ${formatMoney(maxLoanAmount)}원)`,
        () => {
            const inputAmount = document.getElementById('input-amount');
            const amount = parseInt(inputAmount.value);
            
            if (isNaN(amount) || amount <= 0) {
                showNotification('유효한 금액을 입력하세요.');
                return;
            }
            
            if (amount > maxLoanAmount) {
                showNotification('대출 한도를 초과했습니다.');
                return;
            }
            
            // 대출 처리
            gameState.player.money += amount;
            gameState.player.loan += amount;
            
            // 화면 업데이트
            elements.moneyDisplay.textContent = formatMoney(gameState.player.money) + '원';
            document.getElementById('loan-amount').textContent = formatMoney(gameState.player.loan) + '원';
            
            // 대출 완료 알림
            showNotification(`${formatMoney(amount)}원을 대출받았습니다.`);
        },
        null,
        'number'
    );
    
    // 금액 입력 필드 생성
    elements.modalBody.innerHTML = `
        <p>대출 받을 금액을 입력하세요. (최대: ${formatMoney(maxLoanAmount)}원)</p>
        <p>이자율: ${gameState.player.interestRate * 100}%</p>
        <input type="number" id="input-amount" min="1" max="${maxLoanAmount}" class="modal-input">
    `;
}

// 대출 상환하기
function repayLoan() {
    if (gameState.player.loan <= 0) {
        showNotification('상환할 대출이 없습니다.');
        return;
    }
    
    // 상환 금액 입력 모달
    showModal(
        '대출 상환',
        `상환할 금액을 입력하세요. (현재 대출: ${formatMoney(gameState.player.loan)}원)`,
        () => {
            const inputAmount = document.getElementById('input-amount');
            const amount = parseInt(inputAmount.value);
            
            if (isNaN(amount) || amount <= 0) {
                showNotification('유효한 금액을 입력하세요.');
                return;
            }
            
            if (amount > gameState.player.money) {
                showNotification('소지금이 부족합니다.');
                return;
            }
            
            if (amount > gameState.player.loan) {
                showNotification('대출금액보다 많이 상환할 수 없습니다.');
                return;
            }
            
            // 상환 처리
            gameState.player.money -= amount;
            gameState.player.loan -= amount;
            
            // 화면 업데이트
            elements.moneyDisplay.textContent = formatMoney(gameState.player.money) + '원';
            document.getElementById('loan-amount').textContent = formatMoney(gameState.player.loan) + '원';
            
            // 상환 완료 알림
            showNotification(`${formatMoney(amount)}원을 상환했습니다.`);
        },
        null,
        'number'
    );
    
    // 금액 입력 필드 생성
    elements.modalBody.innerHTML = `
        <p>상환할 금액을 입력하세요. (현재 대출: ${formatMoney(gameState.player.loan)}원)</p>
        <input type="number" id="input-amount" min="1" max="${Math.min(gameState.player.money, gameState.player.loan)}" class="modal-input">
    `;
}

// 블랙잭 게임 초기화 및 표시
function initBlackjackGame() {
    // 게임 섹션 초기화
    hideAllGameSections();
    
    // 현재 게임 설정
    gameState.currentGame = 'blackjack';
    
    // 블랙잭 게임 상태 초기화
    gameState.blackjack = {
        deck: createDeck(),
        playerHand: [],
        dealerHand: [],
        playerScore: 0,
        dealerScore: 0,
        bet: 1000,
        gameState: 'betting' // betting, playing, dealerTurn, gameOver
    };
    
    // 게임 화면 생성
    elements.blackjackGame.innerHTML = `
        <h2>블랙잭</h2>
        <div class="bet-controls">
            <button id="decrease-bet-btn" class="bet-btn">- 베팅</button>
            <div id="bet-amount" class="bet-amount">${formatMoney(gameState.blackjack.bet)}원</div>
            <button id="increase-bet-btn" class="bet-btn">+ 베팅</button>
        </div>
        
        <div class="dealer-hand">
            <div class="hand-label">딜러 패</div>
            <div id="dealer-cards" class="card-container"></div>
            <div id="dealer-score" class="hand-value">점수: 0</div>
        </div>
        
        <div class="player-hand">
            <div class="hand-label">내 패</div>
            <div id="player-cards" class="card-container"></div>
            <div id="player-score" class="hand-value">점수: 0</div>
        </div>
        
        <div class="blackjack-controls">
            <button id="deal-btn" class="primary-btn">게임 시작</button>
            <button id="hit-btn" class="primary-btn" disabled>히트</button>
            <button id="stand-btn" class="primary-btn" disabled>스탠드</button>
            <button id="back-to-lobby-btn" class="secondary-btn">로비로 돌아가기</button>
        </div>
        
        <div id="game-result" class="game-result"></div>
    `;
    
    // 이벤트 리스너 설정
    document.getElementById('deal-btn').addEventListener('click', startBlackjackRound);
    document.getElementById('hit-btn').addEventListener('click', blackjackHit);
    document.getElementById('stand-btn').addEventListener('click', blackjackStand);
    document.getElementById('back-to-lobby-btn').addEventListener('click', showLobby);
    document.getElementById('decrease-bet-btn').addEventListener('click', () => {
        changeBet(-1000);
    });
    document.getElementById('increase-bet-btn').addEventListener('click', () => {
        changeBet(1000);
    });
    
    // 블랙잭 게임 섹션 표시
    elements.blackjackGame.classList.remove('hidden');
}

// 블랙잭 베팅 금액 변경
function changeBet(amount) {
    // 게임 진행 중에는 베팅 변경 불가
    if (gameState.blackjack.gameState !== 'betting') return;
    
    // 새 베팅 금액 계산
    const newBet = Math.max(1000, gameState.blackjack.bet + amount);
    
    // 소지금 초과 검사
    if (newBet > gameState.player.money) {
        showNotification('소지금을 초과하여 베팅할 수 없습니다.');
        return;
    }
    
    // 베팅 금액 업데이트
    gameState.blackjack.bet = newBet;
    document.getElementById('bet-amount').textContent = formatMoney(newBet) + '원';
}

// 블랙잭 게임 라운드 시작
function startBlackjackRound() {
    // 베팅 금액 확인
    if (gameState.player.money < gameState.blackjack.bet) {
        showNotification('소지금이 부족합니다.');
        return;
    }
    
    // 베팅 금액만큼 소지금 차감
    updateMoney(-gameState.blackjack.bet);
    
    // 게임 상태 변경
    gameState.blackjack.gameState = 'playing';
    
    // 덱 초기화 (필요한 경우)
    if (gameState.blackjack.deck.length < 10) {
        gameState.blackjack.deck = createDeck();
    }
    
    // 손패 초기화
    gameState.blackjack.playerHand = [];
    gameState.blackjack.dealerHand = [];
    
    // 카드 분배 (각각 2장씩)
    gameState.blackjack.playerHand.push(drawCard());
    gameState.blackjack.dealerHand.push(drawCard());
    gameState.blackjack.playerHand.push(drawCard());
    gameState.blackjack.dealerHand.push(drawCard());
    
    // 점수 계산
    calculateBlackjackScore();
    
    // 게임 화면 업데이트
    updateBlackjackUI();
    
    // 게임 결과 초기화
    document.getElementById('game-result').textContent = '';
    
    // 컨트롤 버튼 활성화/비활성화
    document.getElementById('deal-btn').disabled = true;
    document.getElementById('hit-btn').disabled = false;
    document.getElementById('stand-btn').disabled = false;
    document.getElementById('decrease-bet-btn').disabled = true;
    document.getElementById('increase-bet-btn').disabled = true;
    
    // 내츄럴 블랙잭 확인
    checkNaturalBlackjack();
}

// 내츄럴 블랙잭 확인
function checkNaturalBlackjack() {
    const playerScore = gameState.blackjack.playerScore;
    const dealerScore = gameState.blackjack.dealerScore;
    
    // 둘 다 블랙잭인 경우
    if (playerScore === 21 && dealerScore === 21) {
        endBlackjackRound('push');
    }
    // 플레이어만 블랙잭인 경우
    else if (playerScore === 21) {
        endBlackjackRound('blackjack');
    }
    // 딜러만 블랙잭인 경우
    else if (dealerScore === 21) {
        endBlackjackRound('dealer');
    }
}

// 블랙잭 히트 (카드 한 장 더 받기)
function blackjackHit() {
    // 게임 진행 중인지 확인
    if (gameState.blackjack.gameState !== 'playing') return;
    
    // 카드 한 장 추가
    gameState.blackjack.playerHand.push(drawCard());
    
    // 점수 재계산
    calculateBlackjackScore();
    
    // 게임 화면 업데이트
    updateBlackjackUI();
    
    // 버스트 확인 (21점 초과)
    if (gameState.blackjack.playerScore > 21) {
        endBlackjackRound('bust');
    }
}

// 블랙잭 스탠드 (카드 더 안받고 턴 종료)
function blackjackStand() {
    // 게임 진행 중인지 확인
    if (gameState.blackjack.gameState !== 'playing') return;
    
    // 딜러 턴으로 전환
    gameState.blackjack.gameState = 'dealerTurn';
    
    // 딜러 카드 공개
    revealDealerCard();
    
    // 딜러 행동 (17점 이상이 될 때까지 히트)
    dealerPlay();
}

// 딜러 카드 공개
function revealDealerCard() {
    updateBlackjackUI(true);
}

// 딜러 플레이
function dealerPlay() {
    // 딜러가 17점 미만이면 카드 계속 뽑기
    while (gameState.blackjack.dealerScore < 17) {
        gameState.blackjack.dealerHand.push(drawCard());
        calculateBlackjackScore();
        updateBlackjackUI(true);
    }
    
    // 결과 판정
    determineBlackjackWinner();
}

// 블랙잭 승자 판정
function determineBlackjackWinner() {
    const playerScore = gameState.blackjack.playerScore;
    const dealerScore = gameState.blackjack.dealerScore;
    
    // 딜러 버스트
    if (dealerScore > 21) {
        endBlackjackRound('win');
    }
    // 점수 비교
    else if (playerScore > dealerScore) {
        endBlackjackRound('win');
    }
    else if (playerScore < dealerScore) {
        endBlackjackRound('lose');
    }
    else {
        endBlackjackRound('push');
    }
}

// 블랙잭 게임 종료 및 결과 처리
function endBlackjackRound(result) {
    // 게임 상태 업데이트
    gameState.blackjack.gameState = 'gameOver';
    
    // 버튼 상태 업데이트
    document.getElementById('deal-btn').disabled = false;
    document.getElementById('hit-btn').disabled = true;
    document.getElementById('stand-btn').disabled = true;
    document.getElementById('decrease-bet-btn').disabled = false;
    document.getElementById('increase-bet-btn').disabled = false;
    
    // 딜러 카드 모두 공개
    updateBlackjackUI(true);
    
    // 결과에 따른 상금 처리
    let winnings = 0;
    let resultText = '';
    
    switch (result) {
        case 'blackjack':
            // 블랙잭은 1.5배 지급
            winnings = Math.floor(gameState.blackjack.bet * 2.5);
            resultText = '블랙잭! ' + formatMoney(winnings) + '원을 획득했습니다!';
            break;
            
        case 'win':
            // 승리는 2배 지급
            winnings = gameState.blackjack.bet * 2;
            resultText = '승리! ' + formatMoney(winnings) + '원을 획득했습니다!';
            break;
            
        case 'push':
            // 무승부는 베팅금액 반환
            winnings = gameState.blackjack.bet;
            resultText = '무승부. 베팅금액이 반환됩니다.';
            break;
            
        case 'lose':
            // 패배는 획득 없음
            winnings = 0;
            resultText = '패배... 베팅금액을 잃었습니다.';
            break;
            
        case 'bust':
            // 버스트는 획득 없음
            winnings = 0;
            resultText = '버스트! 21점을 초과했습니다.';
            break;
            
        case 'dealer':
            // 딜러 블랙잭은 획득 없음
            winnings = 0;
            resultText = '딜러 블랙잭! 베팅금액을 잃었습니다.';
            break;
    }
    
    // 상금 지급
    if (winnings > 0) {
        updateMoney(winnings);
    }
    
    // 결과 표시
    document.getElementById('game-result').textContent = resultText;
}

// 블랙잭 UI 업데이트
function updateBlackjackUI(revealDealer = false) {
    // 플레이어 카드 표시
    const playerCardsContainer = document.getElementById('player-cards');
    playerCardsContainer.innerHTML = '';
    
    gameState.blackjack.playerHand.forEach(card => {
        playerCardsContainer.appendChild(createCardElement(card));
    });
    
    // 딜러 카드 표시
    const dealerCardsContainer = document.getElementById('dealer-cards');
    dealerCardsContainer.innerHTML = '';
    
    gameState.blackjack.dealerHand.forEach((card, index) => {
        // 첫 번째 카드는 게임 상태에 따라 앞/뒷면 표시
        if (index === 0 || revealDealer || gameState.blackjack.gameState === 'dealerTurn' || gameState.blackjack.gameState === 'gameOver') {
            dealerCardsContainer.appendChild(createCardElement(card));
        } else {
            dealerCardsContainer.appendChild(createCardBackElement());
        }
    });
    
    // 점수 표시
    document.getElementById('player-score').textContent = '점수: ' + gameState.blackjack.playerScore;
    
    // 딜러 점수는 게임 상태에 따라 표시 여부 결정
    if (revealDealer || gameState.blackjack.gameState === 'dealerTurn' || gameState.blackjack.gameState === 'gameOver') {
        document.getElementById('dealer-score').textContent = '점수: ' + gameState.blackjack.dealerScore;
    } else {
        document.getElementById('dealer-score').textContent = '점수: ?';
    }
}

// 카드 요소 생성
function createCardElement(card) {
    const cardElement = document.createElement('div');
    cardElement.className = `card ${card.suit === '♥️' || card.suit === '♦️' ? 'card-red' : ''}`;
    
    // 카드 내용 구성
    cardElement.innerHTML = `
        <div class="card-value">${card.value}</div>
        <div class="card-suit">${card.suit}</div>
        <div class="card-value" style="transform: rotate(180deg)">${card.value}</div>
    `;
    
    return cardElement;
}

// 카드 뒷면 요소 생성
function createCardBackElement() {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    cardElement.style.backgroundColor = '#1d3557';
    cardElement.style.color = 'white';
    
    // 카드 내용 구성
    cardElement.innerHTML = `
        <div style="font-size: 2.5rem; text-align: center; line-height: 120px;">🎴</div>
    `;
    
    return cardElement;
}

// 블랙잭 점수 계산
function calculateBlackjackScore() {
    // 플레이어 점수 계산
    gameState.blackjack.playerScore = calculateHandScore(gameState.blackjack.playerHand);
    
    // 딜러 점수 계산
    gameState.blackjack.dealerScore = calculateHandScore(gameState.blackjack.dealerHand);
}

// 패의 점수 계산
function calculateHandScore(hand) {
    let score = 0;
    let aceCount = 0;
    
    // 모든 카드 점수 합산
    hand.forEach(card => {
        if (card.value === 'A') {
            // 에이스는 일단 11점으로 계산하고 나중에 조정
            score += 11;
            aceCount++;
        } else if (card.value === 'J' || card.value === 'Q' || card.value === 'K') {
            // 페이스 카드는 10점
            score += 10;
        } else {
            // 숫자 카드는 해당 숫자 점수
            score += parseInt(card.value);
        }
    });
    
    // 점수가 21을 초과하면 에이스를 1점으로 조정
    while (score > 21 && aceCount > 0) {
        score -= 10;
        aceCount--;
    }
    
    return score;
}

// 덱 생성
function createDeck() {
    const suits = ['♥️', '♦️', '♠️', '♣️'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = [];
    
    // 모든 카드 조합 생성
    for (const suit of suits) {
        for (const value of values) {
            deck.push({ suit, value });
        }
    }
    
    // 덱 섞기
    return shuffleDeck(deck);
}

// 덱 섞기
function shuffleDeck(deck) {
    // 피셔-예이츠 셔플 알고리즘
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    return deck;
}

// 카드 뽑기
function drawCard() {
    return gameState.blackjack.deck.pop();
}

// 슬롯 머신 게임 초기화 및 표시
function initSlotGame() {
    // 게임 섹션 초기화
    hideAllGameSections();
    
    // 현재 게임 설정
    gameState.currentGame = 'slot';
    
    // 슬롯 게임 상태 초기화
    gameState.slot = {
        bet: 500,
        reels: [0, 0, 0],
        spinning: false
    };
    
    // 게임 화면 생성
    elements.slotGame.innerHTML = `
        <h2>슬롯 머신</h2>
        <div class="bet-controls">
            <button id="slot-decrease-bet-btn" class="bet-btn">- 베팅</button>
            <div id="slot-bet-amount" class="bet-amount">${formatMoney(gameState.slot.bet)}원</div>
            <button id="slot-increase-bet-btn" class="bet-btn">+ 베팅</button>
        </div>
        
        <div class="slot-machine">
            <div class="slot-reel" id="slot-reel-0">
                <div class="slot-symbol">🍒</div>
            </div>
            <div class="slot-reel" id="slot-reel-1">
                <div class="slot-symbol">🍎</div>
            </div>
            <div class="slot-reel" id="slot-reel-2">
                <div class="slot-symbol">🍋</div>
            </div>
        </div>
        
        <div class="slot-controls">
            <button id="spin-btn" class="spin-btn">돌리기!</button>
        </div>
        
        <div id="slot-result" class="game-result"></div>
        
        <div class="payout-table">
            <h3>배당률</h3>
            <table>
                <tr>
                    <td>🍒 🍒 🍒</td>
                    <td>x3</td>
                </tr>
                <tr>
                    <td>🍎 🍎 🍎</td>
                    <td>x5</td>
                </tr>
                <tr>
                    <td>🍋 🍋 🍋</td>
                    <td>x8</td>
                </tr>
                <tr>
                    <td>💎 💎 💎</td>
                    <td>x10</td>
                </tr>
                <tr>
                    <td>🎰 🎰 🎰</td>
                    <td>x50</td>
                </tr>
            </table>
        </div>
        
        <button id="slot-back-to-lobby-btn" class="secondary-btn">로비로 돌아가기</button>
    `;
    
    // 이벤트 리스너 설정
    document.getElementById('spin-btn').addEventListener('click', spinSlotMachine);
    document.getElementById('slot-back-to-lobby-btn').addEventListener('click', showLobby);
    document.getElementById('slot-decrease-bet-btn').addEventListener('click', () => {
        changeSlotBet(-100);
    });
    document.getElementById('slot-increase-bet-btn').addEventListener('click', () => {
        changeSlotBet(100);
    });
    
    // 슬롯 게임 섹션 표시
    elements.slotGame.classList.remove('hidden');
}

// 슬롯 베팅 금액 변경
function changeSlotBet(amount) {
    // 스핀 중에는 베팅 변경 불가
    if (gameState.slot.spinning) return;
    
    // 새 베팅 금액 계산
    const newBet = Math.max(100, gameState.slot.bet + amount);
    
    // 소지금 초과 검사
    if (newBet > gameState.player.money) {
        showNotification('소지금을 초과하여 베팅할 수 없습니다.');
        return;
    }
    
    // 베팅 금액 업데이트
    gameState.slot.bet = newBet;
    document.getElementById('slot-bet-amount').textContent = formatMoney(newBet) + '원';
}

// 슬롯 머신 스핀
function spinSlotMachine() {
    // 이미 스핀 중이면 무시
    if (gameState.slot.spinning) return;
    
    // 베팅 금액 확인
    if (gameState.player.money < gameState.slot.bet) {
        showNotification('소지금이 부족합니다.');
        return;
    }
    
    // 베팅 금액만큼 소지금 차감
    updateMoney(-gameState.slot.bet);
    
    // 스핀 상태로 변경
    gameState.slot.spinning = true;
    
    // 스핀 버튼 비활성화
    document.getElementById('spin-btn').disabled = true;
    document.getElementById('slot-decrease-bet-btn').disabled = true;
    document.getElementById('slot-increase-bet-btn').disabled = true;
    
    // 결과 초기화
    document.getElementById('slot-result').textContent = '';
    
    // 슬롯 심볼 (이모지)
    const symbols = ['🍒', '🍎', '🍋', '💎', '🎰'];
    
    // 릴 회전 애니메이션
    let spinDuration = 0;
    
    // 각 릴마다 다른 시간으로 회전
    for (let i = 0; i < 3; i++) {
        spinDuration = 1000 + (i * 500); // 첫 번째 릴은 1초, 두 번째는 1.5초, 세 번째는 2초
        
        // 릴 회전 시작
        animateSlotReel(i, symbols, spinDuration);
    }
    
    // 모든 릴이 정지한 후 결과 처리 (가장 긴 스핀 시간 + 약간의 추가 시간)
    setTimeout(() => {
        // 결과 계산
        calculateSlotResult(symbols);
        
        // 스핀 완료
        gameState.slot.spinning = false;
        
        // 버튼 다시 활성화
        document.getElementById('spin-btn').disabled = false;
        document.getElementById('slot-decrease-bet-btn').disabled = false;
        document.getElementById('slot-increase-bet-btn').disabled = false;
    }, spinDuration + 100);
}

// 슬롯 릴 애니메이션
function animateSlotReel(reelIndex, symbols, duration) {
    const reelElement = document.getElementById(`slot-reel-${reelIndex}`);
    const symbolElement = reelElement.querySelector('.slot-symbol');
    
    // 최종 결과 (랜덤)
    const finalSymbolIndex = Math.floor(Math.random() * symbols.length);
    gameState.slot.reels[reelIndex] = finalSymbolIndex;
    
    // 애니메이션 시작 시간
    const startTime = Date.now();
    
    // 애니메이션 함수
    function update() {
        // 경과 시간 계산
        const elapsed = Date.now() - startTime;
        
        // 애니메이션 진행률 (0~1)
        const progress = Math.min(elapsed / duration, 1);
        
        // 릴이 감속하는 효과 (easeOut)
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        
        // 현재 회전 횟수 (10회에서 0회로 감소)
        const rotations = 10 * (1 - easedProgress);
        
        // 현재 심볼 인덱스 계산
        const currentIndex = Math.floor((rotations % 1) * symbols.length);
        
        // 애니메이션 진행 중이면 랜덤 심볼 표시
        if (progress < 1) {
            symbolElement.textContent = symbols[currentIndex];
            requestAnimationFrame(update);
        }
        // 애니메이션 종료 시 최종 심볼 표시
        else {
            symbolElement.textContent = symbols[finalSymbolIndex];
        }
    }
    
    // 애니메이션 시작
    update();
}

// 슬롯 결과 계산
function calculateSlotResult(symbols) {
    // 각 릴의 심볼
    const reelSymbols = gameState.slot.reels.map(index => symbols[index]);
    
    // 결과 메시지
    let resultText = '';
    let winnings = 0;
    
    // 모든 심볼이 같은지 확인
    if (reelSymbols[0] === reelSymbols[1] && reelSymbols[1] === reelSymbols[2]) {
        // 심볼에 따른 배당 계산
        let multiplier = 1;
        
        switch (reelSymbols[0]) {
            case '🍒': multiplier = 3; break;   // 체리 (x3)
            case '🍎': multiplier = 5; break;   // 사과 (x5)
            case '🍋': multiplier = 8; break;   // 레몬 (x8)
            case '💎': multiplier = 10; break;  // 다이아몬드 (x10)
            case '🎰': multiplier = 50; break;  // 잭팟 (x50)
        }
        
        // 상금 계산
        winnings = gameState.slot.bet * multiplier;
        
        // 상금 지급
        updateMoney(winnings);
        
        // 결과 메시지
        resultText = `축하합니다! ${reelSymbols[0]} ${reelSymbols[1]} ${reelSymbols[2]} - ${multiplier}배! ${formatMoney(winnings)}원을 획득했습니다!`;
    } else {
        resultText = `아쉽네요... 다음 기회에! ${reelSymbols[0]} ${reelSymbols[1]} ${reelSymbols[2]}`;
    }
    
    // 결과 표시
    document.getElementById('slot-result').textContent = resultText;
}

// 룰렛 게임 초기화 및 표시
function initRouletteGame() {
    // 게임 섹션 초기화
    hideAllGameSections();
    
    // 현재 게임 설정
    gameState.currentGame = 'roulette';
    
    // 룰렛 게임 상태 초기화
    gameState.roulette = {
        bet: 1000,
        bets: [],  // {type, number, amount} 형식으로 베팅 정보 저장
        spinning: false,
        result: null
    };
    
    // 게임 화면 생성
    elements.rouletteGame.innerHTML = `
        <h2>룰렛</h2>
        <div class="roulette-wheel-container">
            <div id="roulette-wheel" class="roulette-wheel">
                <div class="roulette-center"></div>
            </div>
            <div class="roulette-marker"></div>
        </div>
        
        <div class="bet-controls">
            <button id="roulette-decrease-bet-btn" class="bet-btn">- 베팅</button>
            <div id="roulette-bet-amount" class="bet-amount">${formatMoney(gameState.roulette.bet)}원</div>
            <button id="roulette-increase-bet-btn" class="bet-btn">+ 베팅</button>
        </div>
        
        <div class="roulette-betting-table" id="roulette-betting-table">
            <!-- 0 -->
            <div class="bet-cell green" data-bet="number" data-number="0">0</div>
            
            <!-- 1-36 -->
            <div class="bet-cell red" data-bet="number" data-number="1">1</div>
            <div class="bet-cell black" data-bet="number" data-number="2">2</div>
            <div class="bet-cell red" data-bet="number" data-number="3">3</div>
            <div class="bet-cell black" data-bet="number" data-number="4">4</div>
            <div class="bet-cell red" data-bet="number" data-number="5">5</div>
            <div class="bet-cell black" data-bet="number" data-number="6">6</div>
            <div class="bet-cell red" data-bet="number" data-number="7">7</div>
            <div class="bet-cell black" data-bet="number" data-number="8">8</div>
            <div class="bet-cell red" data-bet="number" data-number="9">9</div>
            <div class="bet-cell black" data-bet="number" data-number="10">10</div>
            <div class="bet-cell black" data-bet="number" data-number="11">11</div>
            <div class="bet-cell red" data-bet="number" data-number="12">12</div>
            <div class="bet-cell black" data-bet="number" data-number="13">13</div>
            <div class="bet-cell red" data-bet="number" data-number="14">14</div>
            <div class="bet-cell black" data-bet="number" data-number="15">15</div>
            <div class="bet-cell red" data-bet="number" data-number="16">16</div>
            <div class="bet-cell black" data-bet="number" data-number="17">17</div>
            <div class="bet-cell red" data-bet="number" data-number="18">18</div>
            <div class="bet-cell red" data-bet="number" data-number="19">19</div>
            <div class="bet-cell black" data-bet="number" data-number="20">20</div>
            <div class="bet-cell red" data-bet="number" data-number="21">21</div>
            <div class="bet-cell black" data-bet="number" data-number="22">22</div>
            <div class="bet-cell red" data-bet="number" data-number="23">23</div>
            <div class="bet-cell black" data-bet="number" data-number="24">24</div>
            <div class="bet-cell red" data-bet="number" data-number="25">25</div>
            <div class="bet-cell black" data-bet="number" data-number="26">26</div>
            <div class="bet-cell red" data-bet="number" data-number="27">27</div>
            <div class="bet-cell black" data-bet="number" data-number="28">28</div>
            <div class="bet-cell black" data-bet="number" data-number="29">29</div>
            <div class="bet-cell red" data-bet="number" data-number="30">30</div>
            <div class="bet-cell black" data-bet="number" data-number="31">31</div>
            <div class="bet-cell red" data-bet="number" data-number="32">32</div>
            <div class="bet-cell black" data-bet="number" data-number="33">33</div>
            <div class="bet-cell red" data-bet="number" data-number="34">34</div>
            <div class="bet-cell black" data-bet="number" data-number="35">35</div>
            <div class="bet-cell red" data-bet="number" data-number="36">36</div>
            
            <!-- 특수 베팅 -->
            <div class="bet-cell" data-bet="color" data-color="red">빨강</div>
            <div class="bet-cell" data-bet="color" data-color="black">검정</div>
            <div class="bet-cell" data-bet="parity" data-parity="even">짝수</div>
            <div class="bet-cell" data-bet="parity" data-parity="odd">홀수</div>
            <div class="bet-cell" data-bet="range" data-range="low">1-18</div>
            <div class="bet-cell" data-bet="range" data-range="high">19-36</div>
        </div>
        
        <div class="active-bets" id="active-bets">
            <h3>현재 베팅</h3>
            <div id="bets-list"></div>
            <div id="total-bet">총 베팅: 0원</div>
        </div>
        
        <div class="roulette-controls">
            <button id="spin-roulette-btn" class="primary-btn">룰렛 돌리기</button>
            <button id="clear-bets-btn" class="secondary-btn">베팅 초기화</button>
            <button id="roulette-back-to-lobby-btn" class="secondary-btn">로비로 돌아가기</button>
        </div>
        
        <div id="roulette-result" class="game-result"></div>
    `;
    
    // 이벤트 리스너 설정
    document.getElementById('spin-roulette-btn').addEventListener('click', spinRoulette);
    document.getElementById('clear-bets-btn').addEventListener('click', clearRouletteBets);
    document.getElementById('roulette-back-to-lobby-btn').addEventListener('click', showLobby);
    document.getElementById('roulette-decrease-bet-btn').addEventListener('click', () => {
        changeRouletteBet(-100);
    });
    document.getElementById('roulette-increase-bet-btn').addEventListener('click', () => {
        changeRouletteBet(100);
    });
    
    // 베팅 테이블 셀에 이벤트 리스너 추가
    document.querySelectorAll('#roulette-betting-table .bet-cell').forEach(cell => {
        cell.addEventListener('click', () => {
            placeBet(cell.dataset.bet, cell.dataset.number || cell.dataset.color || cell.dataset.parity || cell.dataset.range);
        });
    });
    
    // 룰렛 게임 섹션 표시
    elements.rouletteGame.classList.remove('hidden');
}

// 룰렛 베팅 금액 변경
function changeRouletteBet(amount) {
    // 스핀 중에는 베팅 변경 불가
    if (gameState.roulette.spinning) return;
    
    // 새 베팅 금액 계산
    const newBet = Math.max(100, gameState.roulette.bet + amount);
    
    // 소지금 초과 검사
    if (newBet > gameState.player.money) {
        showNotification('소지금을 초과하여 베팅할 수 없습니다.');
        return;
    }
    
    // 베팅 금액 업데이트
    gameState.roulette.bet = newBet;
    document.getElementById('roulette-bet-amount').textContent = formatMoney(newBet) + '원';
}

// 룰렛 베팅 배치
function placeBet(betType, value) {
    // 스핀 중에는 베팅 불가
    if (gameState.roulette.spinning) return;
    
    // 베팅 금액 확인
    if (gameState.player.money < gameState.roulette.bet) {
        showNotification('소지금이 부족합니다.');
        return;
    }
    
    // 베팅 금액만큼 소지금 차감
    updateMoney(-gameState.roulette.bet);
    
    // 베팅 정보 저장
    gameState.roulette.bets.push({
        type: betType,
        value: value,
        amount: gameState.roulette.bet
    });
    
    // 베팅 목록 업데이트
    updateBetsList();
}

// 룰렛 베팅 목록 업데이트
function updateBetsList() {
    const betsList = document.getElementById('bets-list');
    const totalBetElement = document.getElementById('total-bet');
    
    // 베팅 목록 초기화
    betsList.innerHTML = '';
    
    // 총 베팅 금액
    let totalBet = 0;
    
    // 베팅 목록 생성
    gameState.roulette.bets.forEach((bet, index) => {
        totalBet += bet.amount;
        
        // 베팅 항목 생성
        const betItem = document.createElement('div');
        betItem.className = 'bet-item';
        
        // 베팅 종류에 따른 텍스트 설정
        let betText = '';
        switch (bet.type) {
            case 'number':
                betText = `숫자 ${bet.value}`;
                break;
            case 'color':
                betText = `${bet.value === 'red' ? '빨강' : '검정'} 색상`;
                break;
            case 'parity':
                betText = `${bet.value === 'even' ? '짝수' : '홀수'}`;
                break;
            case 'range':
                betText = `${bet.value === 'low' ? '1-18' : '19-36'} 범위`;
                break;
        }
        
        betItem.innerHTML = `
            ${betText} - ${formatMoney(bet.amount)}원
            <button class="remove-bet-btn" data-index="${index}">X</button>
        `;
        
        // 베팅 제거 버튼 이벤트 추가
        betItem.querySelector('.remove-bet-btn').addEventListener('click', () => {
            removeBet(index);
        });
        
        betsList.appendChild(betItem);
    });
    
    // 총 베팅 금액 표시
    totalBetElement.textContent = `총 베팅: ${formatMoney(totalBet)}원`;
}

// 룰렛 베팅 제거
function removeBet(index) {
    // 스핀 중에는 베팅 제거 불가
    if (gameState.roulette.spinning) return;
    
    // 베팅 금액 환불
    updateMoney(gameState.roulette.bets[index].amount);
    
    // 베팅 제거
    gameState.roulette.bets.splice(index, 1);
    
    // 베팅 목록 업데이트
    updateBetsList();
}

// 룰렛 베팅 초기화
function clearRouletteBets() {
    // 스핀 중에는 베팅 초기화 불가
    if (gameState.roulette.spinning) return;
    
    // 모든 베팅 금액 환불
    gameState.roulette.bets.forEach(bet => {
        updateMoney(bet.amount);
    });
    
    // 베팅 초기화
    gameState.roulette.bets = [];
    
    // 베팅 목록 업데이트
    updateBetsList();
}

// 룰렛 스핀
function spinRoulette() {
    // 이미 스핀 중이면 무시
    if (gameState.roulette.spinning) return;
    
    // 베팅이 없으면 무시
    if (gameState.roulette.bets.length === 0) {
        showNotification('최소 하나 이상의 베팅이 필요합니다.');
        return;
    }
    
    // 스핀 상태로 변경
    gameState.roulette.spinning = true;
    
    // 버튼 비활성화
    document.getElementById('spin-roulette-btn').disabled = true;
    document.getElementById('clear-bets-btn').disabled = true;
    document.getElementById('roulette-decrease-bet-btn').disabled = true;
    document.getElementById('roulette-increase-bet-btn').disabled = true;
    
    // 결과 초기화
    document.getElementById('roulette-result').textContent = '';
    
    // 랜덤 결과 생성 (0-36)
    const result = Math.floor(Math.random() * 37);
    gameState.roulette.result = result;
    
    // 결과에 따른 회전 각도 계산
    // 룰렛 번호 순서는 실제 룰렛과 다를 수 있음
    const rotationAngle = 3600 + (result * 9.73); // 10번 회전 + 최종 결과 위치
    
    // 룰렛 회전 애니메이션
    const wheelElement = document.getElementById('roulette-wheel');
    wheelElement.style.transform = `rotate(${rotationAngle}deg)`;
    
    // 회전 완료 후 결과 처리 (애니메이션 시간과 동일)
    setTimeout(() => {
        // 결과 계산
        calculateRouletteResult(result);
        
        // 스핀 완료
        gameState.roulette.spinning = false;
        
        // 버튼 다시 활성화
        document.getElementById('spin-roulette-btn').disabled = false;
        document.getElementById('clear-bets-btn').disabled = false;
        document.getElementById('roulette-decrease-bet-btn').disabled = false;
        document.getElementById('roulette-increase-bet-btn').disabled = false;
        
        // 베팅 초기화
        gameState.roulette.bets = [];
        updateBetsList();
    }, 3000); // 애니메이션 시간 (3초)
}

// 룰렛 결과 계산
function calculateRouletteResult(result) {
    // 결과 번호의 특성 확인
    const isRed = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(result);
    const isBlack = !isRed && result !== 0;
    const isEven = result !== 0 && result % 2 === 0;
    const isOdd = result !== 0 && result % 2 !== 0;
    const isLow = result >= 1 && result <= 18;
    const isHigh = result >= 19 && result <= 36;
    
    // 총 상금
    let totalWinnings = 0;
    let winningBets = 0;
    
    // 각 베팅 확인
    gameState.roulette.bets.forEach(bet => {
        let won = false;
        let multiplier = 0;
        
        switch (bet.type) {
            case 'number':
                // 숫자 베팅은 정확히 일치해야 함 (배당 36배)
                if (parseInt(bet.value) === result) {
                    won = true;
                    multiplier = 36;
                }
                break;
                
            case 'color':
                // 색상 베팅 (배당 2배)
                if ((bet.value === 'red' && isRed) || (bet.value === 'black' && isBlack)) {
                    won = true;
                    multiplier = 2;
                }
                break;
                
            case 'parity':
                // 홀짝 베팅 (배당 2배)
                if ((bet.value === 'even' && isEven) || (bet.value === 'odd' && isOdd)) {
                    won = true;
                    multiplier = 2;
                }
                break;
                
            case 'range':
                // 범위 베팅 (배당 2배)
                if ((bet.value === 'low' && isLow) || (bet.value === 'high' && isHigh)) {
                    won = true;
                    multiplier = 2;
                }
                break;
        }
        
        // 상금 계산 및 지급
        if (won) {
            const winnings = bet.amount * multiplier;
            totalWinnings += winnings;
            winningBets++;
        }
    });
    
    // 최종 상금 지급
    if (totalWinnings > 0) {
        updateMoney(totalWinnings);
    }
    
    // 결과 텍스트
    let resultColor = '';
    if (result === 0) {
        resultColor = '초록(0)';
    } else if (isRed) {
        resultColor = '빨강';
    } else {
        resultColor = '검정';
    }
    
    let resultText = `결과: ${result} (${resultColor})`;
    
    if (winningBets > 0) {
        resultText += ` - 축하합니다! ${winningBets}개의 베팅이 적중하여 총 ${formatMoney(totalWinnings)}원을 획득했습니다!`;
    } else {
        resultText += ' - 아쉽게도 적중한 베팅이 없습니다.';
    }
    
    // 결과 표시
    document.getElementById('roulette-result').textContent = resultText;
}

// 간단한 포커 게임 초기화 및 표시
function initPokerGame() {
    // 게임 섹션 초기화
    hideAllGameSections();
    
    // 현재 게임 설정
    gameState.currentGame = 'poker';
    
    // 포커 게임 상태 초기화
    gameState.poker = {
        deck: createDeck(),
        playerHand: [],
        computerHands: [[], [], []],  // 3명의 컴퓨터 플레이어
        communityCards: [],
        playerChips: 10000,
        computerChips: [10000, 10000, 10000],
        pot: 0,
        currentBet: 0,
        stage: 'preflop',  // preflop, flop, turn, river, showdown
        currentPlayer: 0,  // 0: 플레이어, 1-3: 컴퓨터
        minBet: 100
    };
    
    // 게임 화면 생성
    elements.pokerGame.innerHTML = `
        <h2>텍사스 홀덤 포커</h2>
        
        <div class="poker-table">
            <div class="poker-players">
                <div class="poker-player">
                    <div class="poker-player-name">컴퓨터 1</div>
                    <div class="poker-player-chips" id="computer1-chips">${formatMoney(gameState.poker.computerChips[0])}원</div>
                    <div id="computer1-cards" class="card-container"></div>
                </div>
                <div class="poker-player">
                    <div class="poker-player-name">컴퓨터 2</div>
                    <div class="poker-player-chips" id="computer2-chips">${formatMoney(gameState.poker.computerChips[1])}원</div>
                    <div id="computer2-cards" class="card-container"></div>
                </div>
                <div class="poker-player">
                    <div class="poker-player-name">컴퓨터 3</div>
                    <div class="poker-player-chips" id="computer3-chips">${formatMoney(gameState.poker.computerChips[2])}원</div>
                    <div id="computer3-cards" class="card-container"></div>
                </div>
            </div>
            
            <div class="poker-pot" id="poker-pot">팟: 0원</div>
            
            <div class="poker-community-cards">
                <div class="hand-label">커뮤니티 카드</div>
                <div id="community-cards" class="card-container"></div>
            </div>
            
            <div class="poker-player">
                <div class="poker-player-name">나</div>
                <div class="poker-player-chips" id="player-chips">${formatMoney(gameState.poker.playerChips)}원</div>
                <div id="player-cards" class="card-container"></div>
            </div>
        </div>
        
        <div class="poker-controls">
            <div class="bet-controls">
                <button id="poker-decrease-bet-btn" class="bet-btn">- 베팅</button>
                <div id="poker-bet-amount" class="bet-amount">${formatMoney(gameState.poker.minBet)}원</div>
                <button id="poker-increase-bet-btn" class="bet-btn">+ 베팅</button>
            </div>
            
            <div class="poker-actions" id="poker-actions">
                <button id="poker-fold-btn" class="secondary-btn" disabled>폴드</button>
                <button id="poker-check-btn" class="primary-btn" disabled>체크</button>
                <button id="poker-call-btn" class="primary-btn" disabled>콜</button>
                <button id="poker-raise-btn" class="primary-btn" disabled>레이즈</button>
                <button id="poker-start-btn" class="primary-btn">게임 시작</button>
            </div>
        </div>
        
        <div id="poker-result" class="game-result"></div>
        
        <button id="poker-back-to-lobby-btn" class="secondary-btn">로비로 돌아가기</button>
    `;
    
    // 이벤트 리스너 설정
    document.getElementById('poker-start-btn').addEventListener('click', startPokerGame);
    document.getElementById('poker-fold-btn').addEventListener('click', foldPoker);
    document.getElementById('poker-check-btn').addEventListener('click', checkPoker);
    document.getElementById('poker-call-btn').addEventListener('click', callPoker);
    document.getElementById('poker-raise-btn').addEventListener('click', raisePoker);
    document.getElementById('poker-back-to-lobby-btn').addEventListener('click', showLobby);
    document.getElementById('poker-decrease-bet-btn').addEventListener('click', () => {
        changePokerBet(-100);
    });
    document.getElementById('poker-increase-bet-btn').addEventListener('click', () => {
        changePokerBet(100);
    });
    
    // 포커 게임 섹션 표시
    elements.pokerGame.classList.remove('hidden');
}

// 포커 베팅 금액 변경
function changePokerBet(amount) {
    // 게임 진행 중에만 베팅 변경 가능
    if (gameState.poker.stage === 'notStarted') return;
    
    // 새 베팅 금액 계산 (최소 베팅 이상)
    const newBet = Math.max(gameState.poker.minBet, gameState.poker.currentBet + amount);
    
    // 소지금 초과 검사
    if (newBet > gameState.poker.playerChips) {
        return;
    }
    
    // 베팅 금액 업데이트
    gameState.poker.currentBet = newBet;
    document.getElementById('poker-bet-amount').textContent = formatMoney(newBet) + '원';
}

// 포커 게임 시작
function startPokerGame() {
    // 게임이 이미 시작되었으면 무시
    if (gameState.poker.stage !== 'notStarted' && gameState.poker.stage !== 'showdown') {
        return;
    }
    
    // 게임 시작 버튼 숨기기
    document.getElementById('poker-start-btn').style.display = 'none';
    
    // 게임 결과 초기화
    document.getElementById('poker-result').textContent = '';
    
    // 게임 상태 초기화
    gameState.poker.deck = createDeck();
    gameState.poker.playerHand = [];
    gameState.poker.computerHands = [[], [], []];
    gameState.poker.communityCards = [];
    gameState.poker.pot = 0;
    gameState.poker.currentBet = gameState.poker.minBet;
    gameState.poker.stage = 'preflop';
    gameState.poker.currentPlayer = 0;
    
    // 베팅 금액 초기화
    document.getElementById('poker-bet-amount').
