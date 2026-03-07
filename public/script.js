// ==========================================
// 🔌 Flashcard Pro V2.0 终极控制逻辑 (纯净无错版)
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

    // 强行接管“添加”按钮，绑定带有智能预填分类的专属函数
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

    // 退出学习模式回到主界面时，静默去服务器拉取最新卡片状态！
    if (viewId === 'manage-view' || viewId === 'dashboard-view') {
        loadFlashcards();
    }
}

// --- 2. 侧边栏与文件夹管理 ---
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        allCategories = await response.json();

        const sidebarMenu = document.getElementById('sidebar-menu');
        if (sidebarMenu) {
            const icons = {
                dashboard: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>`,
                all: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
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
            html += `
                <li class="nav-item ${currentCategoryId === 'uncategorized' ? 'active' : ''}" style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;" onclick="selectSidebarItem('uncategorized', '未分类区', 'vocabulary', this)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 20px;"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    <span style="color: #475569;">未分类区</span>
                </li>
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
                    const cIcon = icons.doc;
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

// ✨ 1. 修复文件夹展开/折叠功能
function toggleFolder(event, folderId) {
    event.stopPropagation(); // 关键：拦截点击，防止触发“选中文件夹”
    const childrenContainer = document.getElementById(`children-of-${folderId}`);
    const arrowIcon = event.currentTarget; 
    
    if (childrenContainer.style.display === 'none') {
        childrenContainer.style.display = 'block';
        collapsedFolders.delete(folderId);
        arrowIcon.innerHTML = icons.arrowDown; // 变向下箭头
    } else {
        childrenContainer.style.display = 'none';
        collapsedFolders.add(folderId);
        arrowIcon.innerHTML = icons.arrowRight; // 变向右箭头
    }
}

function toggleRoot(event) {
    event.stopPropagation();
    const container = document.getElementById('user-folders-container');
    const arrowIcon = event.currentTarget;
    
    if (container.style.display === 'none') {
        container.style.display = 'block';
        rootCollapsed = false;
        arrowIcon.innerHTML = icons.arrowDown;
    } else {
        container.style.display = 'none';
        rootCollapsed = true;
        arrowIcon.innerHTML = icons.arrowRight;
    }
}
// ✨ 侧边栏点击逻辑 (终极容错版)
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

        const settingsBtn = document.getElementById('category-settings-btn');
        if (settingsBtn) {
            if (id !== 'all' && id !== 'uncategorized' && id !== 'dashboard') {
                settingsBtn.classList.remove('hidden');
            } else {
                settingsBtn.classList.add('hidden');
            }
        }

        // ⚠️ 关键：必须切回到 manage-view 才能看到卡片
        showMainView('manage-view'); 
        renderCards();

        // 手机端自动收起侧边栏
        if (window.innerWidth <= 768) {
            toggleMobileSidebar();
        }
    } catch (error) {
        console.error("侧边栏点击报错拦截:", error);
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
    
    if (window.innerWidth <= 768) {
        toggleMobileSidebar();
    }
}

// ✨ 移动端菜单切换逻辑 (仅保留此唯一版本)
function toggleMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobile-overlay');
    if(!sidebar || !overlay) return;
    
    sidebar.classList.toggle('mobile-active');
    if (sidebar.classList.contains('mobile-active')) {
        overlay.style.display = 'block';
    } else {
        overlay.style.display = 'none';
    }
}

// ✨ 快捷新建子分类逻辑
// ✨ 2. 快捷新建子分类 (带手机端自动收起)
// ✨ 终极版：快捷新建分类 (100% 自动收起侧边栏)
function quickCreateSubCategory(event, parentId) {
    // 1. 拦截点击，防止触发背后的文件夹
    if (event) event.stopPropagation(); 
    
    // 2. 呼出新建弹窗
    openCategoryModal();
    
    // 3. 自动帮你选好归属文件夹 (加50毫秒延迟，确保弹窗已经完全渲染出来)
    setTimeout(() => {
        const parentSelect = document.getElementById('parent-category-select');
        if (parentSelect) parentSelect.value = parentId;
    }, 50);
    
    // 4. 暴力收起侧边栏 (放宽屏幕尺寸到 1024px，涵盖所有大屏手机和平板)
    if (window.innerWidth <= 1024) { 
        const sidebar = document.querySelector('.sidebar');
        // 兼容查找所有可能叫这个名字的遮罩层，绝不漏网
        const overlays = document.querySelectorAll('#mobile-overlay, #mobile-sidebar-overlay, .mobile-overlay');
        
        if (sidebar) {
            sidebar.classList.remove('mobile-active');
        }
        overlays.forEach(overlay => {
            overlay.style.display = 'none';
            overlay.classList.remove('active');
        });
    }
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
        
        const rootItem = document.querySelector('.root-nav');
        selectSidebarItem('all', '所有卡片', 'vocabulary', rootItem);
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
        
        if (document.getElementById('manage-view') && !document.getElementById('manage-view').classList.contains('hidden')) {
            filterCards(); 
        }
        if(document.getElementById('dashboard-view') && !document.getElementById('dashboard-view').classList.contains('hidden')) {
            renderDashboard(); 
        }
    } catch (error) { console.error('加载卡片失败:', error); }
}

function filterCards() {
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    let filtered = allCards;
    
    if (currentCategoryId !== 'all') {
        filtered = allCards.filter(card => {
            if (currentCategoryId === 'uncategorized') return !card.category; 
            if (!card.category) return false; 
            return card.category._id === currentCategoryId || card.category.parentId === currentCategoryId;
        });
    }

    if (searchTerm) {
        filtered = filtered.filter(card => card.question.toLowerCase().includes(searchTerm) || card.answer.toLowerCase().includes(searchTerm));
    }
    
    renderCards(filtered);
}

function renderCards(cardsToRender = null) {
    if (!cardsToRender) {
        // 如果没有传入特定数据，就重新走一遍过滤逻辑
        filterCards();
        return;
    }

    const list = document.getElementById('flashcards-list');
    if (!list) return;

    if (cardsToRender.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding: 60px 20px; color: #94a3b8; font-size: 0.95rem; grid-column: 1 / -1;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" style="margin-bottom:12px; display:block; margin-left:auto; margin-right:auto;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            这里空空如也，赶快添加或导入几张卡片吧！
        </div>`;
        return;
    }

    const now = new Date();
    const getBadgeStyle = (bg, color) => `display:inline-flex; align-items:center; gap:4px; padding:2px 10px; border-radius:12px; font-size:0.75rem; font-weight:600; background:${bg}; color:${color};`;
    const actionBtnStyle = "display:inline-flex; align-items:center; gap:6px; padding:6px 14px; border-radius:8px; border:none; cursor:pointer; font-size:0.85rem; font-weight:500; transition:0.2s;";

    list.innerHTML = cardsToRender.map(card => {
        const categoryName = card.category ? card.category.name : '未分类区';
        const reviewDate = card.nextReviewDate ? new Date(card.nextReviewDate) : now;
        const isDue = reviewDate <= now;
        
        const stageHtml = card.stage >= 1 
            ? `<span style="${getBadgeStyle('#fef3c7', '#b45309')}">可默写</span>` 
            : `<span style="${getBadgeStyle('#f1f5f9', '#64748b')}">🐢 待进阶</span>`;

        const statusHtml = isDue 
            ? `<span style="${getBadgeStyle('#fff1f2', '#e11d48')}">待复习</span>` 
            : `<span style="${getBadgeStyle('#ecfdf5', '#059669')}">已同步</span>`;

        return `
            <div class="card-item" style="padding: 24px; border-radius: 20px; background: white; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02); display: flex; flex-direction: column; gap: 10px; transition: 0.3s;" onmouseover="this.style.borderColor='#e2e8f0'; this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='#f1f5f9'; this.style.transform='translateY(0)'">
                <strong style="color: #1e293b; font-size: 1.15rem; letter-spacing: -0.2px;">Q: ${card.question}</strong>
                <p style="color: #475569; margin: 0; line-height: 1.5;">A: ${card.answer}</p>
                
                <div style="display: flex; align-items: center; gap: 10px; margin-top: 6px; flex-wrap: wrap;">
                    <span style="color: #94a3b8; font-size: 0.75rem; font-weight: 500;">${categoryName}</span>
                    <span style="color: #e2e8f0;">|</span>
                    ${stageHtml}
                    ${statusHtml}
                </div>

                <div class="card-actions" style="display: flex; gap: 10px; margin-top: 14px;">
                    <button onclick="editCard('${card._id}')" 
                        style="${actionBtnStyle} background:#f8fafc; color:#64748b;" 
                        onmouseover="this.style.backgroundColor='#f1f5f9'; this.style.color='#1e293b'" 
                        onmouseout="this.style.backgroundColor='#f8fafc'; this.style.color='#64748b'">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg> 
                        编辑
                    </button>
                    <button onclick="deleteCard('${card._id}')" 
                        style="${actionBtnStyle} background:#fff1f2; color:#fb7185;" 
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
    if (elStage0) elStage0.innerText = allCards.filter(c => c.stage === 0 || !c.stage).length;
    if (elStage1) elStage1.innerText = allCards.filter(c => c.stage >= 1).length;
}

// --- 5. 弹窗与增删改查 ---
function openAddCardModal() { 
    document.getElementById('modal-question').value = '';
    document.getElementById('modal-answer').value = '';
    const selectEl = document.getElementById('modal-category-select');
    if (currentCategoryId !== 'all' && currentCategoryId !== 'uncategorized' && currentCategoryId !== 'dashboard') {
        selectEl.value = currentCategoryId; 
    } else {
        selectEl.value = ""; 
    }
    openModal('add-card-modal');
}

function openBatchModal() { 
    document.getElementById('batch-input').value = ''; 
    const selectEl = document.getElementById('batch-category-select');
    if (currentCategoryId !== 'all' && currentCategoryId !== 'uncategorized' && currentCategoryId !== 'dashboard') {
        selectEl.value = currentCategoryId;
    } else {
        selectEl.value = "";
    }
    openModal('batch-modal');
}

function openCategoryModal() { document.getElementById('new-category-input').value = ''; openModal('category-modal'); }
function closeAllModals() { document.getElementById('modal-overlay').style.display = 'none'; document.querySelectorAll('.pro-modal').forEach(m => m.style.display = 'none'); }
function openModal(id) { document.getElementById('modal-overlay').style.display = 'block'; document.getElementById(id).style.display = 'block'; }

async function createFlashcardFromModal() {
    const question = document.getElementById('modal-question').value;
    const answer = document.getElementById('modal-answer').value;
    const categoryId = document.getElementById('modal-category-select').value || null;
    if (!question || !answer) return alert('请填写完整内容');
    try { await fetch('/api/flashcards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, answer, categoryId }) }); closeAllModals(); loadFlashcards(); } catch (error) { console.error(error); }
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

// ✨ 完美适配你 UI 的批量导入核心逻辑
// ✨ 终极批量导入：智能抓取分类 + 暴力过滤垃圾字符 + 报错透传
async function confirmBatchImport(event) {
    // 1. 兼容抓取输入框（无论你 HTML 里叫 batch-input 还是 import-text，统统拿下）
    const textInput = document.getElementById('batch-input') || document.getElementById('import-text');
    // 兼容抓取下拉分类框
    const categorySelect = document.getElementById('modal-category-select') || document.getElementById('import-category-select');
    
    if (!textInput || !textInput.value.trim()) {
        alert("⚠️ 请输入需要导入的单词！");
        return;
    }

    const text = textInput.value.trim();
    const lines = text.split('\n');
    const newCards = [];
    
    // 2. 智能确定要存入哪个文件夹
    let categoryId = null;
    if (categorySelect && categorySelect.value) {
        categoryId = categorySelect.value; // 优先取你弹窗里选的文件夹
    } else if (currentCategoryId && currentCategoryId !== 'all' && currentCategoryId !== 'uncategorized') {
        categoryId = currentCategoryId; // 备用：取你左侧高亮的文件夹
    }

    // 3. 强力解析引擎
    for (let line of lines) {
        line = line.trim();
        // 🔪 过滤 1：跳过空行、表头
        if (!line || line.toLowerCase().includes('english') || line.includes('中文')) continue; 
        
        // 🔪 过滤 2 (关键修复)：暴力踢掉全都是减号和竖线的排版行 (例如 |---------|------|)
        if (/^[\-\|\s]+$/.test(line)) continue;

        let parts = [];
        if (line.startsWith('|') && line.endsWith('|')) {
            parts = line.split('|').map(p => p.trim()).filter(p => p !== ''); 
        } else if (line.includes('|')) {
            parts = line.split('|').map(p => p.trim());
        } else {
            parts = line.split(/\t+| {2,}| - |:/); 
        }

        // ... 前面的解析代码保持不变 ...
        
        if (parts.length >= 2) {
            newCards.push({
                question: parts[0],
                answer: parts[1],
                categoryId: categoryId // 🔴 关键修复：把 category 改成了 categoryId！和你的单张添加保持绝对一致！
            });
        }
    }

    if (newCards.length === 0) {
        alert("❌ 没有识别到有效的卡片！请检查格式是否正确。");
        return;
    }

    // 4. 发送给后端并记录成功率
    try {
        let successCount = 0;
        for (const card of newCards) {
            const response = await fetch('/api/flashcards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(card)
            });
            
            if (response.ok) {
                successCount++;
            } else {
                // 🕵️‍♂️ 抓虫神器：如果后端还是拒收，直接把后端的“骂人话”打印出来！
                const errData = await response.json().catch(()=>({}));
                console.error("后端拒绝了这张卡:", card, "原因:", errData);
            }
        }

        alert(`🎉 解析了 ${newCards.length} 张，实际成功存入数据库 ${successCount} 张！`);
        
        // 5. 收尾：关弹窗、清数据、重渲染
        if (successCount > 0) {
            textInput.value = ''; 
            
            // 兼容各种关弹窗的方法
            if (typeof closeAllModals === 'function') {
                closeAllModals(); 
            } else {
                const modal = textInput.closest('div[style*="position: fixed"]');
                if (modal) modal.style.display = 'none';
            }
            
            if (typeof renderCards === 'function') renderCards(); 
        }

    } catch (error) {
        console.error("批量导入网络报错:", error);
        alert("⚠️ 导入过程出现网络异常，请看控制台。");
    }
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
    if (currentStudyIndex >= studyCards.length) { 
        alert('恭喜你，完成了本次复习！'); 
        showMainView('manage-view');
        return; 
    }
    const card = studyCards[currentStudyIndex];
    document.getElementById('study-question').innerText = card.question; 
    document.getElementById('study-answer').innerText = card.answer;
    const cardInner = document.getElementById('card-inner'); if (cardInner) cardInner.classList.remove('is-flipped');
    
    const centerProgress = document.getElementById('study-progress-center');
    if (centerProgress) centerProgress.innerText = `${currentStudyIndex + 1} / ${studyCards.length}`;
    document.getElementById('progress-bar-fill').style.width = `${((currentStudyIndex + 1) / studyCards.length) * 100}%`;
}

function flipCard() { document.getElementById('card-inner').classList.toggle('is-flipped'); }

// ✨ 3. 提交背诵对错结果 (绝对流畅版)
function submitReview(isKnown) {
    if (!studyCards || studyCards.length === 0 || currentStudyIndex >= studyCards.length) return;
    
    const currentCard = studyCards[currentStudyIndex];
    
    // 1. 本地逻辑：立刻执行，绝不卡顿
    if (isKnown) {
        currentCard.nextReviewDate = new Date(Date.now() + 86400000).toISOString();
        currentCard.stage = (currentCard.stage || 0) + 1;
    } else {
        studyCards.push(currentCard); // 答错了，默默塞回队尾
    }
    
    // 2. 后台静默通知服务器 (不用 await，不卡界面)
    try { 
        fetch(`/api/flashcards/${currentCard._id}/review`, { 
            method: 'PATCH', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ isKnown }) 
        }); 
    } catch (e) { console.warn("后台同步稍后重试", e); }
    
    // 3. 走向下一张
    currentStudyIndex++;
    
    // 判断是否背完了
    if (currentStudyIndex >= studyCards.length) {
        setTimeout(() => {
            alert('🎉 恭喜！本次背诵任务圆满完成！');
            showMainView('manage-view'); 
        }, 150);
    } else {
        renderStudyCard(); // 渲染下一张卡片
    }
}

function nextStudyCard() {
    currentStudyIndex++;
    if (currentStudyIndex >= studyCards.length) {
        setTimeout(() => {
            alert('🎉 恭喜！本次复习任务已全部搞定！');
            showMainView('manage-view');
        }, 150);
        return;
    }
    renderStudyCard();
}

function prevStudyCard() { if (currentStudyIndex > 0) { currentStudyIndex--; renderStudyCard(); } }
function markAsKnown() { submitReview(true); }
function markAsReview() { submitReview(false); }

// --- 2. 默写模式 ---
function startSpellMode() {
    const limitInput = document.getElementById('study-limit');
    const maxCards = limitInput ? parseInt(limitInput.value) || 20 : 20;
    const now = new Date();
    
    let dueCards = allCards.filter(card => {
            const date = card.nextReviewDate ? new Date(card.nextReviewDate) : new Date(0);
            const isDue = date <= now; 
            const isReadyForSpell = card.stage >= 1; 
            
            let isMatch = false;
            if (currentCategoryId === 'all') {
                isMatch = true;
            } else if (currentCategoryId === 'uncategorized') {
                isMatch = !card.category;
            } else if (card.category) {
                isMatch = (card.category._id === currentCategoryId) || (card.category.parentId === currentCategoryId);
            }
            return isReadyForSpell && isMatch && isDue; 
        });

    if (dueCards.length === 0) return alert('提示：当前没有[可默写]的单词！\n\n原因可能是：\n1. 单词都已复习完\n2. 单词还处于初级阶段，请先在[背诵模式]里背对1次解锁默写！');
    dueCards.sort((a, b) => (b.interval || 0) - (a.interval || 0) || Math.random() - 0.5);
    spellCards = dueCards.slice(0, maxCards); currentSpellIndex = 0;
    showMainView('spell-view'); renderSpellCard();
}

function renderSpellCard() {
    if (currentSpellIndex >= spellCards.length) { 
        alert('恭喜你，完成了所有的拼写检验！'); 
        showMainView('manage-view');
        return; 
    }
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
        card.nextReviewDate = new Date(Date.now() + 86400000).toISOString();
        card.stage = (card.stage || 0) + 1;
    } else {
        feedbackEl.innerHTML = `<div style="display:flex;align-items:flex-start;gap:6px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" stroke-width="2.5" style="flex-shrink:0;margin-top:2px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> <div><strong>拼写错误。卡片已降级，请重新通过背诵找回语感。</strong><br><br>你的输入：<span style="color:red; text-decoration: line-through;">${inputStr}</span><br>正确答案：<span style="color:green;">${card.answer}</span></div></div>`;
        feedbackEl.style.color = '#e53e3e'; 
        spellCards.push(card); 
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