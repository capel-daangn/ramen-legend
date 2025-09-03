// 게임 상태 관리
const gameState = {
    isPlaying: false,
    timeLeft: 120,  // 2분으로 증가
    score: 0,
    combo: 0,
    maxCombo: 0,
    successfulOrders: 0,
    orders: [],
    orderIdCounter: 1,
    selectedStation: null,
    stations: [
        { id: 0, status: 'empty', ingredients: [], startTime: null, cookingTime: 0 },
        { id: 1, status: 'empty', ingredients: [], startTime: null, cookingTime: 0 },
        { id: 2, status: 'empty', ingredients: [], startTime: null, cookingTime: 0 }
    ]
};

// 라면 레시피 정의
const recipes = [
    { name: '기본 라면', required: ['water', 'soup', 'noodles'], optional: [], time: 180 },
    { name: '계란 라면', required: ['water', 'soup', 'noodles', 'egg'], optional: [], time: 210 },
    { name: '만두 라면', required: ['water', 'soup', 'noodles', 'dumpling'], optional: [], time: 240 },
    { name: '치즈 라면', required: ['water', 'soup', 'noodles', 'cheese'], optional: [], time: 200 },
    { name: '파 듬뿍 라면', required: ['water', 'soup', 'noodles', 'greenOnion'], optional: [], time: 180 },
    { name: '스페셜 라면', required: ['water', 'soup', 'noodles', 'egg', 'cheese'], optional: ['greenOnion'], time: 240 },
    { name: '만두 치즈 라면', required: ['water', 'soup', 'noodles', 'dumpling', 'cheese'], optional: [], time: 260 }
];

// 재료 이름 매핑
const ingredientNames = {
    water: '물',
    soup: '스프',
    noodles: '면',
    egg: '계란',
    dumpling: '만두',
    cheese: '치즈',
    greenOnion: '파'
};

// 타이머 인터벌
let timerInterval = null;
let cookingIntervals = [];

// DOM 요소들
const elements = {
    timeLeft: document.getElementById('timeLeft'),
    currentScore: document.getElementById('currentScore'),
    combo: document.getElementById('combo'),
    comboCount: document.getElementById('comboCount'),
    orderList: document.getElementById('orderList'),
    stations: document.querySelectorAll('.station'),
    ingredientBtns: document.querySelectorAll('.ingredient-btn'),
    gameOverlay: document.getElementById('gameOverlay'),
    overlayTitle: document.getElementById('overlayTitle'),
    overlayMessage: document.getElementById('overlayMessage'),
    finalScore: document.getElementById('finalScore'),
    startGameBtn: document.getElementById('startGame')
};

// 게임 초기화
function initGame() {
    gameState.isPlaying = false;
    gameState.timeLeft = 120;
    gameState.score = 0;
    gameState.successfulOrders = 0;
    gameState.orders = [];
    gameState.orderIdCounter = 1;
    gameState.selectedStation = null;
    gameState.stations.forEach((station, index) => {
        station.status = 'empty';
        station.ingredients = [];
        station.startTime = null;
        station.cookingTime = 0;
        updateStationDisplay(index);
    });
    
    updateDisplay();
    elements.gameOverlay.classList.remove('hidden');
}

// 게임 시작
function startGame() {
    gameState.isPlaying = true;
    gameState.timeLeft = 120;
    gameState.score = 0;
    gameState.successfulOrders = 0;
    gameState.combo = 0;
    gameState.maxCombo = 0;
    gameState.orders = [];
    gameState.orderIdCounter = 1;
    
    elements.gameOverlay.classList.add('hidden');
    updateDisplay();
    
    // 타이머 시작
    timerInterval = setInterval(() => {
        gameState.timeLeft--;
        updateDisplay();
        
        if (gameState.timeLeft <= 0) {
            endGame();
        }
    }, 1000);
    
    // 첫 주문 생성
    setTimeout(generateOrder, 1000);
    
    // 조리 상태 업데이트
    cookingIntervals.forEach(interval => clearInterval(interval));
    cookingIntervals = [];
    
    cookingIntervals.push(setInterval(updateCookingStatus, 100));
}

// 게임 종료
function endGame() {
    gameState.isPlaying = false;
    clearInterval(timerInterval);
    cookingIntervals.forEach(interval => clearInterval(interval));
    
    // 랭킹 저장
    saveRanking(gameState.score);
    
    // 게임 결과 표시
    elements.overlayTitle.textContent = '게임 종료!';
    
    // 등급 판정
    let grade = '';
    if (gameState.score >= 500) grade = '🏆 라면 마스터!';
    else if (gameState.score >= 400) grade = '🥇 라면 전문가';
    else if (gameState.score >= 300) grade = '🥈 숙련된 요리사';
    else if (gameState.score >= 200) grade = '🥉 초보 요리사';
    else grade = '🍜 견습생';
    
    elements.overlayMessage.innerHTML = `
        <div style="font-size: 1.2em; margin-bottom: 10px;">${grade}</div>
        <div>성공한 주문: ${gameState.successfulOrders}개</div>
        <div>최대 콤보: ${gameState.maxCombo}연속</div>
        ${getRankingHTML()}
        <div style="margin-top: 15px;">
            <button onclick="shareScore()" style="
                padding: 10px 20px;
                background: linear-gradient(135deg, #4267B2 0%, #5B7EC7 100%);
                color: white;
                border: none;
                border-radius: 15px;
                font-weight: 600;
                cursor: pointer;
                margin-right: 10px;
            ">📱 공유하기</button>
            <button onclick="copyScoreLink()" style="
                padding: 10px 20px;
                background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
                color: white;
                border: none;
                border-radius: 15px;
                font-weight: 600;
                cursor: pointer;
            ">🔗 링크 복사</button>
        </div>
    `;
    
    elements.finalScore.innerHTML = `
        <div style="font-size: 2em; color: #ff6b6b;">🏆 ${gameState.score}점</div>
    `;
    
    elements.startGameBtn.textContent = '다시 도전!';
    elements.gameOverlay.classList.remove('hidden');
}

// 랭킹 저장
function saveRanking(score) {
    let rankings = JSON.parse(localStorage.getItem('ramenRankings') || '[]');
    const newEntry = {
        score: score,
        date: new Date().toLocaleString('ko-KR'),
        orders: gameState.successfulOrders,
        combo: gameState.maxCombo
    };
    
    rankings.push(newEntry);
    rankings.sort((a, b) => b.score - a.score);
    rankings = rankings.slice(0, 10); // 상위 10개만 보관
    
    localStorage.setItem('ramenRankings', JSON.stringify(rankings));
}

// 랭킹 HTML 생성
function getRankingHTML() {
    const rankings = JSON.parse(localStorage.getItem('ramenRankings') || '[]');
    if (rankings.length === 0) return '';
    
    const currentScoreRank = rankings.findIndex(r => r.score === gameState.score) + 1;
    
    let html = '<div style="margin-top: 20px; font-size: 0.9em;">';
    html += `<div style="font-weight: 600; margin-bottom: 8px;">🏆 최고 기록 TOP 5</div>`;
    
    rankings.slice(0, 5).forEach((rank, index) => {
        const isCurrent = rank.score === gameState.score && rank.orders === gameState.successfulOrders;
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        
        html += `<div style="padding: 3px 0; ${isCurrent ? 'color: #ff6b6b; font-weight: 600;' : 'color: #666;'}">`;
        html += `${medal} ${rank.score}점 (주문 ${rank.orders}개, 콤보 ${rank.combo})`;
        if (isCurrent) html += ' ← NEW!';
        html += `</div>`;
    });
    
    if (currentScoreRank > 5) {
        html += `<div style="padding: 3px 0; color: #999;">...당신의 순위: ${currentScoreRank}위</div>`;
    }
    
    html += '</div>';
    return html;
}

// 주문 생성
function generateOrder() {
    if (!gameState.isPlaying) return;
    
    const recipe = recipes[Math.floor(Math.random() * recipes.length)];
    const order = {
        id: gameState.orderIdCounter++,
        recipe: recipe,
        createdAt: Date.now(),
        timeLimit: recipe.time * 1000 // 밀리초로 변환
    };
    
    gameState.orders.push(order);
    displayOrder(order);
    
    // 다음 주문 생성 (3-8초 사이)
    const nextOrderTime = 3000 + Math.random() * 5000;
    setTimeout(generateOrder, nextOrderTime);
}

// 손님 아바타 배열
const customerAvatars = ['👨', '👩', '👴', '👵', '👦', '👧', '👨‍🦰', '👩‍🦰', '👱‍♂️', '👱‍♀️', '🧑', '👨‍🦱', '👩‍🦱'];

// 손님 피드백 메시지
const customerFeedback = {
    perfect: [ // 90-100점
        "와! 이건 예술이네요! 🤩",
        "인생 라면이에요! 다음에 또 올게요!",
        "헉... 이게 그 전설의 맛?!",
        "당근이님 천재 아니에요?",
        "이 맛... 눈물이 나네요 ㅠㅠ",
        "미슐랭 라면집 인정!",
        "완벽 그 자체! 감동했어요!",
        "우와... 말이 안 나와요...",
        "이런 라면은 처음이야!",
        "당근이님 최고! 👏"
    ],
    great: [ // 70-89점
        "맛있어요! 잘 먹었습니다!",
        "오~ 꽤 괜찮네요!",
        "역시 당근이네 라면!",
        "든든하고 좋아요~",
        "이 정도면 만족!",
        "라면 맛집 인정~",
        "좋아요! 굿굿!",
        "배부르고 맛있어요!",
        "또 오고 싶네요!"
    ],
    good: [ // 50-69점
        "무난하게 먹을만해요",
        "나쁘지 않네요",
        "그럭저럭 괜찮아요",
        "배는 부르네요",
        "평범한 맛이에요",
        "먹을만 해요~"
    ],
    bad: [ // 50점 미만
        "음... 좀 아쉬워요",
        "다음엔 더 잘 부탁해요",
        "에... 이건 좀...",
        "배고파서 먹긴 하는데...",
        "좀 더 신경써주세요 ㅠㅠ"
    ]
};

// 주문 표시
function displayOrder(order) {
    const orderElement = document.createElement('div');
    orderElement.className = 'order';
    orderElement.id = `order-${order.id}`;
    
    const ingredients = [...order.recipe.required, ...order.recipe.optional];
    const ingredientList = ingredients.map(ing => ingredientNames[ing]).join(', ');
    const customerAvatar = customerAvatars[Math.floor(Math.random() * customerAvatars.length)];
    
    orderElement.innerHTML = `
        <div class="order-header">
            <span class="order-customer">${customerAvatar}</span>
            <span class="order-number">주문 #${order.id}</span>
            <span class="order-time">${Math.floor(order.recipe.time)}초</span>
        </div>
        <div class="order-name">${order.recipe.name}</div>
        <div class="order-items">
            ${ingredients.map(ing => `<span class="order-item">${ingredientNames[ing]}</span>`).join('')}
        </div>
    `;
    
    elements.orderList.appendChild(orderElement);
    
    // 시간 경과에 따른 긴급 표시
    setTimeout(() => {
        if (document.getElementById(`order-${order.id}`)) {
            orderElement.classList.add('urgent');
        }
    }, order.timeLimit * 0.7);
}

// 화구 선택
elements.stations.forEach((station, index) => {
    station.addEventListener('click', () => {
        if (gameState.isPlaying) {
            elements.stations.forEach(s => s.classList.remove('selected'));
            station.classList.add('selected');
            gameState.selectedStation = index;
        }
    });
});

// 재료 추가
elements.ingredientBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (!gameState.isPlaying || gameState.selectedStation === null) return;
        
        const station = gameState.stations[gameState.selectedStation];
        if (station.status !== 'empty' && station.status !== 'preparing') return;
        
        const ingredient = btn.dataset.ingredient;
        if (!station.ingredients.includes(ingredient)) {
            station.ingredients.push(ingredient);
            station.status = 'preparing';
            updateStationDisplay(gameState.selectedStation);
        }
    });
});

// 화구별 조리 시작 버튼
document.querySelectorAll('.cook-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const stationIndex = parseInt(btn.dataset.station);
        if (!gameState.isPlaying) return;
        
        const station = gameState.stations[stationIndex];
        if (station.status !== 'preparing' || station.ingredients.length === 0) return;
        
        // 기본 재료 체크
        if (!station.ingredients.includes('water') || 
            !station.ingredients.includes('soup') || 
            !station.ingredients.includes('noodles')) {
            showMessage('물, 스프, 면은 필수입니다!');
            return;
        }
        
        station.status = 'cooking';
        station.startTime = Date.now();
        station.cookingTime = 0;
        updateStationDisplay(stationIndex);
    });
});

// 화구별 서빙 버튼
document.querySelectorAll('.serve-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const stationIndex = parseInt(btn.dataset.station);
        if (!gameState.isPlaying) return;
        
        const station = gameState.stations[stationIndex];
        if (station.status !== 'cooking') return;
    
    // 주문과 매칭
    const matchingOrder = findMatchingOrder(station.ingredients);
    if (matchingOrder) {
        const timeTaken = Date.now() - matchingOrder.createdAt;
        const score = calculateScore(matchingOrder, timeTaken, station.cookingTime);
        
        // 콤보 처리
        gameState.combo++;
        gameState.successfulOrders++;
        if (gameState.combo > gameState.maxCombo) {
            gameState.maxCombo = gameState.combo;
        }
        
        // 콤보 보너스 점수
        const comboBonus = Math.floor(score * (gameState.combo - 1) * 0.1);
        const totalScore = score + comboBonus;
        
        gameState.score += totalScore;
        
        // 손님 피드백 표시
        showCustomerFeedback(totalScore, matchingOrder);
        showScorePopup(totalScore, gameState.combo);
        updateComboDisplay();
        
        // 주문 제거
        const orderIndex = gameState.orders.findIndex(o => o.id === matchingOrder.id);
        gameState.orders.splice(orderIndex, 1);
        document.getElementById(`order-${matchingOrder.id}`).remove();
    } else {
        showMessage('일치하는 주문이 없습니다!');
        gameState.score = Math.max(0, gameState.score - 10);
        gameState.combo = 0;
        updateComboDisplay();
    }
        
        // 화구 초기화
        resetStation(stationIndex);
    });
});

// 화구별 버리기 버튼
document.querySelectorAll('.discard-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const stationIndex = parseInt(btn.dataset.station);
        if (!gameState.isPlaying) return;
        
        const station = gameState.stations[stationIndex];
        if (station.status === 'empty') return;
        
        resetStation(stationIndex);
        gameState.score = Math.max(0, gameState.score - 5);
        updateDisplay();
    });
});

// 주문 매칭 찾기
function findMatchingOrder(ingredients) {
    for (const order of gameState.orders) {
        const required = order.recipe.required;
        const hasAllRequired = required.every(ing => ingredients.includes(ing));
        
        if (hasAllRequired) {
            // 추가 재료 체크
            const extraIngredients = ingredients.filter(ing => 
                !required.includes(ing) && ing !== 'water' && ing !== 'soup' && ing !== 'noodles'
            );
            const optionalMatch = order.recipe.optional.length === 0 || 
                                 extraIngredients.every(ing => order.recipe.optional.includes(ing));
            
            if (ingredients.length === required.length + extraIngredients.length && optionalMatch) {
                return order;
            }
        }
    }
    return null;
}

// 점수 계산
function calculateScore(order, timeTaken, cookingTime) {
    let score = 100;
    
    // 시간 기반 점수
    const timeRatio = timeTaken / order.timeLimit;
    if (timeRatio > 1.2) {
        score -= 30; // 너무 늦음
    } else if (timeRatio > 1) {
        score -= 20; // 조금 늦음
    } else if (timeRatio < 0.5) {
        score -= 10; // 너무 빠름
    }
    
    // 조리 시간 기반 점수 (10-15초가 최적)
    const optimalCookingTime = 12500; // 12.5초
    const cookingDiff = Math.abs(cookingTime - optimalCookingTime);
    if (cookingDiff > 5000) {
        score -= 20;
    } else if (cookingDiff > 2500) {
        score -= 10;
    }
    
    return Math.max(10, score);
}

// 화구 초기화
function resetStation(stationIndex) {
    const station = gameState.stations[stationIndex];
    station.status = 'empty';
    station.ingredients = [];
    station.startTime = null;
    station.cookingTime = 0;
    updateStationDisplay(stationIndex);
}

// 화구 디스플레이 업데이트
function updateStationDisplay(stationIndex) {
    const station = gameState.stations[stationIndex];
    const stationElement = elements.stations[stationIndex];
    const pot = stationElement.querySelector('.pot');
    const waterLevel = pot.querySelector('.water-level');
    const noodles = pot.querySelector('.noodles');
    const toppings = pot.querySelector('.toppings');
    const statusText = stationElement.querySelector('.cookingStatus');
    const progressBar = stationElement.querySelector('.progressBar');
    
    // 상태 텍스트
    if (station.status === 'empty') {
        statusText.textContent = '비어있음';
        statusText.style.color = '#718096';
        statusText.style.fontSize = '0.7em';
    } else if (station.status === 'preparing') {
        statusText.textContent = '준비 중';
        statusText.style.color = '#4299e1';
        statusText.style.fontSize = '0.7em';
    } else if (station.status === 'cooking') {
        const cookingSeconds = Math.floor(station.cookingTime / 1000);
        
        // 과조리 상태 표시
        if (station.cookingTime > 15000) {
            statusText.textContent = `⚠️ 타고 있음! (${cookingSeconds}초)`;
            statusText.style.color = '#e53e3e';
            statusText.style.fontWeight = 'bold';
        } else if (station.cookingTime > 10000) {
            statusText.textContent = `조리 완료! (${cookingSeconds}초)`;
            statusText.style.color = '#38a169';
            statusText.style.fontWeight = 'bold';
        } else {
            statusText.textContent = `조리 중 (${cookingSeconds}초)`;
            statusText.style.color = '#718096';
            statusText.style.fontWeight = 'normal';
        }
    }
    
    // 물 표시
    if (station.ingredients.includes('water')) {
        waterLevel.style.height = '60%';
    } else {
        waterLevel.style.height = '0';
    }
    
    // 면 표시
    if (station.ingredients.includes('noodles')) {
        noodles.style.display = 'block';
    } else {
        noodles.style.display = 'none';
    }
    
    // 토핑 표시
    const toppingEmojis = [];
    if (station.ingredients.includes('soup')) toppingEmojis.push('🍲');
    if (station.ingredients.includes('egg')) toppingEmojis.push('🥚');
    if (station.ingredients.includes('dumpling')) toppingEmojis.push('🥟');
    if (station.ingredients.includes('cheese')) toppingEmojis.push('🧀');
    if (station.ingredients.includes('greenOnion')) toppingEmojis.push('🌿');
    toppings.textContent = toppingEmojis.join('');
    
    // 준비 중일 때도 추가된 재료 목록 표시
    if (station.status === 'preparing' && station.ingredients.length > 0) {
        const addedIngredients = station.ingredients.map(ing => ingredientNames[ing]).join(', ');
        statusText.textContent = `준비: ${addedIngredients}`;
        statusText.style.fontSize = '0.65em';
    }
    
    // 진행 바
    if (station.status === 'cooking') {
        const progress = Math.min(100, (station.cookingTime / 15000) * 100);
        progressBar.style.width = `${progress}%`;
        
        // 과조리 경고
        if (progress > 80) {
            progressBar.style.background = 'linear-gradient(90deg, #f56565 0%, #e53e3e 100%)';
        } else {
            progressBar.style.background = 'linear-gradient(90deg, #48bb78 0%, #38a169 100%)';
        }
    } else {
        progressBar.style.width = '0';
    }
}

// 조리 상태 업데이트
function updateCookingStatus() {
    if (!gameState.isPlaying) return;
    
    gameState.stations.forEach((station, index) => {
        if (station.status === 'cooking') {
            station.cookingTime = Date.now() - station.startTime;
            updateStationDisplay(index);
            
            // 과조리 체크 (20초 이상 자동 폐기)
            if (station.cookingTime > 20000) {
                // 자동 폐기
                resetStation(index);
                gameState.score = Math.max(0, gameState.score - 15);
                showMessage('라면이 타서 폐기되었습니다!');
                updateDisplay();
            }
        }
    });
}

// 디스플레이 업데이트
function updateDisplay() {
    elements.timeLeft.textContent = gameState.timeLeft;
    elements.currentScore.textContent = gameState.score;
}

// 메시지 표시
function showMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'completed-order';
    messageElement.textContent = message;
    document.body.appendChild(messageElement);
    
    setTimeout(() => {
        messageElement.remove();
    }, 2000);
}

// 손님 피드백 표시
function showCustomerFeedback(score, order) {
    const feedbackElement = document.createElement('div');
    feedbackElement.className = 'customer-feedback';
    
    // 점수에 따른 별점 및 피드백 선택
    let stars, feedbackArray;
    if (score >= 90) {
        stars = 5;
        feedbackArray = customerFeedback.perfect;
    } else if (score >= 80) {
        stars = 4;
        feedbackArray = customerFeedback.great;
    } else if (score >= 70) {
        stars = 3;
        feedbackArray = customerFeedback.great;
    } else if (score >= 50) {
        stars = 2;
        feedbackArray = customerFeedback.good;
    } else {
        stars = 1;
        feedbackArray = customerFeedback.bad;
    }
    
    const feedback = feedbackArray[Math.floor(Math.random() * feedbackArray.length)];
    const orderElement = document.getElementById(`order-${order.id}`);
    const customerEmoji = orderElement ? orderElement.querySelector('.order-customer').textContent : '😊';
    
    // 별점 생성
    let starRating = '';
    for (let i = 0; i < 5; i++) {
        starRating += i < stars ? '⭐' : '☆';
    }
    
    feedbackElement.innerHTML = `
        <div class="feedback-customer">${customerEmoji}</div>
        <div class="feedback-content">
            <div class="feedback-stars">${starRating}</div>
            <div class="feedback-message">${feedback}</div>
        </div>
    `;
    
    // 피드백 섹션에 추가
    const feedbackSection = document.getElementById('feedbackSection');
    feedbackSection.innerHTML = ''; // 이전 피드백 제거
    feedbackSection.appendChild(feedbackElement);
    
    setTimeout(() => {
        feedbackElement.classList.add('fade-out');
        setTimeout(() => {
            feedbackElement.remove();
        }, 500);
    }, 3000);
}

// 점수 팝업 표시
function showScorePopup(score, combo) {
    const popup = document.createElement('div');
    popup.className = 'completed-order score-popup';
    
    let emoji = '😊';
    if (score >= 90) emoji = '🎉';
    else if (score >= 70) emoji = '👍';
    else if (score >= 50) emoji = '😐';
    else emoji = '😅';
    
    let comboText = '';
    if (combo > 1) {
        comboText = `<div style="font-size: 0.8em; color: #ff6b6b;">콤보 x${combo}!</div>`;
    }
    
    popup.innerHTML = `${emoji} +${score}점!${comboText}`;
    document.body.appendChild(popup);
    
    setTimeout(() => {
        popup.remove();
    }, 2000);
}

// 콤보 표시 업데이트
function updateComboDisplay() {
    if (gameState.combo > 1) {
        elements.combo.style.display = 'block';
        elements.comboCount.textContent = gameState.combo;
        elements.combo.classList.add('combo-active');
    } else {
        elements.combo.style.display = 'none';
        elements.combo.classList.remove('combo-active');
    }
}


// 점수 공유 기능
function shareScore() {
    const score = gameState.score;
    const grade = score >= 500 ? '라면 마스터' : 
                  score >= 400 ? '라면 전문가' :
                  score >= 300 ? '숙련된 요리사' :
                  score >= 200 ? '초보 요리사' : '견습생';
    
    const text = `🍜 당근이의 라면가게에서 ${score}점 달성!\n등급: ${grade}\n성공 주문: ${gameState.successfulOrders}개\n최대 콤보: ${gameState.maxCombo}연속\n\n당신도 도전해보세요!`;
    
    if (navigator.share) {
        navigator.share({
            title: '당근이의 라면가게 - 내 점수',
            text: text,
            url: window.location.href
        }).catch(err => console.log('공유 취소됨'));
    } else {
        // Web Share API를 지원하지 않는 경우
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
        window.open(shareUrl, '_blank');
    }
}

// 링크 복사 기능
function copyScoreLink() {
    const score = gameState.score;
    const text = `🍜 당근이의 라면가게에서 ${score}점 달성! 당신도 도전해보세요! ${window.location.href}`;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showMessage('링크가 복사되었습니다! 📋');
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

// 클립보드 복사 대체 방법
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showMessage('링크가 복사되었습니다! 📋');
    } catch (err) {
        showMessage('복사 실패. 수동으로 복사해주세요.');
    }
    
    document.body.removeChild(textArea);
}

// window 객체에 함수 등록 (onclick에서 호출하기 위함)
window.shareScore = shareScore;
window.copyScoreLink = copyScoreLink;

// 게임 시작 버튼 이벤트
elements.startGameBtn.addEventListener('click', startGame);

// 초기화
initGame();