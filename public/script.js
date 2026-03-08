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
    // 只有在点击了“未分类”时，才显示清空按钮
// 🛡️ 动态控制清空按钮的显示与隐藏
    const clearBtn = document.getElementById('btn-clear-uncategorized');
    if (clearBtn) {
        // 只有当左侧选中的是“未分类 (uncategorized)”时，才让这个危险按钮弹出来
        if (currentCategoryId === 'uncategorized') {
            clearBtn.style.display = 'inline-flex';
        } else {
            clearBtn.style.display = 'none'; // 在其他正常文件夹里，直接让它消失！
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

// ✨ 终极版：结构化下拉菜单（自动禁用包含子级的父级文件夹）
// ✨ 极致强迫症版：所有顶级文件夹一律锁死，强制两级结构！
// ✨ 顶级交互版：带有“快捷新建”入口的结构化菜单
// 纯净版：无 Emoji 的结构化菜单
function refreshSelectOptions() {
    const selects = ['modal-category-select', 'batch-category-select', 'edit-category-select'];
    
    const parents = allCategories.filter(c => !c.parentId);
    const children = allCategories.filter(c => c.parentId);

    let optionsHtml = `<option value="">(无) 请选择具体子文件夹...</option>`; 
    
    // 移除了表情，保留了高亮颜色
    optionsHtml += `<option value="CREATE_NEW" style="color: #3b82f6; font-weight: bold;">快捷新建文件夹...</option>`;
    
    parents.forEach(p => {
        const myChildren = children.filter(c => c.parentId === p._id);
        optionsHtml += `<optgroup label="── ${p.name} ──">`;
        if (myChildren.length > 0) {
            myChildren.forEach(c => {
                // 用两个空格代替图标，保持子文件夹的视觉缩进
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

// 专属父级文件夹的复合交互引擎
function handleParentClick(event, folderId, folderName, folderType, liElement) {
    const childrenContainer = document.getElementById(`children-of-${folderId}`);
    const arrowContainer = liElement.querySelector('.toggle-arrow');
    
    // 1. 智能展开与折叠逻辑
    if (childrenContainer) {
        if (childrenContainer.style.display === 'none') {
            // 处于折叠状态时，点击展开
            childrenContainer.style.display = 'block';
            collapsedFolders.delete(folderId);
            if (arrowContainer) {
                arrowContainer.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
            }
        } else if (currentCategoryId === folderId) {
            // 如果已经展开，且当前右侧正是该父级的视图，再次点击则收起
            childrenContainer.style.display = 'none';
            collapsedFolders.add(folderId);
            if (arrowContainer) {
                arrowContainer.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
            }
        }
    }

    // 2. 将系统焦点切换至父级
    // 这一步会自动将右侧标题改为父级名称，显示设置按钮，并聚合加载名下所有子分类的卡片
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
    
    // 1. 处理“所有卡片”全局视图：直接显示全部，不进行任何分类拦截
    if (currentCategoryId === 'all' || currentCategoryId === 'dashboard') {
        filtered = allCards;
    } 
    // 2. 处理“未分类区”：只抓取没有家（null/空/undefined）的卡片
    else if (currentCategoryId === 'uncategorized') {
        filtered = allCards.filter(card => {
            // 兼容性查户口：不管后端传的是哪个字段，只要没值就放行
            const catId = card.category ? (card.category._id || card.category) : card.categoryId;
            return !catId || catId === 'null' || catId === '';
        });
    } 
    // 3. 处理普通文件夹 & 父级聚合视图
    else {
        // 构建当前文件夹及其子文件夹的“白名单”
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

    // 最后应用搜索过滤
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

        // 动态判断当前卡片是否被选中，以渲染对应的 SVG 图标
        const isChecked = selectedCards.has(card._id);
        const checkboxIcon = isChecked 
            ? `<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="#3b82f6" stroke-width="2"></circle><path d="M8 12l3 3 5-6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`
            : `<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="#cbd5e1" stroke-width="2"></circle></svg>`;

        // 当卡片被选中时，边框会变成莫兰迪蓝色，提升视觉反馈的质感
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
// ✨ 智能防穿透：打开单张添加弹窗
// ✨ 智能预填：精确匹配未分类的值
// ✨ 智能预填：精确匹配未分类的值，告别空白选项
// ✨ 智能预填：回归最原始的空字符串，完美匹配 "(无) 未分类"
// ✨ 沉浸式引擎版：打开添加卡片弹窗
function openAddCardModal() { 
    document.getElementById('modal-question').value = '';
    document.getElementById('modal-answer').value = '';
    
    const selectEl = document.getElementById('modal-category-select');
    
    // 🌟 1. 确保画中画弹窗的 HTML 存在于页面中
    injectQuickCategoryModal();
    
    // 🌟 2. 监听下拉框，如果选了“快捷新建”，就呼出画中画弹窗
    selectEl.onchange = function() {
        if (this.value === 'CREATE_NEW') {
            openQuickCategoryModal();
        }
    };

    if (currentCategoryId !== 'all' && currentCategoryId !== 'uncategorized' && currentCategoryId !== 'dashboard') {
        const isParentFolder = allCategories.some(c => c.parentId === currentCategoryId);
        if (isParentFolder) {
            selectEl.value = ""; 
        } else {
            selectEl.value = currentCategoryId; 
        }
    } else {
        selectEl.value = ""; 
    }

    if (currentCategoryId !== 'all' && currentCategoryId !== 'uncategorized' && currentCategoryId !== 'dashboard') {
        // 🛑 核心修复：真正的顶级大类判定（只要它自己没归属，就是大类）
        const currentCat = allCategories.find(c => c._id === currentCategoryId);
        const isParentFolder = currentCat && !currentCat.parentId; 
        
        if (isParentFolder) {
            selectEl.value = ""; // 是大类，强制置空，逼用户选
        } else {
            selectEl.value = currentCategoryId; // 是子类，正常预填
        }
    } else {
        selectEl.value = ""; 
    }


    openModal('add-card-modal');
}

// ✨ 智能防穿透：打开批量导入弹窗
// 完整替换 openBatchModal 函数
function openBatchModal() { 
    document.getElementById('batch-input').value = ''; 
    const selectEl = document.getElementById('batch-category-select');
    
    if (currentCategoryId !== 'all' && currentCategoryId !== 'uncategorized' && currentCategoryId !== 'dashboard') {
        // 🛑 同步修复
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

// ✨ 终极版添加卡片：保存 -> 强制刷新数据 -> 智能追随视角
// ✨ 终极版：添加卡片 (拦截后端报错 + 修正分类值)
async function createFlashcardFromModal() {
    const question = document.getElementById('modal-question').value;
    const answer = document.getElementById('modal-answer').value;
    const selectValue = document.getElementById('modal-category-select').value;
    
    if (!question || !answer) return alert('请填写完整内容');
    
    // 整理分类数据：如果是未分类，就传 null
    let categoryId = null;
    if (selectValue && selectValue !== "" && selectValue !== "uncategorized") {
        categoryId = selectValue;
    }

    const payload = { question: question.trim(), answer: answer.trim(), categoryId };

    try {
        // 🛑 坚决改回正确的复数大门！
        const response = await fetch('/api/flashcards', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            // 抓取后端的真实抱怨内容
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
    
    // 🛑 核心修复：极简取值
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

// ✨ 完美适配你 UI 的批量导入核心逻辑
// ✨ 终极批量导入：智能抓取分类 + 暴力过滤垃圾字符 + 报错透传
// ✨ 终极批量导入：增加“正在导入”动画 + 并发极速提速版
// ✨ 终极批量导入：莫兰迪 SVG 加载 + 绝对防卡死修复版
async function confirmBatchImport(event) {
    const textInput = document.getElementById('batch-input') || document.getElementById('import-text');
    const categorySelect = document.getElementById('modal-category-select') || document.getElementById('import-category-select');
    
    // 兼容抓取你的按钮，最好在 HTML 给它加个 id="btn-batch-submit"
    const submitBtn = document.getElementById('btn-batch-submit') || document.querySelector('button[onclick*="confirmBatchImport"]');

    if (!textInput || !textInput.value.trim()) {
        alert("⚠️ 请输入需要导入的单词！");
        return;
    }

    const text = textInput.value.trim();
    const lines = text.split('\n');
    const newCards = [];
    
   // 在 confirmBatchImport 函数内部找到这段，替换掉
    let categoryId = null;
    if (categorySelect && categorySelect.value) {
        categoryId = categorySelect.value; 
    } else if (currentCategoryId && currentCategoryId !== 'all' && currentCategoryId !== 'uncategorized') {
        
        // 🛑 终极雷达升级：即使是不带儿子的“哈哈哈”，也能被精准拦截
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

    // 🌟 正确的位置：在真正发请求前，让按钮变身 Loading！
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
        // 🌟 暴力的收尾：任务结束，不管怎样，强制恢复原状！绝不留任何 Loading 代码！
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

// --- 1. 背诵模式 ---
// --- 1. 增强版背诵引擎（支持父级聚合继承） ---
function startStudyMode() {
    const limitInput = document.getElementById('study-limit');
    const maxCards = limitInput ? parseInt(limitInput.value) || 20 : 20;
    const now = new Date();
    
    // 提前构建当前视角的“白名单”（包含父级自身和所有子级）
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
            // 核心修复：按白名单抓取卡片，完美继承子级复习任务
            const cardCatId = card.category ? card.category._id : card.categoryId;
            isMatch = targetCategoryIds.has(cardCatId);
        }
        return isDue && isMatch;
    });

    if (dueCards.length === 0) return alert('太棒了！当前分类（含所有子文件夹）下没有需要复习的卡片！');
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
// --- 2. 增强版默写引擎（支持父级聚合继承） ---
function startSpellMode() {
    const limitInput = document.getElementById('study-limit');
    const maxCards = limitInput ? parseInt(limitInput.value) || 20 : 20;
    const now = new Date();
    
    // 同样构建白名单
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
            // 核心修复：按白名单抓取卡片
            const cardCatId = card.category ? card.category._id : card.categoryId;
            isMatch = targetCategoryIds.has(cardCatId);
        }
        return isReadyForSpell && isMatch && isDue; 
    });

    if (dueCards.length === 0) return alert('提示：当前分类（含所有子文件夹）没有[可默写]的单词！\n\n原因可能是：\n1. 单词都已复习完\n2. 单词还处于初级阶段，请先在[背诵模式]里背对1次解锁默写！');
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

// ✨ 极度安全的过滤逻辑 (提取成公共函数，绝不误杀)
function getUncategorizedCards() {
    return allCards.filter(c => {
        // 🛑 容错处理：不管是 categoryId 还是 category，只要没值就属于未分类区
        const catValue = c.categoryId || (c.category ? (c.category._id || c.category) : null);
        return !catValue || catValue === 'uncategorized' || catValue === '';
    });
}

// ✨ 拦截器：呼出弹窗，并明确展示要删的是哪些词！
function showClearConfirmModal() {
    const targetCards = getUncategorizedCards();
    
    if (targetCards.length === 0) {
        alert("当前未分类区域为空，无需清空。");
        return;
    }
    
    // 🛡️ 防呆设计：在弹窗里显示几个要删的单词，让用户肉眼确认！
    const sampleWords = targetCards.slice(0, 3).map(c => c.question).join(', ');
    const moreText = targetCards.length > 3 ? '...' : '';
    
    const confirmText = document.getElementById('clear-confirm-text');
    if (confirmText) {
        confirmText.innerHTML = `即将删除 <b>${targetCards.length}</b> 张未分类卡片<br><span style="font-size: 12px; color: #94a3b8;">(包含: ${sampleWords}${moreText})</span><br>一旦删除无法恢复。`;
    }

    const modal = document.getElementById('clear-confirm-modal');
    if (modal) modal.style.display = 'flex';
}

// ✨ 核心删除引擎
async function executeClearUncategorized() {
    const targetCards = getUncategorizedCards(); // 再次严格获取一遍
    const btn = document.getElementById('confirm-clear-btn');
    const originalText = btn.innerHTML;

    const spinnerSvg = `<svg style="animation: spin 1s linear infinite; margin-right: 6px; width: 14px; height: 14px; display: inline-block; vertical-align: -2px;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle style="opacity: 0.25;" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path style="opacity: 0.75;" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;

    if (btn) {
        btn.innerHTML = `${spinnerSvg} 清空中...`;
        btn.disabled = true;
        btn.style.opacity = '0.8';
        btn.style.cursor = 'wait';
    }

    try {
        const deletePromises = targetCards.map(card => 
            fetch(`/api/flashcards/${card._id}`, { method: 'DELETE' })
        );
        await Promise.all(deletePromises);
        
        document.getElementById('clear-confirm-modal').style.display = 'none';
        if (typeof loadFlashcards === 'function') loadFlashcards();
        else if (typeof renderCards === 'function') renderCards();
        
    } catch (error) {
        console.error("清空失败:", error);
        alert("网络连接异常，部分卡片可能未能清除。");
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        }
    }
}

// 全局状态变量
let isManageMode = false;
let selectedCards = new Set();

// 切换管理模式
// 增强版：切换管理模式（联动全选按钮）
function toggleManageMode() {
    isManageMode = !isManageMode;
    selectedCards.clear();
    
    const manageBtn = document.getElementById('btn-toggle-manage');
    const selectAllBtn = document.getElementById('btn-select-all');
    
    if (manageBtn) {
        manageBtn.textContent = isManageMode ? "退出管理" : "批量管理";
        manageBtn.style.color = isManageMode ? "#3b82f6" : "#64748b";
    }
    
    // 控制全选按钮的显示和文字初始化
    if (selectAllBtn) {
        selectAllBtn.style.display = isManageMode ? "inline-block" : "none";
        selectAllBtn.textContent = "全选";
    }
    
    if (typeof renderCards === 'function') renderCards();
    updateBatchActionBar();
}

// 增强版：强制退出管理模式
function exitManageMode() {
    isManageMode = false;
    selectedCards.clear();
    
    const manageBtn = document.getElementById('btn-toggle-manage');
    const selectAllBtn = document.getElementById('btn-select-all');
    
    if (manageBtn) {
        manageBtn.textContent = "批量管理";
        manageBtn.style.color = "#64748b";
    }
    
    if (selectAllBtn) {
        selectAllBtn.style.display = "none";
    }
    
    if (typeof renderCards === 'function') renderCards();
    updateBatchActionBar();
}

// ✨ 全新核心引擎：智能全选/取消全选 (仅针对当前页面可见的卡片)
function toggleSelectAllCards() {
    if (!isManageMode) return;

    // 极其严谨的设计：只抓取当前页面实际渲染出来的卡片 ID
    const visibleCheckboxes = document.querySelectorAll('[id^="checkbox-wrap-"]');
    const visibleIds = Array.from(visibleCheckboxes).map(node => node.id.replace('checkbox-wrap-', ''));
    
    if (visibleIds.length === 0) return;

    // 判断当前是否已经全部选中
    const isAllSelected = visibleIds.every(id => selectedCards.has(id));

    if (isAllSelected) {
        // 如果已经全选，则执行“取消全选”
        visibleIds.forEach(id => selectedCards.delete(id));
        document.getElementById('btn-select-all').textContent = "全选";
    } else {
        // 否则，执行“全选”
        visibleIds.forEach(id => selectedCards.add(id));
        document.getElementById('btn-select-all').textContent = "取消全选";
    }

    // 局部极速更新 UI，拒绝整个页面重绘导致的闪烁
    visibleIds.forEach(id => {
        const checkboxWrap = document.getElementById(`checkbox-wrap-${id}`);
        const cardItem = checkboxWrap.closest('.card-item');
        const isChecked = selectedCards.has(id);
        
        if (checkboxWrap) {
            checkboxWrap.innerHTML = isChecked 
                ? `<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="#3b82f6" stroke-width="2"></circle><path d="M8 12l3 3 5-6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`
                : `<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="#cbd5e1" stroke-width="2"></circle></svg>`;
        }
        if (cardItem) {
            cardItem.style.borderColor = isChecked ? '#3b82f6' : '#f1f5f9';
        }
    });

    // 最后更新底部悬浮舱的数量显示
    updateBatchActionBar();
}

// 选中或取消选中卡片
function toggleCardSelection(cardId) {
    if (!isManageMode) return; 

    if (selectedCards.has(cardId)) {
        selectedCards.delete(cardId);
    } else {
        selectedCards.add(cardId);
    }
    
    // 局部更新复选框 UI，不引起页面重绘闪烁
    const checkboxWrap = document.getElementById(`checkbox-wrap-${cardId}`);
    if (checkboxWrap) {
        if (selectedCards.has(cardId)) {
            // 选中状态：莫兰迪蓝底色 + 白色对勾
            checkboxWrap.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="#3b82f6" stroke-width="2"></circle><path d="M8 12l3 3 5-6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
        } else {
            // 未选中状态：浅灰边框空心圆
            checkboxWrap.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="#cbd5e1" stroke-width="2"></circle></svg>`;
        }
    }
    
    updateBatchActionBar();
}

// 控制底部悬浮舱的显示与隐藏
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

// 极速并发删除引擎
async function executeBatchDelete() {
    if (selectedCards.size === 0) return;

    // 克制且清晰的二次确认
    if (!confirm(`确定要删除选中的 ${selectedCards.size} 张卡片吗？此操作不可恢复。`)) return;

    const countText = document.getElementById('selected-count-text');
    const originalText = countText.textContent;
    countText.textContent = "删除中...";

    try {
        const deletePromises = Array.from(selectedCards).map(id => 
            fetch(`/api/flashcards/${id}`, { method: 'DELETE' })
        );
        
        await Promise.all(deletePromises);
        
        exitManageMode(); // 删除完毕后自动退出管理模式
        
        if (typeof loadFlashcards === 'function') loadFlashcards();
        else if (typeof renderCards === 'function') renderCards();
        
    } catch (error) {
        console.error("批量删除失败:", error);
        alert("网络连接异常，部分卡片可能未能清除。");
        countText.textContent = originalText;
    }
}

// ✨ 拦截器：呼出批量移动弹窗，并动态加载最新的文件夹列表
// 拦截器：呼出批量移动弹窗，并采用高级结构化下拉菜单
function promptBatchMove() {
    if (selectedCards.size === 0) return;
    
    // 动态更新提示文字
    document.getElementById('batch-move-text').innerText = `将已选的 ${selectedCards.size} 张卡片移动到：`;
    
    // 1. 拆分父子节点
    const parents = allCategories.filter(c => !c.parentId);
    const children = allCategories.filter(c => c.parentId);

    // 2. 组装高级 HTML 结构（彻底隔离父级文件夹）
    let optionsHtml = `<option value="uncategorized">未分类区</option>`; 
    
    parents.forEach(p => {
        const myChildren = children.filter(c => c.parentId === p._id);
        
        // 核心防线：顶级文件夹变身不可点击的标题
        optionsHtml += `<optgroup label="── ${p.name} ──">`;
        
        if (myChildren.length > 0) {
            myChildren.forEach(c => {
                // 用空格做层级缩进
                optionsHtml += `<option value="${c._id}">  ${c.name}</option>`;
            });
        } else {
            // 空目录直接灰色禁用
            optionsHtml += `<option value="" disabled>  (空目录，不可放入卡片)</option>`;
        }
        
        optionsHtml += `</optgroup>`;
    });
    
    // 3. 渲染到批量移动的下拉框中
    const moveSelect = document.getElementById('batch-move-select');
    if (moveSelect) {
        moveSelect.innerHTML = optionsHtml;
    }
    
    // 呼出弹窗
    const modal = document.getElementById('batch-move-modal');
    if (modal) modal.style.display = 'flex';
}

// ✨ 核心引擎：极速并发执行移动
async function executeBatchMove() {
    if (selectedCards.size === 0) return;
    
    // 抓取目标文件夹的 ID
    let targetCategoryId = document.getElementById('batch-move-select').value;
    // 如果用户选择了“未分类区”，在数据底层我们将 categoryId 设为 null 以剥离它的归属
    if (targetCategoryId === 'uncategorized') targetCategoryId = null; 

    const btn = document.getElementById('confirm-move-btn');
    const originalText = btn.innerHTML;
    
    // 纯净的 SVG Loading 动画，融入按钮
    const spinnerSvg = `<svg style="animation: spin 1s linear infinite; margin-right: 6px; width: 14px; height: 14px; display: inline-block; vertical-align: -2px;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle style="opacity: 0.25;" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path style="opacity: 0.75;" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
    
    if (btn) {
        btn.innerHTML = `${spinnerSvg} 移动中...`;
        btn.disabled = true;
        btn.style.opacity = '0.8';
        btn.style.cursor = 'wait';
    }

    try {
        // 利用 Promise.all 齐射并发：向后端发送所有选中的卡片的更新请求
        const movePromises = Array.from(selectedCards).map(id => {
            // 找到卡片原本的数据，只修改它的归属地 (categoryId)
            const card = allCards.find(c => c._id === id);
            if (!card) return Promise.resolve(); // 兜底防止意外报错
            
            return fetch(`/api/flashcards/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    question: card.question, 
                    answer: card.answer, 
                    categoryId: targetCategoryId 
                })
            });
        });
        
        await Promise.all(movePromises);
        
        // 成功转移后：关闭弹窗 -> 强制退出管理模式 -> 重新拉取最新数据刷新列表
        document.getElementById('batch-move-modal').style.display = 'none';
        exitManageMode(); 
        
        if (typeof loadFlashcards === 'function') loadFlashcards();
        
    } catch (error) {
        console.error("批量移动失败:", error);
        alert("网络连接异常，部分卡片可能未能成功转移。");
    } finally {
        // 稳健收尾，恢复按钮状态
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        }
    }
}

// ✨ 全局 ESC 退出引擎 (层级优先级拦截)
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        let isModalClosed = false;

        // 优先级 1：检查并关闭所有可能打开的弹窗 (蒙层)
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

        // 优先级 2：如果刚才没有关闭任何弹窗，且当前处于批量管理模式，则优雅退出管理模式
        if (!isModalClosed && isManageMode) {
            exitManageMode();
        }
    }
});

// ==========================================
// ✨ 弹窗内快捷新建文件夹引擎 (Inline UI)
// ==========================================
function setupInlineCategoryUI() {
    const selectEl = document.getElementById('modal-category-select');
    if (!selectEl || selectEl.dataset.inlineBound) return;
    
    // 标记已绑定，防止重复渲染
    selectEl.dataset.inlineBound = 'true';
    
    // 监听下拉框的选中事件
    selectEl.addEventListener('change', function() {
        if (this.value === 'CREATE_NEW') {
            showInlineCategoryForm();
        }
    });

    // 在下拉框屁股后面，偷偷塞入一个隐藏的精美表单
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            快速创建新文件夹
        </div>
        <input type="text" id="inline-cat-name" placeholder="输入文件夹名称 (如: 阅读高频词)" style="width: 100%; box-sizing: border-box; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 10px; font-size: 0.95rem; outline: none;">
        <select id="inline-cat-parent" style="width: 100%; box-sizing: border-box; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 14px; font-size: 0.95rem; outline: none; background: white;">
        </select>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button type="button" onclick="cancelInlineCategory()" style="padding: 8px 16px; border-radius: 8px; border: none; background: #e2e8f0; color: #475569; cursor: pointer; font-size: 0.9rem; font-weight: 500; transition: 0.2s;" onmouseover="this.style.background='#cbd5e1'" onmouseout="this.style.background='#e2e8f0'">取消</button>
            <button type="button" onclick="submitInlineCategory(event)" style="padding: 8px 16px; border-radius: 8px; border: none; background: #3b82f6; color: white; cursor: pointer; font-size: 0.9rem; font-weight: 500; transition: 0.2s;" onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">确认创建</button>
        </div>
    `;
    // 将表单插入到 HTML 中
    selectEl.parentNode.insertBefore(container, selectEl.nextSibling);
}

// 变形！隐藏下拉框，展现输入面板
function showInlineCategoryForm() {
    document.getElementById('modal-category-select').style.display = 'none';
    document.getElementById('inline-cat-form').style.display = 'block';
    
    // 动态拉取最新的父级目录供你选择
    const parentSelect = document.getElementById('inline-cat-parent');
    parentSelect.innerHTML = '<option value="">📁 (无) 作为顶级文件夹</option>';
    allCategories.filter(c => !c.parentId).forEach(cat => {
        // 智能预判：如果你刚才停留在“高中英语”视图，默认帮你选好“归属于高中英语”！
        const isSelected = (currentCategoryId === cat._id) ? 'selected' : '';
        parentSelect.innerHTML += `<option value="${cat._id}" ${isSelected}>↳ 归属于: ${cat.name}</option>`;
    });
    
    document.getElementById('inline-cat-name').value = '';
    // 自动聚焦输入框，键盘直接可以打字
    setTimeout(() => document.getElementById('inline-cat-name').focus(), 50);
}

// 后悔了，变回下拉框
function cancelInlineCategory() {
    document.getElementById('inline-cat-form').style.display = 'none';
    const selectEl = document.getElementById('modal-category-select');
    selectEl.style.display = 'block';
    selectEl.value = ""; // 恢复默认提示
}

// 发射！向后端发送创建请求
async function submitInlineCategory(event) {
    const name = document.getElementById('inline-cat-name').value.trim();
    const parentId = document.getElementById('inline-cat-parent').value;
    
    if (!name) return alert('名称不能为空哦！');
    
    const btn = event.target;
    const originalText = btn.innerText;
    btn.innerText = '创建中...';
    btn.disabled = true;
    
    try {
        // 1. 静默通知后端创建
        await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, parentId: parentId || null, type: 'vocabulary' })
        });
        
        // 2. 重新拉取所有文件夹数据 (这会悄悄更新整个左侧边栏和下拉框)
        await loadCategories(); 
        
        // 3. 完美变身：隐藏输入面板，展现全新的下拉框
        document.getElementById('inline-cat-form').style.display = 'none';
        const selectEl = document.getElementById('modal-category-select');
        selectEl.style.display = 'block';
        
        // 4. 极致体贴：帮你自动选中刚才创建的那个文件夹！
        setTimeout(() => {
            const createdCat = allCategories.find(c => c.name === name && (c.parentId || '') === parentId);
            if (createdCat) {
                selectEl.value = createdCat._id;
            }
        }, 150); // 给浏览器一点点渲染的时间
        
    } catch (error) {
        console.error("行内创建报错:", error);
        alert("创建失败，请检查网络。");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// ==========================================
// ✨ 极致体验：画中画连环创建引擎 (大类 + 子类一次搞定)
// ==========================================

function injectQuickCategoryModal() {
    if (document.getElementById('quick-category-modal')) return;
    
    const modalHtml = `
    <div id="quick-category-overlay" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; z-index:10000; background: transparent;" onclick="closeQuickCategoryModal()"></div>
    
    <div id="quick-category-modal" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:white; padding:24px; border-radius:16px; box-shadow:0 20px 40px rgba(0,0,0,0.2); z-index: 10001; width: 340px; border: 1px solid #e2e8f0;">
        <h3 style="margin-top:0; color:#1e293b; font-size:1.15rem; margin-bottom:20px; display:flex; align-items:center; gap:8px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
            极速建档中心
        </h3>

        <label style="font-size:0.85rem; color:#64748b; font-weight:600; margin-bottom:8px; display:block;">1. 归属大类 (顶级文件夹)</label>
        <select id="quick-parent-select" style="width:100%; padding:12px; border-radius:10px; border:1px solid #cbd5e1; margin-bottom:10px; outline:none; background:#f8fafc;" onchange="toggleNewParentInput()">
        </select>
        
        <input type="text" id="quick-new-parent-name" placeholder="请输入全新大类名称 (如: 雅思)" style="display:none; width:100%; padding:12px; border-radius:10px; border:2px dashed #3b82f6; margin-bottom:16px; outline:none; box-sizing:border-box; background:#eff6ff; color:#1e293b; font-weight:500;">

        <label style="font-size:0.85rem; color:#64748b; font-weight:600; margin-bottom:8px; display:block; margin-top:8px;">2. 子文件夹 (实际存放卡片的位置)</label>
        <input type="text" id="quick-child-name" placeholder="必填 (如: 核心词汇)" style="width:100%; padding:12px; border-radius:10px; border:1px solid #cbd5e1; margin-bottom:24px; outline:none; box-sizing:border-box; font-weight:500;">

        <div style="display:flex; justify-content:flex-end; gap:12px;">
            <button onclick="closeQuickCategoryModal()" style="padding:10px 18px; border:none; background:#f1f5f9; color:#475569; border-radius:10px; cursor:pointer; font-weight:600; transition:0.2s;" onmouseover="this.style.background='#e2e8f0'">取消</button>
            <button id="quick-cat-submit-btn" onclick="submitQuickCategory()" style="padding:10px 18px; border:none; background:#3b82f6; color:white; border-radius:10px; cursor:pointer; font-weight:600; transition:0.2s; box-shadow:0 4px 6px -1px rgba(59,130,246,0.3);" onmouseover="this.style.background='#2563eb'">确认创建</button>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function openQuickCategoryModal() {
    const addCardModal = document.getElementById('add-card-modal');
    addCardModal.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    addCardModal.style.filter = 'blur(6px) brightness(0.85)';
    addCardModal.style.pointerEvents = 'none';

    const parentSelect = document.getElementById('quick-parent-select');
    parentSelect.innerHTML = `<option value="CREATE_NEW_PARENT" style="color:#3b82f6; font-weight:bold;">创建全新大类...</option>`;
    parentSelect.innerHTML += `<option disabled>──────────────</option>`;
    
    allCategories.filter(c => !c.parentId).forEach(p => {
        parentSelect.innerHTML += `<option value="${p._id}">挂载到现有: ${p.name}</option>`;
    });

    document.getElementById('quick-category-overlay').style.display = 'block';
    document.getElementById('quick-category-modal').style.display = 'block';
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

    // 🌟 撤销特效：解除底层弹窗的模糊状态
    const addCardModal = document.getElementById('add-card-modal');
    addCardModal.style.filter = 'none';
    addCardModal.style.pointerEvents = 'auto';

    // 恢复下拉框默认状态
    const selectEl = document.getElementById('modal-category-select');
    if (selectEl.value === 'CREATE_NEW') selectEl.value = ""; 
}

// 🚀 高能预警：连环创建逻辑
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

// ==========================================
// 桌面级交互：右键菜单引擎 (编辑 + 删除)
// ==========================================

// ==========================================
// 桌面级交互：右键菜单引擎 (雷达升级版：通杀所有文件夹)
// ==========================================

(function setupContextMenu() {
    function injectContextMenu() {
        if(document.getElementById('custom-context-menu')) return;
        const menuHTML = `
            <div id="custom-context-menu" style="display:none; position:absolute; z-index:9999; background:white; border:1px solid #e2e8f0; border-radius:8px; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); padding:6px; min-width:150px;">
                <div id="ctx-edit-btn" style="padding:10px 12px; margin-bottom:4px; cursor:pointer; color:#3b82f6; font-size:0.9rem; border-radius:6px; display:flex; align-items:center; gap:8px; font-weight:500; transition:0.15s;" onmouseover="this.style.background='#eff6ff'" onmouseout="this.style.background='transparent'">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    重命名
                </div>
                <div style="height:1px; background:#e2e8f0; margin: 4px 0;"></div>
                <div id="ctx-delete-btn" style="padding:10px 12px; cursor:pointer; color:#ef4444; font-size:0.9rem; border-radius:6px; display:flex; align-items:center; gap:8px; font-weight:500; transition:0.15s;" onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='transparent'">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    删除该文件夹
                </div>
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

        // 🛑 核心修复：全频段智能雷达
        document.addEventListener('contextmenu', function(e) {
            // 不管你是什么标签，只要你身上带了 onclick 点击事件，我就查你
            const targetElement = e.target.closest('[onclick]');

            if (targetElement) {
                const onclickStr = targetElement.getAttribute('onclick') || '';

                // 💡 终极暴力扫描：直接拿着我们所有的文件夹 ID 去匹配这段代码
                // 只要这段点击事件里包含了某个文件夹的 ID，那点中的绝对就是它！
                const targetCat = allCategories.find(c => onclickStr.includes(c._id));

                if (targetCat) {
                    e.preventDefault(); // 强行拦截系统右键
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
                    
                    // 如果删掉的是当前正看着的文件夹，就退回“所有卡片”
                    if (currentCategoryId === contextMenuTargetId) {
                        const allCardsEl = document.querySelector(`.nav-item[onclick*="all"]`);
                        if(allCardsEl) allCardsEl.click();
                        else loadFlashcards();
                    } else {
                        // 🌟 特别补充：如果删掉的是父级大类，也要检查一下我们是不是在看着它的子类
                        // 为了稳妥，删完之后直接全局刷新一下卡片显示
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

// ==========================================
// 批量管理：纯前端 Excel(CSV) 导出引擎
// ==========================================

function batchExportCards() {
    if (typeof selectedCards === 'undefined' || selectedCards.size === 0) {
        alert("请先勾选需要导出的卡片！");
        return;
    }

    // 1. 捞出被勾选的卡片
    const cardsToExport = allCards.filter(card => selectedCards.has(card._id));
    if (cardsToExport.length === 0) return;

    // 2. 组装 CSV 内容
    // \uFEFF 是 UTF-8 的 BOM 头，这是魔法！没有它，Windows 的 Excel 打开中文字符会变乱码
    let csvContent = "\uFEFF"; 
    
    // 添加 Excel 的表头（第一行）
    csvContent += "正面 (问题),反面 (答案)\n";

    // 核心安全转义函数：防止卡片内容里本身就有逗号或换行，导致 Excel 错位
    const escapeCSV = (str) => {
        if (!str) return '""';
        let safeStr = String(str).replace(/"/g, '""'); // 将内部的双引号转义
        if (safeStr.search(/("|,|\n)/g) >= 0) {
            safeStr = `"${safeStr}"`; // 如果有特殊字符，用双引号把整个格子包起来
        }
        return safeStr;
    };

    // 将卡片数据一行行塞进去
    cardsToExport.forEach(card => {
        const q = escapeCSV(card.question);
        const a = escapeCSV(card.answer);
        csvContent += `${q},${a}\n`;
    });

    // 3. 智能命名，这次后缀变成了 .csv
    let fileName = "批量导出卡片.csv";
    if (typeof currentCategoryId !== 'undefined' && currentCategoryId !== 'all' && currentCategoryId !== 'uncategorized' && currentCategoryId !== 'dashboard') {
        const cat = allCategories.find(c => c._id === currentCategoryId);
        if (cat) fileName = `${cat.name}_导出.csv`;
    } else if (currentCategoryId === 'uncategorized') {
        fileName = "未分类区_导出.csv";
    }

    // 4. 触发浏览器下载
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