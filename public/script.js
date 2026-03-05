// ==========================================
// 🔌 Flashcard Pro 核心控制逻辑 (修复增删改查)
// ==========================================

let allCards = []; 
let currentCategoryId = 'all'; // 记录当前左侧选中的分类
let editingCardId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadFlashcards();
});

// --- 1. 视图切换 ---
function showMainView(viewId) {
    document.getElementById('manage-view').classList.add('hidden');
    if (document.getElementById('study-view')) document.getElementById('study-view').classList.add('hidden');
    if (document.getElementById('spell-view')) document.getElementById('spell-view').classList.add('hidden');
    
    document.getElementById(viewId).classList.remove('hidden');
}

// --- 2. 分类管理与导航 ---
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const categories = await response.json();

        // 渲染左侧导航栏
        const sidebarMenu = document.getElementById('sidebar-menu');
        if (sidebarMenu) {
            sidebarMenu.innerHTML = `<li class="nav-item active" onclick="selectSidebarItem('all', '📥 所有卡片', this)">📥 所有卡片</li>`;
            categories.forEach(cat => {
                sidebarMenu.innerHTML += `<li class="nav-item" onclick="selectSidebarItem('${cat._id}', '📂 ${cat.name}', this)">📂 ${cat.name}</li>`;
            });
        }

        // 渲染所有弹窗里的下拉框
        const selects = ['modal-category-select', 'batch-category-select', 'edit-category-select'];
        selects.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.innerHTML = categories.map(cat => `<option value="${cat._id}">${cat.name}</option>`).join('');
            }
        });
    } catch (error) { console.error('加载分类失败:', error); }
}

function selectSidebarItem(id, title, element) {
    document.getElementById('current-view-title').innerText = title;
    
    // 处理侧边栏高亮
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');
    
    currentCategoryId = id; // 更新当前选中的分类
    showMainView('manage-view'); // 确保显示的是管理列表
    filterCards(); // 触发过滤
}

async function confirmCategory() {
    const name = document.getElementById('new-category-input').value;
    if (!name) return alert('请输入名称');
    try {
        await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        closeAllModals();
        loadCategories();
    } catch (error) { console.error(error); }
}

// --- 3. 卡片管理 (增删改查) ---
async function loadFlashcards() {
    try {
        const response = await fetch('/api/flashcards');
        allCards = await response.json();
        filterCards(); // 加载后应用过滤
    } catch (error) { console.error('加载卡片失败:', error); }
}

// ✨ 找回：分类点击与顶部搜索框的过滤逻辑
function filterCards() {
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    const filtered = allCards.filter(card => {
        // 1. 匹配左侧选中的分类
        const matchesCategory = currentCategoryId === 'all' || (card.category && card.category._id === currentCategoryId);
        // 2. 匹配搜索文本
        const matchesSearch = card.question.toLowerCase().includes(searchTerm) || card.answer.toLowerCase().includes(searchTerm);
        
        return matchesCategory && matchesSearch;
    });
    
    renderCards(filtered);
}

// ✨ 找回：带“待复习状态”和“编辑按钮”的卡片渲染
function renderCards(cardsToRender) {
    const list = document.getElementById('flashcards-list');
    if (!list) return;
    const now = new Date();
    
    list.innerHTML = cardsToRender.map(card => {
        const categoryName = card.category ? card.category.name : '未分类';
        const reviewDate = card.nextReviewDate ? new Date(card.nextReviewDate) : now;
        const isDue = reviewDate <= now;
        
        const statusHtml = isDue 
            ? '<span style="color: #ed8936; font-size: 0.85rem; margin-left: 8px; font-weight: bold;">🔥 待复习</span>' 
            : `<span style="color: #48bb78; font-size: 0.85rem; margin-left: 8px; font-weight: bold;">✅ ${reviewDate.getMonth()+1}月${reviewDate.getDate()}日</span>`;

        return `
            <div class="card-item">
                <strong>Q: ${card.question}</strong>
                <p>A: ${card.answer}</p>
                <small style="color: #a0aec0;">分类: ${categoryName} ${statusHtml}</small>
                <div class="card-actions">
                    <button onclick="editCard('${card._id}')">✏️ 编辑</button>
                    <button onclick="deleteCard('${card._id}')">🗑️ 删除</button>
                </div>
            </div>
        `;
    }).join('');
}

// --- 4. 弹窗控制中心 ---
function openAddCardModal() {
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('add-card-modal').style.display = 'block';
}

function openCategoryModal() {
    document.getElementById('new-category-input').value = '';
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('category-modal').style.display = 'block';
}

function openBatchModal() {
    document.getElementById('batch-input').value = '';
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('batch-modal').style.display = 'block';
}

function closeAllModals() {
    document.getElementById('modal-overlay').style.display = 'none';
    document.querySelectorAll('.pro-modal').forEach(m => m.style.display = 'none');
}

// --- 5. 核心交互逻辑 (增改导) ---
async function createFlashcardFromModal() {
    const question = document.getElementById('modal-question').value;
    const answer = document.getElementById('modal-answer').value;
    const categoryId = document.getElementById('modal-category-select').value;

    if (!question || !answer) return alert('请填写完整内容');

    try {
        const response = await fetch('/api/flashcards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, answer, categoryId })
        });
        if (response.ok) {
            document.getElementById('modal-question').value = '';
            document.getElementById('modal-answer').value = '';
            closeAllModals();
            loadFlashcards();
        }
    } catch (error) { console.error(error); }
}

// ✨ 找回：编辑卡片功能
function editCard(id) {
    const card = allCards.find(c => c._id === id);
    if (!card) return;
    editingCardId = id;
    
    document.getElementById('edit-question').value = card.question;
    document.getElementById('edit-answer').value = card.answer;
    if (card.category) document.getElementById('edit-category-select').value = card.category._id;
    
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('edit-card-modal').style.display = 'block';
}

async function updateCard() {
    const question = document.getElementById('edit-question').value;
    const answer = document.getElementById('edit-answer').value;
    const categoryId = document.getElementById('edit-category-select').value;
    
    try {
        await fetch(`/api/flashcards/${editingCardId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, answer, categoryId })
        });
        closeAllModals();
        loadFlashcards();
    } catch (error) { console.error('更新失败:', error); }
}

async function deleteCard(id) {
    if (!confirm('确定要删除这张卡片吗？')) return;
    try {
        await fetch(`/api/flashcards/${id}`, { method: 'DELETE' });
        loadFlashcards();
    } catch (error) { console.error(error); }
}

// ✨ 找回：批量导入功能
async function confirmBatchImport() {
    const text = document.getElementById('batch-input').value;
    const categoryId = document.getElementById('batch-category-select').value;
    if(!text.trim()) return alert('请输入内容');

    const lines = text.split('\n');
    for (let line of lines) {
        let parts = line.split('\t'); 
        if (parts.length < 2) parts = line.split(/[|｜]/);
        
        if (parts.length >= 2) {
            await fetch('/api/flashcards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: parts[0].trim(), answer: parts[1].trim(), categoryId })
            });
        }
    }
    closeAllModals();
    loadFlashcards();
}

// --- 6. 预留：背诵与默写入口 ---
// ==========================================
// 📖 核心学习逻辑与全键盘监听 (完全复活版)
// ==========================================

let studyCards = []; let currentStudyIndex = 0;
let spellCards = []; let currentSpellIndex = 0;

function speakWord(text, event) {
    if (event) event.stopPropagation(); 
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const isChinese = /[\u4e00-\u9fa5]/.test(text);
    utterance.lang = isChinese ? 'zh-CN' : 'en-US';
    utterance.rate = isChinese ? 1.0 : 0.9;
    window.speechSynthesis.speak(utterance);
}

// --- 1. 背诵模式 ---
// --- 1. 背诵模式 ---
function startReciteMode() {
    // ✨ 动态读取你设置的数量，如果没有设置就默认 20
    const limitInput = document.getElementById('study-limit');
    const maxCards = limitInput ? parseInt(limitInput.value) || 20 : 20;

    const now = new Date();
    // 智能筛选：只学当前左侧选中的分类，并且到期的卡片
    let dueCards = allCards.filter(card => {
        const date = card.nextReviewDate ? new Date(card.nextReviewDate) : new Date(0);
        const isMatch = currentCategoryId === 'all' || (card.category && card.category._id === currentCategoryId);
        return date <= now && isMatch;
    });

    if (dueCards.length === 0) return alert('🎉 太棒了！当前分类下没有需要复习的卡片！');

    dueCards.sort((a, b) => (b.interval || 0) - (a.interval || 0) || Math.random() - 0.5);
    
    // ✨ 使用你自定义的数量进行截断
    studyCards = dueCards.slice(0, maxCards); 
    currentStudyIndex = 0;

    showMainView('study-view');
    renderStudyCard();
}

function renderStudyCard() {
    if (currentStudyIndex >= studyCards.length) {
        alert('🎉 恭喜你，完成了本次复习！');
        return showMainView('manage-view');
    }
    const card = studyCards[currentStudyIndex];
    document.getElementById('study-question').innerText = card.question;
    document.getElementById('study-answer').innerText = card.answer;
    
    const cardInner = document.getElementById('card-inner');
    if (cardInner) cardInner.classList.remove('is-flipped');

    document.getElementById('study-progress-text').innerText = `当前第 ${currentStudyIndex + 1} 张 / 共 ${studyCards.length} 张`;
    document.getElementById('progress-bar-fill').style.width = `${((currentStudyIndex + 1) / studyCards.length) * 100}%`;
    document.getElementById('study-prev-btn').style.display = currentStudyIndex === 0 ? 'none' : 'inline-block';
}

function flipCard() { document.getElementById('card-inner').classList.toggle('is-flipped'); }
function nextStudyCard() { currentStudyIndex++; renderStudyCard(); }
function prevStudyCard() { if (currentStudyIndex > 0) { currentStudyIndex--; renderStudyCard(); } }

async function submitReview(isKnown) {
    const currentCard = studyCards[currentStudyIndex];
    try {
        await fetch(`/api/flashcards/${currentCard._id}/review`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isKnown })
        });
    } catch (e) { console.error('记录失败:', e); }
    if (!isKnown) studyCards.push(currentCard); // 忘了就塞到队尾重背
    nextStudyCard();
}
function markAsKnown() { submitReview(true); }
function markAsReview() { submitReview(false); }


// --- 2. 默写模式 ---
// --- 2. 默写模式 ---
function startSpellMode() {
    // ✨ 同样动态读取数量
    const limitInput = document.getElementById('study-limit');
    const maxCards = limitInput ? parseInt(limitInput.value) || 20 : 20;

    const now = new Date();
    let dueCards = allCards.filter(card => {
        const date = card.nextReviewDate ? new Date(card.nextReviewDate) : new Date(0);
        const isMatch = currentCategoryId === 'all' || (card.category && card.category._id === currentCategoryId);
        return date <= now && isMatch;
    });

    if (dueCards.length === 0) return alert('🎉 太棒了！今天没有需要检验的卡片！');

    dueCards.sort((a, b) => (b.interval || 0) - (a.interval || 0) || Math.random() - 0.5);
    
    // ✨ 使用你自定义的数量
    spellCards = dueCards.slice(0, maxCards);
    currentSpellIndex = 0;

    showMainView('spell-view');
    renderSpellCard();
}

function renderSpellCard() {
    if (currentSpellIndex >= spellCards.length) {
        alert('🏆 恭喜你，完成了所有的拼写检验！');
        return showMainView('manage-view');
    }
    const card = spellCards[currentSpellIndex];
    document.getElementById('spell-question').innerText = card.question || '（空问题）';
    
    const inputEl = document.getElementById('spell-input');
    inputEl.value = ''; inputEl.disabled = false; inputEl.focus(); 
    
    document.getElementById('spell-feedback').innerHTML = '';
    document.getElementById('spell-next-control').classList.add('hidden');
    document.getElementById('spell-progress-text').innerText = `当前第 ${currentSpellIndex + 1} 张 / 共 ${spellCards.length} 张`;
    document.getElementById('spell-prev-btn').style.display = currentSpellIndex === 0 ? 'none' : 'inline-block';
}

function prevSpellCard() { if (currentSpellIndex > 0) { currentSpellIndex--; renderSpellCard(); } }
function nextSpellCard() { currentSpellIndex++; renderSpellCard(); }

function handleSpellEnter(event) {
    if (event.key === 'Enter') {
        const inputEl = document.getElementById('spell-input');
        if (inputEl.disabled) nextSpellCard(); else checkSpelling();
    }
}

async function checkSpelling() {
    const inputEl = document.getElementById('spell-input');
    if (inputEl.disabled) return nextSpellCard(); 

    const inputStr = inputEl.value.trim().toLowerCase(); 
    if (inputStr === '') {
        inputEl.style.borderColor = '#e53e3e'; 
        inputEl.placeholder = '⚠️ 请先输入单词哦！';
        setTimeout(() => { inputEl.style.borderColor = 'transparent'; inputEl.placeholder = '请在此输入答案...'; }, 1500);
        return; 
    }

    const card = spellCards[currentSpellIndex];
    const answerStr = card.answer.trim().toLowerCase();  
    const feedbackEl = document.getElementById('spell-feedback');
    inputEl.disabled = true; 

    const isCorrect = (inputStr === answerStr);

    if (isCorrect) {
        feedbackEl.innerHTML = '✅ <strong>拼写正确！</strong> 完全掌握！';
        feedbackEl.style.color = '#48bb78';
        speakWord(card.answer, null); 
    } else {
        feedbackEl.innerHTML = `❌ <strong>拼写错误。</strong><br><br>你的输入：<span style="color:red; text-decoration: line-through;">${inputStr}</span><br>正确答案：<span style="color:green;">${card.answer}</span>`;
        feedbackEl.style.color = '#e53e3e';
        spellCards.push(card); 
    }

    try {
        await fetch(`/api/flashcards/${card._id}/review`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isKnown: isCorrect })
        });
    } catch(e) {}

    document.getElementById('spell-next-control').classList.remove('hidden');
}

// --- 3. 全局键盘快捷键 ---
document.addEventListener('keydown', function(event) {
    const activeTag = document.activeElement.tagName.toLowerCase();
    const isTyping = (activeTag === 'input' || activeTag === 'textarea');
    const isSpellInput = (document.activeElement.id === 'spell-input');
    if (isTyping && !isSpellInput) return;

    const studyArea = document.getElementById('study-view');
    const spellArea = document.getElementById('spell-view');

    if (studyArea && !studyArea.classList.contains('hidden')) {
        switch(event.code) {
            case 'Space': event.preventDefault(); flipCard(); break;
            case 'ArrowLeft': prevStudyCard(); break;
            case 'ArrowRight': nextStudyCard(); break;
            case 'Digit1': markAsReview(); break;
            case 'Digit2': markAsKnown(); break;
        }
    }

    if (spellArea && !spellArea.classList.contains('hidden')) {
        switch(event.code) {
            case 'ArrowLeft': prevSpellCard(); break;
            case 'ArrowRight': nextSpellCard(); break;
            case 'Enter': 
            case 'NumpadEnter':
                const inputEl = document.getElementById('spell-input');
                if (inputEl && inputEl.disabled) {
                    event.preventDefault(); 
                    nextSpellCard();
                }
                break;
        }
    }
});