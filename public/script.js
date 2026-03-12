// ==========================================
// 🔌 Flashcard Pro V2.0 终极UI修复版 (极简丝滑+手势引擎)
// ==========================================

// 🛡️ [终极防线]：通过 JS 强行注入移动端抽屉样式，彻底解决侧边栏挤压卡片的问题！
// 🛡️ [终极防线]：通过 JS 强行注入苹果原生级底部导航栏与上拉菜单！
// ==========================================
// 🔌 Flashcard Pro V2.0 终极UI修复版 (极简丝滑+手势引擎)
// ==========================================

// 🛡️ 1. 注入绝对不会错位的 CSS (修复 Z-index 穿透和大按钮排版)

// 🛡️ [终极防线]：修复层级穿透、恢复顶部加号，并加入手机端专属分类页样式
const styleFix = document.createElement('style');
styleFix.innerHTML = `
    @media (max-width: 768px) {
        .sidebar { display: none !important; }
        #mobile-menu-btn { display: none !important; }
        .main-content { padding-bottom: 85px !important; }
        
        .mobile-bottom-nav {
            display: flex; justify-content: space-around; align-items: center;
            position: fixed; bottom: 0; left: 0; width: 100%; height: 65px;
            background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
            box-shadow: 0 -4px 20px rgba(0,0,0,0.05); 
            z-index: 900; 
            padding-bottom: env(safe-area-inset-bottom); border-top: 1px solid #f1f5f9;
        }
        .nav-tab {
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            color: #94a3b8; font-size: 0.7rem; font-weight: 600; gap: 4px; flex: 1; cursor: pointer; transition: 0.2s;
        }
        .nav-tab.active { color: #4f46e5; }
        .nav-tab svg { width: 22px; height: 22px; stroke: currentColor; transition: 0.2s; }
        .nav-tab.active svg { transform: translateY(-2px); }

        /* 🌟 手机端分类页专属 UI (大卡片 + 分离触控区) */
        #folders-view { padding: 12px 16px 30px 16px !important; background: #f8fafc; min-height: 100vh; }
        .mobile-folder-card {
            background: white; border-radius: 16px; margin-bottom: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.02); border: 1px solid #f1f5f9; overflow: hidden;
        }
        .mobile-folder-header { display: flex; align-items: center; height: 60px; }
        /* 左侧 80%：点击直接进文件夹 */
        .mobile-folder-content {
            flex: 1; display: flex; align-items: center; gap: 12px; padding: 0 16px; height: 100%; cursor: pointer;
        }
        /* 右侧 20%：折叠控制区 */
        .mobile-folder-toggle {
            width: 56px; height: 100%; display: flex; align-items: center; justify-content: center;
            border-left: 1px solid #f8fafc; color: #94a3b8; cursor: pointer;
        }
        .mobile-child-list { background: #f8fafc; border-top: 1px solid #f1f5f9; padding: 4px 0; }
        .mobile-child-item {
            padding: 14px 16px 14px 44px; display: flex; align-items: center; gap: 10px;
            color: #475569; font-size: 0.95rem; border-bottom: 1px solid #f1f5f9; cursor: pointer;
        }
        .mobile-child-item:last-child { border-bottom: none; }
    }
    
    #modal-overlay { z-index: 9998 !important; }
    .pro-modal { z-index: 9999 !important; }
    #quick-category-overlay { z-index: 10000 !important; }
    #quick-category-modal { z-index: 10001 !important; }
    
    @media (min-width: 769px) {
        .mobile-bottom-nav { display: none !important; }
        #folders-view { display: none !important; } 
        .sidebar { display: flex !important; flex-direction: column !important; }
    }
`;
document.head.appendChild(styleFix);


// 🛡️ 2. 同步极速注入 HTML 容器 (解决空数据、无响应的元凶)
// 这样做保证了等一下 loadCategories 时，folders-view 已经准备好接客了！
(function initMobileUISync() {
    if (!document.getElementById('mobile-bottom-nav')) {
        const bottomNavHTML = `
            <nav id="mobile-bottom-nav" class="mobile-bottom-nav">
                <div class="nav-tab active" id="tab-dashboard" onclick="handleBottomNav('dashboard')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    <span>主页</span>
                </div>

                <div class="nav-tab" id="tab-explore" onclick="handleBottomNav('explore')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <span>发现</span>
                </div>

                <div class="nav-tab" id="tab-folders" onclick="handleBottomNav('folders')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    <span>词库</span>
                </div>

                <div class="nav-tab" id="tab-profile" onclick="handleBottomNav('profile')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    <span>我的</span>
                </div>
            </nav>
        `;
        document.body.insertAdjacentHTML('beforeend', bottomNavHTML);
    }

    if (!document.getElementById('folders-view')) {
        const foldersViewHTML = `
            <div id="folders-view" class="view hidden" style="padding: 16px; box-sizing: border-box; animation: fadeIn 0.3s ease;">
                <div style="background: white; border-radius: 20px; padding: 10px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid #f1f5f9;">
                    <ul class="nav-menu" id="mobile-folders-menu" style="margin:0;"></ul>
                </div>
            </div>
        `;
        const contentArea = document.querySelector('.content-area');
        if (contentArea) contentArea.insertAdjacentHTML('beforeend', foldersViewHTML);
    }

})();

// 🛡️ 3. 注册底栏中枢路由
window.handleBottomNav = function(target) {
    if (window.innerWidth > 768) return;

    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    const tab = document.getElementById('tab-' + target);
    if (tab) tab.classList.add('active');

    if (target === 'dashboard') {
        const dashBtn = document.querySelector('.nav-item[onclick*="selectDashboard"]');
        if (dashBtn) selectDashboard(dashBtn);
    } else if (target === 'all') {
        if (typeof goToAllCards === 'function') goToAllCards();
    } else if (target === 'folders') {
        document.getElementById('current-view-title').innerText = '知识库分类';
        showMainView('folders-view'); 
    }
};

// --- 下面接你原来的 let allCards = []; 等等代码 ---
let allCards = [];

let allCategories = [];
let currentCategoryId = 'all';
let editingCardId = null;
let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
let touchEndY = 0;
let collapsedFolders = new Set();
let rootCollapsed = false;
let isFreePracticeMode = false; // 🌟 记得在函数外部定义这个变量


document.addEventListener('DOMContentLoaded', () => {
    // 1. ⚡ 开启骨架屏护盾
    window.isDataLoading = true;
    showMainView('dashboard-view');
    const titleEl = document.getElementById('current-view-title');
    if (titleEl) titleEl.innerText = 'Tagi ～';
    
    // 此时渲染的是骨架屏，绝不跳动
    if (typeof renderDashboard === 'function') renderDashboard(); 

    // 2. 异步静默拉取数据
    Promise.all([loadCategories(), loadFlashcards()]).then(() => {
        window.isDataLoading = false; // 关闭护盾
        const dashboardNavItem = document.querySelector('.nav-item[onclick*="selectDashboard"]');
        if (dashboardNavItem) {
            selectDashboard(dashboardNavItem);
        } else {
            renderDashboard(); // 数据满载回归
        }
    }).catch(err => {
        console.error("加载数据失败:", err);
        window.isDataLoading = false;
        renderDashboard(); 
    });

    // 3. 基础事件绑定
    const addBtn = document.getElementById('btn-add-card');
    if (addBtn) {
        addBtn.onclick = (e) => {
            e.preventDefault();
            openAddCardModal();
        };
    }

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
    overlay.onclick = () => {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && sidebar.classList.contains('mobile-active')) {
            toggleMobileSidebar();
        }
    };
});

// --- 1. 视图切换引擎 ---
// --- 1. 视图切换引擎 (🌟 新增沉浸式学习状态管理) ---
// --- 1. 视图切换引擎 (🌟 修复异步覆盖 Bug 版) ---
// --- 1. 视图切换引擎 (🚀 上线级：完美平衡版) ---
// --- 1. 视图切换引擎 (🚀 上线级：完美平衡 + 笔记类型智能过滤版) ---
function showMainView(viewId) {
    const views = ['manage-view', 'study-view', 'spell-view', 'dashboard-view', 'folders-view'];
    views.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    const target = document.getElementById(viewId);
    if (target) target.classList.remove('hidden');

    // ==== 🛡️ 核心修复：全局 Header 栏目控制 ====
    const globalHeader = document.querySelector('.main-header');
    const viewTitle = document.getElementById('current-view-title');
    const headerActions = document.querySelector('.header-actions');
    
    if (viewId === 'dashboard-view') {
        // 1. 【彻底抹除】主页顶部的白条
        if (globalHeader) globalHeader.style.setProperty('display', 'none', 'important');
        
        // 2. 隐藏标题和动作区
        if (viewTitle) viewTitle.style.display = 'none';
        if (headerActions) headerActions.style.display = 'none';

        // 3. 执行主页渲染
        window.isFreePracticeMode = false;
        if (typeof renderDashboard === 'function') renderDashboard(); 
        
    } else if (viewId === 'folders-view') {
        // 📁 【手机端分类页】：隐藏顶部繁杂按钮，但保留白条显示标题
        if (globalHeader) globalHeader.style.display = 'flex';
        if (headerActions) headerActions.style.display = 'none';
        if (viewTitle) viewTitle.style.display = 'block';

    } else if (viewId === 'manage-view') {
        // 📁 【常规列表页】：全副武装！恢复所有显示
        if (globalHeader) globalHeader.style.display = 'flex';
        if (headerActions) headerActions.style.display = 'flex';
        if (viewTitle) viewTitle.style.display = 'block';
        
        // 原有的按钮显示逻辑...
        const addBtn = document.getElementById('btn-add-card');
        const manageBtn = document.getElementById('btn-toggle-manage');
        if (addBtn) addBtn.style.display = 'inline-flex';
        if (manageBtn) manageBtn.style.display = 'inline-flex';
        
        if (typeof filterCards === 'function') filterCards(); 

    } else {
        // 🎯 【沉浸背诵/默写】：全屏清场！
        if (globalHeader) globalHeader.style.display = 'none'; 
    }

    // 动态控制“未分类区”的专属清空按钮
    const clearBtn = document.getElementById('btn-clear-uncategorized');
    if (clearBtn) {
        clearBtn.style.display = (currentCategoryId === 'uncategorized' && viewId === 'manage-view') ? 'inline-flex' : 'none';
    }
}

// --- 2. 侧边栏与文件夹管理 ---
// --- 2. 侧边栏与文件夹管理 ---
// --- 2. 侧边栏与文件夹管理 (双路渲染引擎) ---
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        allCategories = await response.json();

        let desktopHtml = ''; 
        let mobileHtml = '';

        const icons = {
            dashboard: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>`,
            all: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
            folder: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
            doc: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
            arrowRight: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
            arrowDown: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>`
        };

        // ==== 1. 组装电脑端左侧菜单 ====
        desktopHtml = `
            <li class="nav-item ${currentCategoryId === 'dashboard' ? 'active' : ''}" onclick="selectDashboard(this)">
                ${icons.dashboard} <span>学习数据</span>
            </li>
            <div style="height: 1px; background: #e2e8f0; margin: 10px 0;"></div>
        `;
        const rootArrow = rootCollapsed ? icons.arrowRight : icons.arrowDown;
        desktopHtml += `
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
        desktopHtml += `
            <li class="nav-item ${currentCategoryId === 'uncategorized' ? 'active' : ''}" style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;" onclick="selectSidebarItem('uncategorized', '未分类区', 'vocabulary', this)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 20px;"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                <span style="color: #475569;">未分类区</span>
            </li>
        `;

        // ==== 2. 组装手机端大卡片 UI ====
        mobileHtml = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px; margin-top: 10px;">
                <h3 style="margin:0; font-size:1.4rem; color:#1e293b; font-weight:800;">知识库</h3>
                <button onclick="openCategoryModal()" style="background:#eef2ff; color:#4f46e5; border:none; padding:8px 14px; border-radius:12px; font-weight:700; font-size:0.9rem; display:flex; align-items:center; gap:6px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>新建
                </button>
            </div>
            
            <div class="mobile-folder-card" onclick="selectSidebarItem('all', '所有卡片', 'vocabulary', null)">
                <div class="mobile-folder-header">
                    <div class="mobile-folder-content">${icons.all} <strong style="color:#1e293b; font-size:1.05rem;">所有卡片</strong></div>
                </div>
            </div>
            <div class="mobile-folder-card" onclick="selectSidebarItem('uncategorized', '未分类区', 'vocabulary', null)">
                <div class="mobile-folder-header">
                    <div class="mobile-folder-content">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        <strong style="color:#475569; font-size:1.05rem;">未分类区</strong>
                    </div>
                </div>
            </div>
        `;

        const parents = allCategories.filter(c => !c.parentId);
        const children = allCategories.filter(c => c.parentId);

        parents.forEach(p => {
            const hasChildren = children.some(c => c.parentId === p._id);
            const isCollapsed = collapsedFolders.has(p._id);
            const arrow = isCollapsed ? icons.arrowRight : icons.arrowDown;
            const icon = p.type === 'notes' ? icons.doc : icons.folder;
            const isActive = currentCategoryId === p._id ? 'active' : '';

            // 电脑端拼接
            desktopHtml += `
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

            // 手机端拼接 (分离触控区)
            mobileHtml += `
                <div class="mobile-folder-card">
                    <div class="mobile-folder-header">
                        <div class="mobile-folder-content" onclick="selectSidebarItem('${p._id}', '${p.name}', '${p.type}', null)">
                            ${icon} <strong style="color:#1e293b; font-size:1.05rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.name}</strong>
                        </div>
                        <div class="mobile-folder-toggle" onclick="toggleMobileFolder(event, '${p._id}')" style="visibility: ${hasChildren ? 'visible' : 'hidden'}">
                            <svg id="m-arrow-${p._id}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="transition: transform 0.3s; transform: rotate(${isCollapsed ? '-90deg' : '0deg'});"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                    </div>
                    <div id="m-children-${p._id}" class="mobile-child-list" style="display: ${isCollapsed ? 'none' : 'block'};">
            `;

            children.filter(c => c.parentId === p._id).forEach(child => {
                const cIcon = icons.doc;
                const cActive = currentCategoryId === child._id ? 'active' : '';
                
                desktopHtml += `<li class="nav-item is-child ${cActive}" onclick="selectSidebarItem('${child._id}', '${child.name}', '${child.type}', this)">${cIcon} <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${child.name}</span></li>`;
                
                mobileHtml += `<div class="mobile-child-item" onclick="selectSidebarItem('${child._id}', '${child.name}', '${child.type}', null)">${cIcon} <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${child.name}</span></div>`;
            });
            
            desktopHtml += `</div>`;
            mobileHtml += `</div></div>`;
        });
        desktopHtml += `</div>`;

        // 渲染到 DOM
        const sidebarMenu = document.getElementById('sidebar-menu');
        if (sidebarMenu) sidebarMenu.innerHTML = desktopHtml;

        const foldersView = document.getElementById('folders-view');
        if (foldersView) foldersView.innerHTML = mobileHtml; // 直接强行覆盖整个内容

        refreshSelectOptions();
        
    } catch (error) { console.error('加载分类失败:', error); }
}

// 📱 手机端专属的手风琴折叠函数 (完全独立，不影响电脑端)
window.toggleMobileFolder = function(event, folderId) {
    event.stopPropagation(); // 阻止进入文件夹的点击事件
    const childrenContainer = document.getElementById(`m-children-${folderId}`);
    const arrow = document.getElementById(`m-arrow-${folderId}`);
    
    if (childrenContainer) {
        if (childrenContainer.style.display === 'none') {
            childrenContainer.style.display = 'block';
            if (arrow) arrow.style.transform = 'rotate(0deg)';
            collapsedFolders.delete(folderId); // 顺便记录状态，两端同步
        } else {
            childrenContainer.style.display = 'none';
            if (arrow) arrow.style.transform = 'rotate(-90deg)';
            collapsedFolders.add(folderId);
        }
    }
};

// --- 下拉框隔离引擎 ---
function refreshSelectOptions() {
    const selects = ['modal-category-select', 'batch-category-select', 'edit-category-select'];
    const parents = allCategories.filter(c => !c.parentId);
    const children = allCategories.filter(c => c.parentId);

    let optionsHtml = `<option value="">(无) 放入未分类区...</option>`;
    optionsHtml += `<option disabled>──────────────</option>`;

    parents.forEach(p => {
        // 🌟 方案三核心：大类文件夹变灰且 disabled，绝不让用户选中！
        optionsHtml += `<option value="" disabled style="font-weight: bold; color: #94a3b8; background: #f8fafc;">📁 [大类] ${p.name} (不可直放卡片)</option>`;
        
        const myChildren = children.filter(c => c.parentId === p._id);
        if (myChildren.length > 0) {
            myChildren.forEach(c => {
                optionsHtml += `<option value="${c._id}" style="color: #1e293b; font-weight:500;">&nbsp;&nbsp;&nbsp;&nbsp;↳ 📦 [卡包] ${c.name}</option>`;
            });
        } else {
            optionsHtml += `<option value="" disabled style="color: #cbd5e1;">&nbsp;&nbsp;&nbsp;&nbsp;↳ (空，请先在外部建卡包)</option>`;
        }
    });

    selects.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = optionsHtml;
    });

    // 处理建大类的下拉框
    const parentSelect = document.getElementById('parent-category-select');
    if (parentSelect) {
        parentSelect.innerHTML = '<option value="">(无) 作为顶级大类</option>';
        parents.forEach(cat => {
            parentSelect.innerHTML += `<option value="${cat._id}">归属于 -> 📁 ${cat.name}</option>`;
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
// ✨ 侧边栏点击逻辑 (安全收起版 + 修复跨文件夹幽灵删除)
function selectSidebarItem(id, title, type, element) {
    try {
        currentCategoryId = id;

        // 🚨 修复 2：只要切换了文件夹，强行退出管理模式，清空勾选池！(防止误删其他文件夹的卡片)
        if (typeof exitManageMode === 'function' && isManageMode) {
            exitManageMode();
        }

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
        
        // 🌟 动态隐藏默写按钮
        const spellBtn = document.querySelector('button[onclick*="startSpellMode"]');
        if (spellBtn) {
            if (type === 'notes') {
                spellBtn.style.display = 'none';
            } else {
                spellBtn.style.display = '';
            }
        }
        
        // 触发界面切换，内部会自动调用 filterCards 刷新列表
        showMainView('manage-view');

        // 👇 替换原有的手机端逻辑：不需要收遮罩了，直接点亮底部“词库”按钮
        if (window.innerWidth <= 768) {
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            const tabAll = document.getElementById('tab-all');
            if (tabAll) tabAll.classList.add('active');
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
    document.getElementById('current-view-title').innerText = 'Tagi ～';
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');
    const settingsBtn = document.getElementById('category-settings-btn');
    if (settingsBtn) settingsBtn.classList.add('hidden');

    showMainView('dashboard-view');
    renderDashboard();

    if (window.innerWidth <= 768) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && sidebar.classList.contains('mobile-active')) toggleMobileSidebar();
    }
}

// ✨ 完美抽屉与遮罩切换
function toggleMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobile-overlay');
    if (!sidebar || !overlay) return;

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
        let activeEl = null; navItems.forEach(el => { if (el.classList.contains('active')) activeEl = el; });
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
    try { 
        await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, parentId: parentId || null, type }) }); 
        closeAllModals(); 
        await loadCategories(); 
        
        // 🌟 自动导达新文件夹！
        const createdCat = allCategories.find(c => c.name === name && (c.parentId || null) === (parentId || null));
        if (createdCat) {
            selectSidebarItem(createdCat._id, createdCat.name, createdCat.type, null);
            if (window.innerWidth <= 768) window.handleBottomNav('all'); // 手机端切回词库看数据
        }
    } catch (error) { console.error(error); }
}

async function loadFlashcards() {
    try {
        const response = await fetch('/api/flashcards');
        allCards = await response.json();

        // 🌟 无论在哪个页面，先把数据看板的逻辑刷一遍，确保左侧边栏或首页数字准确
        renderDashboard();

        // 如果当前在列表页，再执行筛选和列表渲染
        if (document.getElementById('manage-view') && !document.getElementById('manage-view').classList.contains('hidden')) {
            filterCards();
        }

        console.log("✅ 全局数据同步完成，看板已点亮");
    } catch (error) {
        console.error('加载卡片失败:', error);
    }
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
    // ==========================================
    // 🛡️ 终极防空护盾：只要进了这个函数，如果是异常状态就拨乱反正
    // ==========================================
    if (currentCategoryId === 'dashboard' || !currentCategoryId) {
        currentCategoryId = 'all';
        // 点亮左侧的“所有卡片”
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        const allCardsNav = document.querySelector(`.nav-item[onclick*="all"]`);
        if (allCardsNav) allCardsNav.classList.add('active');
    }

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
        const cardCatId = card.category ? (card.category._id || card.category) : card.categoryId;
        const currentCat = allCategories.find(c => c._id === cardCatId);
        const isNoteType = currentCat ? currentCat.type === 'notes' : false;
        let stageHtml = '';
        if (isNoteType) {
            stageHtml = `<span style="${getBadgeStyle('#e0f2fe', '#0369a1')}">已归档</span>`;
        } else {
            stageHtml = card.stage >= 1
                ? `<span style="${getBadgeStyle('#fef3c7', '#b45309')}">可默写</span>`
                : `<span style="${getBadgeStyle('#f1f5f9', '#64748b')}">待进阶</span>`;
        }
        
        const reviewDate = card.nextReviewDate ? new Date(card.nextReviewDate) : now;
        const isDue = reviewDate <= now;

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

// ==========================================
// 🧠 Oopsy 核心记忆引擎 (Spaced Repetition V2)
// ==========================================
const REVIEW_INTERVALS = [0.5, 1, 2, 4, 7, 15, 30]; // 艾宾浩斯间隔天数

function processCardMemory(card, isCorrect, isSpellMode = false) {
    if (typeof card.stage !== 'number') card.stage = 0;
    // 🌟 初始化错误分（如果没有的话）
    if (typeof card.failCount !== 'number') card.failCount = 0;

    if (isCorrect) {
        // ✅ 对了：正常升级
        if (isSpellMode) {
            card.stage = Math.min(card.stage + 2, REVIEW_INTERVALS.length - 1);
        } else {
            card.stage = Math.min(card.stage + 1, REVIEW_INTERVALS.length - 1);
        }
    } else {
        // ❌ 错了：执行“保级惩罚”
        if (isSpellMode) {
            // 🌟 关键改动：最低保在 Stage 1，确保它依然拥有“默写资格”
            card.stage = Math.max(1, card.stage - 1);
            card.failCount += 0.5; // 🌟 默写错：只加 0.5 分
        } else {
            // 背诵错了：如果是老兵(Stage>=1)就留级在1，如果是新人就回0
            card.stage = card.stage >= 1 ? 1 : 0;
            card.failCount += 1;   // 🌟 背诵错：加 1 分
        }
    }

    const nextDate = new Date();

    // 🌟 核心逻辑重写：只要错了，不管是 Stage 1、2 还是 5，通通明天见！
    if (!isCorrect) {
        nextDate.setDate(nextDate.getDate() + 1);
        nextDate.setHours(4, 0, 0, 0);
        console.log(`错题锁定：[${card.question}] 将在明天凌晨4点重新出现`);
    } else {
        // 只有对了，才按照艾宾浩斯阶梯延后
        const daysToAdd = REVIEW_INTERVALS[card.stage];
        nextDate.setTime(nextDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    }

    card.nextReviewDate = nextDate.toISOString();
    updateStreak();
    return card;
}

function updateStreak() {
    const now = new Date();
    const todayStr = now.toDateString();
    let lastActive = localStorage.getItem('oopsy_last_active');
    let streak = parseInt(localStorage.getItem('oopsy_streak_days')) || 0;

    if (lastActive === todayStr) return; // 今天已打卡

    if (lastActive) {
        const lastDate = new Date(lastActive);
        const diffDays = Math.ceil(Math.abs(now - lastDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) streak += 1;
        else if (diffDays > 1) streak = 1; // 断签清零
    } else {
        streak = 1;
    }

    localStorage.setItem('oopsy_last_active', todayStr);
    localStorage.setItem('oopsy_streak_days', streak);
}

// ==========================================
// 📊 首页数据引擎与智能推荐
// ==========================================
function renderDashboard() {
    // 🛡️ 新增：进入主页时，把全局头部那个多余的标题藏起来
    const viewTitle = document.getElementById('current-view-title');
    if (viewTitle) viewTitle.style.display = 'none'; 

    // 🛡️ 新增：顺便把那个“复习 20 张”的小方块也藏了，主页不需要它
    const studyLimitWrap = document.querySelector('.header-actions div');
    if (studyLimitWrap) studyLimitWrap.style.display = 'none';
    const now = new Date();

    // 1. 处理动态问候语 (根据时间)
    const hour = now.getHours();
    let greeting = "你好，大拿";
    if (hour < 12) greeting = "早上好，大拿";
    else if (hour < 18) greeting = "下午好，大拿";
    else greeting = "晚上好，大拿";

    const greetingTitle = document.querySelector('#dashboard-view h2');
    if (greetingTitle) greetingTitle.innerText = greeting;

    // ==========================================
    // 🛡️ 核心修复：安全骨架屏（杜绝 null 报错！）
    // ==========================================
    if (window.isDataLoading) {
        const elTotal = document.getElementById('dash-total-cards');
        if (elTotal) elTotal.innerText = '-';

        const elMastered = document.getElementById('dash-mastered-cards');
        if (elMastered) elMastered.innerText = '-';

        const elStreak = document.getElementById('dash-streak-days');
        if (elStreak) elStreak.innerText = '-';

        const elHard = document.getElementById('hard-cards-count');
        if (elHard) elHard.innerText = '-';

        const missionText = document.getElementById('dash-mission-text');
        if (missionText) missionText.innerText = "正在从记忆宇宙同步数据...";

        const pillText = document.getElementById('study-progress-pill');
        if (pillText) pillText.innerText = `计算中...`;

        const previewBox = document.getElementById('dash-task-previews');
        if (previewBox) previewBox.style.display = "none"; 

        const mainBtn = document.querySelector('.continue-btn');
        if (mainBtn) {
            mainBtn.style.background = "#eef2ff";
            mainBtn.style.color = "#a5b4fc";
            mainBtn.style.boxShadow = "none";
            mainBtn.innerText = "数据同步中...";
            mainBtn.style.pointerEvents = "none";
        }

        const urgentBox = document.getElementById('dash-urgent-tasks');
        if (urgentBox) {
            urgentBox.style.display = 'block';
            urgentBox.innerHTML = `<div style="text-align:center; padding: 40px 20px; color: #94a3b8; font-size: 0.9rem;">⏳ 正在分析你的记忆曲线...</div>`;
        }
        return; // 🛑 骨架屏渲染完毕，直接打断，绝不去算 0
    }
    // ==========================================

    // 👇 真实数据渲染逻辑
    const totalCards = allCards.length;
    const masteredCards = allCards.filter(c => (c.stage || 0) >= 3).length;
    const dueCardsList = allCards.filter(card => {
        const date = card.nextReviewDate ? new Date(card.nextReviewDate) : new Date(0);
        return date <= now;
    });
    const dueCount = dueCardsList.length;
    let streakDays = localStorage.getItem('oopsy_streak_days') || 0;
    
    const elTotal = document.getElementById('dash-total-cards');
    const elMastered = document.getElementById('dash-mastered-cards');
    const elStreak = document.getElementById('dash-streak-days');
    const elHard = document.getElementById('hard-cards-count');
    const hardCardsCount = allCards.filter(c => !c.stage || c.stage === 0).length;

    if (elTotal) elTotal.innerText = totalCards;
    if (elMastered) elMastered.innerText = masteredCards;
    if (elStreak) elStreak.innerText = streakDays;
    if (elHard) elHard.innerText = hardCardsCount; 

    const missionText = document.getElementById('dash-mission-text');
    if (missionText) {
        missionText.innerText = dueCount > 0 ? `今天有 ${dueCount} 张卡片等着你复习~` : "今日任务已全部清空，休息一下吧！";
    }

    const pillText = document.getElementById('study-progress-pill');
    if (pillText) pillText.innerText = `待复习 ${dueCount}`;

    const previewBox = document.getElementById('dash-task-previews');
    const mainBtn = document.querySelector('.continue-btn');

    if (previewBox) {
        if (dueCount > 0) {
            previewBox.style.display = "block"; 
            previewBox.innerHTML = dueCardsList.slice(0, 3).map(c => `
                <div style="padding: 16px; background: white; border-radius: 12px; border: 1px solid #eef2ff; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.02);">
                    <div>
                        <div style="color: #4f46e5; font-size: 0.75rem; font-weight: 600; margin-bottom: 4px; background: #eef2ff; display: inline-block; padding: 2px 8px; border-radius: 4px;">
                            ${c.category?.name || '未分类'}
                        </div>
                        <div style="font-weight: 600; color: #1e293b; font-size: 1rem;">
                            ${c.question}
                        </div>
                    </div>
                    <div style="color: #94a3b8; font-size: 0.8rem; font-weight: 500;"> 复习 > </div>
                </div>
            `).join('');
            
            if (mainBtn) {
                mainBtn.style.opacity = "1";
                mainBtn.style.pointerEvents = "auto";
                mainBtn.style.background = "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)";
                mainBtn.innerText = "继续科学复习 →";
            }
        } else {
            previewBox.style.display = "none"; 
            if (mainBtn) {
                mainBtn.style.background = "#eef2ff"; 
                mainBtn.style.color = "#a5b4fc";      
                mainBtn.style.boxShadow = "none";
                mainBtn.innerText = "今日任务已达标";
                mainBtn.style.pointerEvents = "none"; 
            }
        }
    }
    
    renderUrgentTasks(now);

    // 在 renderDashboard 函数内部的最下面
    renderUrgentTasks(now); 

    // 🛡️ 强制补丁：等任务渲染完后，瞬间把里面的 header 删掉
    setTimeout(() => {
        const urgentBox = document.getElementById('dash-urgent-tasks');
        if (urgentBox) {
            // 找到主页任务列表里的那个 header 并直接从 DOM 中移除
            const header = urgentBox.querySelector('.main-header');
            if (header) {
                header.remove(); 
                console.log("已强力移除主页冗余 Header");
            }
        }
    }, 50); // 延迟 50 毫秒确保渲染已完成
}

function renderUrgentTasks(now) {
    const tasksContainer = document.getElementById('dash-urgent-tasks');
    if (!tasksContainer) return;

    const categoryDueCounts = {};
    allCards.forEach(card => {
        const date = card.nextReviewDate ? new Date(card.nextReviewDate) : new Date(0);
        if (date <= now) {
            const catId = card.categoryId || (card.category ? (card.category._id || card.category) : 'uncategorized');
            categoryDueCounts[catId] = (categoryDueCounts[catId] || 0) + 1;
        }
    });

    const urgentFolders = Object.keys(categoryDueCounts).map(catId => ({
        id: catId, dueCount: categoryDueCounts[catId]
    })).sort((a, b) => b.dueCount - a.dueCount).slice(0, 4);

    if (urgentFolders.length === 0) {
        tasksContainer.innerHTML = `
            <div style="grid-column: 1 / -1; color: #4f46e5; font-size: 1rem; padding: 40px 20px; background: #fcfdff; border-radius: 20px; border: 2px dashed #e0e7ff; text-align: center; transition: all 0.3s ease;">
                <div style="font-size: 2rem; margin-bottom: 12px;">👻</div>
                <strong style="display: block; margin-bottom: 4px;">太棒了！今日任务全部清空</strong>
                <span style="color: #94a3b8; font-size: 0.85rem;">你的记忆曲线非常健康，休息一下吧。</span>
            </div>
        `;
        return;
    }

    let html = '';
    urgentFolders.forEach(task => {
        let folderName = '未分类区'; let pathName = '公共存放池';
        if (task.id !== 'uncategorized') {
            const cat = allCategories.find(c => c._id === task.id);
            if (cat) {
                folderName = cat.name;
                if (cat.parentId) {
                    const parent = allCategories.find(p => p._id === cat.parentId);
                    if (parent) pathName = `归属于: ${parent.name}`;
                } else pathName = '顶级文件夹';
            }
        }
        html += `
            <div class="dash-task-card" onclick="startTaskFromDash('${task.id}', '${folderName}')">
                <span class="task-badge">${task.dueCount} 项待复习</span>
                <h4 class="task-title">${folderName}</h4>
                <p class="task-path">${pathName}</p>
                <div class="task-arrow"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></div>
            </div>`;
    });
    tasksContainer.innerHTML = html;
}

function startTaskFromDash(folderId, folderName) {
    const targetNavId = folderId;
    const targetElement = document.querySelector(`.nav-item[onclick*="${targetNavId}"]`);
    selectSidebarItem(targetNavId, folderName, 'vocabulary', targetElement);
    setTimeout(() => { startStudyMode(); }, 200);
}

function startGlobalReview() {
    const now = new Date();
    const dueCardsQueue = allCards.filter(card => {
        const date = card.nextReviewDate ? new Date(card.nextReviewDate) : new Date(0);
        return date <= now;
    });

    if (dueCardsQueue.length === 0) return alert('🎉 太棒了！今天所有的卡片都已经复习完毕啦！');

    const allCardsNav = document.querySelector(`.nav-item[onclick*="all"]`);
    if (allCardsNav) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        allCardsNav.classList.add('active');
        currentCategoryId = 'all';
    }

    studyCards = [...dueCardsQueue];
    currentStudyIndex = 0;
    const studyModal = document.getElementById('study-view');
    if (studyModal) {
        showMainView('study-view');
        if (typeof renderStudyCard === 'function') renderStudyCard();
    }
}

// --- 弹窗控制与拦截引擎 ---
function openAddCardModal() { 
    if (typeof refreshSelectOptions === 'function') refreshSelectOptions();

    document.getElementById('modal-question').value = '';
    document.getElementById('modal-answer').value = '';
    const selectEl = document.getElementById('modal-category-select');

    // 🌟 方案三核心：智能拦截！判断当前在什么层级
    let isParentFolder = false;
    let currentCat = null;
    if (currentCategoryId !== 'all' && currentCategoryId !== 'uncategorized' && currentCategoryId !== 'dashboard') {
        currentCat = allCategories.find(c => c._id === currentCategoryId);
        if (currentCat && !currentCat.parentId) {
            isParentFolder = true; // 用户停留在“大类”中
        }
    }

    if (isParentFolder) {
        // 🚨 触发温柔拦截，不打开添加卡片弹窗，去建卡包！
        promptSmartDeckCreation(currentCat);
        return; 
    }

    // 如果用户本来就在卡包里，或者在总览里，正常打开加卡片弹窗
    if (currentCat && currentCat.parentId) {
        selectEl.value = currentCategoryId; // 默认选中当前卡包
    } else {
        selectEl.value = ""; // 默认丢进未分类
    }
    
    openModal('add-card-modal');
}

// --- 卡片保存引擎 (物理消灭毒瘤) ---
async function createFlashcardFromModal() {
    const question = document.getElementById('modal-question').value;
    const answer = document.getElementById('modal-answer').value;
    const selectValue = document.getElementById('modal-category-select').value;

    if (!question || !answer) return alert('请填写完整内容');

    let categoryId = null;
    // 🚨 终极清洗：只要不是有效的 ID，一律视为 null (放入未分类)
    if (selectValue && selectValue !== "" && selectValue !== "uncategorized" && selectValue !== "CREATE_NEW") {
        categoryId = selectValue;
    }

    const payload = { question: question.trim(), answer: answer.trim(), categoryId };

    try {
        const response = await fetch('/api/flashcards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) return alert(`保存失败：状态码 ${response.status}`);
        
        closeAllModals();
        await loadFlashcards();
        
        // 自动回到刚才的卡包
        let targetNavId = categoryId ? categoryId : 'uncategorized';
        selectSidebarItem(targetNavId, categoryId ? "知识库" : "未分类区", 'vocabulary', null);

    } catch (error) { console.error("🔥 网络崩溃:", error); }
}

function openBatchModal() {
    
    document.getElementById('batch-input').value = '';
    const selectEl = document.getElementById('batch-category-select');

    // 2. 🌟 核心修复：在这里插入大类拦截逻辑
    let isParentFolder = false;
    let currentCat = null;

    if (currentCategoryId !== 'all' && currentCategoryId !== 'uncategorized' && currentCategoryId !== 'dashboard') {
        currentCat = allCategories.find(c => c._id === currentCategoryId);
        // 如果当前文件夹没有父级 ID，说明它是个“大类”
        if (currentCat && !currentCat.parentId) {
            isParentFolder = true;
        }
    }

    if (isParentFolder) {
        // 🚨 触发拦截：不允许在父文件夹直接批量导入，先去建个卡包！
        // 这里的 promptSmartDeckCreation 会引导用户建包，建完后会自动跳到添加界面
        alert(`提示：【${currentCat.name}】是大类文件夹，请先创建一个子卡包再进行批量导入。`);
        promptSmartDeckCreation(currentCat); 
        return; 
    }

    // 👇 🌟 核心修复：给批量导入的下拉框装上极速建档的“监听神经”
    if (typeof injectQuickCategoryModal === 'function') injectQuickCategoryModal();
    selectEl.onchange = function() {
        if (this.value === 'CREATE_NEW') {
            window.quickCreateSourceDropdown = 'batch-category-select'; // 告诉系统：是从批量导入下拉框来的
            window.quickCreateSourceModal = 'batch-modal';              // 告诉系统：背后的父弹窗是批量导入
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
    openModal('batch-modal');
}

function openCategoryModal() { document.getElementById('new-category-input').value = ''; openModal('category-modal'); }
function closeAllModals() { document.getElementById('modal-overlay').style.display = 'none'; document.querySelectorAll('.pro-modal').forEach(m => m.style.display = 'none'); }
function openModal(id) { document.getElementById('modal-overlay').style.display = 'block'; document.getElementById(id).style.display = 'block'; }



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
        const chunkSize = 20; // 每次并发发送 20 张卡片

        for (let i = 0; i < newCards.length; i += chunkSize) {
            const chunk = newCards.slice(i, i + chunkSize);
            
            const promises = chunk.map(card => 
                fetch('/api/flashcards', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(card)
                })
                .then(res => res.ok ? 1 : 0)
                .catch(() => 0)
            );
            
            const results = await Promise.all(promises);
            successCount += results.reduce((sum, current) => sum + current, 0);
            
            // 批次间稍微休息，给服务器喘息空间
            if (i + chunkSize < newCards.length) {
                await new Promise(r => setTimeout(r, 50));
            }
        }

        setTimeout(() => {
            alert(`🎉 解析了 ${newCards.length} 张，成功存入 ${successCount} 张！`);
            if (successCount > 0) {
                textInput.value = '';
                closeAllModals();
                loadFlashcards();
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

    // 1. 构建分类筛选池
    const targetCategoryIds = new Set([currentCategoryId]);
    allCategories.forEach(cat => {
        if (cat.parentId === currentCategoryId) {
            targetCategoryIds.add(cat._id);
        }
    });

    // 2. 筛选待复习卡片 (科学模式)
    let dueCards = allCards.filter(card => {
        const date = card.nextReviewDate ? new Date(card.nextReviewDate) : new Date(0);
        const isDue = date <= now;

        let isMatch = false;
        if (currentCategoryId === 'all' || currentCategoryId === 'dashboard') {
            isMatch = true;
        } else if (currentCategoryId === 'uncategorized') {
            const catValue = card.category || card.categoryId;
            isMatch = !catValue || catValue === 'uncategorized';
        } else {
            const cardCatId = card.category ? (card.category._id || card.category) : card.categoryId;
            isMatch = targetCategoryIds.has(cardCatId);
        }
        return isDue && isMatch;
    });

    // --- 🌟 核心改进：分流逻辑 ---
    if (dueCards.length === 0) {
        // 如果没有到期卡片，引导至自由浏览
        const goFree = confirm('当前没有需要复习的卡片。是否开启【自由模式】浏览该分类下的所有卡片？\n(提示：自由模式不会记录学习进度)');

        if (goFree) {
            startFreeStudy(); // 调用自由模式函数
        }
        return;
    }

    // 3. 科学复习模式进入
    window.isFreePracticeMode = false; // 确保关闭自由模式标识
    dueCards.sort((a, b) => (b.interval || 0) - (a.interval || 0) || Math.random() - 0.5);
    studyCards = dueCards.slice(0, maxCards);
    currentStudyIndex = 0;

    showMainView('study-view');
    renderStudyCard();
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
    const studyHeader = document.querySelector('#study-view .study-header-title');
    if (studyHeader) {
        if (window.isFreePracticeMode) {
            studyHeader.innerHTML = '自由模式 <span style="font-size:0.8rem; color:#94a3b8; font-weight:normal;">(不记录进度)</span>';
            studyHeader.style.color = '#64748b'; // 灰色表示不计分
        } else {
            studyHeader.innerHTML = '科学复习';
            studyHeader.style.color = '#3b82f6'; // 蓝色表示正式任务
        }
    }
}

function flipCard() { document.getElementById('card-inner').classList.toggle('is-flipped'); }

// ==========================================
// 🚨 加了 Debug 弹窗的 submitReview 函数
// ==========================================
async function submitReview(isKnown) { // 注意这里加了 async
    if (!studyCards || studyCards.length === 0 || currentStudyIndex >= studyCards.length) return;
    const currentCard = studyCards[currentStudyIndex];

    if (window.isFreePracticeMode) {
        console.log("👻 自由模式：不更新进度，不发请求");
    } else {
        processCardMemory(currentCard, isKnown, false);

        if (!isKnown) {
            studyCards.push(currentCard); 
        }

        try {
            const payload = {
                isKnown,
                stage: currentCard.stage,
                nextReviewDate: currentCard.nextReviewDate
            };
            
            // // 🐛 第一处弹窗：准备发送的数据
            // alert(`准备发送到后端:\n卡片ID: ${currentCard._id}\n数据: ${JSON.stringify(payload)}`);

            const response = await fetch(`/api/flashcards/${currentCard._id}/review`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            // // 🐛 第二处弹窗：后端的响应状态
            // alert(`后端返回状态码: ${response.status}\n是否成功(ok): ${response.ok}`);

        } catch (e) { 
            // 🐛 第三处弹窗：极其关键！捕捉手机端的静默崩溃！
            // alert(`手机端网络请求彻底崩溃啦！\n报错信息: ${e.message}\n错误详情: ${e.toString()}`);
            // console.warn("后台同步稍后重试", e); 
        }
    }

    currentStudyIndex++;

    if (currentStudyIndex >= studyCards.length) {
        setTimeout(() => {
            const msg = window.isFreePracticeMode ? '👻 自由预习圆满完成！' : '🎉 恭喜！本次背诵任务圆满完成！';
            alert(msg);
            window.isFreePracticeMode = false;
            showMainView('dashboard-view');
            renderDashboard(); 
        }, 150);
    } else {
        renderStudyCard();
    }

    // --- 无论什么模式，都要切下一张 ---
    currentStudyIndex++;

    if (currentStudyIndex >= studyCards.length) {
        setTimeout(() => {
            const msg = window.isFreePracticeMode ? '👻 自由预习圆满完成！' : '🎉 恭喜！本次背诵任务圆满完成！';
            alert(msg);

            // 结束后重置开关，防止影响下次科学复习
            window.isFreePracticeMode = false;

            // 如果是从首页进的，建议跳回 dashboard-view
            showMainView('dashboard-view');
            renderDashboard(); // 刷新一下首页数字
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
    isFreePracticeMode = false; // 重置模式

    // 1. 获取目标文件夹 ID 集合 (包含子文件夹)
    const targetCategoryIds = new Set([currentCategoryId]);
    allCategories.forEach(cat => {
        if (cat.parentId === currentCategoryId) targetCategoryIds.add(cat._id);
    });

    // 👇 新增隔离墙：构建【免默写】黑名单 (揪出类型为 'notes' 的文件夹及其子文件夹)
    const immuneCategoryIds = new Set();
    allCategories.forEach(cat => {
        if (cat.type === 'notes') {
            immuneCategoryIds.add(cat._id);
            // 连坐机制：父级是笔记，子文件夹自动免考
            allCategories.filter(child => child.parentId === cat._id).forEach(child => {
                immuneCategoryIds.add(child._id);
            });
        }
    });

    // 2. 定义筛选函数（复用逻辑）
    const getCards = (onlyDue) => {
        return allCards.filter(card => {
            const date = card.nextReviewDate ? new Date(card.nextReviewDate) : new Date(0);
            const isDue = date <= now;
            const isReadyForSpell = (card.stage || 0) >= 1; // 🌟 必须背过一次才能默写

            const cardCatId = card.category ? (card.category._id || card.category) : card.categoryId;

            // 🛡️ 核心隔离墙生效：如果这张卡属于 notes 文件夹，直接一脚踢出默写队伍！
            if (immuneCategoryIds.has(cardCatId)) {
                return false; 
            }

            let isMatch = false;
            if (currentCategoryId === 'all') {
                isMatch = true;
            } else if (currentCategoryId === 'uncategorized') {
                const catValue = card.category || card.categoryId;
                isMatch = !catValue || catValue === 'uncategorized';
            } else {
                isMatch = targetCategoryIds.has(cardCatId);
            }

            // 如果 onlyDue 为 true，则同时检查到期时间；否则只检查解锁状态
            return isReadyForSpell && isMatch && (onlyDue ? isDue : true);
        });
    };

    // 3. 尝试获取科学到期的卡片
    let cards = getCards(true);

    // 4. 如果没有到期的，询问是否开启自由练
    if (cards.length === 0) {
        const totalUnlocked = getCards(false).length;
        if (totalUnlocked === 0) {
            // 提示语里顺便提醒一下，免得以后忘了为什么有些词没出来
            return alert('提示：当前分类没有[已解锁]的单词！\n\n1. 请先在[背诵模式]里点击“认识”来解锁默写功能。\n2. 注意：被设为“笔记/资料”类型的文件夹会自动免疫默写。');
        }

        const confirmForced = confirm(`当前没有科学待复习的单词。\n是否开启“自由练习”？(包含该分类下已解锁的 ${totalUnlocked} 个单词)\n\n注：自由练习模式不增加单词等级。`);
        if (confirmForced) {
            isFreePracticeMode = true;
            cards = getCards(false);

            // 🌟 核心改进：如果是自由模式，执行“彻底洗牌”
            // 这种洗牌算法（Fisher-Yates）比 Math.random() 更科学，确保完全随机
            for (let i = cards.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [cards[i], cards[j]] = [cards[j], cards[i]];
            }
        } else { return; }
    }

    // 5. 排序与启动逻辑
    if (!isFreePracticeMode) {
        // 💡 只有科学复习模式，才按间隔排序（先排复习间隔大的，即快忘的）
        cards.sort((a, b) => (b.interval || 0) - (a.interval || 0) || Math.random() - 0.5);
    } else {
        // 💡 自由模式已经在第 4 步洗过牌了，这里千万不要再调用 sort()！
        // 直接保持洗牌后的结果即可
    }

    // 统一截取数量并启动
    spellCards = cards.slice(0, maxCards);
    currentSpellIndex = 0;

    showMainView('spell-view');
    renderSpellCard();
    console.log(`🚀 默写启动！模式：${isFreePracticeMode ? '自由练习' : '科学复习'}，数量：${spellCards.length}`);
}

// 🌟 1. 每次渲染新卡片，把按钮“洗脑”回提交状态
function renderSpellCard() {
    if (currentSpellIndex >= spellCards.length) {
        alert('🎉 恭喜你，完成了所有的拼写检验！');
        // 🌟 修复：默写结束后回到数据看板，让用户看到进度清空的爽感
        showMainView('dashboard-view'); 
        return;
    }
    
    // ... 下面的代码保持你原来的不变 ...
    const card = spellCards[currentSpellIndex];
    document.getElementById('spell-question').innerText = card.answer || '（空问题）';

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

async function checkSpelling() {
    const inputEl = document.getElementById('spell-input');
    if (inputEl.disabled) return nextSpellCard();

    const card = spellCards[currentSpellIndex];
    if (!card) return; // 🌟 安全检查：防止卡片数据丢失

    // 1. 双向净化逻辑
    const cleanText = (text) => {
        return (text || "")
            .toLowerCase()
            // 🌟 第一层净化：把连字符(-)和下划线(_)统统变成空格。这样 user-friendly 和 user friendly 就能画等号！
            .replace(/[-_]/g, " ")
            // 🌟 第二层净化：无情抹除所有其他花里胡哨的标点符号（顺便把单双引号、中文符号也防住了）
            .replace(/[.,\/#!$%\^&\*;:{}=`~()'"“”‘’]/g, "")
            // 🌟 第三层净化：把可能出现的多个连续空格压缩成一个，并去掉首尾多余空格
            .replace(/\s+/g, ' ')
            .trim();
    };

    const inputStr = cleanText(inputEl.value);
    const answerStr = cleanText(card.question);

    console.log(`比对详情: [${inputStr}] vs [${answerStr}]`); // 🌟 调试日志

    const feedbackEl = document.getElementById('spell-feedback');
    inputEl.disabled = true;
    const isCorrect = (inputStr === answerStr);

    // 2. 模式识别与引擎更新
    // 🌟 使用 window. 确保变量不存在时也不会崩掉
    if (window.isFreePracticeMode === false) {
        console.log("执行科学复习逻辑...");
        if (typeof processCardMemory === 'function') {
            processCardMemory(card, isCorrect, true);
        }

        try {
            await fetch(`/api/flashcards/${card._id}/review`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    isKnown: isCorrect,
                    stage: card.stage,
                    nextReviewDate: card.nextReviewDate
                })
            });
        } catch (e) { console.error("同步进度失败", e); }
    } else {
        console.log("执行自由练习逻辑，不更新数据。");
    }

    // 3. 渲染反馈 (确保这部分代码存在，否则界面没反应)
    if (isCorrect) {
        feedbackEl.innerHTML = '<strong style="color:#48bb78;">✅ 拼写正确！</strong>';
        if (typeof speakWord === 'function') speakWord(card.question);
    } else {
        feedbackEl.innerHTML = `<div style="color:#e53e3e;">❌ 拼写错误。<br>正确答案：<strong>${card.question}</strong></div>`;
        spellCards.push(card); // 错词重练
    }

    // 4. 激活“继续”按钮
    const submitBtn = document.querySelector('#spell-view .check-btn');
    if (submitBtn) {
        submitBtn.innerHTML = '继续下一张 (Enter) ➔';
        submitBtn.style.background = '#10b981';
        submitBtn.onclick = nextSpellCard;
    }
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



document.addEventListener('keydown', function (event) {
    const activeTag = document.activeElement.tagName.toLowerCase();
    const isTyping = (activeTag === 'input' || activeTag === 'textarea');
    const isSpellInput = (document.activeElement.id === 'spell-input');
    if (isTyping && !isSpellInput) return;
    const studyArea = document.getElementById('study-view'); const spellArea = document.getElementById('spell-view');

    if (studyArea && !studyArea.classList.contains('hidden')) {
        switch (event.code) {
            case 'Space': event.preventDefault(); flipCard(); break;
            case 'ArrowLeft': prevStudyCard(); break;
            case 'ArrowRight': nextStudyCard(); break;
            case 'Digit1': markAsReview(); break;
            case 'Digit2': markAsKnown(); break;
        }
    }
    if (spellArea && !spellArea.classList.contains('hidden')) {
        switch (event.code) {
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
        if (isManageMode) {
            // --- 🌈 风格同步：把方块按钮变成文字按钮 ---
            manageBtn.innerHTML = `<span style="font-size: 14px; font-weight: 600;">退出</span>`;
            manageBtn.style.color = "#ef4444";
            manageBtn.style.background = "transparent"; // 去掉背景颜色
            manageBtn.style.border = "none";            // 去掉边框
            manageBtn.style.width = "auto";             // 宽度自适应，不再是 38px
            manageBtn.style.minWidth = "unset";         // 彻底释放宽度限制
            manageBtn.style.padding = "0 4px";          // 左右留点微距，对齐全选
            manageBtn.style.boxShadow = "none";         // 去掉投影
        } else {
            // --- 🔙 回归原始：恢复成精致的图标方块 ---
            manageBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`;
            manageBtn.style.color = "#64748b";
            manageBtn.style.background = "rgb(248, 250, 252)"; // 恢复原来的背景色
            manageBtn.style.border = "1px solid rgb(226, 232, 240)"; // 恢复边框
            manageBtn.style.width = "38px";             // 恢复正方形宽度
            manageBtn.style.padding = "0";              // 恢复无内边距
        }
    }

    if (selectAllBtn) {
        selectAllBtn.style.display = isManageMode ? "inline-flex" : "none";
        // 确保全选的文字大小和间距也一致
        selectAllBtn.style.fontSize = "14px";
        selectAllBtn.style.padding = "0 4px";
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

document.addEventListener('keydown', function (event) {
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

    selectEl.addEventListener('change', function () {
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

        // 🌟 自动导达并选中下拉框
        setTimeout(() => {
            const createdCat = allCategories.find(c => c.name === name && (c.parentId || '') === parentId);
            if (createdCat) {
                selectEl.value = createdCat._id;
                selectSidebarItem(createdCat._id, createdCat.name, createdCat.type, null);
                if (window.innerWidth <= 768) window.handleBottomNav('all');
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

// 🌟 1. 安全升级：切换输入框显隐时，增加 null 检查
function toggleNewParentInput() {
    const select = document.getElementById('quick-parent-select');
    const input = document.getElementById('quick-new-parent-name');
    
    // 🛡️ 安全锁：如果页面上还没生成这两个元素，直接返回，绝不报错
    if (!select || !input) return; 

    if (select.value === 'CREATE_NEW_PARENT') {
        input.style.display = 'block';
    } else {
        input.style.display = 'none';
        input.value = '';
    }
}

// 🌟 2. 核心修复：打开弹窗前，强行保证 HTML 已经注入！
function openQuickCategoryModal() {
    // 👇 极其关键的一步：不管你是从哪里点进来的，先检查 HTML 画没画好，没画好就当场画！
    if (typeof injectQuickCategoryModal === 'function') {
        injectQuickCategoryModal();
    }

    const sourceModalId = window.quickCreateSourceModal || 'add-card-modal';
    const baseModal = document.getElementById(sourceModalId);
    
    if (baseModal && baseModal.style.display !== 'none' && baseModal.style.display !== '') {
        baseModal.style.filter = 'brightness(0.6)';
        baseModal.style.pointerEvents = 'none';
    }

    const quickModal = document.getElementById('quick-category-modal');
    const quickOverlay = document.getElementById('quick-category-overlay');

    if(quickModal) quickModal.style.zIndex = '30000';
    if(quickOverlay) quickOverlay.style.zIndex = '29999';

    const parentSelect = document.getElementById('quick-parent-select');
    if(parentSelect) {
        parentSelect.innerHTML = `<option value="CREATE_NEW_PARENT" style="color:#3b82f6; font-weight:bold;">创建全新大类...</option><option disabled>──────────────</option>`;
        allCategories.filter(c => !c.parentId).forEach(p => {
            parentSelect.innerHTML += `<option value="${p._id}">挂载到现有: ${p.name}</option>`;
        });
    }

    if(quickOverlay) quickOverlay.style.display = 'block';
    if(quickModal) quickModal.style.display = 'block';
    
    // 因为前面加了自动注入，现在这里调用绝对安全
    toggleNewParentInput();

    setTimeout(() => {
        if (parentSelect && parentSelect.value === 'CREATE_NEW_PARENT') {
            const newParentInput = document.getElementById('quick-new-parent-name');
            if(newParentInput) newParentInput.focus();
        } else {
            const childInput = document.getElementById('quick-child-name');
            if(childInput) childInput.focus();
        }
    }, 100);
}

function closeQuickCategoryModal() {
    document.getElementById('quick-category-overlay').style.display = 'none';
    document.getElementById('quick-category-modal').style.display = 'none';

    // 🌟 动态获取是谁召唤了极速建档，就恢复谁的亮度
    const sourceModalId = window.quickCreateSourceModal || 'add-card-modal';
    const baseModal = document.getElementById(sourceModalId);
    if (baseModal) {
        baseModal.style.filter = 'none';
        baseModal.style.pointerEvents = 'auto';
    }

    // 🌟 动态获取来源下拉框，如果取消了建档，把下拉框重置为空
    const sourceDropdownId = window.quickCreateSourceDropdown || 'modal-category-select';
    const selectEl = document.getElementById(sourceDropdownId);
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

        // 在 submitQuickCategory 函数的最后面，把 setTimeout 替换成这样：
        setTimeout(() => {
            const sourceDropdownId = window.quickCreateSourceDropdown || 'modal-category-select';
            const selectEl = document.getElementById(sourceDropdownId);
            
            const createdChild = allCategories.find(c => c.name === childName && c.parentId === finalParentId);
            if (createdChild) {
                if (selectEl) selectEl.value = createdChild._id;
                // 🌟 自动导达新建立的子文件夹
                selectSidebarItem(createdChild._id, createdChild.name, createdChild.type, null);
                if (window.innerWidth <= 768) window.handleBottomNav('all');
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
// 🖱️ 右键/长按操作菜单引擎 (双端完美兼容 + 防溢出)
// ==========================================
(function setupContextMenu() {
    function injectContextMenu() {
        if (document.getElementById('custom-context-menu')) return;
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

})(); // 👈 极其重要的括号！刚才就是少了它导致的白屏！

// ==========================================
// 📱 移动端专属交互引擎 (墨墨背单词-平级切换版)
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('mobile-bottom-nav')) {
        const bottomNavHTML = `
            <nav id="mobile-bottom-nav" class="mobile-bottom-nav">
                <div class="nav-tab active" id="tab-dashboard" onclick="handleBottomNav('dashboard')">
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                    <span>主页</span>
                </div>
                <div class="nav-tab" id="tab-all" onclick="handleBottomNav('all')">
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    <span>词库</span>
                </div>
                <div class="nav-tab add-btn" onclick="openAddCardModal()">
                    <div class="add-circle"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></div>
                </div>
                <div class="nav-tab" id="tab-folders" onclick="handleBottomNav('folders')">
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    <span>分类</span>
                </div>
            </nav>
        `;
        document.body.insertAdjacentHTML('beforeend', bottomNavHTML);
    }

    if (!document.getElementById('folders-view')) {
        const foldersViewHTML = `
            <div id="folders-view" class="view hidden" style="padding: 16px; box-sizing: border-box; animation: fadeIn 0.3s ease;">
                <div style="background: white; border-radius: 20px; padding: 10px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid #f1f5f9;">
                    <ul class="nav-menu" id="mobile-folders-menu" style="margin:0;"></ul>
                </div>
            </div>
        `;
        document.querySelector('.content-area').insertAdjacentHTML('beforeend', foldersViewHTML);
    }
});

window.handleBottomNav = function(target) {
    if (window.innerWidth > 768) return;

    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    const tab = document.getElementById('tab-' + target);
    if (tab) tab.classList.add('active');

    if (target === 'dashboard') {
        const dashBtn = document.querySelector('.nav-item[onclick*="selectDashboard"]');
        if (dashBtn) selectDashboard(dashBtn);
    } else if (target === 'all') {
        if (typeof goToAllCards === 'function') goToAllCards();
    } else if (target === 'folders') {
        document.getElementById('current-view-title').innerText = '知识库分类';
        showMainView('folders-view'); 
    }
};

// ==========================================
// 👻 自由背诵模式引擎 (修复被误杀的函数)
// ==========================================
window.startFreeStudy = function() {
    // 1. 开启“不留痕”开关
    window.isFreePracticeMode = true;

    // 2. 获取当前分类下的所有卡片（地毯式：不看时间，不看等级）
    let cards = [];
    if (currentCategoryId === 'all' || currentCategoryId === 'dashboard' || !currentCategoryId) {
        cards = [...allCards]; // 全量
    } else {
        // 获取当前选中的文件夹及其子文件夹的 ID
        const targetCategoryIds = new Set([currentCategoryId]);
        allCategories.forEach(cat => {
            if (cat.parentId === currentCategoryId) targetCategoryIds.add(cat._id);
        });
        cards = allCards.filter(c => {
            const cardCatId = c.category?._id || c.category || c.categoryId;
            return targetCategoryIds.has(cardCatId);
        });
    }

    if (cards.length === 0) {
        alert("当前分类下没有卡片可以预习哦。");
        return;
    }

    // 3. 随机洗牌 (满足随机性需求)
    cards.sort(() => Math.random() - 0.5);

    // 4. 进入背诵界面
    studyCards = cards;
    currentStudyIndex = 0;

    // 切换视图
    showMainView('study-view');
    if (typeof renderStudyCard === 'function') renderStudyCard();

    console.log("👻 已开启自由背诵模式：全量加载，随机乱序，不记录进度。");
};

// ==========================================
// 📦 方案三专属：智能卡包引导引擎
// ==========================================
function promptSmartDeckCreation(parentFolder) {
    if (!document.getElementById('smart-deck-modal')) {
        const html = `
        <div id="smart-deck-overlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:10005;" onclick="closeSmartDeckModal()"></div>
        <div id="smart-deck-modal" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:white; padding:24px; border-radius:16px; z-index:10006; width:320px; box-shadow:0 10px 25px rgba(0,0,0,0.1);">
            <h3 style="margin-top:0; color:#1e293b; font-size:1.15rem; display:flex; align-items:center; gap:8px;">📦 需要建立一个卡包</h3>
            <p style="color:#64748b; font-size:0.9rem; margin-bottom:16px; line-height:1.5;">【<span id="smart-deck-parent-name" style="color:#3b82f6; font-weight:bold;"></span>】 是一个大类文件夹，不能直接放卡片哦。<br>顺手帮它建个具体的卡包吧：</p>
            <input type="text" id="smart-deck-input" placeholder="输入卡包名称 (如: List 1)" style="width:100%; padding:12px; border:1px solid #cbd5e1; border-radius:8px; outline:none; box-sizing:border-box; margin-bottom:20px; font-size:0.95rem; background:#f8fafc;">
            <div style="display:flex; justify-content:flex-end; gap:10px;">
                <button onclick="closeSmartDeckModal()" style="padding:10px 16px; border:none; background:#f1f5f9; color:#475569; border-radius:8px; font-weight:600; cursor:pointer;">取消</button>
                <button id="smart-deck-submit-btn" onclick="submitSmartDeckAndAddCard()" style="padding:10px 16px; border:none; background:#3b82f6; color:white; border-radius:8px; font-weight:600; cursor:pointer;">创建并加卡片</button>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    document.getElementById('smart-deck-parent-name').innerText = parentFolder.name;
    window.smartDeckParentId = parentFolder._id; // 记住大类ID

    document.getElementById('smart-deck-overlay').style.display = 'block';
    document.getElementById('smart-deck-modal').style.display = 'block';
    setTimeout(() => document.getElementById('smart-deck-input').focus(), 100);
}

function closeSmartDeckModal() {
    document.getElementById('smart-deck-overlay').style.display = 'none';
    document.getElementById('smart-deck-modal').style.display = 'none';
    document.getElementById('smart-deck-input').value = '';
}

async function submitSmartDeckAndAddCard() {
    const deckName = document.getElementById('smart-deck-input').value.trim();
    if (!deckName) return alert("卡包名字不能为空哦！");

    const btn = document.getElementById('smart-deck-submit-btn');
    btn.innerText = "正在创建...";
    btn.disabled = true;

    try {
        // 1. 后台静默创建卡包
        await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: deckName, parentId: window.smartDeckParentId, type: 'vocabulary' })
        });

        await loadCategories(); // 刷新左侧/手机端列表
        closeSmartDeckModal();

        // 2. 找到刚建好的卡包，瞬间切过去
        const newDeck = allCategories.find(c => c.name === deckName && c.parentId === window.smartDeckParentId);
        if (newDeck) {
            selectSidebarItem(newDeck._id, newDeck.name, newDeck.type, null);
        }

        // 3. 丝滑调出“添加卡片”弹窗，并且死死锁住新卡包！
        setTimeout(() => {
            if (typeof refreshSelectOptions === 'function') refreshSelectOptions();
            document.getElementById('modal-question').value = '';
            document.getElementById('modal-answer').value = '';
            
            const selectEl = document.getElementById('modal-category-select');
            if (selectEl && newDeck) selectEl.value = newDeck._id;
            
            openModal('add-card-modal');
        }, 150);

    } catch (error) {
        console.error("卡包创建失败:", error);
        alert("创建失败，请检查网络。");
    } finally {
        btn.innerText = "创建并加卡片";
        btn.disabled = false;
    }
}

// ==========================================
// 📱 侧滑返回引擎 (右滑退出背诵/默写)
// ==========================================
(function setupSwipeBack() {
    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;

        const deltaX = touchEndX - touchStartX;
        const deltaY = Math.abs(touchEndY - touchStartY);

        // 阈值判断：
        // 1. 水平向右滑动超过 100 像素
        // 2. 垂直偏移不超过 50 像素（防止误触，比如斜着滑）
        if (deltaX > 100 && deltaY < 50) {
            handleSwipeBack();
        }
    }, { passive: true });

    function handleSwipeBack() {
        const studyView = document.getElementById('study-view');
        const spellView = document.getElementById('spell-view');
        const foldersView = document.getElementById('folders-view');

        // 如果当前正在【背诵】或【默写】，则退回到列表页
        if (
            (studyView && !studyView.classList.contains('hidden')) || 
            (spellView && !spellView.classList.contains('hidden'))
        ) {
            console.log("检测到右滑：退出学习模式");
            showMainView('manage-view');
            // 如果你希望回到词库页，可以加上底栏状态同步
            if (window.innerWidth <= 768) window.handleBottomNav('all');
        } 
        // 如果当前正在【手机分类页】，可以退回到主页
        else if (foldersView && !foldersView.classList.contains('hidden')) {
            window.handleBottomNav('dashboard');
        }
    }
})();