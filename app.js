// ==================== STATE ====================
var REQUIRED_ITEMS = 3;
var APP_VERSION = '3';
var CREEP_TIME = 15; // seconds for Swiper timer
var MAX_ATTEMPTS = 5;
var regSelectedItems = [];
var loginSelectedItems = [];
var currentLoginUser = null;
var failedAttempts = 0;
var creepInterval = null;
var creepTimeLeft = CREEP_TIME;
var audioCtx = null;

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', function () {
    clearStaleData();
    injectCharacterSVGs();
    renderItemGrids();
    createStarryBackground();
    initSparkleCanvas();
    checkExistingSession();
});

// ==================== AUDIO (Web Audio API - no files) ====================
function getAudioCtx() {
    if (!audioCtx) {
        try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* silent */ }
    }
    return audioCtx;
}

function playTone(freq, duration, type, volume) {
    var ctx = getAudioCtx();
    if (!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.value = volume || 0.15;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
}

function sfxClick() { playTone(600, 0.08, 'sine', 0.1); }
function sfxSelect() { playTone(800, 0.12, 'triangle', 0.12); }
function sfxDeselect() { playTone(400, 0.08, 'triangle', 0.08); }
function sfxSuccess() {
    playTone(523, 0.15, 'sine', 0.15);
    setTimeout(function () { playTone(659, 0.15, 'sine', 0.15); }, 150);
    setTimeout(function () { playTone(784, 0.15, 'sine', 0.15); }, 300);
    setTimeout(function () { playTone(1047, 0.3, 'sine', 0.18); }, 450);
}
function sfxFail() {
    playTone(300, 0.2, 'sawtooth', 0.12);
    setTimeout(function () { playTone(200, 0.3, 'sawtooth', 0.12); }, 200);
}
function sfxAlert() {
    playTone(880, 0.1, 'square', 0.08);
    setTimeout(function () { playTone(880, 0.1, 'square', 0.08); }, 200);
}
function sfxTick() { playTone(1000, 0.03, 'sine', 0.06); }
function sfxUrgent() { playTone(600, 0.06, 'square', 0.1); setTimeout(function () { playTone(800, 0.06, 'square', 0.1); }, 80); }

// ==================== SPARKLE TRAIL ====================
var sparkles = [];
var sparkleCanvas, sparkleCtxDraw;

function initSparkleCanvas() {
    sparkleCanvas = document.getElementById('sparkleCanvas');
    if (!sparkleCanvas) return;
    sparkleCtxDraw = sparkleCanvas.getContext('2d');
    resizeSparkle();
    window.addEventListener('resize', resizeSparkle);
    document.addEventListener('mousemove', function (e) {
        for (var i = 0; i < 2; i++) {
            sparkles.push({
                x: e.clientX, y: e.clientY,
                vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3 - 1,
                life: 1,
                color: ['#FF6B9D', '#F1C40F', '#3498DB', '#8E44AD', '#E67E22'][Math.floor(Math.random() * 5)],
                size: Math.random() * 3 + 1.5
            });
        }
    });
    requestAnimationFrame(drawSparkles);
}

function resizeSparkle() {
    if (!sparkleCanvas) return;
    sparkleCanvas.width = window.innerWidth;
    sparkleCanvas.height = window.innerHeight;
}

function drawSparkles() {
    if (!sparkleCtxDraw) { requestAnimationFrame(drawSparkles); return; }
    sparkleCtxDraw.clearRect(0, 0, sparkleCanvas.width, sparkleCanvas.height);
    for (var i = sparkles.length - 1; i >= 0; i--) {
        var s = sparkles[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.025;
        if (s.life <= 0) { sparkles.splice(i, 1); continue; }
        sparkleCtxDraw.globalAlpha = s.life;
        sparkleCtxDraw.fillStyle = s.color;
        sparkleCtxDraw.beginPath();
        // draw star shape
        var r = s.size * s.life;
        for (var j = 0; j < 5; j++) {
            var angle = (j * 4 * Math.PI / 5) - Math.PI / 2;
            var method = j === 0 ? 'moveTo' : 'lineTo';
            sparkleCtxDraw[method](s.x + r * Math.cos(angle), s.y + r * Math.sin(angle));
        }
        sparkleCtxDraw.closePath();
        sparkleCtxDraw.fill();
    }
    sparkleCtxDraw.globalAlpha = 1;
    requestAnimationFrame(drawSparkles);
}

// ==================== DATA MIGRATION ====================
function clearStaleData() {
    if (localStorage.getItem('doraAppVersion') !== APP_VERSION) {
        localStorage.removeItem('doraUsers');
        localStorage.removeItem('doraSession');
        localStorage.setItem('doraAppVersion', APP_VERSION);
    }
}

function isValidUser(user) {
    return user
        && typeof user.username === 'string'
        && typeof user.chant === 'string'
        && Array.isArray(user.items)
        && user.items.length === REQUIRED_ITEMS;
}

// ==================== INJECT SVGs ====================
function injectCharacterSVGs() {
    var map = {
        regLogo: SVG.dora,
        loginLogo: SVG.boots,
        regBackpackIcon: SVG.backpack,
        btnBackpackIcon: SVG.backpack,
        backpackOpen: SVG.backpackOpen,
        swiperChar: SVG.swiperSneaky,
        swiperWaiting: SVG.swiperSneaky,
        swiperDefeated: SVG.swiperDefeated,
        swiperWins: SVG.swiperSneaky,
        doraHelperAvatar: SVG.dora,
        creepSwiperIcon: SVG.swiper
    };
    for (var id in map) {
        var el = document.getElementById(id);
        if (el) el.innerHTML = map[id];
    }
}

// ==================== STARRY BACKGROUND ====================
function createStarryBackground() {
    var bg = document.getElementById('starsBg');
    if (!bg) return;
    for (var i = 0; i < 50; i++) {
        var star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        var size = Math.random() * 3 + 1;
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        star.style.setProperty('--dur', (Math.random() * 3 + 2) + 's');
        star.style.animationDelay = Math.random() * 5 + 's';
        bg.appendChild(star);
    }
}

// ==================== SESSION CHECK ====================
function checkExistingSession() {
    try {
        var session = JSON.parse(localStorage.getItem('doraSession') || 'null');
        if (session && isValidUser(session)) {
            showWelcome(session);
        } else {
            localStorage.removeItem('doraSession');
        }
    } catch (e) {
        localStorage.removeItem('doraSession');
    }
}

// ==================== RENDER ITEM GRIDS ====================
function renderItemGrids() {
    renderItemGrid('regItemsGrid', 'reg');
    renderItemGrid('loginItemsGrid', 'login');
}

function renderItemGrid(containerId, mode) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    BACKPACK_ITEMS.forEach(function (item) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'item-btn';
        btn.dataset.itemId = item.id;
        btn.innerHTML =
            '<div class="item-svg">' + item.svg + '</div>' +
            '<span class="item-name">' + item.name + '</span>' +
            '<span class="check-badge">&#10003;</span>';
        btn.addEventListener('click', function () { handleItemClick(item.id, mode); });
        container.appendChild(btn);
    });
}

// ==================== ITEM SELECTION ====================
function handleItemClick(itemId, mode) {
    var selected = mode === 'reg' ? regSelectedItems : loginSelectedItems;
    var idx = selected.indexOf(itemId);

    if (idx !== -1) {
        selected.splice(idx, 1);
        sfxDeselect();
    } else if (selected.length < REQUIRED_ITEMS) {
        selected.push(itemId);
        sfxSelect();
    } else {
        return;
    }

    updateItemUI(mode);
}

function updateItemUI(mode) {
    var selected = mode === 'reg' ? regSelectedItems : loginSelectedItems;
    var gridId = mode === 'reg' ? 'regItemsGrid' : 'loginItemsGrid';
    var slotsId = mode === 'reg' ? 'regSelectedSlots' : 'loginSelectedSlots';

    document.querySelectorAll('#' + gridId + ' .item-btn').forEach(function (btn) {
        btn.classList.toggle('selected', selected.indexOf(btn.dataset.itemId) !== -1);
    });

    var slots = document.querySelectorAll('#' + slotsId + ' .sel-slot');
    slots.forEach(function (slot, i) {
        if (i < selected.length) {
            var item = BACKPACK_ITEMS.find(function (it) { return it.id === selected[i]; });
            slot.className = 'sel-slot filled';
            slot.innerHTML = item ? item.svg : '?';
        } else {
            slot.className = 'sel-slot empty';
            slot.innerHTML = '?';
        }
    });

    if (mode === 'login') {
        var btn = document.getElementById('btnChantReady');
        if (btn) btn.disabled = selected.length < REQUIRED_ITEMS;
    }
}

function clearItems(mode) {
    if (mode === 'reg') regSelectedItems = [];
    else loginSelectedItems = [];
    updateItemUI(mode);
}

// ==================== STORAGE ====================
function getUsers() {
    try { return JSON.parse(localStorage.getItem('doraUsers') || '{}'); }
    catch (e) { return {}; }
}
function saveUser(username, data) {
    var users = getUsers();
    users[username.toLowerCase()] = data;
    localStorage.setItem('doraUsers', JSON.stringify(users));
}
function getUser(username) {
    var users = getUsers();
    return users[username.toLowerCase()] || null;
}

// ==================== PAGE NAVIGATION ====================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
    var page = document.getElementById(pageId);
    if (page) page.classList.add('active');

    if (pageId === 'registerPage') {
        regSelectedItems = [];
        updateItemUI('reg');
        document.getElementById('regError').textContent = '';
        document.getElementById('registerForm').reset();
    }
    if (pageId === 'loginPage') {
        resetLoginStages();
    }
}

function showLoginStage(stageId) {
    stopCreepTimer();
    document.querySelectorAll('#loginCard .login-stage').forEach(function (s) { s.classList.remove('active'); });
    var stage = document.getElementById(stageId);
    if (stage) {
        stage.classList.add('active');
        stage.style.animation = 'none';
        void stage.offsetHeight;
        stage.style.animation = '';
    }
    updateMapProgress(stageId);
    updateDoraHelper(stageId);
}

function resetLoginStages() {
    loginSelectedItems = [];
    currentLoginUser = null;
    failedAttempts = 0;
    stopCreepTimer();
    updateItemUI('login');
    showLoginStage('loginStage0');
    var input = document.getElementById('loginUsername');
    if (input) input.value = '';
    var chant = document.getElementById('loginChant');
    if (chant) chant.value = '';
    clearAllErrors();
}

function clearAllErrors() {
    document.querySelectorAll('.error-msg').forEach(function (el) { el.textContent = ''; });
}

// ==================== MAP PROGRESS ====================
function updateMapProgress(stageId) {
    var stageMap = {
        loginStage0: 0, loginStage1: 1, loginStage2: 2,
        loginStage3: 3, loginStageSuccess: 4, loginStageFail: 3
    };
    var step = stageMap[stageId] !== undefined ? stageMap[stageId] : 0;
    var isFail = stageId === 'loginStageFail';

    var labels = ['Start Here!', 'Swiper Spotted!', 'Opening Backpack...', 'Say the Chant!', 'Victory!'];

    // Update dots
    for (var i = 0; i <= 4; i++) {
        var dot = document.getElementById('mapDot' + i) || document.querySelector('[data-step="' + i + '"]');
        if (!dot) continue;
        dot.classList.remove('completed', 'active', 'failed');
        if (i < step) dot.classList.add('completed');
        else if (i === step) dot.classList.add(isFail ? 'failed' : 'active');
    }

    // Update lines
    for (var j = 1; j <= 4; j++) {
        var fill = document.getElementById('mapLineFill' + j);
        if (fill) fill.style.width = (j <= step ? '100%' : '0%');
    }

    var lbl = document.getElementById('mapLabel');
    if (lbl) lbl.textContent = isFail ? 'Swiper Wins... Try Again!' : (labels[step] || '');
}

// ==================== DORA HELPER BUBBLE ====================
function updateDoraHelper(stageId) {
    var bubble = document.getElementById('doraHelperBubble');
    if (!bubble) return;

    var messages = {
        loginStage0: 'Type your explorer name! I know you can do it!',
        loginStage1: 'Swiper is here! Quick, open Backpack!',
        loginStage2: 'Remember which items you picked? Grab them!',
        loginStage3: 'Say the magic words! Louder! LOUDER!',
        loginStageSuccess: 'We did it! You stopped Swiper!',
        loginStageFail: 'Oh no! Let\'s try again. You can do it!'
    };

    var msg = messages[stageId] || 'Can you help me stop Swiper?';

    // Cockier Swiper speech on more attempts
    if (stageId === 'loginStageFail' && failedAttempts >= 3) {
        msg = 'Don\'t give up! Remember your secret items and chant!';
    }

    bubble.style.animation = 'none';
    void bubble.offsetHeight;
    bubble.style.animation = '';
    bubble.textContent = msg;
}

// ==================== SWIPER SPEECH (escalating) ====================
function updateSwiperSpeech() {
    var el = document.getElementById('swiperSpeechText');
    if (!el) return;
    var taunts = [
        "You'll never get in! <em>*sneaky laugh*</em>",
        "Back again? Ha! You'll never stop me!",
        "I'm getting stronger! <em>*sneaky giggle*</em>",
        "Give up already! I'm UNSTOPPABLE!",
        "Is that the best you've got?! <em>*evil grin*</em>"
    ];
    el.innerHTML = taunts[Math.min(failedAttempts, taunts.length - 1)];
}

// ==================== CREEP TIMER ====================
function startCreepTimer() {
    stopCreepTimer();
    creepTimeLeft = CREEP_TIME;
    updateCreepUI();

    creepInterval = setInterval(function () {
        creepTimeLeft--;
        updateCreepUI();
        if (creepTimeLeft <= 5) sfxTick();
        if (creepTimeLeft <= 0) {
            stopCreepTimer();
            // Time's up — Swiper wins!
            sfxFail();
            document.getElementById('failMsg').textContent = "Too slow! Swiper got you!";
            failedAttempts++;
            screenShake();
            showLoginStage('loginStageFail');
            updateAttemptPips();
        }
    }, 1000);
}

function stopCreepTimer() {
    if (creepInterval) { clearInterval(creepInterval); creepInterval = null; }
}

function updateCreepUI() {
    var pct = ((CREEP_TIME - creepTimeLeft) / CREEP_TIME) * 100;
    var fill = document.getElementById('creepBarFill');
    var icon = document.getElementById('creepSwiperIcon');
    var timer = document.getElementById('creepTimer');

    if (fill) fill.style.width = pct + '%';
    if (icon) icon.style.left = 'calc(' + pct + '% - 17px)';
    if (timer) {
        timer.textContent = creepTimeLeft;
        timer.classList.toggle('danger', creepTimeLeft <= 5);
    }
}

// ==================== ATTEMPT COUNTER ====================
function updateAttemptPips() {
    var container = document.getElementById('attemptCounter');
    if (!container) return;
    container.innerHTML = '';
    for (var i = 0; i < MAX_ATTEMPTS; i++) {
        var pip = document.createElement('div');
        pip.className = 'attempt-pip' + (i < failedAttempts ? ' used' : '');
        container.appendChild(pip);
    }
}

// ==================== SCREEN SHAKE + RED FLASH ====================
function screenShake() {
    var card = document.getElementById('loginCard');
    if (!card) return;
    card.classList.remove('screen-shake', 'red-flash');
    void card.offsetHeight;
    card.classList.add('screen-shake', 'red-flash');
    setTimeout(function () { card.classList.remove('screen-shake', 'red-flash'); }, 700);
}

// ==================== REGISTRATION ====================
function handleRegister() {
    sfxClick();
    var username = document.getElementById('regUsername').value.trim();
    var email = document.getElementById('regEmail').value.trim();
    var chant = document.getElementById('regChant').value.trim();
    var errorEl = document.getElementById('regError');

    if (!username || username.length < 3) return showError(errorEl, 'Explorer name must be at least 3 characters!');
    if (!email || email.indexOf('@') === -1) return showError(errorEl, 'Please enter a valid email!');
    if (regSelectedItems.length < REQUIRED_ITEMS) return showError(errorEl, 'Pick ' + REQUIRED_ITEMS + ' items from Backpack!');
    if (!chant || chant.length < 3) return showError(errorEl, 'Your secret chant must be at least 3 characters!');
    if (getUser(username)) return showError(errorEl, 'This explorer name is already taken!');

    var userData = {
        username: username, email: email,
        items: regSelectedItems.slice(), chant: chant,
        registeredAt: new Date().toISOString()
    };
    saveUser(username, userData);
    localStorage.setItem('doraSession', JSON.stringify(userData));
    sfxSuccess();
    showWelcome(userData);
}

// ==================== LOGIN FLOW ====================
function enterJungle() {
    sfxClick();
    var username = document.getElementById('loginUsername').value.trim();
    var errorEl = document.getElementById('loginError0');

    if (!username) return showError(errorEl, 'Please enter your explorer name!');
    var user = getUser(username);
    if (!user) return showError(errorEl, 'Explorer not found! Check your name or register.');

    if (!isValidUser(user)) {
        var users = getUsers();
        delete users[username.toLowerCase()];
        localStorage.setItem('doraUsers', JSON.stringify(users));
        return showError(errorEl, 'Account data is outdated. Please register again!');
    }

    currentLoginUser = user;
    failedAttempts = 0;
    sfxAlert();
    updateSwiperSpeech();
    showLoginStage('loginStage1');
}

function openBackpack() {
    sfxClick();
    showLoginStage('loginStage2');
}

function showChantStage() {
    sfxClick();
    if (loginSelectedItems.length < REQUIRED_ITEMS) {
        return showError(document.getElementById('loginError2'), 'You need ' + REQUIRED_ITEMS + ' items to stop Swiper!');
    }
    showLoginStage('loginStage3');
    startCreepTimer();
    sfxUrgent();
}

function attemptStopSwiper() {
    sfxClick();
    stopCreepTimer();
    var chantInput = document.getElementById('loginChant');
    var errorEl = document.getElementById('loginError3');
    var chant = chantInput ? chantInput.value.trim() : '';

    if (!chant) return showError(errorEl, 'You must shout the magic words!');
    if (!currentLoginUser || !isValidUser(currentLoginUser)) return showError(errorEl, 'Something went wrong. Please start over!');

    var userItems = currentLoginUser.items.slice().sort();
    var loginItems = loginSelectedItems.slice().sort();
    var itemsMatch = userItems.length === loginItems.length
        && userItems.every(function (item, i) { return item === loginItems[i]; });
    var chantMatch = currentLoginUser.chant.trim().toLowerCase() === chant.toLowerCase();

    if (itemsMatch && chantMatch) {
        sfxSuccess();
        showLoginStage('loginStageSuccess');
        createCelebrationStars();
        setTimeout(function () {
            localStorage.setItem('doraSession', JSON.stringify(currentLoginUser));
            showWelcome(currentLoginUser);
        }, 2800);
    } else {
        failedAttempts++;
        sfxFail();
        screenShake();

        var msg = '';
        if (!itemsMatch && !chantMatch) msg = 'Wrong items AND wrong chant! Swiper is too strong!';
        else if (!itemsMatch) msg = 'Wrong items! You grabbed the wrong things from Backpack!';
        else msg = "Wrong chant! Those aren't the magic words!";

        if (failedAttempts >= MAX_ATTEMPTS) {
            msg = 'Swiper won ' + MAX_ATTEMPTS + ' times! Account locked. Register again to reset.';
            var users = getUsers();
            delete users[currentLoginUser.username.toLowerCase()];
            localStorage.setItem('doraUsers', JSON.stringify(users));
        }

        document.getElementById('failMsg').textContent = msg;
        showLoginStage('loginStageFail');
        updateAttemptPips();
        updateSwiperSpeech();
    }
}

function retryLogin() {
    sfxClick();
    if (failedAttempts >= MAX_ATTEMPTS) {
        showPage('registerPage');
        return;
    }
    loginSelectedItems = [];
    updateItemUI('login');
    var chant = document.getElementById('loginChant');
    if (chant) chant.value = '';
    showLoginStage('loginStage1');
    updateSwiperSpeech();
}

// ==================== WELCOME ====================
function showWelcome(user) {
    if (!user || !isValidUser(user)) {
        localStorage.removeItem('doraSession');
        showPage('registerPage');
        return;
    }
    showPage('welcomePage');

    // Typing effect for welcome message
    typeText(document.getElementById('welcomeMsg'), 'Hola, ' + user.username + '!');

    document.getElementById('welcomeUsername').textContent = user.username;
    document.getElementById('welcomeEmail').textContent = user.email || '';
    document.getElementById('welcomeChant').textContent = '"' + user.chant + '"';
    document.getElementById('userAvatar').textContent = user.username.charAt(0).toUpperCase();

    var itemsContainer = document.getElementById('welcomeItems');
    itemsContainer.innerHTML = user.items.map(function (itemId) {
        var item = BACKPACK_ITEMS.find(function (i) { return i.id === itemId; });
        return item ? '<div class="mini-item">' + item.svg + '</div>' : '';
    }).join('');

    var charContainer = document.getElementById('welcomeCharacters');
    charContainer.innerHTML = ['dora', 'boots', 'map', 'swiper', 'backpack'].map(function (key) {
        return '<div class="welcome-char">' + SVG[key] + '</div>';
    }).join('');

    var quotes = [
        'We did it! We did it! ' + user.username + ' stopped Swiper!',
        'Delicioso! ' + user.username + ' is the bravest explorer!',
        'Come on, vamonos! ' + user.username + ', everybody let\'s go!',
        'Lo hicimos! Swiper is no match for ' + user.username + '!',
        user.username + ' said "' + user.chant + '" and saved the day!',
        'Backpack helped ' + user.username + ' stop Swiper! Teamwork!'
    ];
    document.getElementById('adventureQuote').textContent =
        quotes[Math.floor(Math.random() * quotes.length)];

    launchConfetti();
}

// ==================== TYPING EFFECT ====================
function typeText(el, text) {
    if (!el) return;
    el.textContent = '';
    el.classList.add('typewriter');
    var i = 0;
    var interval = setInterval(function () {
        el.textContent = text.slice(0, i + 1);
        i++;
        if (i >= text.length) {
            clearInterval(interval);
            setTimeout(function () { el.classList.remove('typewriter'); }, 600);
        }
    }, 60);
}

// ==================== LOGOUT ====================
function handleLogout() {
    sfxClick();
    localStorage.removeItem('doraSession');
    showPage('loginPage');
}

// ==================== HELPERS ====================
function showError(el, msg) {
    if (!el) return;
    sfxFail();
    el.textContent = msg;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
}

function createCelebrationStars() {
    var container = document.getElementById('celebrationStars');
    if (!container) return;
    container.innerHTML = '';
    for (var i = 0; i < 5; i++) {
        var star = document.createElement('div');
        star.className = 'celebration-star';
        star.innerHTML = BACKPACK_ITEMS[0].svg;
        container.appendChild(star);
    }
}

function launchConfetti() {
    var container = document.getElementById('confettiContainer');
    if (!container) return;
    container.innerHTML = '';
    var colors = ['#FF6B9D', '#3498DB', '#F1C40F', '#E67E22', '#8E44AD', '#00b894', '#e17055', '#6c5ce7'];
    for (var i = 0; i < 80; i++) {
        var piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + '%';
        piece.style.setProperty('--fall', (Math.random() * 2 + 1.5) + 's');
        piece.style.animationDelay = (Math.random() * 1.5) + 's';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        var size = Math.random() * 8 + 5;
        piece.style.width = size + 'px';
        piece.style.height = size + 'px';
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        container.appendChild(piece);
    }
    setTimeout(function () { container.innerHTML = ''; }, 5000);
}
