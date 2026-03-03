let allFlashcards = [];
let studyCards = [];
let currentStudyIndex = 0;
let editingCardId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadFlashcards();
});

function showView(viewName) {
    document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
    document.getElementById(`${viewName}-view`).classList.remove('hidden');
    
    if (viewName === 'manage') loadFlashcards();
    if (viewName === 'study') {
        // 进入学习模式时，先显示设置面板，隐藏卡片
        document.getElementById('study-setup').classList.remove('hidden');
        document.getElementById('study-card-area').classList.add('hidden');
    }
}

// === 分类逻辑 ===
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const categories = await response.json();
        
        const selectManage = document.getElementById('category-select');
        const selectEdit = document.getElementById('edit-category-select');
        const selectStudy = document.getElementById('study-category-select'); // ✨ 学习页面的下拉框
        
        if (!selectManage || !selectEdit || !selectStudy) return;

        selectManage.innerHTML = '<option value="">请选择分类（必选）</option>';
        selectEdit.innerHTML = '<option value="">请选择分类（必选）</option>';
        selectStudy.innerHTML = '<option value="all">📚 全部卡片 (混合复习)</option>';
        
        categories.forEach(category => {
            const optionHtml = `<option value="${category._id}">${category.name}</option>`;
            selectManage.insertAdjacentHTML('beforeend', optionHtml);
            selectEdit.insertAdjacentHTML('beforeend', optionHtml);
            selectStudy.insertAdjacentHTML('beforeend', optionHtml);
        });
    } catch (error) { console.error('获取分类失败:', error); }
}

function openCategoryModal() {
    document.getElementById('category-modal').style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
}

function closeCategoryModal() {
    document.getElementById('category-modal').style.display = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
}

async function confirmCategory() {
    const nameInput = document.getElementById('new-category-input');
    const name = nameInput.value.trim();
    if (!name) return alert('分类名称不能为空！');

    try {
        const response = await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }) 
        });
        if (response.ok) {
            alert('分类添加成功！');
            nameInput.value = ''; 
            closeCategoryModal(); 
            await loadCategories(); 
        } else { alert('添加失败'); }
    } catch (error) { console.error(error); }
}

// === 闪卡逻辑 ===
async function loadFlashcards() {
    try {
        const response = await fetch('/api/flashcards');
        allFlashcards = await response.json();
        renderCards(allFlashcards); // 抽离成单独的渲染函数
    } catch (error) { console.error(error); }
}

// 渲染卡片列表 (方便搜索时复用)
// 替换原来的 renderCards 函数
function renderCards(cardsToRender) {
    const list = document.getElementById('flashcards-list');
    list.innerHTML = '';
    
    const now = new Date();
    
    cardsToRender.forEach(card => {
        const categoryName = card.category ? card.category.name : '未分类';
        
        // 兼容旧数据：如果没有 nextReviewDate，就当作需要立刻复习
        const reviewDate = card.nextReviewDate ? new Date(card.nextReviewDate) : now;
        const isDue = reviewDate <= now;
        
        // 智能状态显示
        const statusHtml = isDue 
            ? '<span style="color: #ed8936; font-size: 0.85rem; margin-left: 8px; font-weight: bold;">🔥 待复习</span>' 
            : `<span style="color: #48bb78; font-size: 0.85rem; margin-left: 8px; font-weight: bold;">✅ ${reviewDate.getMonth()+1}月${reviewDate.getDate()}日复习</span>`;

        list.innerHTML += `
            <div class="card-item">
                <div class="card-content">
                    <strong>Q: ${card.question}</strong>
                    <p>A: ${card.answer}</p>
                    <small>分类: ${categoryName}</small> ${statusHtml}
                </div>
                <div class="card-actions">
                    <button onclick="editFlashcard('${card._id}')">编辑</button>
                    <button onclick="deleteFlashcard('${card._id}')">删除</button>
                </div>
            </div>
        `;
    });
}
// ✨ 新增：实时搜索过滤功能
function filterCards() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const filteredCards = allFlashcards.filter(card => {
        const categoryName = card.category ? card.category.name.toLowerCase() : '';
        return card.question.toLowerCase().includes(searchTerm) || 
               card.answer.toLowerCase().includes(searchTerm) ||
               categoryName.includes(searchTerm);
    });
    renderCards(filteredCards);
}

async function createFlashcard() {
    const question = document.getElementById('question-input').value;
    const answer = document.getElementById('answer-input').value;
    const categoryId = document.getElementById('category-select').value; 
    if (!question || !answer) return alert('问题和答案不能为空！');
    if (!categoryId) return alert('请先选择分类！');

    try {
        const response = await fetch('/api/flashcards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, answer, categoryId }) 
        });
        if (response.ok) {
            document.getElementById('question-input').value = '';
            document.getElementById('answer-input').value = '';
            loadFlashcards();
        }
    } catch (error) { console.error(error); }
}

async function deleteFlashcard(id) {
    if (!confirm('确定要删除吗？')) return;
    await fetch(`/api/flashcards/${id}`, { method: 'DELETE' });
    loadFlashcards();
}

function editFlashcard(id) {
    const card = allFlashcards.find(c => c._id === id);
    if (!card) return;
    editingCardId = id;
    document.getElementById('edit-question-input').value = card.question;
    document.getElementById('edit-answer-input').value = card.answer;
    if (card.category) document.getElementById('edit-category-select').value = card.category._id;
    showView('edit');
}

async function updateFlashcard() {
    const question = document.getElementById('edit-question-input').value;
    const answer = document.getElementById('edit-answer-input').value;
    const categoryId = document.getElementById('edit-category-select').value;
    
    await fetch(`/api/flashcards/${editingCardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer, categoryId })
    });
    showView('manage');
}

// === ✨ 升级版学习模式逻辑 ===
// 替换原来的 startStudyMode 函数
function startStudyMode() {
    const selectedCategoryId = document.getElementById('study-category-select').value;
    const now = new Date();
    
    // ✨ 核心：只筛选出“下次复习时间”小于或等于“现在”的卡片
    if (selectedCategoryId === 'all') {
        studyCards = allFlashcards.filter(card => {
            const date = card.nextReviewDate ? new Date(card.nextReviewDate) : new Date(0);
            return date <= now;
        });
    } else {
        studyCards = allFlashcards.filter(card => {
            const date = card.nextReviewDate ? new Date(card.nextReviewDate) : new Date(0);
            return card.category && card.category._id === selectedCategoryId && date <= now;
        });
    }

    if (studyCards.length === 0) {
        alert('🎉 太棒了！今天这个分类下的复习任务已经全部清空啦！明天再来吧！');
        showView('manage');
        return;
    }
    
    studyCards.sort(() => Math.random() - 0.5);
    currentStudyIndex = 0;
    
    document.getElementById('study-setup').classList.add('hidden');
    document.getElementById('study-card-area').classList.remove('hidden');
    
    renderStudyCard();
}

function renderStudyCard() {
    if (currentStudyIndex >= studyCards.length) {
        alert('🎉 恭喜你，完成了所选卡片的复习！');
        showView('manage');
        return;
    }
    const card = studyCards[currentStudyIndex];
    document.getElementById('study-question').innerText = card.question;
    document.getElementById('study-answer').innerText = card.answer;
    
    // ✨ 确保每次显示新卡片时，都是正面朝上
    const cardInner = document.getElementById('card-inner');
    if (cardInner) cardInner.classList.remove('is-flipped');

    // ✨ 更新进度条的文字和蓝色填充长度
    const currentNum = currentStudyIndex + 1;
    const totalNum = studyCards.length;
    document.getElementById('study-progress-text').innerText = `当前第 ${currentNum} 张 / 共 ${totalNum} 张`;
    
    const percentage = (currentNum / totalNum) * 100;
    document.getElementById('progress-bar-fill').style.width = `${percentage}%`;
}

function flipCard() { 
    // ✨ 核心魔法：不再是隐藏显示，而是给卡片添加/移除翻转的 CSS 类
    document.getElementById('card-inner').classList.toggle('is-flipped'); 
}
function nextCard() { currentStudyIndex++; renderStudyCard(); }
// 替换原来的 markAsKnown 函数
async function submitReview(isKnown) {
    const currentCard = studyCards[currentStudyIndex];
    try {
        await fetch(`/api/flashcards/${currentCard._id}/review`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isKnown })
        });
    } catch (error) { console.error('记录失败:', error); }
    
    // 界面表现逻辑
    if (isKnown) {
        nextCard(); // 记住了，看下一张
    } else {
        studyCards.push(currentCard); // 忘了，把这张卡塞到队列最后面，今天必须再背一遍！
        nextCard();
    }
}

function markAsKnown() { submitReview(true); }
function markAsReview() { submitReview(false); }
