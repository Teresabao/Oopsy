// ==========================================
// 🔌 Flashcard Pro V2.0 终极控制逻辑 (纯净无 Emoji 极简版)
// ==========================================

let allCards = []; 
let allCategories = []; 
let currentCategoryId = 'all'; 
let editingCardId = null;

let collapsedFolders = new Set();
let rootCollapsed = false; 

document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadFlashcards();

    // ✨ 强行接管“添加”按钮，绑定带有智能预填分类的专属函数
    const addBtn = document.getElementById('btn-add-card');
    if (addBtn) {
        addBtn.onclick = (e) => {
            e.preventDefault();
            openAddCardModal();
        };
    }
});

// --- 1. 视图切换引擎 ---
function showMainView(viewId) {
    const views = ['manage-view', 'study-view', 'spell-view', 'dashboard-view']; 
    views.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    const target = document.getElementById(viewId);
    if (target) target.classList.remove('hidden');

    // ✨ 核心修复：退出学习模式回到主界面时，静默去服务器拉取最新卡片状态！
    if (viewId === 'manage-view' || viewId === 'dashboard-view') {
        loadFlashcards();
    }
}
// --- 2. V2.0 终极折叠式树形导航栏 ---
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        allCategories = await response.json();

        const sidebarMenu = document.getElementById('sidebar-menu');
        if (sidebarMenu) {
            const icons = {
                dashboard: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>`,
                all: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
                uncat: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
                folder: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
                doc: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
                arrowRight: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
                arrowDown: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>`
            };

            let html = `
                <li class="nav-item ${currentCategoryId === 'dashboard' ? 'active' : ''}" onclick="selectDashboard(this)">
                    ${icons.dashboard} <span>学习数据</span>
                </li>
                <div style="height: 1px; background: #e2e8f0; margin: 10px 0;"></div>
            `;
            
            // ✨ 给“所有卡片”也装上同款极简加号
            const rootArrow = rootCollapsed ? icons.arrowRight : icons.arrowDown;
            html += `
                <li class="nav-item root-nav ${currentCategoryId === 'all' ? 'active' : ''}" style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 8px; flex: 1;" onclick="selectSidebarItem('all', '所有卡片', 'vocabulary', this.parentElement)">
                        <div class="toggle-arrow" onclick="toggleRoot(event)">${rootArrow}</div>
                        ${icons.all} <span>所有卡片</span>
                    </div>
                    
                    <div class="folder-actions" onclick="quickCreateSubCategory(event, '')" title="新建顶级文件夹">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </div>
                </li>
                <div id="user-folders-container" style="display: ${rootCollapsed ? 'none' : 'block'}; padding-left: 14px;">
            `;

            const parents = allCategories.filter(c => !c.parentId);
            const children = allCategories.filter(c => c.parentId);

            parents.forEach(p => {
                const hasChildren = children.some(c => c.parentId === p._id);
                const isCollapsed = collapsedFolders.has(p._id);
                const arrow = isCollapsed ? icons.arrowRight : icons.arrowDown;
                const icon = p.type === 'notes' ? icons.doc : icons.folder;
                const isActive = currentCategoryId === p._id ? 'active' : '';
                
                html += `
                    <li class="nav-item parent-nav ${isActive}" style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 8px; flex: 1;" onclick="selectSidebarItem('${p._id}', '${p.name}', '${p.type}', this.parentElement)">
                            <div class="toggle-arrow" style="visibility: ${hasChildren ? 'visible' : 'hidden'}" onclick="toggleFolder(event, '${p._id}')">${arrow}</div>
                            ${icon} <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;">${p.name}</span>
                        </div>
                        
                        <div class="folder-actions" onclick="quickCreateSubCategory(event, '${p._id}')" title="在此文件夹下新建">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </div>
                    </li>
                    <div id="children-of-${p._id}" style="display: ${isCollapsed ? 'none' : 'block'}; padding-left: 28px;">
                `;
                
                children.filter(c => c.parentId === p._id).forEach(child => {
                    const cIcon = child.type === 'notes' ? icons.doc : icons.doc;
                    const cActive = currentCategoryId === child._id ? 'active' : '';
                    html += `
                        <li class="nav-item is-child ${cActive}" onclick="selectSidebarItem('${child._id}', '${child.name}', '${child.type}', this)">
                            ${cIcon} <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${child.name}</span>
                        </li>`;
                });
                html += `</div>`; 
            });
            html += `</div>`; 
            
            sidebarMenu.innerHTML = html;
        }

        refreshSelectOptions(); 
    } catch (error) { console.error('加载分类失败:', error); }
}

function refreshSelectOptions() {
    const selects = ['modal-category-select', 'batch-category-select', 'edit-category-select'];
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = `<option value="">(无) 未分类</option>` + 
                           allCategories.map(cat => `<option value="${cat._id}">${cat.name}</option>`).join('');
        }
    });

    const parentSelect = document.getElementById('parent-category-select');
    if (parentSelect) {
        parentSelect.innerHTML = '<option value="">(无) 作为顶级文件夹</option>';
        allCategories.filter(c => !c.parentId).forEach(cat => {
            parentSelect.innerHTML += `<option value="${cat._id}">归属于 -> ${cat.name}</option>`;
        });
    }
}

function toggleRoot(event) { event.stopPropagation(); rootCollapsed = !rootCollapsed; loadCategories(); }
function toggleFolder(event, folderId) { event.stopPropagation(); if (collapsedFolders.has(folderId)) collapsedFolders.delete(folderId); else collapsedFolders.add(folderId); loadCategories(); }

// ✨ 侧边栏点击逻辑 (终极防弹版)
function selectSidebarItem(id, title, type, element) {
    try {
        currentCategoryId = id;
        
        // 1. 安全更新标题
        const titleEl = document.getElementById('current-view-title');
        if (titleEl) titleEl.textContent = title;

        // 2. 更新左侧高亮状态
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        if (element) {
            element.classList.add('active');
        } else {
            const root = document.querySelector('.root-nav');
            if (root) root.classList.add('active');
        }

        // 3. 渲染数据并切回列表页
        renderCards(); 
        // ⚠️ 关键修正：确保切回的是 manage-view (卡片管理列表)
        showMainView('manage-view'); 

        // 4. 手机端点完自动收起
        if (window.innerWidth <= 768) {
            const sidebar = document.querySelector('.sidebar');
            const overlay = document.getElementById('mobile-overlay');
            if (sidebar) sidebar.classList.remove('mobile-active');
            if (overlay) overlay.style.display = 'none';
        }
    } catch (error) {
        console.error("侧边栏点击出错:", error);
    }
}

function selectDashboard(element) {
    document.getElementById('current-view-title').innerText = '数据看板';
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');
    const settingsBtn = document.getElementById('category-settings-btn');
    if (settingsBtn) settingsBtn.classList.add('hidden');
    showMainView('dashboard-view');
    renderDashboard();
}

// --- 3. ⚙️ V2.0 大一统：文件夹设置中心 ---
function openCategorySettingsModal() {
    const cat = allCategories.find(c => c._id === currentCategoryId);
    if (!cat) return;
    document.getElementById('edit-cat-name').value = cat.name;
    document.getElementById('edit-cat-type').value = cat.type || 'vocabulary';
    const parentSelect = document.getElementById('edit-cat-parent');
    parentSelect.innerHTML = '<option value="">(无) 作为顶级文件夹</option>';
    allCategories.forEach(c => {
        if (!c.parentId && c._id !== cat._id) {
            parentSelect.innerHTML += `<option value="${c._id}" ${cat.parentId === c._id ? 'selected' : ''}>归属于 -> ${c.name}</option>`;
        }
    });
    openModal('category-settings-modal');
}

async function submitCategorySettings() {
    const name = document.getElementById('edit-cat-name').value;
    const parentId = document.getElementById('edit-cat-parent').value;
    const type = document.getElementById('edit-cat-type').value;
    if (!name) return alert('名称不能为空！');
    try {
        await fetch(`/api/categories/${currentCategoryId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, parentId, type }) });
        closeAllModals(); await loadCategories();
        document.getElementById('current-view-title').innerText = name;
        const navItems = document.querySelectorAll('.nav-item');
        let activeEl = null; navItems.forEach(el => { if(el.classList.contains('active')) activeEl = el; });
        selectSidebarItem(currentCategoryId, name, type, activeEl);
    } catch (error) { console.error(error); }
}

async function deleteCurrentCategory() {
    if (!confirm('确定要彻底删除该文件夹吗？\n\n放心，里面的卡片不会丢失，会被自动移入【未分类区】池中保护！')) return;
    try {
        await fetch(`/api/categories/${currentCategoryId}`, { method: 'DELETE' });
        closeAllModals();
        await loadCategories();
        await loadFlashcards();
        
        const uncatItem = document.querySelector('.uncat-nav');
        if (uncatItem) {
            selectSidebarItem('uncategorized', '未分类区', 'vocabulary', uncatItem);
        } else {
            const rootItem = document.querySelector('.root-nav');
            selectSidebarItem('all', '所有卡片', 'vocabulary', rootItem);
        }
    } catch (error) { console.error(error); }
}

// --- 4. 卡片管理与渲染 ---
async function confirmCategory() {
    const name = document.getElementById('new-category-input').value;
    const parentId = document.getElementById('parent-category-select') ? document.getElementById('parent-category-select').value : null;
    const type = document.getElementById('category-type-select') ? document.getElementById('category-type-select').value : 'vocabulary';
    if (!name) return alert('请输入名称');
    try { await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, parentId: parentId || null, type }) }); closeAllModals(); loadCategories(); } catch (error) { console.error(error); }
}

async function loadFlashcards() {
    try {
        const response = await fetch('/api/flashcards');
        allCards = await response.json();
        filterCards(); 
        const dashView = document.getElementById('dashboard-view');
        if(dashView && !dashView.classList.contains('hidden')) renderDashboard(); 
    } catch (error) { console.error('加载卡片失败:', error); }
}

function filterCards() {
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    const filtered = allCards.filter(card => {
        let isMatch = false;
        if (currentCategoryId === 'all') {
            isMatch = true; 
        } else if (currentCategoryId === 'uncategorized') {
            isMatch = !card.category; 
        } else if (!card.category) {
            isMatch = false; 
        } else {
            const isDirectMatch = card.category._id === currentCategoryId;
            const isChildMatch = card.category.parentId === currentCategoryId;
            isMatch = isDirectMatch || isChildMatch;
        }

        const matchesSearch = card.question.toLowerCase().includes(searchTerm) || card.answer.toLowerCase().includes(searchTerm);
        return isMatch && matchesSearch;
    });
    
    renderCards(filtered);
}

function renderCards(cardsToRender) {
    // 1. 严格保留你的专属 ID
    const list = document.getElementById('flashcards-list');
    if (!list) return;

    // ✨ 2. 新增：防崩溃与空数据优雅展示
    if (!cardsToRender || cardsToRender.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding: 60px 20px; color: #94a3b8; font-size: 0.95rem;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" style="margin-bottom:12px; display:block; margin-left:auto; margin-right:auto;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            这里空空如也，赶快添加或导入几张卡片吧！
        </div>`;
        return;
    }

    const now = new Date();
    
    list.innerHTML = cardsToRender.map(card => {
        const categoryName = card.category ? card.category.name : '未分类区';
        const reviewDate = card.nextReviewDate ? new Date(card.nextReviewDate) : now;
        const isDue = reviewDate <= now;
        
        // ✨ 极简卡片动作按钮样式 (全局复用)
        const actionBtnBase = "display:inline-flex; align-items:center; gap:6px; padding:6px 14px; border-radius:8px; border:none; cursor:pointer; font-size:0.85rem; font-weight:500; transition:0.2s;";

        // 1. 优化徽章样式 (Stage Badge)
        const stageIcon = card.stage >= 1 
            ? `<span style="display:inline-flex; align-items:center; gap:4px; padding:2px 8px; background:#fef3c7; color:#b45309; border-radius:12px; font-size:0.75rem;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg> 
                可默写</span>` 
            : `<span style="display:inline-flex; align-items:center; gap:4px; padding:2px 8px; background:#f1f5f9; color:#64748b; border-radius:12px; font-size:0.75rem;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> 
                待进阶</span>`;

        // 2. 优化状态样式 (Status Badge)
        const statusHtml = isDue 
            ? `<span style="display:inline-flex; align-items:center; gap:4px; padding:2px 8px; background:#fff1f2; color:#e11d48; border-radius:12px; font-size:0.75rem; font-weight:bold;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg> 
                待复习</span>` 
            : `<span style="display:inline-flex; align-items:center; gap:4px; padding:2px 8px; background:#ecfdf5; color:#059669; border-radius:12px; font-size:0.75rem; font-weight:bold;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> 
                ${reviewDate.getMonth()+1}月${reviewDate.getDate()}日</span>`;

        return `
            <div class="card-item" style="padding: 24px; border-radius: 20px; background: white; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02); display: flex; flex-direction: column; gap: 10px; transition: 0.3s;" onmouseover="this.style.borderColor='#e2e8f0'; this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='#f1f5f9'; this.style.transform='translateY(0)'">
                <strong style="color: #1e293b; font-size: 1.15rem; letter-spacing: -0.2px;">Q: ${card.question}</strong>
                <p style="color: #475569; margin: 0; line-height: 1.5;">A: ${card.answer}</p>
                
                <div style="display: flex; align-items: center; gap: 10px; margin-top: 6px; flex-wrap: wrap;">
                    <span style="color: #94a3b8; font-size: 0.75rem; font-weight: 500;">${categoryName}</span>
                    <span style="color: #e2e8f0;">|</span>
                    ${stageIcon}
                    ${statusHtml}
                </div>

                <div class="card-actions" style="display: flex; gap: 10px; margin-top: 14px;">
                    <button onclick="editCard('${card._id}')" 
                        style="${actionBtnBase} background:#f8fafc; color:#64748b;" 
                        onmouseover="this.style.backgroundColor='#f1f5f9'; this.style.color='#1e293b'" 
                        onmouseout="this.style.backgroundColor='#f8fafc'; this.style.color='#64748b'">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg> 
                        编辑
                    </button>
                    <button onclick="deleteCard('${card._id}')" 
                        style="${actionBtnBase} background:#fff1f2; color:#fb7185;" 
                        onmouseover="this.style.backgroundColor='#ffe4e6'; this.style.color='#e11d48'" 
                        onmouseout="this.style.backgroundColor='#fff1f2'; this.style.color='#fb7185'">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> 
                        删除
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderDashboard() {
    const elTotal = document.getElementById('dash-total-cards');
    const elStage0 = document.getElementById('dash-stage0-cards');
    const elStage1 = document.getElementById('dash-stage1-cards');
    if (elTotal) elTotal.innerText = allCards.length;
    if (elStage0) elStage0.innerText = allCards.filter(c => c.stage === 0).length;
    if (elStage1) elStage1.innerText = allCards.filter(c => c.stage >= 1).length;
}

// --- 5. 弹窗与增删改查 ---
function openAddCardModal() { 
    document.getElementById('modal-question').value = '';
    document.getElementById('modal-answer').value = '';

    const selectEl = document.getElementById('modal-category-select');
    if (currentCategoryId !== 'all' && currentCategoryId !== 'uncategorized') {
        selectEl.value = currentCategoryId; 
    } else {
        selectEl.value = ""; 
    }

    document.getElementById('modal-overlay').style.display = 'block'; 
    document.getElementById('add-card-modal').style.display = 'block'; 
}

function openBatchModal() { 
    document.getElementById('batch-input').value = ''; 
    
    const selectEl = document.getElementById('batch-category-select');
    if (currentCategoryId !== 'all' && currentCategoryId !== 'uncategorized') {
        selectEl.value = currentCategoryId;
    } else {
        selectEl.value = "";
    }

    document.getElementById('modal-overlay').style.display = 'block'; 
    document.getElementById('batch-modal').style.display = 'block'; 
}

function openCategoryModal() { document.getElementById('new-category-input').value = ''; document.getElementById('modal-overlay').style.display = 'block'; document.getElementById('category-modal').style.display = 'block'; }
function closeAllModals() { document.getElementById('modal-overlay').style.display = 'none'; document.querySelectorAll('.pro-modal').forEach(m => m.style.display = 'none'); }
function openModal(id) { document.getElementById('modal-overlay').style.display = 'block'; document.getElementById(id).style.display = 'block'; }

async function createFlashcardFromModal() {
    const question = document.getElementById('modal-question').value;
    const answer = document.getElementById('modal-answer').value;
    const categoryId = document.getElementById('modal-category-select').value || null;
    if (!question || !answer) return alert('请填写完整内容');
    try { await fetch('/api/flashcards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, answer, categoryId }) }); document.getElementById('modal-question').value = ''; document.getElementById('modal-answer').value = ''; closeAllModals(); loadFlashcards(); } catch (error) { console.error(error); }
}

function editCard(id) {
    const card = allCards.find(c => c._id === id);
    if (!card) return;
    editingCardId = id;
    document.getElementById('edit-question').value = card.question;
    document.getElementById('edit-answer').value = card.answer;
    document.getElementById('edit-category-select').value = card.category ? card.category._id : '';
    openModal('edit-card-modal');
}

async function updateCard() {
    const question = document.getElementById('edit-question').value;
    const answer = document.getElementById('edit-answer').value;
    let categoryId = document.getElementById('edit-category-select').value;
    if (categoryId === "") categoryId = null; 
    try { await fetch(`/api/flashcards/${editingCardId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, answer, categoryId }) }); closeAllModals(); loadFlashcards(); } catch (error) { console.error('更新失败:', error); }
}

async function deleteCard(id) { if (confirm('确定要彻底删除这张卡片吗？')) { try { await fetch(`/api/flashcards/${id}`, { method: 'DELETE' }); loadFlashcards(); } catch (error) { console.error(error); } } }

async function confirmBatchImport() {
    const text = document.getElementById('batch-input').value;
    const categoryId = document.getElementById('batch-category-select').value || null;
    if(!text.trim()) return alert('请输入内容');
    const lines = text.split('\n');
    for (let line of lines) {
        let parts = line.split('\t'); if (parts.length < 2) parts = line.split(/[|｜]/);
        if (parts.length >= 2) { await fetch('/api/flashcards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: parts[0].trim(), answer: parts[1].trim(), categoryId }) }); }
    }
    closeAllModals(); loadFlashcards();
}

// ==========================================
// 📖 核心学习逻辑与全键盘监听
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
// ✨ 关键修复：名字与 HTML 一致
function startStudyMode() {
    const limitInput = document.getElementById('study-limit');
    const maxCards = limitInput ? parseInt(limitInput.value) || 20 : 20;
    const now = new Date();
    
    let dueCards = allCards.filter(card => {
        const date = card.nextReviewDate ? new Date(card.nextReviewDate) : new Date(0);
        const isDue = date <= now;
        
        let isMatch = false;
        if (currentCategoryId === 'all') {
            isMatch = true;
        } else if (currentCategoryId === 'uncategorized') {
            isMatch = !card.category; 
        } else if (card.category) {
            isMatch = (card.category._id === currentCategoryId) || (card.category.parentId === currentCategoryId);
        }
        
        return isDue && isMatch;
    });

    if (dueCards.length === 0) return alert('太棒了！当前分类下没有需要复习的卡片！');
    dueCards.sort((a, b) => (b.interval || 0) - (a.interval || 0) || Math.random() - 0.5);
    studyCards = dueCards.slice(0, maxCards); currentStudyIndex = 0;
    showMainView('study-view'); renderStudyCard();
}

function renderStudyCard() {
    if (currentStudyIndex >= studyCards.length) { alert('恭喜你，完成了本次复习！'); return showMainView('manage-view'); }
    const card = studyCards[currentStudyIndex];
    document.getElementById('study-question').innerText = card.question; document.getElementById('study-answer').innerText = card.answer;
    const cardInner = document.getElementById('card-inner'); if (cardInner) cardInner.classList.remove('is-flipped');
    
    const centerProgress = document.getElementById('study-progress-center');
    if (centerProgress) {
        centerProgress.innerText = `${currentStudyIndex + 1} / ${studyCards.length}`;
    }
    document.getElementById('progress-bar-fill').style.width = `${((currentStudyIndex + 1) / studyCards.length) * 100}%`;
}

function flipCard() { document.getElementById('card-inner').classList.toggle('is-flipped'); }
function nextStudyCard() { currentStudyIndex++; renderStudyCard(); }
function prevStudyCard() { if (currentStudyIndex > 0) { currentStudyIndex--; renderStudyCard(); } }

// ✨ 1. 核心复习提交逻辑 (防弹容错版)
async function submitReview(isKnown) {
    // 🛡️ 防弹衣 1：如果数组为空或越界，立刻拦截，防止崩溃！
    if (!studyCards || studyCards.length === 0 || currentStudyIndex >= studyCards.length) return;

    const currentCard = studyCards[currentStudyIndex];
    
    // 🛡️ 防弹衣 2：网络请求失败绝不准卡死本地界面
    try { 
        await fetch(`/api/flashcards/${currentCard._id}/review`, { 
            method: 'PATCH', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ isKnown }) 
        }); 
    } catch (e) {
        console.warn("网络开小差了，但不影响本地背单词哦~");
    }
    
    // ✨ 核心机制：本地立刻篡改数据
    if (isKnown) {
        currentCard.nextReviewDate = new Date(Date.now() + 86400000).toISOString(); 
        currentCard.stage = (currentCard.stage || 0) + 1; 
    } else {
        studyCards.push(currentCard); // 答错无情塞回队尾
    }
    
    // 走向下一题
    nextStudyCard();
}

function markAsKnown() { submitReview(true); }
function markAsReview() { submitReview(false); }

// ✨ 2. 必须配套更新的“下一题”逻辑
function nextStudyCard() {
    currentStudyIndex++;
    
    // 🛡️ 防弹衣 3：安全判断是否已经背完？
    if (currentStudyIndex >= studyCards.length) {
        // 延迟 100 毫秒弹窗，让最后一个按钮的点击动画能播完，体验更好
        setTimeout(() => {
            alert('🎉 恭喜！本次复习任务已全部搞定！');
            showMainView('manage-view'); // 切回列表界面
            loadFlashcards(); // 重新向服务器拉取最新数据，刷新全局状态
        }, 100);
        return;
    }
    
    // 如果还没背完，继续渲染下一张卡
    renderStudyCard();
}

// --- 2. 默写模式 ---
function startSpellMode() {
    const limitInput = document.getElementById('study-limit');
    const maxCards = limitInput ? parseInt(limitInput.value) || 20 : 20;
    const now = new Date();
    
    let dueCards = allCards.filter(card => {
            // 1. 判断是否“到期” (SM-2 算法给出的下次复习时间 <= 当前时间)
            const date = card.nextReviewDate ? new Date(card.nextReviewDate) : new Date(0);
            const isDue = date <= now; 
            
            // 2. 判断是否“有资格” (必须是背熟了的，stage >= 1)
            const isReadyForSpell = card.stage >= 1; 
            
            // 3. 判断是否属于当前选中的分类
            let isMatch = false;
            if (currentCategoryId === 'all') {
                isMatch = true;
            } else if (currentCategoryId === 'uncategorized') {
                isMatch = !card.category;
            } else if (card.category) {
                isMatch = (card.category._id === currentCategoryId) || (card.category.parentId === currentCategoryId);
            }
            
            // ✨ 关键修复：必须同时满足“有资格”且“到期了”，才会被抓出来默写！
            return isReadyForSpell && isMatch && isDue; 
        });

    if (dueCards.length === 0) return alert('提示：当前没有[可默写]的单词！\n\n原因可能是：\n1. 单词都已复习完\n2. 单词还处于初级阶段，请先在[背诵模式]里将它们背对 1 次，才能解锁默写哦！');
    dueCards.sort((a, b) => (b.interval || 0) - (a.interval || 0) || Math.random() - 0.5);
    spellCards = dueCards.slice(0, maxCards); 
    currentSpellIndex = 0;
    showMainView('spell-view'); 
    renderSpellCard();
}

function renderSpellCard() {
    if (currentSpellIndex >= spellCards.length) { alert('恭喜你，完成了所有的拼写检验！'); return showMainView('manage-view'); }
    const card = spellCards[currentSpellIndex];
    document.getElementById('spell-question').innerText = card.question || '（空问题）';
    const inputEl = document.getElementById('spell-input'); inputEl.value = ''; inputEl.disabled = false; inputEl.focus(); 
    document.getElementById('spell-feedback').innerHTML = ''; document.getElementById('spell-next-control').classList.add('hidden');
    
    document.getElementById('spell-prev-btn').style.display = currentSpellIndex === 0 ? 'none' : 'inline-flex';
}

function prevSpellCard() { if (currentSpellIndex > 0) { currentSpellIndex--; renderSpellCard(); } }
function nextSpellCard() { currentSpellIndex++; renderSpellCard(); }
function handleSpellEnter(event) { if (event.key === 'Enter') { const inputEl = document.getElementById('spell-input'); if (inputEl.disabled) nextSpellCard(); else checkSpelling(); } }

async function checkSpelling() {
    const inputEl = document.getElementById('spell-input');
    if (inputEl.disabled) return nextSpellCard(); 
    const inputStr = inputEl.value.trim().toLowerCase(); 
    if (inputStr === '') { inputEl.style.borderColor = '#e53e3e'; inputEl.placeholder = '请先输入单词哦！'; setTimeout(() => { inputEl.style.borderColor = 'transparent'; inputEl.placeholder = '请在此输入答案...'; }, 1500); return; }

    const card = spellCards[currentSpellIndex];
    const answerStr = card.answer.trim().toLowerCase();  
    const feedbackEl = document.getElementById('spell-feedback'); inputEl.disabled = true; 
    const isCorrect = (inputStr === answerStr);

    if (isCorrect) {
        feedbackEl.innerHTML = '<div style="display:flex;align-items:center;gap:6px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#48bb78" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> <strong>拼写正确！完全掌握！</strong></div>'; 
        feedbackEl.style.color = '#48bb78'; speakWord(card.answer, null); 
        
        // ✨ 核心修复：拼写正确，推迟到明天复习，并继续升级！
        card.nextReviewDate = new Date(Date.now() + 86400000).toISOString();
        card.stage = (card.stage || 0) + 1;
    } else {
        feedbackEl.innerHTML = `<div style="display:flex;align-items:flex-start;gap:6px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" stroke-width="2.5" style="flex-shrink:0;margin-top:2px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> <div><strong>拼写错误。卡片已降级，请重新通过背诵找回语感。</strong><br><br>你的输入：<span style="color:red; text-decoration: line-through;">${inputStr}</span><br>正确答案：<span style="color:green;">${card.answer}</span></div></div>`;
        feedbackEl.style.color = '#e53e3e'; 
        spellCards.push(card); 
        
        // ✨ 核心修复：拼写错误，无情降级！
        card.stage = Math.max(0, (card.stage || 0) - 1);
    }
    try { await fetch(`/api/flashcards/${card._id}/review`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isKnown: isCorrect }) }); } catch(e) {}
    document.getElementById('spell-next-control').classList.remove('hidden');
}

// --- 6. 全局键盘快捷键 ---
document.addEventListener('keydown', function(event) {
    const activeTag = document.activeElement.tagName.toLowerCase();
    const isTyping = (activeTag === 'input' || activeTag === 'textarea');
    const isSpellInput = (document.activeElement.id === 'spell-input');
    if (isTyping && !isSpellInput) return;
    const studyArea = document.getElementById('study-view'); const spellArea = document.getElementById('spell-view');

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
            case 'Enter': case 'NumpadEnter': const inputEl = document.getElementById('spell-input'); if (inputEl && inputEl.disabled) { event.preventDefault(); nextSpellCard(); } break;
        }
    }
});

// ✨ 快捷新建子分类逻辑
function quickCreateSubCategory(event, parentId) {
    event.stopPropagation(); // 防止触发文件夹的选择事件
    
    // 1. 打开弹窗
    openCategoryModal();
    
    // 2. 自动选中父级文件夹
    const parentSelect = document.getElementById('parent-category-select');
    if (parentSelect) {
        parentSelect.value = parentId;
    }
}

// ✨ 移动端侧边栏切换逻辑
function toggleMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobile-sidebar-overlay');
    
    sidebar.classList.toggle('mobile-active');
    overlay.classList.toggle('active');
}

// ✨ 修改原有的 selectSidebarItem 函数，加入自动关闭功能
const originalSelectSidebarItem = selectSidebarItem;
selectSidebarItem = function(id, title, type, element) {
    originalSelectSidebarItem(id, title, type, element);
    
    // 如果是手机端，点击完选项自动收起菜单
    if (window.innerWidth <= 768) {
        toggleMobileSidebar();
    }
};

function toggleMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobile-overlay');
    
    if (sidebar.classList.contains('mobile-active')) {
        sidebar.classList.remove('mobile-active');
        overlay.style.display = 'none';
    } else {
        sidebar.classList.add('mobile-active');
        overlay.style.display = 'block';
    }
}

// ✨ 2. 移动端侧边栏切换逻辑
function toggleMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobile-overlay');
    if(!sidebar || !overlay) return;
    
    if (sidebar.classList.contains('mobile-active')) {
        sidebar.classList.remove('mobile-active');
        overlay.style.display = 'none';
    } else {
        sidebar.classList.add('mobile-active');
        overlay.style.display = 'block';
    }
}

// ✨ 3. 侧边栏点击逻辑 (防弹版)
function selectSidebarItem(id, title, type, element) {
    try {
        currentCategoryId = id;
        
        const titleEl = document.getElementById('current-view-title');
        if (titleEl) titleEl.textContent = title;

        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        if (element) {
            element.classList.add('active');
        } else {
            const root = document.querySelector('.root-nav');
            if (root) root.classList.add('active');
        }

        renderCards(); // 重新渲染卡片
        showMainView('dashboard-view'); // ⚠️ 确保你的 index.html 里有 id 为 dashboard-view 的元素，如果没有，请改成 'manage-view'

        // 手机端自动收起侧边栏
        if (window.innerWidth <= 768) {
            const sidebar = document.querySelector('.sidebar');
            const overlay = document.getElementById('mobile-overlay');
            if (sidebar) sidebar.classList.remove('mobile-active');
            if (overlay) overlay.style.display = 'none';
        }
    } catch (error) {
        console.error("侧边栏点击报错拦截:", error);
    }
}