// ==========================================
// 🔌 Flashcard Pro V2.0 终极UI修复版 (极简丝滑+手势引擎)
// ==========================================

// 🛡️ [终极防线]：通过 JS 强行注入移动端抽屉样式，彻底解决侧边栏挤压卡片的问题！
const styleFix = document.createElement('style');
styleFix.innerHTML = `
    @media (max-width: 768px) {
        .sidebar {
            position: fixed !important;
            top: 0;
            left: -100% !important; /* 默认隐藏在屏幕左侧之外 */
            width: 280px !important;
            height: 100vh !important;
            z-index: 1000 !important;
            transition: left 0.3s ease-in-out !important;
            background: white !important;
            box-shadow: 4px 0 15px rgba(0,0,0,0.1) !important;
        }
        .sidebar.mobile-active {
            left: 0 !important; /* 呼出时滑入屏幕 */
        }
        #mobile-overlay {
            z-index: 999 !important; /* 确保遮罩层在侧边栏下面，在卡片上面 */
        }
    }
`;
document.head.appendChild(styleFix);

let allCards = []; 
let allCategories = []; 
let currentCategoryId = 'all'; 
let editingCardId = null;

let collapsedFolders = new Set();
let rootCollapsed = false; 

document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadFlashcards();

    // 强行接管“添加”按钮
    const addBtn = document.getElementById('btn-add-card');
    if (addBtn) {
        addBtn.onclick = (e) => {
            e.preventDefault();
            openAddCardModal();
        };
    }

    // 🛡️ 确保手机端遮罩层存在并绑定点击收起事件
    let overlay = document.getElementById('mobile-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'mobile-overlay';
        overlay.style.display = 'none';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.4)';
        overlay.style.backdropFilter = 'blur(2px)';
        document.body.appendChild(overlay);
    }
    // 点击遮罩层，自动收起侧边栏
    overlay.onclick = () => {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && sidebar.classList.contains('mobile-active')) {
            toggleMobileSidebar();
        }
    };
});

// --- 1. 视图切换引擎 ---
// --- 1. 视图切换引擎 (🌟 新增沉浸式学习状态管理) ---
function showMainView(viewId) {
    const views = ['manage-view', 'study-view', 'spell-view', 'dashboard-view']; 
    views.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    const target = document.getElementById(viewId);
    if (target) target.classList.remove('hidden');

    // ==== 🌟 沉浸式引擎：控制顶部多余按钮的显隐 ====
    const headerActions = document.querySelector('.header-actions');
    const limitInput = document.getElementById('study-limit');
    const limitContainer = limitInput ? limitInput.parentElement : null; // 抓取包裹复习张数的容器

    if (viewId === 'manage-view' || viewId === 'dashboard-view') {
        // 场景 A：回到主页面（退出学习模式） -> 恢复所有功能按钮
        if (headerActions) headerActions.style.display = 'flex';
        // 恢复复习张数输入框
        if (limitContainer && limitContainer.tagName !== 'BODY') limitContainer.style.display = ''; 
        loadFlashcards(); // 重新加载卡片数据
    } else {
        // 场景 B：进入背诵或默写模式 -> 强行进入沉浸状态，清场！
        if (headerActions) headerActions.style.display = 'none'; // 隐藏添加/背诵/默写等按钮
        if (limitContainer && limitContainer.tagName !== 'BODY') limitContainer.style.display = 'none'; // 隐藏复习张数框
    }
    
    // 动态控制“未分类区”的清空按钮：只有在主页面的未分类区才显示
    const clearBtn = document.getElementById('btn-clear-uncategorized');
    if (clearBtn) {
        if (currentCategoryId === 'uncategorized' && viewId === 'manage-view') {
            clearBtn.style.display = 'inline-flex';
        } else {
            clearBtn.style.display = 'none'; 
        }
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
                        
                        <div style="display: flex; align-items: center; gap: 8px; flex: 1; cursor: pointer;" onclick="handleParentClick(event, '${p._id}', '${p.name}', '${p.type}', this.parentElement)">
                            <div class="toggle-arrow" style="visibility: ${hasChildren ? 'visible' : 'hidden'}">${arrow}</div>
                            ${icon} <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;">${p.name}</span>
                        </div>
                        
                        <div class="folder-actions" onclick="quickCreateSubCategory(event, '${p._id}')" title="在此文件夹下新建" style="cursor: pointer; padding: 4px; color: #cbd5e1; transition: 0.2s;" onmouseover="this.style.color='#64748b'" onmouseout="this.style.color='#cbd5e1'">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
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
    
    const parents = allCategories.filter(c => !c.parentId);
    const children = allCategories.filter(c => c.parentId);

    let optionsHtml = `<option value="">(无) 请选择具体子文件夹...</option>`; 
    optionsHtml += `<option value="CREATE_NEW" style="color: #3b82f6; font-weight: bold;">快捷新建文件夹...</option>`;
    
    parents.forEach(p => {
        const myChildren = children.filter(c => c.parentId === p._id);
        optionsHtml += `<optgroup label="── ${p.name} ──">`;
        if (myChildren.length > 0) {
            myChildren.forEach(c => {
                optionsHtml += `<option value="${c._id}">  ${c.name}</option>`;
            });
        } else {
            optionsHtml += `<option value="" disabled>  (空目录，请先建子文件夹)</option>`;
        }
        optionsHtml += `</optgroup>`;
    });

    selects.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = optionsHtml;
    });

    const parentSelect = document.getElementById('parent-category-select');
    if (parentSelect) {
        parentSelect.innerHTML = '<option value="">(无) 作为顶级文件夹</option>';
        parents.forEach(cat => {
            parentSelect.innerHTML += `<option value="${cat._id}">归属于 -> ${cat.name}</option>`;
        });
    }
}

function toggleRoot(event) {
    event.stopPropagation();
    const container = document.getElementById('user-folders-container');
    const arrowIcon = event.currentTarget;
    
    if (container.style.display === 'none') {
        container.style.display = 'block';
        rootCollapsed = false;
        arrowIcon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
    } else {
        container.style.display = 'none';
        rootCollapsed = true;
        arrowIcon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
    }
}

// ✨ 侧边栏点击逻辑 (安全收起版)
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

        showMainView('manage-view'); 
        renderCards();

        // 📱 手机端：只有当它是打开状态时，才执行收起动作 (防止反向触发)
        if (window.innerWidth <= 768) {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar && sidebar.classList.contains('mobile-active')) {
                toggleMobileSidebar();
            }
        }
    } catch (error) {
        console.error("侧边栏点击报错拦截:", error);
    }
}

// ✨ 专属父级文件夹的完美双端逻辑
// ✨ 专属父级文件夹的【智能折叠】双端逻辑
// ✨ 手机端父级文件夹防抖防误触终极版 (纯净无状态版)
function handleParentClick(event, folderId, folderName, folderType, liElement) {
    // 1. 暴力拦截所有冒泡和默认事件，防止点击穿透
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const childrenContainer = document.getElementById(`children-of-${folderId}`);
    const arrowContainer = liElement.querySelector('.toggle-arrow');

    // 2. 纯粹的开关逻辑：看见关着就开，开着就关。彻底抛弃 isCurrentlySelected！
    if (childrenContainer) {
        const isHidden = childrenContainer.style.display === 'none' || childrenContainer.style.display === '';
        
        if (isHidden) {
            // 关着 -> 打开
            childrenContainer.style.display = 'block';
            collapsedFolders.delete(folderId);
            if (arrowContainer) arrowContainer.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
        } else {
            // 开着 -> 收起
            childrenContainer.style.display = 'none';
            collapsedFolders.add(folderId);
            if (arrowContainer) arrowContainer.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
        }
    }

    // 3. 📱 手机端核心隔离：只负责折叠/展开，绝不高亮！绝不记录状态！到此为止！
    if (window.innerWidth <= 1024) {
        return; 
    } 
    
    // 4. 💻 电脑大屏：不仅展开，还要选中并加载右侧卡片
    selectSidebarItem(folderId, folderName, folderType, liElement);
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
        const sidebar = document.querySelector('.sidebar');
        if(sidebar && sidebar.classList.contains('mobile-active')) toggleMobileSidebar();
    }
}

// ✨ 完美抽屉与遮罩切换
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

function quickCreateSubCategory(event, parentId) {
    if (event) event.stopPropagation(); 
    openCategoryModal();
    
    setTimeout(() => {
        const parentSelect = document.getElementById('parent-category-select');
        if (parentSelect) parentSelect.value = parentId;
    }, 50);
    
    if (window.innerWidth <= 1024) { 
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('mobile-overlay');
        if (sidebar) sidebar.classList.remove('mobile-active');
        if (overlay) overlay.style.display = 'none';
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
    
    if (currentCategoryId === 'all' || currentCategoryId === 'dashboard') {
        filtered = allCards;
    } 
    else if (currentCategoryId === 'uncategorized') {
        filtered = allCards.filter(card => {
            const catId = card.category ? (card.category._id || card.category) : card.categoryId;
            return !catId || catId === 'null' || catId === '';
        });
    } 
    else {
        const targetCategoryIds = new Set([currentCategoryId]);
        allCategories.forEach(cat => {
            if (cat.parentId === currentCategoryId) {
                targetCategoryIds.add(cat._id);
            }
        });

        filtered = allCards.filter(card => {
            const catId = card.category ? (card.category._id || card.category) : card.categoryId;
            return targetCategoryIds.has(catId);
        });
    }

    if (searchTerm) {
        filtered = filtered.filter(card => 
            (card.question && card.question.toLowerCase().includes(searchTerm)) || 
            (card.answer && card.answer.toLowerCase().includes(searchTerm))
        );
    }
    
    renderCards(filtered);
}

function renderCards(cardsToRender = null) {
    if (!cardsToRender) {
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
            : `<span style="${getBadgeStyle('#f1f5f9', '#64748b')}">待进阶</span>`;

        const statusHtml = isDue 
            ? `<span style="${getBadgeStyle('#fff1f2', '#e11d48')}">待复习</span>` 
            : `<span style="${getBadgeStyle('#ecfdf5', '#059669')}">已同步</span>`;

        const isChecked = selectedCards.has(card._id);
        const checkboxIcon = isChecked 
            ? `<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="#3b82f6" stroke-width="2"></circle><path d="M8 12l3 3 5-6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`
            : `<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="#cbd5e1" stroke-width="2"></circle></svg>`;

        const cardBorderColor = isChecked ? '#3b82f6' : '#f1f5f9';
        const cardHoverColor = isChecked ? '#3b82f6' : '#e2e8f0';

        return `
            <div class="card-item" onclick="toggleCardSelection('${card._id}')" style="cursor: ${isManageMode ? 'pointer' : 'default'}; padding: 24px; border-radius: 20px; background: white; border: 1px solid ${cardBorderColor}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02); display: flex; align-items: flex-start; transition: 0.3s;" onmouseover="this.style.borderColor='${cardHoverColor}'; this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='${cardBorderColor}'; this.style.transform='translateY(0)'">
                
                <div id="checkbox-wrap-${card._id}" style="display: ${isManageMode ? 'block' : 'none'}; margin-right: 16px; margin-top: 2px; flex-shrink: 0;">
                    ${checkboxIcon}
                </div>

                <div style="display: flex; flex-direction: column; gap: 10px; flex: 1;">
                    <strong style="color: #1e293b; font-size: 1.15rem; letter-spacing: -0.2px;">Q: ${card.question}</strong>
                    <p style="color: #475569; margin: 0; line-height: 1.5;">A: ${card.answer}</p>
                    
                    <div style="display: flex; align-items: center; gap: 10px; margin-top: 6px; flex-wrap: wrap;">
                        <span style="color: #94a3b8; font-size: 0.75rem; font-weight: 500;">${categoryName}</span>
                        <span style="color: #e2e8f0;">|</span>
                        ${stageHtml}
                        ${statusHtml}
                    </div>

                    <div class="card-actions" style="display: flex; gap: 10px; margin-top: 14px;">
                        <button onclick="event.stopPropagation(); editCard('${card._id}')" 
                            style="${actionBtnStyle} background:#f8fafc; color:#64748b;" 
                            onmouseover="this.style.backgroundColor='#f1f5f9'; this.style.color='#1e293b'" 
                            onmouseout="this.style.backgroundColor='#f8fafc'; this.style.color='#64748b'">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg> 
                            编辑
                        </button>
                        <button onclick="event.stopPropagation(); deleteCard('${card._id}')" 
                            style="${actionBtnStyle} background:#fff1f2; color:#fb7185;" 
                            onmouseover="this.style.backgroundColor='#ffe4e6'; this.style.color='#e11d48'" 
                            onmouseout="this.style.backgroundColor='#fff1f2'; this.style.color='#fb7185'">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> 
                            删除
                        </button>
                    </div>
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
    if (typeof injectQuickCategoryModal === 'function') injectQuickCategoryModal();
    
    selectEl.onchange = function() {
        if (this.value === 'CREATE_NEW') {
            window.quickCreateSourceDropdown = 'modal-category-select';
            window.quickCreateSourceModal = 'add-card-modal';
            openQuickCategoryModal();
        }
    };

    if (currentCategoryId !== 'all' && currentCategoryId !== 'uncategorized' && currentCategoryId !== 'dashboard') {
        const currentCat = allCategories.find(c => c._id === currentCategoryId);
        const isParentFolder = currentCat && !currentCat.parentId; 
        
        if (isParentFolder) {
            selectEl.value = ""; 
        } else {
            selectEl.value = currentCategoryId; 
        }
    } else {
        selectEl.value = ""; 
    }
    openModal('add-card-modal');
}

function openBatchModal() { 
    document.getElementById('batch-input').value = ''; 
    const selectEl = document.getElementById('batch-category-select');
    
    if (currentCategoryId !== 'all' && currentCategoryId !== 'uncategorized' && currentCategoryId !== 'dashboard') {
        const currentCat = allCategories.find(c => c._id === currentCategoryId);
        const isParentFolder = currentCat && !currentCat.parentId;
        
        if (isParentFolder) {
            selectEl.value = "";
        } else {
            selectEl.value = currentCategoryId;
        }
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
    const selectValue = document.getElementById('modal-category-select').value;
    
    if (!question || !answer) return alert('请填写完整内容');
    
    let categoryId = null;
    if (selectValue && selectValue !== "" && selectValue !== "uncategorized") {
        categoryId = selectValue;
    }

    const payload = { question: question.trim(), answer: answer.trim(), categoryId };

    try {
        const response = await fetch('/api/flashcards', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("❌ 后端真实报错:", response.status, errText);
            if (response.status === 404) {
                alert(`⚠️ 破案了！接口是通的，但后端因为找不到分类而拒绝保存。\n请按 F12 看看控制台的红字，把详细报错发给我！`);
            } else {
                alert(`保存失败：状态码 ${response.status}`);
            }
            return;
        }

        closeAllModals();
        await loadFlashcards(); 

        let targetNavId = categoryId ? categoryId : 'uncategorized';
        const targetElement = document.querySelector(`.nav-item[onclick*="${targetNavId}"]`);
        selectSidebarItem(targetNavId, categoryId ? "文件夹" : "未分类区", 'vocabulary', targetElement);

    } catch (error) {
        console.error("🔥 网络崩溃:", error);
        alert("网络连接异常。");
    }
}

async function updateCard() {
    const question = document.getElementById('edit-question').value;
    const answer = document.getElementById('edit-answer').value;
    const categoryId = document.getElementById('edit-category-select').value || null;
    
    try { 
        const response = await fetch(`/api/flashcards/${editingCardId}`, { 
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ question, answer, categoryId }) 
        }); 
        
        if (!response.ok) {
            alert("⚠️ 更新失败：数据格式异常。");
            return;
        }
        
        closeAllModals(); 
        await loadFlashcards(); 
    } catch (error) { 
        console.error('更新失败:', error); 
        alert("⚠️ 网络异常，更新失败！");
    }
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

async function deleteCard(id) { if (confirm('确定要彻底删除这张卡片吗？')) { try { await fetch(`/api/flashcards/${id}`, { method: 'DELETE' }); loadFlashcards(); } catch (error) { console.error(error); } } }

async function confirmBatchImport(event) {
    const textInput = document.getElementById('batch-input') || document.getElementById('import-text');
    const categorySelect = document.getElementById('modal-category-select') || document.getElementById('import-category-select');
    const submitBtn = document.getElementById('btn-batch-submit') || document.querySelector('button[onclick*="confirmBatchImport"]');

    if (!textInput || !textInput.value.trim()) {
        alert("⚠️ 请输入需要导入的单词！");
        return;
    }

    const text = textInput.value.trim();
    const lines = text.split('\n');
    const newCards = [];
    
    let categoryId = null;
    if (categorySelect && categorySelect.value) {
        categoryId = categorySelect.value; 
    } else if (currentCategoryId && currentCategoryId !== 'all' && currentCategoryId !== 'uncategorized') {
        const currentCat = allCategories.find(c => c._id === currentCategoryId);
        const isParentFolder = currentCat && !currentCat.parentId;
        if (!isParentFolder) {
            categoryId = currentCategoryId; 
        }
    }

    for (let line of lines) {
        line = line.trim();
        if (!line || line.toLowerCase().includes('english') || line.includes('中文') || /^[\-\|\s]+$/.test(line)) continue;

        let parts = [];
        if (line.startsWith('|') && line.endsWith('|')) {
            parts = line.split('|').map(p => p.trim()).filter(p => p !== ''); 
        } else if (line.includes('|')) {
            parts = line.split('|').map(p => p.trim());
        } else {
            parts = line.split(/\t+| {2,}| - |:/); 
        }

        if (parts.length >= 2) {
            newCards.push({ question: parts[0], answer: parts[1], categoryId: categoryId });
        }
    }

    if (newCards.length === 0) {
        alert("❌ 没有识别到有效的卡片！请检查格式是否正确。");
        return;
    }

    if (submitBtn) {
        const spinnerSvg = `<svg style="animation: spin 1s linear infinite; margin-right: 6px; width: 16px; height: 16px; display: inline-block; vertical-align: -3px;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle style="opacity: 0.25;" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path style="opacity: 0.75;" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
        
        if (!document.getElementById('spin-keyframes')) {
            const style = document.createElement('style');
            style.id = 'spin-keyframes';
            style.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
            document.head.appendChild(style);
        }

        submitBtn.innerHTML = `${spinnerSvg} 正在导入...`;
        submitBtn.disabled = true; 
        submitBtn.style.cursor = "wait";
        submitBtn.style.opacity = "0.8"; 
    }

    try {
        let successCount = 0;
        const fetchPromises = newCards.map(card => 
            fetch('/api/flashcards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(card)
            })
        );

        const responses = await Promise.all(fetchPromises);
        
        for (let i = 0; i < responses.length; i++) {
            if (responses[i].ok) {
                successCount++;
            } else {
                const errData = await responses[i].json().catch(()=>({}));
                console.error("后端拒绝了这张卡:", newCards[i], "原因:", errData);
            }
        }

        setTimeout(() => {
            alert(`🎉 解析了 ${newCards.length} 张，实际成功存入数据库 ${successCount} 张！`);
            
            if (successCount > 0) {
                textInput.value = ''; 
                if (typeof closeAllModals === 'function') closeAllModals(); 
                else {
                    const modal = textInput.closest('div[style*="position: fixed"]');
                    if (modal) modal.style.display = 'none';
                }
                
                if (typeof loadFlashcards === 'function') loadFlashcards(); 
                else if (typeof renderCards === 'function') renderCards(); 
            }
        }, 100);

    } catch (error) {
        console.error("批量导入网络报错:", error);
        alert("⚠️ 导入过程出现网络异常，请看控制台。");
    } finally {
        if (submitBtn) {
            submitBtn.innerHTML = "开始导入";
            submitBtn.disabled = false;
            submitBtn.style.cursor = "pointer";
            submitBtn.style.opacity = "1";
        }
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

function startStudyMode() {
    const limitInput = document.getElementById('study-limit');
    const maxCards = limitInput ? parseInt(limitInput.value) || 20 : 20;
    const now = new Date();
    
    const targetCategoryIds = new Set([currentCategoryId]);
    allCategories.forEach(cat => {
        if (cat.parentId === currentCategoryId) {
            targetCategoryIds.add(cat._id);
        }
    });

    let dueCards = allCards.filter(card => {
        const date = card.nextReviewDate ? new Date(card.nextReviewDate) : new Date(0);
        const isDue = date <= now;
        
        let isMatch = false;
        if (currentCategoryId === 'all') {
            isMatch = true;
        } else if (currentCategoryId === 'uncategorized') {
            const catValue = card.category || card.categoryId;
            isMatch = !catValue || catValue === 'uncategorized';
        } else {
            const cardCatId = card.category ? card.category._id : card.categoryId;
            isMatch = targetCategoryIds.has(cardCatId);
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

function submitReview(isKnown) {
    if (!studyCards || studyCards.length === 0 || currentStudyIndex >= studyCards.length) return;
    const currentCard = studyCards[currentStudyIndex];
    
    if (isKnown) {
        currentCard.nextReviewDate = new Date(Date.now() + 86400000).toISOString();
        currentCard.stage = (currentCard.stage || 0) + 1;
    } else {
        studyCards.push(currentCard);
    }
    
    try { 
        fetch(`/api/flashcards/${currentCard._id}/review`, { 
            method: 'PATCH', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ isKnown }) 
        }); 
    } catch (e) { console.warn("后台同步稍后重试", e); }
    
    currentStudyIndex++;
    
    if (currentStudyIndex >= studyCards.length) {
        setTimeout(() => {
            alert('🎉 恭喜！本次背诵任务圆满完成！');
            showMainView('manage-view'); 
        }, 150);
    } else {
        renderStudyCard(); 
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

function startSpellMode() {
    const limitInput = document.getElementById('study-limit');
    const maxCards = limitInput ? parseInt(limitInput.value) || 20 : 20;
    const now = new Date();
    
    const targetCategoryIds = new Set([currentCategoryId]);
    allCategories.forEach(cat => {
        if (cat.parentId === currentCategoryId) {
            targetCategoryIds.add(cat._id);
        }
    });
    
    let dueCards = allCards.filter(card => {
        const date = card.nextReviewDate ? new Date(card.nextReviewDate) : new Date(0);
        const isDue = date <= now; 
        const isReadyForSpell = card.stage >= 1; 
        
        let isMatch = false;
        if (currentCategoryId === 'all') {
            isMatch = true;
        } else if (currentCategoryId === 'uncategorized') {
            const catValue = card.category || card.categoryId;
            isMatch = !catValue || catValue === 'uncategorized';
        } else {
            const cardCatId = card.category ? card.category._id : card.categoryId;
            isMatch = targetCategoryIds.has(cardCatId);
        }
        return isReadyForSpell && isMatch && isDue; 
    });

    if (dueCards.length === 0) return alert('提示：当前分类没有[可默写]的单词！\n\n原因可能是：\n1. 单词都已复习完\n2. 请先在[背诵模式]里背对解锁默写！');
    dueCards.sort((a, b) => (b.interval || 0) - (a.interval || 0) || Math.random() - 0.5);
    spellCards = dueCards.slice(0, maxCards); currentSpellIndex = 0;
    showMainView('spell-view'); renderSpellCard();
}

// 🌟 1. 每次渲染新卡片，把按钮“洗脑”回提交状态
function renderSpellCard() {
    if (currentSpellIndex >= spellCards.length) { 
        alert('恭喜你，完成了所有的拼写检验！'); 
        showMainView('manage-view');
        return; 
    }
    const card = spellCards[currentSpellIndex];
    document.getElementById('spell-question').innerText = card.question || '（空问题）';
    
    const inputEl = document.getElementById('spell-input'); 
    inputEl.value = ''; inputEl.disabled = false; inputEl.focus(); 
    document.getElementById('spell-feedback').innerHTML = ''; 

    // 强行把底部的按钮恢复成蓝色的“提交”
    const submitBtn = document.querySelector('#spell-view .check-btn');
    if (submitBtn) {
        submitBtn.style.display = 'block';
        submitBtn.innerHTML = '✓ 提交检验 (Enter)';
        submitBtn.style.background = '#3b82f6';
        submitBtn.onclick = checkSpelling; // 重新绑定为检查对错功能
    }
}

// 🌟 2. 魔法按键：验证完直接“变身”
async function checkSpelling() {
    const inputEl = document.getElementById('spell-input');
    // 如果已经验证过了，再次回车直接进下一张！
    if (inputEl.disabled) return nextSpellCard(); 
    
    const inputStr = inputEl.value.trim().toLowerCase(); 
    if (inputStr === '') { 
        inputEl.style.borderColor = '#e53e3e'; 
        inputEl.placeholder = '请先输入单词哦！'; 
        setTimeout(() => { inputEl.style.borderColor = 'transparent'; inputEl.placeholder = '请在此输入答案...'; }, 1500); 
        return; 
    }

    const card = spellCards[currentSpellIndex];
    const answerStr = card.answer.trim().toLowerCase();  
    const feedbackEl = document.getElementById('spell-feedback'); 
    inputEl.disabled = true; // 锁定输入框
    const isCorrect = (inputStr === answerStr);

    // 渲染对错反馈文字
    if (isCorrect) {
        feedbackEl.innerHTML = '<div style="display:flex;align-items:center;gap:6px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#48bb78" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> <strong>拼写正确！完全掌握！</strong></div>'; 
        feedbackEl.style.color = '#48bb78'; 
        try { speakWord(card.answer, null); } catch(e){} // 加了保护，防止手机端语音组件崩溃导致卡死
        card.nextReviewDate = new Date(Date.now() + 86400000).toISOString();
        card.stage = (card.stage || 0) + 1;
    } else {
        feedbackEl.innerHTML = `<div style="display:flex;align-items:flex-start;gap:6px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" stroke-width="2.5" style="flex-shrink:0;margin-top:2px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> <div><strong>拼写错误。卡片已降级。</strong><br><br>你的输入：<span style="color:red; text-decoration: line-through;">${inputStr}</span><br>正确答案：<span style="color:green;">${card.answer}</span></div></div>`;
        feedbackEl.style.color = '#e53e3e'; 
        spellCards.push(card); 
        card.stage = Math.max(0, (card.stage || 0) - 1);
    }

    // 👇 核心魔法：直接霸占原有的提交按钮，把它变成绿色的“下一张”！
    const submitBtn = document.querySelector('#spell-view .check-btn');
    if (submitBtn) {
        submitBtn.style.display = 'block';
        submitBtn.innerHTML = '继续下一张 (Enter) ➔';
        submitBtn.style.background = '#10b981'; // 变绿
        submitBtn.onclick = nextSpellCard; // 核心：把按钮的功能偷偷换成了“下一张”！
    }

    try { await fetch(`/api/flashcards/${card._id}/review`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isKnown: isCorrect }) }); } catch(e) {}
}
function prevSpellCard() { if (currentSpellIndex > 0) { currentSpellIndex--; renderSpellCard(); } }
function nextSpellCard() { currentSpellIndex++; renderSpellCard(); }

function handleSpellEnter(event) { 
    if (event.key === 'Enter') { 
        const inputEl = document.getElementById('spell-input'); 
        if (inputEl.disabled) nextSpellCard(); // 如果禁用了(已验证)，回车直接进下一张
        else checkSpelling(); 
    } 
}



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

function getUncategorizedCards() {
    return allCards.filter(c => {
        const catValue = c.categoryId || (c.category ? (c.category._id || c.category) : null);
        return !catValue || catValue === 'uncategorized' || catValue === '';
    });
}

function showClearConfirmModal() {
    const targetCards = getUncategorizedCards();
    if (targetCards.length === 0) return alert("当前未分类区域为空，无需清空。");
    
    const sampleWords = targetCards.slice(0, 3).map(c => c.question).join(', ');
    const moreText = targetCards.length > 3 ? '...' : '';
    
    const confirmText = document.getElementById('clear-confirm-text');
    if (confirmText) {
        confirmText.innerHTML = `即将删除 <b>${targetCards.length}</b> 张未分类卡片<br><span style="font-size: 12px; color: #94a3b8;">(包含: ${sampleWords}${moreText})</span><br>一旦删除无法恢复。`;
    }

    const modal = document.getElementById('clear-confirm-modal');
    if (modal) modal.style.display = 'flex';
}

async function executeClearUncategorized() {
    const targetCards = getUncategorizedCards(); 
    const btn = document.getElementById('confirm-clear-btn');
    const originalText = btn.innerHTML;

    if (btn) {
        btn.innerHTML = `清空中...`;
        btn.disabled = true;
    }

    try {
        const deletePromises = targetCards.map(card => fetch(`/api/flashcards/${card._id}`, { method: 'DELETE' }));
        await Promise.all(deletePromises);
        
        document.getElementById('clear-confirm-modal').style.display = 'none';
        if (typeof loadFlashcards === 'function') loadFlashcards();
    } catch (error) {
        console.error("清空失败:", error);
        alert("网络连接异常，部分卡片可能未能清除。");
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
}

let isManageMode = false;
let selectedCards = new Set();

// 替换原有的 toggleManageMode 函数
function toggleManageMode() {
    isManageMode = !isManageMode;
    selectedCards.clear();
    
    const manageBtn = document.getElementById('btn-toggle-manage');
    const selectAllBtn = document.getElementById('btn-select-all');
    
    if (manageBtn) {
        // 进入管理模式变成红色的“退出”，否则变回 SVG 图标
        if (isManageMode) {
            manageBtn.innerHTML = `<span style="font-size: 0.9rem; font-weight: bold;">退出</span>`;
            manageBtn.style.color = "#ef4444";
            manageBtn.style.background = "#fee2e2";
        } else {
            manageBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`;
            manageBtn.style.color = "#64748b";
            manageBtn.style.background = "transparent";
        }
    }
    if (selectAllBtn) {
        selectAllBtn.style.display = isManageMode ? "inline-flex" : "none";
        selectAllBtn.innerHTML = `<span style="font-size: 0.9rem; font-weight: bold;">全选</span>`;
    }
    if (typeof renderCards === 'function') renderCards();
    updateBatchActionBar();
}

// 替换原有的 exitManageMode 函数
function exitManageMode() {
    isManageMode = false;
    selectedCards.clear();
    const manageBtn = document.getElementById('btn-toggle-manage');
    const selectAllBtn = document.getElementById('btn-select-all');
    if (manageBtn) {
        manageBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`;
        manageBtn.style.color = "#64748b";
        manageBtn.style.background = "transparent";
    }
    if (selectAllBtn) selectAllBtn.style.display = "none";
    if (typeof renderCards === 'function') renderCards();
    updateBatchActionBar();
}

// 替换原有的 toggleSelectAllCards 函数
function toggleSelectAllCards() {
    if (!isManageMode) return;

    const visibleCheckboxes = document.querySelectorAll('[id^="checkbox-wrap-"]');
    const visibleIds = Array.from(visibleCheckboxes).map(node => node.id.replace('checkbox-wrap-', ''));
    if (visibleIds.length === 0) return;

    const isAllSelected = visibleIds.every(id => selectedCards.has(id));

    if (isAllSelected) {
        visibleIds.forEach(id => selectedCards.delete(id));
        // 字数极简：取消
        document.getElementById('btn-select-all').innerHTML = `<span style="font-size: 0.9rem; font-weight: bold;">全选</span>`;
    } else {
        visibleIds.forEach(id => selectedCards.add(id));
        // 字数极简：全选
        document.getElementById('btn-select-all').innerHTML = `<span style="font-size: 0.9rem; font-weight: bold;">取消</span>`;
    }

    visibleIds.forEach(id => {
        const checkboxWrap = document.getElementById(`checkbox-wrap-${id}`);
        const cardItem = checkboxWrap.closest('.card-item');
        const isChecked = selectedCards.has(id);
        
        if (checkboxWrap) {
            checkboxWrap.innerHTML = isChecked 
                ? `<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="#3b82f6" stroke-width="2"></circle><path d="M8 12l3 3 5-6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`
                : `<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="#cbd5e1" stroke-width="2"></circle></svg>`;
        }
        if (cardItem) cardItem.style.borderColor = isChecked ? '#3b82f6' : '#f1f5f9';
    });

    updateBatchActionBar();
}

function toggleCardSelection(cardId) {
    if (!isManageMode) return; 

    if (selectedCards.has(cardId)) selectedCards.delete(cardId);
    else selectedCards.add(cardId);
    
    const checkboxWrap = document.getElementById(`checkbox-wrap-${cardId}`);
    if (checkboxWrap) {
        if (selectedCards.has(cardId)) {
            checkboxWrap.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="#3b82f6" stroke-width="2"></circle><path d="M8 12l3 3 5-6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
        } else {
            checkboxWrap.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="#cbd5e1" stroke-width="2"></circle></svg>`;
        }
    }
    updateBatchActionBar();
}

function updateBatchActionBar() {
    const bar = document.getElementById('batch-action-bar');
    const countText = document.getElementById('selected-count-text');
    if (isManageMode && selectedCards.size > 0) {
        bar.style.display = 'flex';
        countText.textContent = `已选 ${selectedCards.size} 项`;
    } else {
        bar.style.display = 'none';
    }
}

async function executeBatchDelete() {
    if (selectedCards.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedCards.size} 张卡片吗？此操作不可恢复。`)) return;

    const countText = document.getElementById('selected-count-text');
    const originalText = countText.textContent;
    countText.textContent = "删除中...";

    try {
        const deletePromises = Array.from(selectedCards).map(id => fetch(`/api/flashcards/${id}`, { method: 'DELETE' }));
        await Promise.all(deletePromises);
        exitManageMode(); 
        if (typeof loadFlashcards === 'function') loadFlashcards();
    } catch (error) {
        console.error("批量删除失败:", error);
        alert("网络连接异常，部分卡片可能未能清除。");
        countText.textContent = originalText;
    }
}

function promptBatchMove() {
    if (selectedCards.size === 0) return;
    document.getElementById('batch-move-text').innerText = `将已选的 ${selectedCards.size} 张卡片移动到：`;
    
    const parents = allCategories.filter(c => !c.parentId);
    const children = allCategories.filter(c => c.parentId);

    let optionsHtml = `<option value="uncategorized">未分类区</option>`; 
    
    parents.forEach(p => {
        const myChildren = children.filter(c => c.parentId === p._id);
        optionsHtml += `<optgroup label="── ${p.name} ──">`;
        if (myChildren.length > 0) {
            myChildren.forEach(c => {
                optionsHtml += `<option value="${c._id}">  ${c.name}</option>`;
            });
        } else {
            optionsHtml += `<option value="" disabled>  (空目录，不可放入卡片)</option>`;
        }
        optionsHtml += `</optgroup>`;
    });
    
    const moveSelect = document.getElementById('batch-move-select');
    if (moveSelect) moveSelect.innerHTML = optionsHtml;
    
    const modal = document.getElementById('batch-move-modal');
    if (modal) modal.style.display = 'flex';
}

async function executeBatchMove() {
    if (selectedCards.size === 0) return;
    
    let targetCategoryId = document.getElementById('batch-move-select').value;
    if (targetCategoryId === 'uncategorized') targetCategoryId = null; 

    const btn = document.getElementById('confirm-move-btn');
    const originalText = btn.innerHTML;
    
    if (btn) {
        btn.innerHTML = `移动中...`;
        btn.disabled = true;
    }

    try {
        const movePromises = Array.from(selectedCards).map(id => {
            const card = allCards.find(c => c._id === id);
            if (!card) return Promise.resolve(); 
            return fetch(`/api/flashcards/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: card.question, answer: card.answer, categoryId: targetCategoryId })
            });
        });
        
        await Promise.all(movePromises);
        document.getElementById('batch-move-modal').style.display = 'none';
        exitManageMode(); 
        if (typeof loadFlashcards === 'function') loadFlashcards();
        
    } catch (error) {
        console.error("批量移动失败:", error);
        alert("网络连接异常，部分卡片可能未能成功转移。");
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        let isModalClosed = false;

        const overlay = document.getElementById('modal-overlay');
        const batchMoveModal = document.getElementById('batch-move-modal');
        const clearConfirmModal = document.getElementById('clear-confirm-modal');
        
        if (overlay && overlay.style.display === 'block') {
            if (typeof closeAllModals === 'function') closeAllModals();
            isModalClosed = true;
        }
        if (batchMoveModal && batchMoveModal.style.display === 'flex') {
            batchMoveModal.style.display = 'none';
            isModalClosed = true;
        }
        if (clearConfirmModal && clearConfirmModal.style.display === 'flex') {
            clearConfirmModal.style.display = 'none';
            isModalClosed = true;
        }

        if (!isModalClosed && isManageMode) {
            exitManageMode();
        }
    }
});

function setupInlineCategoryUI() {
    const selectEl = document.getElementById('modal-category-select');
    if (!selectEl || selectEl.dataset.inlineBound) return;
    
    selectEl.dataset.inlineBound = 'true';
    
    selectEl.addEventListener('change', function() {
        if (this.value === 'CREATE_NEW') {
            showInlineCategoryForm();
        }
    });

    const container = document.createElement('div');
    container.id = 'inline-cat-form';
    container.style.display = 'none';
    container.style.marginTop = '10px';
    container.style.padding = '14px';
    container.style.background = '#f8fafc';
    container.style.borderRadius = '10px';
    container.style.border = '1px dashed #cbd5e1';

    container.innerHTML = `
        <div style="font-size: 0.85rem; color: #3b82f6; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
            快速创建新文件夹
        </div>
        <input type="text" id="inline-cat-name" placeholder="输入文件夹名称 (如: 阅读高频词)" style="width: 100%; box-sizing: border-box; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 10px; font-size: 0.95rem; outline: none;">
        <select id="inline-cat-parent" style="width: 100%; box-sizing: border-box; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 14px; font-size: 0.95rem; outline: none; background: white;">
        </select>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button type="button" onclick="cancelInlineCategory()" style="padding: 8px 16px; border-radius: 8px; border: none; background: #e2e8f0; color: #475569; cursor: pointer; font-size: 0.9rem; font-weight: 500; transition: 0.2s;">取消</button>
            <button type="button" onclick="submitInlineCategory(event)" style="padding: 8px 16px; border-radius: 8px; border: none; background: #3b82f6; color: white; cursor: pointer; font-size: 0.9rem; font-weight: 500; transition: 0.2s;">确认创建</button>
        </div>
    `;
    selectEl.parentNode.insertBefore(container, selectEl.nextSibling);
}

function showInlineCategoryForm() {
    document.getElementById('modal-category-select').style.display = 'none';
    document.getElementById('inline-cat-form').style.display = 'block';
    
    const parentSelect = document.getElementById('inline-cat-parent');
    parentSelect.innerHTML = '<option value="">📁 (无) 作为顶级文件夹</option>';
    allCategories.filter(c => !c.parentId).forEach(cat => {
        const isSelected = (currentCategoryId === cat._id) ? 'selected' : '';
        parentSelect.innerHTML += `<option value="${cat._id}" ${isSelected}>↳ 归属于: ${cat.name}</option>`;
    });
    
    document.getElementById('inline-cat-name').value = '';
    setTimeout(() => document.getElementById('inline-cat-name').focus(), 50);
}

function cancelInlineCategory() {
    document.getElementById('inline-cat-form').style.display = 'none';
    const selectEl = document.getElementById('modal-category-select');
    selectEl.style.display = 'block';
    selectEl.value = ""; 
}

async function submitInlineCategory(event) {
    const name = document.getElementById('inline-cat-name').value.trim();
    const parentId = document.getElementById('inline-cat-parent').value;
    
    if (!name) return alert('名称不能为空哦！');
    
    const btn = event.target;
    const originalText = btn.innerText;
    btn.innerText = '创建中...';
    btn.disabled = true;
    
    try {
        await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, parentId: parentId || null, type: 'vocabulary' })
        });
        
        await loadCategories(); 
        
        document.getElementById('inline-cat-form').style.display = 'none';
        const selectEl = document.getElementById('modal-category-select');
        selectEl.style.display = 'block';
        
        setTimeout(() => {
            const createdCat = allCategories.find(c => c.name === name && (c.parentId || '') === parentId);
            if (createdCat) {
                selectEl.value = createdCat._id;
            }
        }, 150); 
        
    } catch (error) {
        console.error("行内创建报错:", error);
        alert("创建失败，请检查网络。");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

function injectQuickCategoryModal() {
    if (document.getElementById('quick-category-modal')) return;
    
    const modalHtml = `
    <div id="quick-category-overlay" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; z-index:10000; background: transparent;" onclick="closeQuickCategoryModal()"></div>
    
    <div id="quick-category-modal" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:white; padding:24px; border-radius:16px; box-shadow:0 20px 40px rgba(0,0,0,0.2); z-index: 10001; width: 340px; border: 1px solid #e2e8f0;">
        <h3 style="margin-top:0; color:#1e293b; font-size:1.15rem; margin-bottom:20px;">极速建档中心</h3>
        <label style="font-size:0.85rem; color:#64748b; font-weight:600; margin-bottom:8px; display:block;">1. 归属大类 (顶级文件夹)</label>
        <select id="quick-parent-select" style="width:100%; padding:12px; border-radius:10px; border:1px solid #cbd5e1; margin-bottom:10px; outline:none; background:#f8fafc;" onchange="toggleNewParentInput()"></select>
        <input type="text" id="quick-new-parent-name" placeholder="请输入全新大类名称" style="display:none; width:100%; padding:12px; border-radius:10px; border:2px dashed #3b82f6; margin-bottom:16px; outline:none; box-sizing:border-box; background:#eff6ff; color:#1e293b; font-weight:500;">
        <label style="font-size:0.85rem; color:#64748b; font-weight:600; margin-bottom:8px; display:block; margin-top:8px;">2. 子文件夹</label>
        <input type="text" id="quick-child-name" placeholder="必填 (如: 核心词汇)" style="width:100%; padding:12px; border-radius:10px; border:1px solid #cbd5e1; margin-bottom:24px; outline:none; box-sizing:border-box; font-weight:500;">
        <div style="display:flex; justify-content:flex-end; gap:12px;">
            <button onclick="closeQuickCategoryModal()" style="padding:10px 18px; border:none; background:#f1f5f9; color:#475569; border-radius:10px; cursor:pointer; font-weight:600;">取消</button>
            <button id="quick-cat-submit-btn" onclick="submitQuickCategory()" style="padding:10px 18px; border:none; background:#3b82f6; color:white; border-radius:10px; cursor:pointer; font-weight:600;">确认创建</button>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function openQuickCategoryModal() {
    const sourceModalId = window.quickCreateSourceModal || 'add-card-modal';
    const baseModal = document.getElementById(sourceModalId);
    if (baseModal) {
        baseModal.style.filter = 'brightness(0.6)'; 
        baseModal.style.pointerEvents = 'none';
    }

    const quickModal = document.getElementById('quick-category-modal');
    const quickOverlay = document.getElementById('quick-category-overlay');
    
    quickModal.style.zIndex = '30000';
    quickOverlay.style.zIndex = '29999';

    const parentSelect = document.getElementById('quick-parent-select');
    parentSelect.innerHTML = `<option value="CREATE_NEW_PARENT" style="color:#3b82f6; font-weight:bold;">创建全新大类...</option><option disabled>──────────────</option>`;
    
    allCategories.filter(c => !c.parentId).forEach(p => {
        parentSelect.innerHTML += `<option value="${p._id}">挂载到现有: ${p.name}</option>`;
    });

    quickOverlay.style.display = 'block';
    quickModal.style.display = 'block';
    toggleNewParentInput();
    
    setTimeout(() => {
        if(parentSelect.value === 'CREATE_NEW_PARENT') document.getElementById('quick-new-parent-name').focus();
        else document.getElementById('quick-child-name').focus();
    }, 100);
}

function toggleNewParentInput() {
    const select = document.getElementById('quick-parent-select');
    const input = document.getElementById('quick-new-parent-name');
    if (select.value === 'CREATE_NEW_PARENT') {
        input.style.display = 'block';
    } else {
        input.style.display = 'none';
        input.value = '';
    }
}

function closeQuickCategoryModal() {
    document.getElementById('quick-category-overlay').style.display = 'none';
    document.getElementById('quick-category-modal').style.display = 'none';

    const addCardModal = document.getElementById('add-card-modal');
    if (addCardModal) {
        addCardModal.style.filter = 'none';
        addCardModal.style.pointerEvents = 'auto';
    }

    const selectEl = document.getElementById('modal-category-select');
    if (selectEl && selectEl.value === 'CREATE_NEW') selectEl.value = ""; 
}

async function submitQuickCategory() {
    const parentSelect = document.getElementById('quick-parent-select').value;
    const newParentName = document.getElementById('quick-new-parent-name').value.trim();
    const childName = document.getElementById('quick-child-name').value.trim();
    const btn = document.getElementById('quick-cat-submit-btn');

    if (parentSelect === 'CREATE_NEW_PARENT' && !newParentName) return alert("大类名称不能为空哦！");
    if (!childName) return alert("子文件夹名称必须填写，否则卡片无处安放！");

    btn.innerText = "正在创建...";
    btn.disabled = true;

    try {
        let finalParentId = parentSelect;

        if (parentSelect === 'CREATE_NEW_PARENT') {
            await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newParentName, parentId: null, type: 'vocabulary' })
            });
            
            await loadCategories();
            const createdParent = allCategories.find(c => c.name === newParentName && !c.parentId);
            if (!createdParent) throw new Error("大类创建迷失在四次元空间了");
            finalParentId = createdParent._id;
        }

        await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: childName, parentId: finalParentId, type: 'vocabulary' })
        });

        await loadCategories();
        closeQuickCategoryModal();

        setTimeout(() => {
            const selectEl = document.getElementById('modal-category-select');
            const createdChild = allCategories.find(c => c.name === childName && c.parentId === finalParentId);
            if (createdChild) {
                selectEl.value = createdChild._id;
            }
        }, 150);

    } catch (error) {
        console.error("连环创建崩溃:", error);
        alert("网络波动，创建失败啦。");
    } finally {
        btn.innerText = "确认创建";
        btn.disabled = false;
    }
}

(function setupContextMenu() {
    function injectContextMenu() {
        if(document.getElementById('custom-context-menu')) return;
        const menuHTML = `
            <div id="custom-context-menu" style="display:none; position:absolute; z-index:9999; background:white; border:1px solid #e2e8f0; border-radius:8px; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); padding:6px; min-width:150px;">
                <div id="ctx-edit-btn" style="padding:10px 12px; margin-bottom:4px; cursor:pointer; color:#3b82f6; font-size:0.9rem; border-radius:6px; display:flex; align-items:center; gap:8px; font-weight:500;">重命名</div>
                <div style="height:1px; background:#e2e8f0; margin: 4px 0;"></div>
                <div id="ctx-delete-btn" style="padding:10px 12px; cursor:pointer; color:#ef4444; font-size:0.9rem; border-radius:6px; display:flex; align-items:center; gap:8px; font-weight:500;">删除该文件夹</div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', menuHTML);
    }

    let contextMenuTargetId = null;
    let contextMenuTargetName = ''; 

    window.addEventListener('DOMContentLoaded', () => {
        injectContextMenu();
        const menu = document.getElementById('custom-context-menu');
        const editBtn = document.getElementById('ctx-edit-btn');
        const deleteBtn = document.getElementById('ctx-delete-btn');
        
        const sidebar = document.getElementById('sidebar-menu');
        if (sidebar) sidebar.style.touchAction = 'manipulation';

        document.addEventListener('contextmenu', function(e) {
            const targetElement = e.target.closest('[onclick]');
            if (targetElement) {
                const onclickStr = targetElement.getAttribute('onclick') || '';
                const targetCat = allCategories.find(c => onclickStr.includes(c._id));

                if (targetCat) {
                    e.preventDefault(); 
                    contextMenuTargetId = targetCat._id;
                    contextMenuTargetName = targetCat.name;
                    menu.style.display = 'block';
                    menu.style.left = e.pageX + 'px';
                    menu.style.top = e.pageY + 'px';
                    return;
                }
            }
            menu.style.display = 'none';
        });

        document.addEventListener('click', function(e) {
            if (e.target.closest('#custom-context-menu')) return;
            menu.style.display = 'none';
        });

        editBtn.addEventListener('click', async function() {
            menu.style.display = 'none'; 
            if (!contextMenuTargetId) return;

            const newName = prompt(`请输入【${contextMenuTargetName}】的新名称：`, contextMenuTargetName);
            if (newName && newName.trim() !== '' && newName.trim() !== contextMenuTargetName) {
                try {
                    const response = await fetch(`/api/categories/${contextMenuTargetId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: newName.trim() })
                    });
                    if (!response.ok) throw new Error('重命名接口报错');

                    await loadCategories(); 
                    if (currentCategoryId === contextMenuTargetId) {
                        const titleEl = document.getElementById('category-title');
                        if (titleEl) titleEl.innerText = newName.trim();
                    }
                } catch (error) {
                    console.error("重命名失败:", error);
                    alert('重命名失败，请检查网络或后端接口。');
                }
            }
        });

        deleteBtn.addEventListener('click', async function() {
            menu.style.display = 'none'; 
            if (!contextMenuTargetId) return;

            if (confirm(`警告：确定要删除【${contextMenuTargetName}】吗？\n文件夹删除后，里面的卡片会自动进入“未分类区”。`)) {
                try {
                    const response = await fetch(`/api/categories/${contextMenuTargetId}`, { method: 'DELETE' });
                    if (!response.ok) throw new Error('删除接口报错');

                    await loadCategories(); 
                    if (currentCategoryId === contextMenuTargetId) {
                        const allCardsEl = document.querySelector(`.nav-item[onclick*="all"]`);
                        if(allCardsEl) allCardsEl.click();
                        else loadFlashcards();
                    } else {
                        loadFlashcards();
                    }
                } catch (error) {
                    console.error("删除失败:", error);
                    alert('删除失败，请检查网络。');
                }
            }
        });
    });
})();

function batchExportCards() {
    if (typeof selectedCards === 'undefined' || selectedCards.size === 0) {
        alert("请先勾选需要导出的卡片！");
        return;
    }

    const cardsToExport = allCards.filter(card => selectedCards.has(card._id));
    if (cardsToExport.length === 0) return;

    let csvContent = "\uFEFF"; 
    csvContent += "正面 (问题),反面 (答案)\n";

    const escapeCSV = (str) => {
        if (!str) return '""';
        let safeStr = String(str).replace(/"/g, '""'); 
        if (safeStr.search(/("|,|\n)/g) >= 0) {
            safeStr = `"${safeStr}"`; 
        }
        return safeStr;
    };

    cardsToExport.forEach(card => {
        const q = escapeCSV(card.question);
        const a = escapeCSV(card.answer);
        csvContent += `${q},${a}\n`;
    });

    let fileName = "批量导出卡片.csv";
    if (typeof currentCategoryId !== 'undefined' && currentCategoryId !== 'all' && currentCategoryId !== 'uncategorized' && currentCategoryId !== 'dashboard') {
        const cat = allCategories.find(c => c._id === currentCategoryId);
        if (cat) fileName = `${cat.name}_导出.csv`;
    } else if (currentCategoryId === 'uncategorized') {
        fileName = "未分类区_导出.csv";
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url); 
}

// ==========================================
// ✨ 触控手势引擎 (滑动出抽屉) 
// ==========================================
let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
let touchEndY = 0;

document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, {passive: true});

document.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleMobileSwipe();
}, {passive: true});

function handleMobileSwipe() {
    if (window.innerWidth > 768) return; // 电脑端不启用手势

    const swipeDistanceX = touchEndX - touchStartX;
    const swipeDistanceY = Math.abs(touchEndY - touchStartY);

    // 防误触：如果上下滑动的幅度比左右大（说明用户在往下看卡片），就不触发侧栏
    if (swipeDistanceY > Math.abs(swipeDistanceX)) return;

    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    const isSidebarOpen = sidebar.classList.contains('mobile-active');

    // 👉 向右滑动（呼出侧边栏）
    // 苛刻条件：必须是从屏幕最左边（小于 40px 的边缘区域）开始滑，且滑行超过 50px 才触发
    if (swipeDistanceX > 50 && touchStartX < 40 && !isSidebarOpen) {
        toggleMobileSidebar();
    }

    // 👈 向左滑动（收起侧边栏）
    // 条件：侧边栏是打开的，并且向左滑了超过 50px
    if (swipeDistanceX < -50 && isSidebarOpen) {
        toggleMobileSidebar();
    }
}