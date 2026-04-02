// ==========================================
// 🔌 Flashcard Pro V2.0 终极UI修复版 (极简丝滑+手势引擎)
// ==========================================

// ==========================================
// 🚀 Oopsy 专属网络快递员 (带 Token 自动验证)
// ==========================================
// 【直接替换你 script.js 原有的 oopsyFetch 函数】
async function oopsyFetch(url, options = {}) {
    const token = localStorage.getItem('oopsy_token');

    // 🌟 白名单机制：登录和注册接口不需要检查 Token，直接放行
    const isAuthRoute = url.includes('/api/auth/login') || url.includes('/api/auth/register');

    // 🌟 安检门：如果不是白名单，且兜里没票 (即 token 是 null、undefined 或空字符串)
    if (!isAuthRoute && (!token || token === 'undefined')) {
        console.warn(`🛑 拦截无票请求: ${url}`);

        // 撕毁废票
        localStorage.clear();

        // 骗过前端：返回一个模拟的空数据 response，让后面的代码不会报 TypeError 或 500
        return {
            ok: false,
            status: 401,
            json: async () => {
                if (url.includes('categories') || url.includes('flashcards')) {
                    return []; // 如果请求分类或卡片，给个空数组
                }
                return { message: "拦截成功，未登录" };
            }
        };
    }

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers: headers
    });

    if (response.status === 401) {
        console.error("身份认证失败，Token 可能已过期");
        // 遇到真实的 401，也只返回一个模拟响应，不抛出 throw new Error，避免控制台血红一片
        return {
            ok: false,
            status: 401,
            json: async () => []
        };
    }

    return response;
}



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
            <div id="folders-view" class="view hidden" style="background: #f1f5f9; min-height: 100vh; padding: 0 !important; padding-bottom: 80px !important; width: 100%; box-sizing: border-box;">
                
                <div style="padding: 12px 16px 8px 16px; font-size: 0.85rem; color: #64748b; font-weight: 500;">
                    我的词库与分类
                </div>
                
                <div style="background: white; border-top: 0.5px solid #e2e8f0; border-bottom: 0.5px solid #e2e8f0; width: 100%;">
                    <ul id="mobile-folders-menu" style="margin: 0; padding: 0; list-style: none; width: 100%;"></ul>
                </div>
                
                <div style="padding: 16px; text-align: center;">
                    <button onclick="var m = document.getElementById('category-modal'); if(m){ m.classList.remove('hidden'); m.style.display='flex'; m.style.zIndex='99999'; } else { alert('找不到弹窗'); }" style="position: relative; z-index: 9999; background: transparent; color: #3b82f6; border: none; font-size: 0.95rem; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        新建词库分类
                    </button>
                </div>
            </div>
        `;
        const contentArea = document.querySelector('.content-area');
        if (contentArea) {
            contentArea.insertAdjacentHTML('beforeend', foldersViewHTML);
            contentArea.style.padding = '0'; // 强行扒掉父元素的束缚
        }
    }

})();

// 🛡️ 3. 注册底栏中枢路由
// 1. 核心路由枢纽：处理手机端底部点击
// 📱 手机端底部导航路由中心
window.handleBottomNav = function (target) {
    if (window.innerWidth > 768) return; // 电脑端不执行

    // 1. 切换底部图标的高亮状态 (变蓝)
    document.querySelectorAll('.mobile-bottom-nav .nav-tab').forEach(t => {
        t.classList.remove('active');
        t.style.color = '#94a3b8'; // 恢复灰色
    });
    const tab = document.getElementById('tab-' + target);
    if (tab) {
        tab.classList.add('active');
        tab.style.color = '#3b82f6'; // 激活变成主题色
    }

    // 2. 核心：根据目标切页面
    if (target === 'dashboard') {
        const dashBtn = document.querySelector('.nav-item[onclick*="selectDashboard"]');
        if (dashBtn) selectDashboard(dashBtn);
    }
    else if (target === 'explore') {
        if (typeof showExploreView === 'function') showExploreView();
    }
    else if (target === 'folders') {
        document.getElementById('current-view-title').innerText = '词库书架';
        showMainView('folders-view');
    }
    else if (target === 'profile') {
        // 🎯 就是这里！召唤出咱们写好的高级设置页面
        if (typeof showProfileView === 'function') {
            showProfileView();
        } else {
            // 如果你没有 showProfileView 函数，直接用底层逻辑切过去：
            document.getElementById('current-view-title').innerText = '我的设置';
            showMainView('profile-view');
        }
    }
};

// 2. 发现页面逻辑
window.showExploreView = function (element) {
    document.getElementById('current-view-title').innerText = '发现词库';

    // 如果是电脑端点的（带了 element 参数），处理左侧边栏高亮
    if (element) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        element.classList.add('active');
    }

    showMainView('explore-view');
};

// 3. 我的/设置页面逻辑
window.showProfileView = function (element) {
    document.getElementById('current-view-title').innerText = '我的设置';

    if (element) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        element.classList.add('active');
    }

    showMainView('profile-view');
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


// ==========================================
// 🔐 身份验证 (Auth) 引擎
// ==========================================
let isLoginMode = true; // 默认显示登录模式

// 🔄 切换：登录 <=> 注册
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    const submitBtn = document.getElementById('btn-auth-submit');
    const switchText = document.getElementById('auth-switch-text');
    const toggleBtn = document.getElementById('btn-toggle-auth');

    if (isLoginMode) {
        title.innerText = '登录 Oopsy';
        subtitle.innerText = '欢迎回来，继续你的记忆之旅 🚀';
        submitBtn.innerText = '立即登录';
        switchText.innerText = '还没有账号？';
        toggleBtn.innerText = '免费注册';
    } else {
        title.innerText = '注册 Oopsy';
        subtitle.innerText = '开启你的专属云端记忆宇宙 🌌';
        submitBtn.innerText = '创建账号';
        switchText.innerText = '已经有账号了？';
        toggleBtn.innerText = '直接登录';
    }
}

// 🚀 提交表单：发请求给后端
// 🚀 提交表单：发请求给后端
async function handleAuthSubmit(event) {
    event.preventDefault();

    const usernameInput = document.getElementById('auth-username').value.trim();
    const passwordInput = document.getElementById('auth-password').value.trim();
    const submitBtn = document.getElementById('btn-auth-submit');
    const originalBtnText = submitBtn.innerText;

    if (!usernameInput || !passwordInput) return alert("请填写完整的账号和密码哦！");

    submitBtn.innerText = '请稍候...';
    submitBtn.disabled = true;

    const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';

    try {
        const response = await oopsyFetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: usernameInput, password: passwordInput })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || '网络请求失败');
        }

        // --- 核心共用：存票、存名 ---
        localStorage.setItem('oopsy_token', data.token);
        const finalUsername = (data.user && data.user.username) ? data.user.username : usernameInput;
        localStorage.setItem('oopsy_username', finalUsername);

        if (isLoginMode) {
            // 登录特有字段存储
            if (data.user.dailyStudyLimit) localStorage.setItem('dailyStudyLimit', data.user.dailyStudyLimit);
            if (data.user.streakDays) localStorage.setItem('oopsy_streak_days', data.user.streakDays);
        } else {
            alert('🎉 注册成功！欢迎来到 Oopsy 宇宙，这就带你进去！');
        }

        // --- 核心切换：展示主应用 ---
        document.getElementById('oopsy-landing-page').style.display = 'none';
        document.getElementById('oopsy-main-app').style.display = 'block';

        // --- 核心渲染：初始化 UI ---
        renderUserInfo();

        // 🚨 关键修复：不管是登录还是注册，都要走一遍数据同步和侧栏重绘
        try {
            // 1. 先去后端拿数据（哪怕新号拿回来是空的，也要拿一次）
            await Promise.all([
                typeof loadCategories === 'function' ? loadCategories() : Promise.resolve(),
                typeof loadFlashcards === 'function' ? loadFlashcards() : Promise.resolve()
            ]);

            // 2. 🚨 重点：强制要求侧栏重新画一遍！
            // 哪怕 categories 是空的，也要让 renderSidebar 运行，把侧栏框架画出来
            if (typeof renderSidebar === 'function') {
                console.log("🛠️ 正在为新用户初始化侧栏...");
                renderSidebar();
            }
        } catch (loadErr) {
            console.warn("数据初始化波动:", loadErr);
        }

        // 清空输入框
        document.getElementById('auth-username').value = '';
        document.getElementById('auth-password').value = '';

    } catch (error) {
        console.error('认证报错:', error);
        alert(`❌ 哎呀出错啦：${error.message}`);
    } finally {
        submitBtn.innerText = originalBtnText;
        submitBtn.disabled = false;
    }
}

// 🛑 核心拦截器：页面一加载就查票
function checkAuthOnLoad() {
    const token = localStorage.getItem('oopsy_token');
    if (!token) {
        // 没票：留在落地页，藏起主应用
        document.getElementById('oopsy-landing-page').style.display = 'flex';
        document.getElementById('oopsy-main-app').style.display = 'none';
    } else {
        // 有票：直接进主应用，藏起落地页
        document.getElementById('oopsy-landing-page').style.display = 'none';
        document.getElementById('oopsy-main-app').style.display = 'block';
        // 👇 加在这里：查票通过后，立刻把名字挂上！
        renderUserInfo();
    }
}


document.addEventListener('DOMContentLoaded', () => {

    // 👇 加在这里：一上来就先查票！没票直接拦截！
    checkAuthOnLoad();
    // 1. ⚡ 开启骨架屏护盾
    window.isDataLoading = true;
    showMainView('dashboard-view');
    const titleEl = document.getElementById('current-view-title');
    if (titleEl) titleEl.innerText = ''; // 🌟 核心修改：主页加载时，标题强制留白

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

    // ==========================================
    // 4. ⚙️ 新增：每日复习量记忆逻辑
    // ==========================================
    const settingLimitInput = document.getElementById('setting-daily-limit');
    const savedLimit = localStorage.getItem('dailyStudyLimit') || 20; // 默认20

    if (settingLimitInput) {
        settingLimitInput.value = savedLimit; // 页面一加载，就把记忆的数字填进去

        settingLimitInput.addEventListener('change', function (e) {
            let val = parseInt(e.target.value);

            // 防御性编程：防止乱填
            if (isNaN(val) || val < 1) val = 1;
            if (val > 500) val = 500;

            e.target.value = val; // 更新输入框显示
            localStorage.setItem('dailyStudyLimit', val); // 永久存入浏览器记忆
            console.log("🔥 你的今日复习目标已更新并保存为:", val);
        });
    }
});

// --- 1. 视图切换引擎 ---
// --- 1. 视图切换引擎 (🌟 新增沉浸式学习状态管理) ---
// --- 1. 视图切换引擎 (🌟 修复异步覆盖 Bug 版) ---
// --- 1. 视图切换引擎 (🚀 上线级：完美平衡版) ---
// --- 1. 视图切换引擎 (🚀 上线级：完美平衡 + 笔记类型智能过滤版) ---
window.showMainView = function (viewId) {

    // 🚀 第一步：进任何新页面前，先给我把上一个页面的垃圾全扫干净！
    if (typeof clearAllGhostStates === 'function') clearAllGhostStates();

    const views = ['manage-view', 'study-view', 'spell-view', 'dashboard-view', 'folders-view', 'explore-view', 'profile-view'];

    // 1. 显隐切换
    views.forEach(v => {
        const el = document.getElementById(v);
        if (el) el.classList.add('hidden');
    });
    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.remove('hidden');

    // 2. 🌟 顶栏整体调度
    const mainHeader = document.querySelector('.main-header');
    const isMobile = window.innerWidth <= 768;

    if (mainHeader) {
        if (viewId === 'study-view' || viewId === 'spell-view') {
            mainHeader.style.setProperty('display', 'none', 'important');
        } else if (isMobile && viewId !== 'manage-view') {
            mainHeader.style.setProperty('display', 'none', 'important');
        } else {
            mainHeader.style.setProperty('display', 'flex', 'important');
            const isDashboard = ['dashboard-view', 'explore-view', 'profile-view'].includes(viewId);
            if (typeof updateHeaderUI === 'function') {
                updateHeaderUI(isDashboard);
            }
        }
    }

    // 3. 🎯 针对特殊页面的重新渲染 (已修复嵌套 Bug，现在逻辑极其清晰)
    if (viewId === 'manage-view') {
        setTimeout(() => {
            if (typeof renderFlashcards === 'function') renderFlashcards();
            else if (typeof loadFlashcards === 'function') loadFlashcards();
        }, 10);
    }

    if (viewId === 'dashboard-view') {
        // 回主页，刷新数字和动态按钮
        if (typeof updateDashboardPlanUI === 'function') updateDashboardPlanUI();
    } else if (viewId === 'manage-view' || viewId === 'library-view') {
        // 回词库，以绝对干净的状态重新画一次卡片
        if (typeof renderCards === 'function' && window.currentDisplayQueue) {
            renderCards(window.currentDisplayQueue);
        }
    }

    // 4. 手机端底栏调度
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) {
        bottomNav.style.display = (viewId === 'study-view' || viewId === 'spell-view' || isManageMode) ? 'none' : 'flex';
    }

    // 5. 悬浮球调度
    const floatingBtn = document.getElementById('floating-add-btn');
    if (floatingBtn) {
        const isStudy = viewId === 'study-view' || viewId === 'spell-view';
        const isDesktop = window.innerWidth > 768;
        floatingBtn.style.display = (!isStudy && !isDesktop) ? 'flex' : 'none';
    }
};


// ==========================================
// ☢️ 终极消毒舱：一键剿灭所有幽灵状态！
// ==========================================
function clearAllGhostStates() {
    // 1. 记忆清零（数据层）
    if (typeof isManageMode !== 'undefined') isManageMode = false;
    if (typeof isAllSelected !== 'undefined') isAllSelected = false;
    if (typeof selectedCards !== 'undefined' && selectedCards) selectedCards.clear();
    sessionStorage.removeItem('pickNewCardsMode');
    sessionStorage.removeItem('pickNewCardsQuota');

    // ==========================================
    // 2. 界面暴力复位（UI层）
    // ==========================================
    // 强制隐藏底部悬浮栏
    const batchBar = document.getElementById('batch-action-bar');
    if (batchBar) batchBar.style.display = 'none';

    // 🎯 核心修复：用真实的 ID 抓取顶部按钮！
    const btnManage = document.getElementById('btn-toggle-manage'); // 👈 换成了你真实的编辑按钮 ID
    const btnSelectAll = document.getElementById('btn-select-all'); // 全选按钮

    // 1. 强制复原【编辑】按钮（哪怕它变成了“退出”，也给它强行掰回四个小方块的图标！）
    // 1. 强制复原【编辑】按钮（连带颜色、边框一起强制洗白！）
    // 1. 强制复原【编辑】按钮（颜色、尺寸、圆角、布局，100%像素级覆盖重置！）
    if (btnManage) {
        // 🎨 直接把最初始的整段 style 字符串强行拍上去！绝不遗漏任何一个属性！
        btnManage.setAttribute('style', 'background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; width: 38px; height: 38px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; padding: 0;');

        // 恢复四个小方块图标
        btnManage.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                <rect x="3" y="14" width="7" height="7" rx="1"></rect>
            </svg>
        `;
    }
    // 2. 强制隐藏并重置【全选】按钮
    if (btnSelectAll) {
        btnSelectAll.style.display = 'none';
        btnSelectAll.innerHTML = `<span style="font-size: 0.9rem; font-weight: bold;">全选</span>`;
    }

    // 3. 强制把所有可能变异的按钮文字掰回来
    document.querySelectorAll('button').forEach(btn => {
        if (btn.innerText.includes('取消全选') || btn.innerText === '取消选中') {
            btn.innerText = '全选';
        }
    });
}


// --- 2. 侧边栏与文件夹管理 (双路渲染引擎) ---
async function loadCategories() {
    try {
        const response = await oopsyFetch('/api/categories');
        // 🚨 这里的空数组兜底很重要
        allCategories = await response.json() || [];

        let desktopHtml = '';
        let mobileHtml = '';

        const icons = {
            dashboard: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>`,
            allIcon: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
            starIcon: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>`,
            folder: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
            doc: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
            arrowRight: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
            arrowDown: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
            rightChevron: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>`
        };

        // ==== 1. 组装电脑端固定菜单 ====
        desktopHtml = `
            <li class="nav-item ${currentCategoryId === 'dashboard' ? 'active' : ''}" onclick="selectDashboard(this)">
                ${icons.dashboard} <span>学习数据</span>
            </li>
            
            <li class="nav-item starred-nav ${currentCategoryId === 'starred' ? 'active' : ''}" onclick="showStarredCards(this)">
                ${icons.starIcon} <span style="color: #854d0e; font-weight: 600;">星标收藏夹</span>
            </li>
            
            <div style="height: 1px; background: #e2e8f0; margin: 10px 0;"></div>

            <li class="nav-item root-nav ${currentCategoryId === 'all' ? 'active' : ''}" style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 8px; flex: 1;" onclick="selectSidebarItem('all', '所有卡片', 'vocabulary', this.parentElement)">
                    <div class="toggle-arrow" onclick="toggleRoot(event)">${rootCollapsed ? icons.arrowRight : icons.arrowDown}</div>
                    ${icons.allIcon} <span>所有卡片</span>
                </div>
                <div class="folder-actions" onclick="quickCreateSubCategory(event, '')" title="新建顶级文件夹">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </div>
            </li>
            <div id="user-folders-container" style="display: ${rootCollapsed ? 'none' : 'block'}; padding-left: 14px;">
        `;

        // ==== 2. 组装手机端固定菜单 ====
        mobileHtml = `
            <li onclick="selectSidebarItem('all', '所有卡片', 'vocabulary', null)">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="color: #ffa500; display: flex; align-items: center;">${icons.allIcon}</div>
                    <span style="color:#1e293b; font-size:1rem; font-weight:500;">所有卡片</span>
                </div>
                ${icons.rightChevron}
            </li>
            <li onclick="showStarredCards(null)" style="background: #fefce8;" class="starred-nav">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="color: #eab308; display: flex; align-items: center;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#eab308" stroke="#eab308"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                    </div>
                    <span style="color:#854d0e; font-size:1rem; font-weight:600;">星标收藏夹</span>
                </div>
                ${icons.rightChevron}
            </li>
        `;

        // ==== 3. 循环渲染动态文件夹 ====
        const parents = allCategories.filter(c => !c.parentId);
        const children = allCategories.filter(c => c.parentId);

        if (parents.length === 0) {
            // 💡 新账号保底提示
            desktopHtml += `<div style="padding: 15px; color: #94a3b8; font-size: 0.8rem; text-align: center;">点击右上角 + 创建文件夹</div>`;
            mobileHtml += `<li style="padding: 20px; text-align: center; color: #94a3b8;">还没有分类，快去创建吧 🚀</li>`;
        } else {
            parents.forEach(p => {
                const hasChildren = children.some(c => c.parentId === p._id);
                const isCollapsed = collapsedFolders.has(p._id);
                const arrow = isCollapsed ? icons.arrowRight : icons.arrowDown;
                const icon = p.type === 'notes' ? icons.doc : icons.folder;
                const isActive = currentCategoryId === p._id ? 'active' : '';

                desktopHtml += `
                    <li class="nav-item parent-nav ${isActive}" data-id="${p._id}" style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 8px; flex: 1; cursor: pointer;" onclick="handleParentClick(event, '${p._id}', '${p.name}', '${p.type}', this.parentElement)">
                            <div class="toggle-arrow" style="visibility: ${hasChildren ? 'visible' : 'hidden'}">${arrow}</div>
                            ${icon} <span class="truncate-text">${p.name}</span>
                        </div>
                        <div class="folder-actions" onclick="quickCreateSubCategory(event, '${p._id}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </div>
                    </li>
                    <div id="children-of-${p._id}" style="display: ${isCollapsed ? 'none' : 'block'}; padding-left: 28px;">
                `;

                children.filter(c => c.parentId === p._id).forEach(child => {
                    desktopHtml += `<li class="nav-item is-child ${currentCategoryId === child._id ? 'active' : ''}" onclick="selectSidebarItem('${child._id}', '${child.name}', '${child.type}', this)">${icons.doc} <span class="truncate-text">${child.name}</span></li>`;
                });

                desktopHtml += `</div>`; // 闭合当前父文件夹的子级容器

                // 手机端拼接 (简化展示)
                mobileHtml += `<li onclick="selectSidebarItem('${p._id}', '${p.name}', '${p.type}', null)">
                    <div style="display: flex; align-items: center; gap: 12px;">${icon} <span>${p.name}</span></div>
                    ${icons.rightChevron}
                </li>`;
            });
        }

        // ==== 4. ⚠️ 终极闭合：确保容器完整 ====
        desktopHtml += `</div>`;

        // ==== 5. 渲染到页面 ====
        const sidebarMenu = document.getElementById('sidebar-menu');
        if (sidebarMenu) sidebarMenu.innerHTML = desktopHtml;

        const mobileFoldersMenu = document.getElementById('mobile-folders-menu');
        if (mobileFoldersMenu) mobileFoldersMenu.innerHTML = mobileHtml;

        refreshSelectOptions();

    } catch (error) {
        console.error('加载分类失败:', error);
    }
}

// 📱 手机端专属的手风琴折叠函数 (完全独立，不影响电脑端)
window.toggleMobileFolder = function (event, folderId) {
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
    // 包含你所有弹窗里的下拉菜单 ID
    const selects = ['modal-category-select', 'batch-category-select', 'edit-category-select'];

    // 默认的未分类选项
    let optionsHtml = '<option value="">未分类区</option>';

    // 梳理父子关系
    const parents = allCategories.filter(c => !c.parentId);
    const children = allCategories.filter(c => c.parentId);

    // 🌟 核心：遍历所有顶级文件夹
    parents.forEach(p => {
        // 🚀 解除封印！把 value 设置为它真实的 _id，并且【绝对不要】加 disabled！
        // 这样“默认卡片夹”就变成了一个可以选中的正常选项
        optionsHtml += `<option value="${p._id}" style="font-weight: bold; color: #ffa500;">📁 ${p.name}</option>`;

        // 把这个大类下面的子卡包也列出来
        const myChildren = children.filter(c => c.parentId === p._id);
        myChildren.forEach(c => {
            optionsHtml += `<option value="${c._id}" style="color: #1e293b;">&nbsp;&nbsp;&nbsp;&nbsp;↳ 📦 ${c.name}</option>`;
        });
    });

    // 批量注入到界面上所有的下拉菜单里
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = optionsHtml;
    });

    // 顺便处理“新建大类”弹窗里的父级选择
    const parentSelect = document.getElementById('parent-category-select');
    if (parentSelect) {
        let parentOptions = '<option value="">(无) 作为顶级大类</option>';
        parents.forEach(cat => {
            parentOptions += `<option value="${cat._id}">归属于 -> 📁 ${cat.name}</option>`;
        });
        parentSelect.innerHTML = parentOptions;
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

        // 🌟 核心修复：检查 element 是不是真实的 DOM 节点。如果不是，就通过 id 去页面上抓
        let targetEl = element;
        if (!targetEl || typeof targetEl.classList === 'undefined') {
            // 假设你的侧边栏 <li> 都有 id="category-xxx" 或者带有 data-id="xxx"
            // 如果你的命名规则不同，这里可以适应你的规则
            targetEl = document.getElementById(`category-${id}`) || document.querySelector(`li[onclick*="${id}"]`);
        }

        // 穿上防弹衣：找到了真实的节点再去加 active
        if (targetEl && targetEl.classList) {
            targetEl.classList.add('active');
        } else {
            const root = document.querySelector('.root-nav');
            if (root) root.classList.add('active');
            console.warn('页面暂未找到新文件夹节点，已默认高亮根目录');
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
    // document.getElementById('current-view-title').innerText = 'Tagi ～';
    const titleEl = document.getElementById('current-view-title');
    if (titleEl) {
        titleEl.textContent = ''; // 👈 直接改成两个单引号，里面什么都不写！
        // titleEl.style.display = 'none'; // 如果你想连占位都省了，也可以加上这句
    }
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

// 打开检测模式选择面板
function openTestSelectorModal() {
    const modal = document.getElementById('test-selector-modal');
    modal.classList.remove('hidden');
}

// 关闭检测模式选择面板
function closeTestSelectorModal() {
    const modal = document.getElementById('test-selector-modal');
    modal.classList.add('hidden');
}

async function submitCategorySettings() {
    const name = document.getElementById('edit-cat-name').value;
    const parentId = document.getElementById('edit-cat-parent').value;
    const type = document.getElementById('edit-cat-type').value;
    if (!name) return alert('名称不能为空！');
    try {
        await oopsyFetch(`/api/categories/${currentCategoryId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, parentId, type }) });
        closeAllModals(); await loadCategories();
        document.getElementById('current-view-title').innerText = name;
        const navItems = document.querySelectorAll('.nav-item');
        let activeEl = null; navItems.forEach(el => { if (el.classList.contains('active')) activeEl = el; });
        selectSidebarItem(currentCategoryId, name, type, activeEl);
    } catch (error) { console.error(error); }
}

async function deleteCurrentCategory() {
    // 🌟 核心修复：如果全局变量丢了，尝试从当前页面的标题或状态中重新抓取
    if (!window.currentCategoryId || window.currentCategoryId === 'undefined') {
        // 尝试从侧边栏的高亮项重新获取（这是一种常见的兜底方案）
        const activeNav = document.querySelector('.nav-item.active');
        if (activeNav && activeNav.dataset.id) {
            window.currentCategoryId = activeNav.dataset.id;
        }
    }

    console.log("🔥 准备删除文件夹，当前获取到的 ID:", window.currentCategoryId);

    // 如果还是拿不到，说明真的没选中任何具体的文件夹
    if (!window.currentCategoryId || window.currentCategoryId === 'all' || window.currentCategoryId === 'uncategorized' || window.currentCategoryId === 'starred') {
        alert("系统提示：无法删除当前系统保留的分类或未选中的文件夹！");
        return;
    }

    if (!confirm('确定要彻底删除该文件夹吗？\n\n放心，里面的卡片会被自动移入【未分类区】！')) return;

    try {
        const res = await oopsyFetch(`/api/categories/${window.currentCategoryId}`, {
            method: 'DELETE'
        });

        if (!res.ok) throw new Error(`删除失败，状态码: ${res.status}`);

        console.log("✅ 删除成功！");
        closeAllModals();
        await loadCategories();
        // 强制跳回“所有卡片”
        const rootItem = document.querySelector('.root-nav');
        selectSidebarItem('all', '所有卡片', 'vocabulary', rootItem);

    } catch (error) {
        console.error("❌ 删除出错:", error);
        alert("删除失败: " + error.message);
    }
}

// --- 4. 卡片管理与渲染 ---
// 📁 修改前端：新建分类/文件夹的逻辑
// 📁 精确对齐修复版：新建分类/文件夹
async function confirmCategory() {
    // 🌟 核心对齐：根据你的截图，ID 是 new-category-input
    const nameInput = document.getElementById('new-category-input');

    // 🌟 下拉框对齐：根据你截图里显示的“归属于...”，通常 ID 可能是这个
    const parentSelect = document.getElementById('parent-category-select') ||
        document.querySelector('select'); // 如果 ID 还不准，就抓页面唯一的 select

    const name = nameInput ? nameInput.value.trim() : "";
    const parentId = parentSelect ? parentSelect.value : null;

    // 调试：如果还是弹空，请看浏览器 Console 里的这两行
    console.log("抓取的输入框元素:", nameInput);
    console.log("抓取到的值内容:", name);

    if (!name) {
        return alert('文件夹名字不能为空哦！');
    }

    try {
        const response = await oopsyFetch('/api/categories', {
            method: 'POST',
            body: JSON.stringify({
                name: name,
                parentId: (parentId && parentId !== "" && parentId !== "null") ? parentId : null,
                type: 'vocabulary'
            })
        });

        if (response.ok) {
            // 🌟 1. 拿到后端刚建好的这个文件夹的“完整档案”（包含 _id）
            const newCategoryData = await response.json();
            console.log('✅ 分类创建成功！', newCategoryData);

            if (nameInput) nameInput.value = ''; // 清空输入

            // 🌟 2. 刷新左侧边栏，让新文件夹显示出来
            await loadCategories();

            // 🌟 3. 关闭弹窗
            if (typeof closeAllModals === 'function') {
                closeAllModals();
            } else {
                const modal = document.querySelector('.modal-overlay') || document.getElementById('category-modal');
                if (modal) modal.classList.add('hidden');
            }

            // 🎯 4. 核心修复：镜头精准跳转到这个新文件夹！
            // 完美复用你之前写过的 selectSidebarItem 逻辑
            if (typeof selectSidebarItem === 'function') {
                setTimeout(() => {
                    try {
                        selectSidebarItem(newCategoryData._id, newCategoryData.name, newCategoryData.type, newCategoryData.parentId);
                    } catch (e) {
                        console.warn("跳转时遇到小问题，走兜底逻辑:", e);
                        window.currentCategoryId = newCategoryData._id;
                        if (typeof filterCards === 'function') filterCards();
                    }
                }, 100); // 👈 核心：等 0.1 秒
            } else {
                // 备用兜底逻辑
                window.currentCategoryId = newCategoryData._id;
                if (typeof filterCards === 'function') filterCards();
                if (typeof showMainView === 'function') showMainView('manage-view');
            }
        } else {
            const errorData = await response.json();
            alert(`创建失败: ${errorData.details || '服务器拒收'}`);
        }
    } catch (error) {
        console.error('💥 创建分类崩溃:', error);
    }
}

async function loadFlashcards() {
    try {
        // 👇 1. 纯净的 await 写法 + 时间戳防缓存魔法
        const response = await oopsyFetch(`/api/flashcards?t=${new Date().getTime()}`, {
            method: 'GET',
            cache: 'no-store', // 🍎 核心：专门击穿苹果等手机浏览器的终极物理缓存！
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        // 👇 2. 解析 JSON
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
    // 🌟 修复1：使用 trim() 砍掉首尾的误触空格，防呆设计！
    const rawSearchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

    let filtered = allCards;

    // --- 文件夹过滤逻辑保持不变 ---
    if (currentCategoryId === 'all' || currentCategoryId === 'dashboard' || !currentCategoryId) {
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
        if (typeof allCategories !== 'undefined') {
            allCategories.forEach(cat => {
                if (cat.parentId === currentCategoryId) {
                    targetCategoryIds.add(cat._id);
                }
            });
        }

        filtered = allCards.filter(card => {
            const catId = card.category ? (card.category._id || card.category) : card.categoryId;
            return targetCategoryIds.has(catId);
        });
    }

    // --- 🌟 修复2：高级分词搜索逻辑 ---
    if (rawSearchTerm) {
        // 把输入按空格拆分成多个关键词，例如 "苹果 红色" -> ["苹果", "红色"]
        const keywords = rawSearchTerm.split(/\s+/);

        filtered = filtered.filter(card => {
            const q = (card.question || '').toLowerCase();
            const a = (card.answer || '').toLowerCase();

            // 🌟 核心魔法：用户输入的【每一个】关键词，都必须能在 Q 或 A 里找到
            return keywords.every(kw => q.includes(kw) || a.includes(kw));
        });
    }

    // 🌟 修复3：悄悄把当前的搜索词挂在全局，为我们接下来的“一键查词加卡片”做准备！
    window.currentSearchTerm = rawSearchTerm;

    // 最后交给渲染引擎
    if (typeof renderCards === 'function') {
        renderCards(filtered);
    }
}

function renderCards(cardsToRender = null) {
    if (currentCategoryId === 'dashboard' || !currentCategoryId) {
        currentCategoryId = 'all';
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        const allCardsNav = document.querySelector(`.nav-item[onclick*="all"]`);
        if (allCardsNav) allCardsNav.classList.add('active');
    }

    if (!cardsToRender) {
        if (typeof filterCards === 'function') filterCards();
        return;
    }

    window.currentDisplayQueue = cardsToRender;
    const list = document.getElementById('flashcards-list');
    if (!list) return;

    // ... 在 renderCards 函数的开头部分 ...
    if (cardsToRender.length === 0) {
        // 🌟 检查当前是不是因为搜索才导致没结果的
        const searchTerm = window.currentSearchTerm || '';
        const list = document.getElementById('flashcards-list');

        if (searchTerm) {
            // 🎯 专属空状态：没搜到？全自动无缝查词！(完美复用 UI)
            list.innerHTML = `
                <div style="padding: 60px 20px; text-align: center; grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center;">
                    <div style="color: #94a3b8; font-size: 15px; margin-bottom: 20px;">
                        本地未找到 <strong style="color:#ef4444;">"${searchTerm}"</strong>，已自动为您联网查询 👇
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: white; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01); border: 1px solid #e2e8f0; width: 100%; max-width: 450px;">
                        <div style="display: flex; flex-direction: column; gap: 6px; text-align: left;">
                            <span style="font-size: 20px; color: #1e293b; font-weight: 600;">${searchTerm}</span>
                            <span id="auto-translation" style="font-size: 14px; color: #3b82f6;">🔍 正在获取有道释义...</span>
                        </div>
                        <button id="auto-add-btn" disabled style="color: #cbd5e1; border: 2px solid #cbd5e1; background: transparent; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 26px; line-height: 1; transition: 0.2s;">
                            +
                        </button>
                    </div>
                </div>
            `;

            // 🚀 UI 刚渲染完，立刻在后台悄悄去查词！
            oopsyFetch(`/api/dict?word=${encodeURIComponent(searchTerm)}`)
                .then(res => res.json())
                .then(data => {
                    let transText = (data.translation && data.translation !== "未找到确切释义") ? data.translation : "未查到完整词性，可先添加后修改";

                    // 更新全局变量（给咱们之前写好的 quickAddMarketWord 用）
                    if (typeof currentLiveTranslation !== 'undefined') {
                        currentLiveTranslation = transText;
                    }

                    // 更新 UI，显示带词性的释义
                    const transUI = document.getElementById('auto-translation');
                    if (transUI) {
                        transUI.innerText = transText;
                        transUI.style.color = '#64748b';
                    }

                    // 激活绿色的加号按钮！
                    const btn = document.getElementById('auto-add-btn');
                    if (btn) {
                        btn.disabled = false;
                        btn.style.color = '#10b981';
                        btn.style.borderColor = '#10b981';
                        btn.style.cursor = 'pointer';
                        // 完美复用发现页的添加魔法！
                        const safeWord = searchTerm.replace(/'/g, "\\'");
                        btn.setAttribute('onclick', `quickAddMarketWord('${safeWord}', this)`);
                    }
                })
                .catch(err => {
                    console.error("查词异常:", err);
                    const transUI = document.getElementById('auto-translation');
                    if (transUI) transUI.innerText = "网络异常，未查到释义";

                    // 即使报错，也允许用户强制点击加号保存单词本体
                    const btn = document.getElementById('auto-add-btn');
                    if (btn) {
                        btn.disabled = false;
                        btn.style.color = '#10b981'; btn.style.borderColor = '#10b981'; btn.style.cursor = 'pointer';
                        const safeWord = searchTerm.replace(/'/g, "\\'");
                        btn.setAttribute('onclick', `quickAddMarketWord('${safeWord}', this)`);
                    }
                });
        } else {
            // 普通空状态（文件夹本来就空）
            list.innerHTML = `
                <div style="text-align:center; padding: 60px 20px; color: #94a3b8; font-size: 0.95rem; grid-column: 1 / -1;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" style="margin-bottom:12px; display:block; margin-left:auto; margin-right:auto;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    这里空空如也，赶快添加或导入几张卡片吧！
                </div>
            `;
        }
        return;
    }

    // 🛡️ 极其安全的模式检测 (防止变量未定义报错)
    const isPickMode = sessionStorage.getItem('pickNewCardsMode') === 'true';
    const safeIsManageMode = (typeof isManageMode !== 'undefined' && isManageMode === true);

    // 🌟 如果是进货模式，主动唤醒底栏
    if (isPickMode) {
        setTimeout(() => {
            if (typeof updateBatchActionBar === 'function') updateBatchActionBar();
        }, 100);
    }

    // 排序逻辑：新词置顶
    let displayArray = [...cardsToRender];
    if (isPickMode) {
        displayArray.sort((a, b) => {
            const aIsOld = (a.stage > 0) ? 1 : 0;
            const bIsOld = (b.stage > 0) ? 1 : 0;
            return aIsOld - bIsOld;
        });
    }
    window.currentDisplayQueue = displayArray;

    const now = new Date();
    const getBadgeStyle = (bg, color) => `display:inline-flex; align-items:center; gap:4px; padding:2px 10px; border-radius:12px; font-size:0.75rem; font-weight:600; background:${bg}; color:${color};`;

    // 🌟 核心开关：决定是否显示圆圈勾选框
    const showCheckbox = (safeIsManageMode || isPickMode);

    list.innerHTML = displayArray.map(card => {
        const categoryName = card.category ? card.category.name : '未分类区';
        const cardCatId = card.category ? (card.category._id || card.category) : card.categoryId;
        const currentCat = typeof allCategories !== 'undefined' ? allCategories.find(c => c._id === cardCatId) : null;
        const isNoteType = currentCat ? currentCat.type === 'notes' : false;

        let stageHtml = isNoteType
            ? `<span style="${getBadgeStyle('#e0f2fe', '#0369a1')}">已归档</span>`
            : (card.stage >= 1 ? `<span style="${getBadgeStyle('#fef3c7', '#b45309')}">可默写</span>` : `<span style="${getBadgeStyle('#f1f5f9', '#64748b')}">待进阶</span>`);

        const isDue = (card.nextReviewDate ? new Date(card.nextReviewDate) : now) <= now;
        const statusHtml = isDue
            ? `<span style="${getBadgeStyle('#fff1f2', '#e11d48')}">待复习</span>`
            : `<span style="${getBadgeStyle('#ecfdf5', '#059669')}">已同步</span>`;

        const isChecked = typeof selectedCards !== 'undefined' && selectedCards.has(card._id);
        const checkboxIcon = isChecked
            ? `<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="#3b82f6" stroke-width="2"></circle><path d="M8 12l3 3 5-6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`
            : `<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="#cbd5e1" stroke-width="2"></circle></svg>`;

        const isOldCard = card.stage > 0;
        const disabledStyle = (isPickMode && isOldCard)
            ? 'opacity: 0.4; pointer-events: none; filter: grayscale(1);'
            : 'cursor: pointer;';

        return `
    <div class="card-item" onclick="handleCardClick('${card._id}')" style="${disabledStyle}">
        <div id="checkbox-wrap-${card._id}" class="card-checkbox" style="display: ${showCheckbox ? 'block !important' : 'none'};">
            ${checkboxIcon}
        </div>
        <div class="card-body">
            <strong class="card-question">Q: ${card.question}</strong>
            <p class="card-answer">A: ${card.answer}</p>
            <div class="card-meta">
                <span class="meta-cat">${categoryName}</span>
                <span class="meta-divider">|</span>
                ${stageHtml}
                ${statusHtml}
            </div>
            <div class="card-actions" style="display: ${isPickMode ? 'none' : 'flex'}">
                <button onclick="event.stopPropagation(); editCard('${card._id}')" class="btn-edit">编辑</button>
                <button onclick="event.stopPropagation(); deleteCard('${card._id}')" class="btn-delete">删除</button>
            </div>
        </div>
    </div>`;



    }).join('');
}

// ==========================================
// 🧠 Oopsy 核心记忆引擎 (Spaced Repetition V2)
// ==========================================
const REVIEW_INTERVALS = [0.5, 1, 2, 4, 7, 15, 30]; // 艾宾浩斯间隔天数

// ==========================================
// 🛡️ 主线引擎：背诵模式打分器 (负责时间线与记账)
// ==========================================
function processCardMemory(card, isCorrect) {
    if (typeof card.stage !== 'number') card.stage = 0;
    if (typeof card.failCount !== 'number') card.failCount = 0;

    // 1. 阶段升降
    if (isCorrect) {
        card.stage = Math.min(card.stage + 1, REVIEW_INTERVALS.length - 1);
    } else {
        card.stage = card.stage >= 1 ? 1 : 0;
        card.failCount += 1;
    }

    // 2. 严格控制复习时间线
    const nextDate = new Date();
    if (!isCorrect) {
        nextDate.setDate(nextDate.getDate() + 1);
        nextDate.setHours(4, 0, 0, 0);
    } else {
        const daysToAdd = REVIEW_INTERVALS[card.stage];
        nextDate.setTime(nextDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    }
    card.nextReviewDate = nextDate.toISOString();

    // 3. 墨墨式“今日账本”精确去重记账
    const todayStr = new Date().toDateString();
    let lastDate = localStorage.getItem('lastStudyDate');
    let studiedIds = [];

    if (lastDate !== todayStr) {
        localStorage.setItem('lastStudyDate', todayStr);
        localStorage.setItem('todayStudiedCardIds', JSON.stringify([]));
        localStorage.setItem('cardsStudiedToday', 0);
    } else {
        try {
            const storedIds = localStorage.getItem('todayStudiedCardIds');
            studiedIds = storedIds ? JSON.parse(storedIds) : [];
        } catch (e) {
            studiedIds = [];
        }
    }

    const currentCardId = card._id || card.id || card.question;
    if (!studiedIds.includes(currentCardId)) {
        studiedIds.push(currentCardId);
        localStorage.setItem('todayStudiedCardIds', JSON.stringify(studiedIds));
        localStorage.setItem('cardsStudiedToday', studiedIds.length);
    }

    updateStreak();
    return card;
}

// 🌟 修复后的打卡引擎：严格按自然日计算，无视具体小时分钟
function updateStreak() {
    const now = new Date();
    const todayStr = now.toDateString(); // 例如 "Sat Mar 14 2026"
    let lastActive = localStorage.getItem('oopsy_last_active');
    let streak = parseInt(localStorage.getItem('oopsy_streak_days')) || 0;

    // 1. 如果今天已经打过卡了，直接跳过，天数不变
    if (lastActive === todayStr) return;

    if (lastActive) {
        // 2. 将时间全部抹平到当天的 00:00:00 进行纯日期对比
        const todayDate = new Date(todayStr);
        const lastDate = new Date(lastActive);

        // 3. 计算两个自然日之间相差的整天数
        const diffTime = Math.abs(todayDate - lastDate);
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            streak += 1; // 昨天打过卡，今天继续 -> 连击+1
        } else if (diffDays > 1) {
            streak = 1; // 漏了超过1天，断签清零 -> 重新从1开始
        }
    } else {
        streak = 1; // 历史第一次打卡
    }

    // 4. 保存今天的数据
    localStorage.setItem('oopsy_last_active', todayStr);
    localStorage.setItem('oopsy_streak_days', streak);
}

// ==========================================
// 📊 首页数据引擎与智能推荐
// ==========================================
function renderDashboard() {
    // 🌟 核心修复：把无脑关灯删掉，并加上“只在主页才隐藏”的判定！
    const isActuallyOnDashboard = !document.getElementById('dashboard-view').classList.contains('hidden');
    if (isActuallyOnDashboard) {
        const viewTitle = document.getElementById('current-view-title');
        if (viewTitle) viewTitle.style.display = 'none';

        const studyLimitWrap = document.querySelector('.header-actions div');
        if (studyLimitWrap) studyLimitWrap.style.display = 'none';
    }
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

        // 🌟 更新全新双核面板的骨架屏
        const summaryEl = document.getElementById('dash-plan-summary');
        if (summaryEl) summaryEl.innerText = "正在从记忆宇宙同步数据...";
        const reviewEl = document.getElementById('dash-review-count');
        if (reviewEl) reviewEl.innerText = "-";
        const newEl = document.getElementById('dash-new-count');
        if (newEl) newEl.innerText = "-";

        const btnReview = document.getElementById('btn-start-review');
        if (btnReview) { btnReview.innerText = '加载中...'; btnReview.disabled = true; }
        const btnPick = document.getElementById('btn-pick-new');
        if (btnPick) { btnPick.innerText = '加载中...'; btnPick.disabled = true; }

        const urgentBox = document.getElementById('dash-urgent-tasks');
        if (urgentBox) {
            urgentBox.style.display = 'block';
            urgentBox.innerHTML = `<div style="text-align:center; padding: 40px 20px; color: #94a3b8; font-size: 0.9rem;">⏳ 正在分析你的记忆曲线...</div>`;
        }
        return; // 🛑 骨架屏渲染完毕，直接打断
    }
    // ==========================================

    // 👇 真实数据基础渲染逻辑 (保留你原本的总数统计)
    const totalCards = allCards.length;
    const masteredCards = allCards.filter(c => (c.stage || 0) >= 3).length;
    const hardCardsCount = allCards.filter(c => !c.stage || c.stage === 0).length;
    let streakDays = localStorage.getItem('oopsy_streak_days') || 0;

    const elTotal = document.getElementById('dash-total-cards');
    if (elTotal) elTotal.innerText = totalCards;
    const elMastered = document.getElementById('dash-mastered-cards');
    if (elMastered) elMastered.innerText = masteredCards;
    const elStreak = document.getElementById('dash-streak-days');
    if (elStreak) elStreak.innerText = streakDays;
    const elHard = document.getElementById('hard-cards-count');
    if (elHard) elHard.innerText = hardCardsCount;

    // ==========================================
    // 🚀 核心替换：直接呼叫全新的双核算账引擎！
    // ==========================================
    updateDashboardPlanUI();

    // ==========================================



    // 底部 Urgent Tasks 渲染
    renderUrgentTasks(now);

    // 🛡️ 强制补丁：等任务渲染完后，瞬间把里面的 header 删掉
    setTimeout(() => {
        const urgentBox = document.getElementById('dash-urgent-tasks');
        if (urgentBox) {
            const header = urgentBox.querySelector('.main-header');
            if (header) {
                header.remove();
            }
        }
    }, 50);
}





// ==========================================
// 📊 全新双核主页 UI 渲染引擎
// ==========================================
// 📊 全新双核主页 UI 渲染引擎 (极其纯净版)
// ==========================================
function updateDashboardPlanUI() {
    // 1. 查账本
    const dailyLimit = parseInt(localStorage.getItem('dailyStudyLimit')) || 20;
    const todayStr = new Date().toDateString();
    let lastDate = localStorage.getItem('lastStudyDate');
    let studiedToday = parseInt(localStorage.getItem('cardsStudiedToday')) || 0;

    if (lastDate !== todayStr) {
        studiedToday = 0;
        localStorage.setItem('lastStudyDate', todayStr);
        localStorage.setItem('cardsStudiedToday', 0);
        localStorage.setItem('todayStudiedCardIds', JSON.stringify([]));
    }

    const remainingTotal = Math.max(0, dailyLimit - studiedToday);

    // 2. 盘点【真实到期老词】数量
    let dueOldCount = 0;
    const now = new Date();

    if (typeof allCards !== 'undefined') {
        allCards.forEach(card => {
            const catValue = card.category ? (card.category._id || card.category) : card.categoryId;
            let isMatch = false;
            // 判断当前卡片夹
            if (currentCategoryId === 'all' || currentCategoryId === 'dashboard') {
                isMatch = catValue && catValue !== 'uncategorized' && catValue !== 'null' && catValue !== '';
            } else if (currentCategoryId === 'uncategorized') {
                isMatch = !catValue || catValue === 'uncategorized' || catValue === 'null' || catValue === '';
            } else {
                isMatch = (catValue === currentCategoryId);
            }

            if (isMatch) {
                const stage = card.stage || 0;
                const date = card.nextReviewDate ? new Date(card.nextReviewDate) : new Date(0);
                // 🌟 只数老词 (stage > 0) 且 时间已到
                if (stage > 0 && date <= now) {
                    dueOldCount++;
                }
            }
        });
    }

    // 3. 核心魔法算式：完美拆分复习与新词！
    const displayReview = Math.min(dueOldCount, remainingTotal);
    const displayNew = Math.max(0, remainingTotal - displayReview);

    // 4. 更新文字与数字
    const summaryEl = document.getElementById('dash-plan-summary');
    if (summaryEl) summaryEl.innerText = `每日目标 ${dailyLimit} 词，今天已背 ${studiedToday} 词`;

    const reviewEl = document.getElementById('dash-review-count');
    if (reviewEl) reviewEl.innerText = displayReview;

    const newEl = document.getElementById('dash-new-count');
    if (newEl) newEl.innerText = displayNew;

    // ==========================================
    // 🌟 5. 核心：呼叫单核智能主按钮变身！
    // ==========================================
    if (typeof updateDashboardMainButton === 'function') {
        updateDashboardMainButton();
    }
}

// ==========================================
// 🎛️ 1. 按钮状态机：根据数据自动变身
// (请将这段代码塞进你的 updateDashboardPlanUI 函数的最后面)
// ==========================================
function updateDashboardMainButton() {
    const btnMain = document.getElementById('btn-main-action');
    if (!btnMain) return;

    const displayReview = parseInt(document.getElementById('dash-review-count').innerText) || 0;
    const displayNew = parseInt(document.getElementById('dash-new-count').innerText) || 0;

    if (displayReview > 0) {
        // 🔵 状态 A：有老词欠债！(优先复习)
        btnMain.innerText = `开始复习 (${displayReview})`;
        btnMain.style.background = 'ffa500';
        btnMain.style.color = 'white';
        btnMain.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.3)';
        btnMain.disabled = false;
        btnMain.style.cursor = 'pointer';
    }
    else if (displayNew > 0) {
        // 🟠 状态 B：老词清空了！(去进货)
        btnMain.innerText = `去挑选新词 (${displayNew})`;
        btnMain.style.background = '#f59e0b';
        btnMain.style.color = 'white';
        btnMain.style.boxShadow = '0 4px 6px -1px rgba(245, 158, 11, 0.3)';
        btnMain.disabled = false;
        btnMain.style.cursor = 'pointer';
    }
    else {
        // ⚪ 状态 C：大满贯！
        btnMain.innerText = '今日任务已达标';
        btnMain.style.background = '#ffa500';
        btnMain.style.color = '#ffffff';
        btnMain.style.boxShadow = 'none';
        btnMain.disabled = true;
        btnMain.style.cursor = 'not-allowed';
    }
}

// 记得在你原本的 updateDashboardPlanUI 里面，调用一下它：
// updateDashboardMainButton();


// ==========================================
// 🎛️ 2. 主按钮的点击路由
// ==========================================
function handleMainAction() {
    const displayReview = parseInt(document.getElementById('dash-review-count').innerText) || 0;
    const displayNew = parseInt(document.getElementById('dash-new-count').innerText) || 0;

    if (displayReview > 0) {
        // 去背老词
        if (typeof startStudyMode === 'function') startStudyMode();
    } else if (displayNew > 0) {
        // 去拉起购物车
        if (typeof goToPickNewCards === 'function') goToPickNewCards();
    }
}

// ⚙️ 快捷调整计划的函数 (点一下就能改数量)
function quickAdjustPlan() {
    const currentLimit = localStorage.getItem('dailyStudyLimit') || 20;
    const newLimit = prompt("🎯 请输入你期望的每日背单词总数量：", currentLimit);

    if (newLimit !== null) {
        const parsed = parseInt(newLimit);
        if (!isNaN(parsed) && parsed > 0) {
            localStorage.setItem('dailyStudyLimit', parsed);
            alert(`✅ 调整成功！今日目标已更新为 ${parsed} 词。`);
            updateDashboardPlanUI(); // 实时刷新面板
        } else {
            alert("❌ 请输入有效的数字！");
        }
    }
}

// =====================================
// ==========================================
// ==========================================
// 🚀 传送门：带任务跳转 (完美尊重用户选择)
// ==========================================
// ==========================================
// 🚀 传送门：带任务跳转 (智能识别手机与电脑)
// ==========================================
// ==========================================
// 🚀 传送门：带任务跳转 (全平台精确制导版)
// ==========================================
// ==========================================
// 🚀 传送门：终极防空白·暴力直达版
// ==========================================
// ==========================================
// 🚀 传送门：纯净导航版 (绝不在后台乱弹窗)
// ==========================================
function goToPickNewCards() {
    const displayNewCount = document.getElementById('dash-new-count')?.innerText || "0";
    const quota = parseInt(displayNewCount) || 0;

    if (quota <= 0) {
        alert("🎉 今日新词配额已满，不需要进货啦！");
        return;
    }

    // 1. 获取所有有效的分类
    const validCategories = (typeof allCategories !== 'undefined')
        ? allCategories.filter(cat => cat.type !== 'notes')
        : [];

    // 2. 🌟 核心升级：强行把“所有卡片”放在列表最前面！
    // 传给 confirmPickFolder 的 ID 是 'all'，这和你系统的默认逻辑是一致的
    let folderOptions = `
        <div class="pick-folder-item" onclick="confirmPickFolder('all', ${quota})" style="background: #f8fafc; border-color: #cbd5e1;">
             所有卡片 (不限文件夹)
        </div>
    `;

    // 3. 接着把其他的具体文件夹拼接在下面
    if (validCategories.length > 0) {
        folderOptions += validCategories.map(cat => `
            <div class="pick-folder-item" onclick="confirmPickFolder('${cat._id}', ${quota})">
                📁 ${cat.name}
            </div>
        `).join('');
    }

    // 4. 生成弹窗并显示
    const modalHTML = `
        <div id="pick-folder-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:10000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(5px);">
            <div style="background:white; padding:24px; border-radius:20px; width:340px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25); text-align:center;">
                <h3 style="margin:0 0 10px 0; color:#1e293b; font-size:1.2rem;">挑选新词 🛒</h3>
                <p style="color:#64748b; font-size:0.9rem; margin-bottom:20px;">请选择一个进货范围：</p>
                <div style="max-height:280px; overflow-y:auto; margin-bottom:20px; padding-right:5px; text-align:left;">
                    ${folderOptions}
                </div>
                <button onclick="document.getElementById('pick-folder-modal').remove()" style="width:100%; padding:12px; background:#f1f5f9; border:none; border-radius:10px; color:#64748b; font-weight:600; cursor:pointer;">取消</button>
            </div>
        </div>
        <style>
            .pick-folder-item { 
                padding:15px; border-radius:12px; cursor:pointer; transition:0.2s; 
                border:1px solid #f1f5f9; margin-bottom:10px; color:#334155; 
                font-weight:500; font-size: 15px; display: flex; align-items: center; gap: 8px;
            }
            .pick-folder-item:hover { background:#eff6ff; border-color:#3b82f6; color:#3b82f6; transform:translateY(-2px); }
        </style>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// 🎯 核心回调：用户选好文件夹后的精准跳转
function confirmPickFolder(catId, quota) {
    // 1. 关掉弹窗
    const modal = document.getElementById('pick-folder-modal');
    if (modal) modal.remove();

    // 2. 🚀 先执行跳转！（触发你系统的原生切换逻辑，让它该清空的清空）
    if (typeof switchCategory === 'function') {
        switchCategory(catId);
    } else {
        const catBtn = document.querySelector(`[onclick*="${catId}"]`);
        if (catBtn) catBtn.click();
        else if (typeof showMainView === 'function') showMainView('cards-view');
    }

    // 3. 🌟 等系统切换完毕（风平浪静后），我们再“注入”进货模式！
    setTimeout(() => {
        // A. 重新写入进货标记（绝对不会被洗掉了）
        sessionStorage.setItem('pickNewCardsMode', 'true');
        sessionStorage.setItem('pickNewCardsQuota', quota);
        if (typeof selectedCards !== 'undefined') selectedCards.clear();

        // 强制指明当前分类ID
        if (typeof window !== 'undefined') window.currentCategoryId = catId;

        // B. 强制刷新卡片列表（这次必定带出勾选框）
        if (typeof filterCards === 'function') {
            filterCards(); // filter 会自动抓取最新分类并触发 renderCards
        } else if (typeof renderCards === 'function' && window.currentDisplayQueue) {
            renderCards(window.currentDisplayQueue);
        }

        // C. 强制升起底部悬浮条
        if (typeof updateBatchActionBar === 'function') {
            updateBatchActionBar();
        }

        console.log("🚀 进货模式已在跳转后强制注入！");
    }, 400); // 延迟 400 毫秒，确保页面的原生跳转彻底执行完毕
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
            <div style="grid-column: 1 / -1; color: #ffa500; font-size: 1rem; padding: 40px 20px; background: #fcfdff; border-radius: 20px; border: 2px dashed #e0e7ff; text-align: center; transition: all 0.3s ease;">
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

    let isParentFolder = false;
    let currentCat = null;

    if (currentCategoryId !== 'all' && currentCategoryId !== 'uncategorized' && currentCategoryId !== 'dashboard') {
        currentCat = allCategories.find(c => c._id === currentCategoryId);

        // 👇👇👇 🌟 核心特批：VIP 通行证 👇👇👇
        // 如果它没有 parentId，但它的名字叫“📥 收件箱”，我们就特批它不是大类！允许放卡片！
        if (currentCat && !currentCat.parentId && currentCat.name !== '默认卡片夹') {
            isParentFolder = true; // 只有普通的顶级文件夹才会被拦截
        }
    }

    if (isParentFolder) {
        // 🚨 触发温柔拦截，不打开添加卡片弹窗，去建卡包！
        promptSmartDeckCreation(currentCat);
        return;
    }

    // 🌟 智能选中逻辑升级
    if (currentCat && (currentCat.parentId || currentCat.name === '默认卡片夹')) {
        selectEl.value = currentCategoryId; // 默认选中当前卡包或收件箱
    } else {
        // 如果在全局界面点添加，我们默认优先找真实的收件箱
        const inboxCat = typeof allCategories !== 'undefined' ? allCategories.find(c => c.name === '默认卡片夹') : null;
        if (inboxCat) {
            selectEl.value = inboxCat._id; // 强行默认选中真实的收件箱
        } else {
            selectEl.value = "";
        }
    }

    openModal('add-card-modal');
}

// --- 卡片保存引擎 (物理消灭毒瘤) ---
// --- 卡片保存引擎 (物理消灭毒瘤) ---
async function createFlashcardFromModal() {
    const question = document.getElementById('modal-question').value;
    const answer = document.getElementById('modal-answer').value;
    const selectValue = document.getElementById('modal-category-select').value;

    if (!question || !answer) return alert('请填写完整内容');

    let finalCategoryId = selectValue;

    // 🌟 核心破局点：如果没选分类，我们强行给它分配/创建一个真实的“收件箱”！
    if (!finalCategoryId || finalCategoryId === "" || finalCategoryId === "uncategorized" || finalCategoryId === "CREATE_NEW") {

        // 1. 在现有的卡片夹里找找，有没有叫“📥 收件箱”的真实文件夹
        let inboxCat = typeof allCategories !== 'undefined' ?
            allCategories.find(c => c.name === '默认卡片夹' || c.name === '未分类' || c.name === '未分类区') : null;

        // 2. 🚨 如果没有，我们当场让后端建一个真实的！(完美利用了你现有的建文件夹接口)
        if (!inboxCat) {
            try {
                console.log("⚙️ 正在为您自动创建真实的【默认卡片夹】...");
                const catRes = await oopsyFetch('/api/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: '默认卡片夹', type: 'vocabulary' }) // 顶层文件夹
                });

                if (catRes.ok) {
                    if (typeof loadCategories === 'function') await loadCategories(); // 刷新左侧菜单
                    inboxCat = allCategories.find(c => c.name === '默认卡片夹');
                }
            } catch (err) {
                console.error("自动创建默认卡片夹失败:", err);
            }
        }

        // 3. 把这个合法的真实 ID 赋给我们要建的卡片！
        if (inboxCat && inboxCat._id) {
            finalCategoryId = inboxCat._id;
        } else {
            return alert("系统错误：无法获取或创建默认卡片夹，请手动选择一个卡片夹！");
        }
    }

    // 📦 组装数据，这次带的是绝对保真的 VIP 通行证 (真实的 categoryId)
    const payload = {
        question: question.trim(),
        answer: answer.trim(),
        category: finalCategoryId
    };

    try {
        // 🚀 发送给后端
        const response = await oopsyFetch('/api/flashcards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("🔥 保存失败详细信息:", errorText);
            return alert(`保存失败：状态码 ${response.status}`);
        }

        // 🎉 大功告成
        closeAllModals();
        await loadFlashcards();

        // 🎯 镜头精准跟随：跳到我们刚刚用的那个真实文件夹
        const targetCat = allCategories.find(c => c._id === finalCategoryId);
        if (targetCat && typeof selectSidebarItem === 'function') {
            selectSidebarItem(targetCat._id, targetCat.name, targetCat.type, null);
        } else {
            window.currentCategoryId = finalCategoryId;
            if (typeof filterCards === 'function') filterCards();
        }

        if (typeof showMainView === 'function') showMainView('manage-view');

    } catch (error) {
        console.error("🔥 网络崩溃:", error);
        alert("网络似乎有点问题哦");
    }
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
    selectEl.onchange = function () {
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
        const response = await oopsyFetch(`/api/flashcards/${editingCardId}`, {
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

async function deleteCard(id) { if (confirm('确定要彻底删除这张卡片吗？')) { try { await oopsyFetch(`/api/flashcards/${id}`, { method: 'DELETE' }); loadFlashcards(); } catch (error) { console.error(error); } } }

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
                // 👇 🌟 核心修复：把这里的 GET 也换回 POST！
                oopsyFetch('/api/flashcards', {
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

// 🔊 语音朗读 (安卓防卡死强化版)
function speakWord(text, event) {
    // 阻止点击事件冒泡，防止一点发音按钮卡片就翻面了
    if (event) {
        event.stopPropagation();
    }

    if (!('speechSynthesis' in window)) {
        return alert('哎呀，你的浏览器不支持语音朗读功能哦！');
    }

    // 🚨 安卓核心修复：发音前必须先清除上一个可能卡死的队列！(极其关键)
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // 智能判断语言：如果里面包含中文，就用中文读；否则一律强制用纯正美式英语
    if (/[\u4e00-\u9fa5]/.test(text)) {
        utterance.lang = 'zh-CN';
    } else {
        utterance.lang = 'en-US'; // 明确指定 en-US，安卓非常吃这一套
    }

    // 稍微放慢一点语速，听得更清楚
    utterance.rate = 0.9;

    // 开口！
    window.speechSynthesis.speak(utterance);
}

// ==========================================
// 🌟 学习模式专属：右上角高级操作栏逻辑
// ==========================================

// ⭐ 1. 独立学习模式的“收藏”功能
// ==========================================
// 🌟 学习模式：收藏/取消收藏逻辑
// ==========================================
async function toggleStudyStar(event) {
    if (event) event.stopPropagation();

    // 1. 获取当前背诵卡片的 ID 
    // (注意：请确保你的 #study-card 标签上有 data-id 属性)
    const studyCard = document.getElementById('study-card');
    const cardId = studyCard ? studyCard.dataset.id : null;

    if (!cardId) {
        console.error("无法获取卡片 ID，请检查 #study-card 是否存在 dataset.id");
        return;
    }

    // 2. 找到星星图标（用于改变颜色）
    const starIcon = document.querySelector('.study-star-icon');
    const starBtn = document.querySelector('.study-star-btn');

    try {
        // 3. 呼叫后端 PATCH 接口
        const res = await oopsyFetch(`/api/flashcards/${cardId}/star`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();

        if (data.success) {
            // 4. 动画效果：点亮/熄灭
            if (starIcon) {
                // 如果是收藏状态：填充黄色，边框变黄
                // 如果是非收藏状态：无填充，边框恢复原色
                starIcon.setAttribute('fill', data.isStarred ? '#eab308' : 'none');
                starIcon.style.color = data.isStarred ? '#eab308' : '#94a3b8';

                // 给按钮加一个小缩放动画
                if (starBtn) {
                    starBtn.style.transform = 'scale(1.2)';
                    setTimeout(() => starBtn.style.transform = 'scale(1)', 200);
                }
            }
            console.log(`🌟 卡片 [${cardId}] 收藏状态: ${data.isStarred}`);

            // 5. ⚠️ 重要：同步更新本地内存中的卡片数据
            // 这样切换回列表页时，收藏夹才能立刻感应到变化
            if (typeof allFlashcards !== 'undefined') {
                const card = allFlashcards.find(c => (c._id === cardId || c.id === cardId));
                if (card) card.isStarred = data.isStarred;
            }
        }
    } catch (err) {
        console.error("收藏请求失败，请检查后端路由是否配置了 PATCH /api/flashcards/:id/star", err);
    }
}


// ✏️ 独立学习模式的“编辑”功能 (已精准对接真实函数)
function openStudyEditModal(event) {
    if (event) event.stopPropagation(); // 施展防冒泡魔法，防止卡片翻转！

    // 1. 拿到当前卡片的 ID
    const studyCard = document.getElementById('study-card');
    if (!studyCard) return;
    const currentCardId = studyCard.dataset.id;
    if (!currentCardId) {
        console.error("找不到卡片 ID！");
        return;
    }

    // 2. 🚀 精准呼叫你真实的编辑函数！
    if (typeof editCard === 'function') {
        editCard(currentCardId);
    } else {
        console.error("天呐，连 editCard 都找不到？请检查函数名是否拼写正确！");
    }
}

// ==========================================
// 🚀 核心发牌引擎 (纯净版：绝不偷偷掺杂新词！)
// ==========================================
// ==========================================
// 🚀 全能发牌引擎 (支持笔记、默写、普通卡全量复习)
// ==========================================
function startStudyMode() {
    // 1. 账本与配额计算 (保持不变)
    const savedLimit = localStorage.getItem('dailyStudyLimit');
    const limitInput = document.getElementById('setting-daily-limit');
    const dailyLimit = savedLimit ? parseInt(savedLimit) : (limitInput ? parseInt(limitInput.value) || 20 : 20);
    const studiedToday = parseInt(localStorage.getItem('cardsStudiedToday')) || 0;
    const remainingQuota = Math.max(0, dailyLimit - studiedToday);

    if (remainingQuota <= 0) {
        alert('🎉 今日背诵任务已完美达标，明天再来吧！');
        return;
    }

    const now = new Date();
    window.isFreePracticeMode = false;

    // 2. 确定目标范围 (当前文件夹及子文件夹)
    const targetCategoryIds = new Set([currentCategoryId]);
    if (typeof allCategories !== 'undefined') {
        allCategories.forEach(cat => {
            if (cat.parentId === currentCategoryId) targetCategoryIds.add(cat._id);
        });
    }

    // 3. 抓取【所有类型】的到期老词
    let dueOldCards = [];

    allCards.forEach(card => {
        // 获取分类 ID
        const catValue = card.category ? (card.category._id || card.category) : card.categoryId;

        // 📂 分类匹配逻辑
        let isMatch = false;
        if (currentCategoryId === 'all' || currentCategoryId === 'dashboard') {
            // 总览模式：只要不是彻底没分类的就抓
            isMatch = catValue && catValue !== 'uncategorized' && catValue !== 'null' && catValue !== '';
        } else if (currentCategoryId === 'uncategorized') {
            isMatch = !catValue || catValue === 'uncategorized' || catValue === 'null' || catValue === '';
        } else {
            isMatch = targetCategoryIds.has(catValue);
        }

        if (!isMatch) return;

        // 🌟 核心：取消类型过滤！不再判断 card.type !== 'notes'
        // 🌟 核心：取消文件夹黑名单！不再判断 immuneCategoryIds

        const date = card.nextReviewDate ? new Date(card.nextReviewDate) : new Date(0);
        if (date > now) return; // 还没到时间的错题不抓

        const stage = card.stage || 0;
        if (stage > 0) {
            dueOldCards.push(card);
        }
    });

    dueOldCards.sort(() => Math.random() - 0.5);

    // 4. 只取老词，绝不自动掺杂新词
    let selectedCards = dueOldCards.slice(0, remainingQuota);

    if (selectedCards.length === 0) {
        alert('🎉 当前没有需要复习的内容啦！请去挑选新内容吧！');
        updateDashboardPlanUI();
        return;
    }

    // 5. 发车
    studyCards = [...selectedCards];
    spellCards = [];
    currentStudyIndex = 0;

    showMainView('study-view');
    renderStudyCard();
    console.log(`🚀 全能复习启动: 本次发牌 ${studyCards.length} 张（含笔记/默写）`);
}

function renderStudyCard() {
    if (currentStudyIndex >= studyCards.length) {
        alert('恭喜你，完成了本次复习！');
        showMainView('manage-view');
        return;
    }

    const card = studyCards[currentStudyIndex];
    const cardInner = document.getElementById('card-inner');

    // ==========================================
    // 🛡️ 防剧透魔法：瞬间归位，绝不泄露背面！
    // ==========================================
    if (cardInner) {
        // 1. 瞬间关掉 CSS 动画
        cardInner.style.transition = 'none';
        // 2. 瞬间把卡片掰回正面（英文面）
        cardInner.classList.remove('is-flipped');

        // 3. 核心魔法：读取一次 offsetWidth，强制浏览器立刻重绘画面（打断它的异步渲染）
        void cardInner.offsetWidth;

        // 4. 把动画开关重新打开，保证等会儿用户点击翻牌时依然有丝滑的动画
        cardInner.style.transition = '';
    }

    // 5. 卡片已经安全地在正面了，这时候再把新单词写上去！
    document.getElementById('study-question').innerText = card.question;
    document.getElementById('study-answer').innerText = card.answer;
    // ==========================================
    // 🌟 搭桥魔法：给卡片贴上隐形的 ID 标签，并初始化正反面的星星
    // ==========================================
    const studyCardElement = document.getElementById('study-card');
    if (studyCardElement) {
        // 把卡片的真实 ID 悄悄存进 HTML 里（兼容 _id 或 id）
        studyCardElement.dataset.id = card._id || card.id;
    }

    // 因为我们正反面各放了一个星星，所以要同时更新它们俩的状态！
    const starIcons = document.querySelectorAll('.study-star-icon');
    starIcons.forEach(icon => {
        const isStarred = card.isStarred; // 读取数据里的收藏状态
        icon.setAttribute('fill', isStarred ? '#eab308' : 'none');
        icon.style.color = isStarred ? '#eab308' : 'currentColor';
    });

    // ==========================================
    // 下面是你原本的进度条和头部文字逻辑，保持不变
    // ==========================================
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
// 🌟 核心 1：注意这里加了 async！
function submitReview(isKnown) {
    // 1. 基础安全检查
    if (!studyCards || studyCards.length === 0 || currentStudyIndex >= studyCards.length) return;

    const currentCard = studyCards[currentStudyIndex];

    // 2. 逻辑处理 (本地先变，立刻生效)
    if (!window.isFreePracticeMode) {
        processCardMemory(currentCard, isKnown, false);

        // 🌟 本地双保险：立刻更新本地大数组
        const globalCard = allCards.find(c => c._id === currentCard._id);
        if (globalCard) {
            globalCard.nextReviewDate = currentCard.nextReviewDate;
            globalCard.stage = currentCard.stage;
        }

        if (!isKnown) {
            studyCards.push(currentCard); // 错词加入队尾
        }

        // 3. 【乐观更新】：后台静默发送，不加 await，绝不阻塞画面！
        const payload = {
            isKnown: isKnown,
            stage: currentCard.stage,
            nextReviewDate: currentCard.nextReviewDate
        };

        oopsyFetch(`/api/flashcards/${currentCard._id}/review`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(e => console.warn("后台同步被浏览器中断，但不影响前端背单词:", e));
    }

    // 4. 【立即切题】：用户点击瞬间就看到下一张
    currentStudyIndex++;

    if (currentStudyIndex >= studyCards.length) {
        // ==========================================
        // 🚀 背诵结束后的接力判定
        // ==========================================
        setTimeout(() => {
            if (window.isFreePracticeMode) {
                alert('👻 自由预习圆满完成！');
                window.isFreePracticeMode = false;
                showMainView('dashboard-view');
                if (typeof renderDashboard === 'function') renderDashboard();
            }
            else if (spellCards && spellCards.length > 0) {
                showMainView('spell-view');
                if (typeof renderSpellCard === 'function') renderSpellCard();
                console.log("👉 背诵完成，无缝切入高阶默写阶段！");
            }
            else {
                // ==========================================
                // 🌟 关键补丁：在抓取数字之前，强制算一次最新的账本！
                // ==========================================
                if (typeof updateDashboardPlanUI === 'function') {
                    updateDashboardPlanUI();
                }

                // 🌟 1. 抓取今日的新词配额
                const newCountEl = document.getElementById('dash-new-count');
                const newQuota = newCountEl ? (parseInt(newCountEl.innerText) || 0) : 0;

                if (newQuota > 0) {
                    // 🌟 2. 温柔的进货邀请
                    const wantToPick = confirm(`🎉 恭喜！今天的复习债全部还清！\n\n🎯 你今天还有 ${newQuota} 个新词额度，要趁热打铁去挑选新词吗？`);

                    if (wantToPick) {
                        if (typeof goToPickNewCards === 'function') goToPickNewCards();
                    } else {
                        showMainView('dashboard-view');
                        if (typeof renderDashboard === 'function') renderDashboard();
                    }
                } else {
                    // 🌟 3. 新词老词全背完的终极形态！
                    alert('🏆 完美！今天的复习和新词任务全部达标！去休息吧！');
                    showMainView('dashboard-view');
                    if (typeof renderDashboard === 'function') renderDashboard();
                }
            }
        }, 150); // 👈 延时动画的收尾括号，绝对不能丢！
    } else {
        // 👈 如果还没背完，就立刻画下一张牌！
        if (typeof renderStudyCard === 'function') renderStudyCard();
    }
}


function nextStudyCard() {
    currentStudyIndex++;
    if (currentStudyIndex >= studyCards.length) {
        setTimeout(() => {
            alert('🎉 恭喜！已完成本轮复习～');
            showMainView('manage-view');
        }, 150);
        return;
    }
    renderStudyCard();
}

function prevStudyCard() { if (currentStudyIndex > 0) { currentStudyIndex--; renderStudyCard(); } }
function markAsKnown() { submitReview(true); }
function markAsReview() { submitReview(false); }




// 全局独立牌盒 (千万别删这两行哦)
window.spellDeck = {
    categoryId: null,
    cards: []
};

function startSpellMode() {
    // 1. 读取单次题量
    const quantitySelect = document.getElementById('test-quantity-select');
    const maxCards = quantitySelect ? parseInt(quantitySelect.value) || 20 : 20;

    // 🌟 核心定调：拼写模式永远是“不计入科学进度的自由检测”！
    isFreePracticeMode = true;

    // 获取文件夹及黑名单 ID (逻辑保留，保护你的笔记文件夹)
    const targetCategoryIds = new Set([currentCategoryId]);
    if (typeof allCategories !== 'undefined') {
        allCategories.forEach(cat => {
            if (cat.parentId === currentCategoryId) targetCategoryIds.add(cat._id);
        });
    }

    const immuneCategoryIds = new Set();
    if (typeof allCategories !== 'undefined') {
        allCategories.forEach(cat => {
            if (cat.type === 'notes') {
                immuneCategoryIds.add(cat._id);
                allCategories.filter(child => child.parentId === cat._id).forEach(child => {
                    immuneCategoryIds.add(child._id);
                });
            }
        });
    }

    // ==========================================
    // 🌟 2. 极简过滤：只要是这个文件夹里的词，管它生熟，全拉出来！
    // ==========================================
    const eligibleCards = allCards.filter(card => {
        const cardCatId = card.category ? (card.category._id || card.category) : card.categoryId;

        // 免疫墙：笔记文件夹一律跳过
        if (immuneCategoryIds.has(cardCatId)) return false;

        let isMatch = false;
        if (currentCategoryId === 'all') {
            isMatch = true;
        } else if (currentCategoryId === 'uncategorized') {
            const catValue = card.category || card.categoryId;
            isMatch = !catValue || catValue === 'uncategorized';
        } else {
            isMatch = targetCategoryIds.has(cardCatId);
        }

        // 💡 只有文件夹匹配这一个条件，众生平等！
        return isMatch;
    });

    if (eligibleCards.length === 0) {
        return alert('提示：当前分类下没有单词！\n(请检查是否全为笔记类型，或尚未添加任何单词)');
    }

    // ==========================================
    // 🌟 3. 纯粹的发牌盒逻辑 (无放回抽样防重发)
    // ==========================================
    // 如果切了词库，或者牌盒被抽空了，重新装填全量单词并洗牌
    if (window.spellDeck.categoryId !== currentCategoryId || window.spellDeck.cards.length === 0) {
        console.log("🔄 牌盒为空或切换了词库，正在重新装填并完美洗牌...");
        window.spellDeck.categoryId = currentCategoryId;
        window.spellDeck.cards = [...eligibleCards]; // 把符合条件的词全部装入

        // Fisher-Yates 完美洗牌
        for (let i = window.spellDeck.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [window.spellDeck.cards[i], window.spellDeck.cards[j]] = [window.spellDeck.cards[j], window.spellDeck.cards[i]];
        }
    }

    // 🔪 从牌盒顶部切走设定的数量 (切走就真没了，下次从剩下的抽)
    spellCards = window.spellDeck.cards.splice(0, maxCards);

    // ==========================================
    // 🌟 4. 发车渲染
    // ==========================================
    currentSpellIndex = 0;
    showMainView('spell-view');
    renderSpellCard();

    console.log(`🚀 盲测启动！抽牌数量：${spellCards.length}`);
    console.log(`📦 当前牌盒剩余库存：${window.spellDeck.cards.length} 词`);

    // 🌟 核心修复 3：新开一局检测，清空历史错题账本！
    window.spellErrorCount = 0;

    currentSpellIndex = 0;
    showMainView('spell-view');
    renderSpellCard();

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

    // 🌟 核心替换：呼叫下划线魔术师！
    // 逻辑推断：如果你的页面上显示的问题是 card.answer（比如中文），
    // 那么你要拼写的单词应该就是 card.question（英文）。如果你的字段名不一样，请改一下这里：
    const targetWord = card.question || '';

    // 1. 根据单词长度，铺设好几条下划线
    if (typeof setupSpellDisplay === 'function') {
        setupSpellDisplay(targetWord);
    }

    // 2. 稍微延迟一点点，强行让隐形输入框获取焦点（自动弹出手机键盘）
    setTimeout(() => {
        const hiddenInput = document.getElementById('spell-hidden-input');
        if (hiddenInput) {
            hiddenInput.disabled = false;
            hiddenInput.focus();
        }
    }, 50);
    document.getElementById('spell-feedback').innerHTML = '';

    // 强行把底部的按钮恢复成蓝色的“提交”
    const submitBtn = document.querySelector('#spell-view .check-btn');
    if (submitBtn) {
        submitBtn.style.display = 'block';
        submitBtn.innerHTML = '✓ 提交检验 (Enter)';
        submitBtn.style.background = '#3b82f6';
        submitBtn.onclick = checkSpelling; // 重新绑定为检查对错功能
    }
    // 🌟 新增：记住这局真正抽了多少张牌
    window.initialSpellCount = spellCards.length;
}

// 🚀 去掉了 async 和 await，不阻塞 UI！
function checkSpelling() {
    console.log("🚀 checkSpelling 被触发了！");
    const inputEl = document.getElementById('spell-hidden-input');
    const submitBtn = document.querySelector('#spell-view .spell-check-btn') || document.querySelector('#spell-view .check-btn');
    const feedbackEl = document.getElementById('spell-feedback');

    // ==========================================
    // 🌟 1. 智能分流器 (多状态路由)
    // ==========================================

    // 状态 A：如果是“继续”，说明已经拼对了，切下一题
    if (submitBtn && submitBtn.innerText.includes('继续')) {
        console.log("➡️ 进入切换下一题逻辑");
        nextSpellCard();
        return;
    }

    // 状态 B：如果是“再拼一次”，说明用户刚看完正确答案，需要【重置界面】！
    if (submitBtn && submitBtn.innerText.includes('再拼一次')) {
        console.log("🔄 确认错词，重置界面准备盲打...");

        // 1. 核心诉求：清空底下显示的答案！
        feedbackEl.innerHTML = '';

        // 2. 按钮恢复原貌 (清除内联样式，交还给 CSS 控制)
        submitBtn.style.background = '';
        submitBtn.innerHTML = '提交校验 (Enter)';

        // 3. 解锁输入框，拿回焦点，准备重打
        inputEl.disabled = false;
        inputEl.value = '';
        inputEl.dispatchEvent(new Event('input'));
        setTimeout(() => inputEl.focus(), 50);

        return; // 🛑 拦截结束，等待用户面对干净的界面重新盲打！
    }

    // ==========================================
    // 2. 核心校验逻辑
    // ==========================================
    const card = spellCards[currentSpellIndex];
    if (!card) return;

    const cleanText = (text) => (text || "").toLowerCase().replace(/[-_]/g, "").replace(/[.,\/#!$%\^&\*;:{}=`~()'"“”‘’]/g, "").replace(/\s+/g, '');
    const inputStr = cleanText(inputEl.value);
    const answerStr = cleanText(card.question);
    const isCorrect = (inputStr === answerStr);

    console.log("📝 判定结果:", isCorrect ? "对" : "错");

    if (isCorrect) {
        // ✅ 拼对分支
        inputEl.disabled = true; // 锁死，防止乱敲
        feedbackEl.innerHTML = '<strong style="color:#10b981;">✅ 拼写正确！</strong>';
        if (typeof speakWord === 'function') speakWord(card.question);

        if (submitBtn) {
            submitBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            submitBtn.innerHTML = '<span>继续下一张 (Enter)</span>';
            // 把焦点给绿按钮，回车直接去下一题
            setTimeout(() => { submitBtn.focus(); }, 100);
        }
    } else {
        // ❌ 拼错分支
        console.log("执行错误展示动作...");

        // 🌟 核心改动：把输入框锁死！逼迫用户看完答案后，敲回车重置界面，不能直接看着答案抄！
        inputEl.disabled = true;
        inputEl.blur();
        inputEl.value = '';
        inputEl.dispatchEvent(new Event('input'));

        feedbackEl.innerHTML = `<div style="color:#ef4444;">❌ 拼写错误，请看清答案后重试。<br>正确答案：<strong style="letter-spacing: 1px;">${card.question}</strong></div>`;

        if (submitBtn) {
            submitBtn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
            submitBtn.innerHTML = '<span>再拼一次 (Enter)</span>';
            // 把焦点给红按钮，等用户看懂了按回车重置
            setTimeout(() => { submitBtn.focus(); }, 100);
        }

        // 抖动动效
        const cardEl = document.querySelector('.spell-card');
        if (cardEl) {
            cardEl.classList.remove('shake-error');
            void cardEl.offsetWidth;
            cardEl.classList.add('shake-error');
        }

        // 错题推入队列尾部重练
        if (typeof spellCards !== 'undefined' && !spellCards.slice(currentSpellIndex + 1).includes(card)) {
            spellCards.push(card);

            // 🌟 核心修复 1：只要推入错题，就在全局记事本上精准 +1
            window.spellErrorCount = (window.spellErrorCount || 0) + 1;
        }
    }

    // ==========================================
    // 3. 后台数据同步
    // ==========================================
    if (window.isFreePracticeMode === false) {
        if (typeof processCardMemory === 'function') processCardMemory(card, isCorrect, true);
        // 如果你有 API 请求也可以放这里
    }
}

function prevSpellCard() { if (currentSpellIndex > 0) { currentSpellIndex--; renderSpellCard(); } }
function nextSpellCard() {
    // 1. 核心基础逻辑：索引推进一步
    currentSpellIndex++;

    /// ==========================================
    // 🌟 核心拦截器：终点线判断 (精准算账版)
    // ==========================================
    if (currentSpellIndex >= spellCards.length) {

        // 1. 提取我们刚才精准记录的错题数 (如果没有错，就是 0)
        const errorCount = window.spellErrorCount || 0;

        // 2. 真实搞定的词汇 = 膨胀后的总长度 - 错题增加的长度 (比如 13 - 3 = 10)
        const realTotal = spellCards.length - errorCount;

        // 3. 把真实数据印到面板上
        const totalCountEl = document.getElementById('completion-total-count');
        if (totalCountEl) totalCountEl.innerText = realTotal;

        const errorCountEl = document.getElementById('completion-error-count');
        if (errorCountEl) {
            errorCountEl.innerText = errorCount;
            // 如果出错了，用醒目的橙色警告，全对则是低调的灰色
            errorCountEl.style.color = errorCount > 0 ? '#f59e0b' : '#94a3b8';
        }

        // 4. 弹出高级结算面板
        const modal = document.getElementById('spell-completion-modal');
        if (modal) modal.classList.remove('hidden');

        return; // 🛑 核心：直接退出函数
    }

    // 2. 只有没到底，才会呼叫渲染函数，把新卡片画出来
    renderSpellCard();

    // 3. 状态重置（一秒卸妆）
    const submitBtn = document.querySelector('#spell-view .spell-check-btn') || document.querySelector('#spell-view .check-btn');
    if (submitBtn) {
        submitBtn.style.background = '';
        submitBtn.innerHTML = '提交校验 (Enter)';
        submitBtn.onclick = checkSpelling;
    }

    const inputEl = document.getElementById('spell-hidden-input');
    if (inputEl) {
        inputEl.disabled = false;
        inputEl.value = '';
        setTimeout(() => {
            inputEl.focus();
        }, 50);
    }
}

// ==========================================
// 🌟 面板出口控制逻辑
// ==========================================

// 点击“再来一组”
function restartSpellMode() {
    document.getElementById('spell-completion-modal').classList.add('hidden');
    // 直接复用咱们刚写好的那台 V8 引擎，无缝衔接下一波！
    startSpellMode();
}

// 点击“返回主页”
function exitSpellMode() {
    document.getElementById('spell-completion-modal').classList.add('hidden');
    // 清空输入框，防止下次进来有残留
    const inputEl = document.getElementById('spell-hidden-input');
    if (inputEl) inputEl.value = '';

    // 退回主看板
    showMainView('dashboard-view');
    renderDashboard();
}

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

    // 💡 兼容你可能存在的两个 ID (spell-input 或 spell-hidden-input)
    const isSpellInput = (document.activeElement.id === 'spell-input' || document.activeElement.id === 'spell-hidden-input');

    if (isTyping && !isSpellInput) return;

    const studyArea = document.getElementById('study-view');
    const spellArea = document.getElementById('spell-view');

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
            case 'Enter':
            case 'NumpadEnter':
                const inputEl = document.getElementById('spell-input') || document.getElementById('spell-hidden-input');

                // 1. 如果焦点还在输入框上，说明用户正在提交答案，全局监听器闭嘴！
                if (event.target === inputEl) {
                    return;
                }

                // 🌟 2. 核心修复：如果输入框被禁用了（说明已经判完卷了）
                if (inputEl && inputEl.disabled) {
                    event.preventDefault();

                    // ❌ 删掉原本的无脑切题：nextSpellCard();

                    // ✅ 找到底下的控制按钮，直接触发它的点击事件！
                    // 这样就能完美走通 checkSpelling 里的“状态A(继续)”或“状态B(再拼一次)”逻辑！
                    const submitBtn = document.querySelector('#spell-view .spell-check-btn') || document.querySelector('#spell-view .check-btn');
                    if (submitBtn) {
                        submitBtn.click();
                    }
                }
                break;
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
        const deletePromises = targetCards.map(card => oopsyFetch(`/api/flashcards/${card._id}`, { method: 'DELETE' }));
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

function exitManageMode() {
    isManageMode = false;
    selectedCards.clear();

    // ==========================================
    // 🧹 1. 隐藏“全选”按钮，并重置状态
    // ==========================================
    if (typeof isAllSelected !== 'undefined') {
        isAllSelected = false;
    }
    const btnSelectAll = document.getElementById('btn-select-all');
    if (btnSelectAll) {
        btnSelectAll.style.display = 'none'; // 👈 退出时把它重新藏起来！
        btnSelectAll.innerText = '全选';     // 重置文字
    }


    // ==========================================
    // 🌟 2. 恢复“批量管理”按钮的四个小方块图标，并“换回原装衣服”
    // ==========================================
    const btnToggleManage = document.getElementById('btn-toggle-manage');
    if (btnToggleManage) {
        // 恢复图标
        btnToggleManage.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                <rect x="3" y="14" width="7" height="7" rx="1"></rect>
            </svg>
        `;

        // 恢复颜色和背景
        btnToggleManage.style.color = '#64748b';
        btnToggleManage.style.background = '#f8fafc';
        btnToggleManage.style.border = '1px solid #e2e8f0';
        btnToggleManage.style.fontWeight = 'normal';

        // 🌟 核心修复：把 38x38 的正方形三围尺寸强行加回来！
        btnToggleManage.style.width = '38px';
        btnToggleManage.style.height = '38px';
        btnToggleManage.style.padding = '0';
        btnToggleManage.style.display = 'inline-flex';
        btnToggleManage.style.alignItems = 'center';
        btnToggleManage.style.justifyContent = 'center';
    }

    // ==========================================
    // 🧹 3. 重新渲染卡片并隐藏底栏
    // ==========================================
    if (typeof renderCards === 'function') renderCards(window.currentDisplayQueue);
    if (typeof updateBatchActionBar === 'function') updateBatchActionBar();
}
// 替换原有的 toggleSelectAllCards 函数
function toggleSelectAllCards() {
    if (!isManageMode) return;

    // ==========================================
    // 🛑 核心拦截：进货模式下，直接没收“全选”功能！
    // ==========================================
    const isPickMode = sessionStorage.getItem('pickNewCardsMode') === 'true';
    if (isPickMode) {
        alert("⚠️ 挑选新词模式下，请使用底部的【随机选词】或手动打勾哦！");
        return; // 直接打断施法，绝不允许全选！
    }

    const visibleCheckboxes = document.querySelectorAll('[id^="checkbox-wrap-"]');
    const visibleIds = Array.from(visibleCheckboxes).map(node => node.id.replace('checkbox-wrap-', ''));
    if (visibleIds.length === 0) return;

    const isAllSelected = visibleIds.every(id => selectedCards.has(id));

    if (isAllSelected) {
        visibleIds.forEach(id => selectedCards.delete(id));
        document.getElementById('btn-select-all').innerHTML = `<span style="font-size: 0.9rem; font-weight: bold;">全选</span>`;
    } else {
        visibleIds.forEach(id => selectedCards.add(id));
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

    if (typeof updateBatchActionBar === 'function') updateBatchActionBar();
}

// ==========================================
// 👆 卡片点击分发中枢
function handleCardClick(cardId) {
    // 1. 获取当前是否处于“进货模式”
    const isPickMode = sessionStorage.getItem('pickNewCardsMode') === 'true';

    // 2. 安全获取“批量编辑模式”状态（防报错）
    const safeIsManageMode = (typeof isManageMode !== 'undefined' && isManageMode === true);

    // 🛑 拦截通道：只要是【进货】或【编辑】，点击卡片统统变成打勾！
    if (isPickMode || safeIsManageMode) {
        if (typeof toggleCardSelection === 'function') {
            toggleCardSelection(cardId);
        }
    }
    // 🟢 放行通道：普通状态下点击，直接开启“不留痕自由浏览”！
    else {
        if (typeof startFreeStudyFromCard === 'function') {
            startFreeStudyFromCard(cardId);
        } else {
            console.error("找不到 startFreeStudyFromCard 函数！请检查是否被误删。");
        }
    }
}
function startFreeStudyFromCard(cardId) {
    // 1. 开启“不留痕”护盾
    window.isFreePracticeMode = true;

    // 2. 拿到当前列表里正在显示的所有卡片，作为浏览队列
    studyCards = window.currentDisplayQueue || allCards;

    // 3. 找到你点击的那张卡片排第几，直接空降过去！
    currentStudyIndex = studyCards.findIndex(c => c._id === cardId);
    if (currentStudyIndex === -1) currentStudyIndex = 0;

    // 4. 切入背诵视图
    showMainView('study-view');
    renderStudyCard();

    console.log(`👻 截获单卡点击！开启自由模式，当前队列: ${studyCards.length}张，空降位置: ${currentStudyIndex + 1}`);
}

// ==========================================
// ✅ 单选卡片拦截器 (防爆单版)
// ==========================================
function toggleCardSelection(cardId) {
    const isPickMode = sessionStorage.getItem('pickNewCardsMode') === 'true';

    // 原来是 if (!isManageMode) return;
    // 现在改为：只要不是这两个模式之一，就不响应点击
    if (!isManageMode && !isPickMode) return;

    // ... 后面的勾选逻辑保持不变 ...


    if (selectedCards.has(cardId)) {
        // 如果是取消打勾，随时放行！
        selectedCards.delete(cardId);
    } else {
        // 🛑 如果是要新打勾，必须先过安检！
        const isPickMode = sessionStorage.getItem('pickNewCardsMode') === 'true';
        if (isPickMode) {
            const quota = parseInt(sessionStorage.getItem('pickNewCardsQuota')) || 0;
            if (selectedCards.size >= quota) {
                // 报警并拦截
                alert(`🎯 今天的 ${quota} 个新词配额已经满啦！\n贪多嚼不烂，快去点击底部【加入记忆】开始背词吧~`);
                return; // ⛔ 极其关键：直接退出函数，绝对不执行下面的画勾和加数操作！
            }
        }

        // 安检通过，允许加入
        selectedCards.add(cardId);
    }

    // 更新卡片上的勾勾 UI
    const checkboxWrap = document.getElementById(`checkbox-wrap-${cardId}`);
    if (checkboxWrap) {
        if (selectedCards.has(cardId)) {
            checkboxWrap.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="#3b82f6" stroke-width="2"></circle><path d="M8 12l3 3 5-6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
        } else {
            checkboxWrap.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="#cbd5e1" stroke-width="2"></circle></svg>`;
        }
    }

    // 更新底部栏状态
    if (typeof updateBatchActionBar === 'function') updateBatchActionBar();
}

// ==========================================
// 🛒 动态变身的底部操作栏
// ==========================================
// ==========================================
// 🛒 动态变身的底部操作栏 (完美无损恢复版)
// ==========================================
// ==========================================
// 🛒 动态变身的底部操作栏 (加入记忆 1/30 版)
// ==========================================
function updateBatchActionBar() {
    const bar = document.getElementById('batch-action-bar');
    const mobileNav = document.getElementById('mobile-bottom-nav');
    if (!bar) return;

    // 🛡️ 安全获取状态，防止全局变量报错
    const isPickMode = sessionStorage.getItem('pickNewCardsMode') === 'true';
    const safeIsManageMode = (typeof isManageMode !== 'undefined' && isManageMode === true);
    const isAnyMode = isPickMode || safeIsManageMode;
    const isMobile = window.innerWidth <= 768;

    if (isAnyMode) {
        bar.style.display = 'flex';

        // 样式分配：手机替换底栏 vs 电脑悬浮胶囊
        if (isMobile) {
            if (mobileNav) mobileNav.style.setProperty('display', 'none', 'important');
            bar.style.cssText = `
                display: flex !important; position: fixed; bottom: 0; left: 0; right: 0; width: 100%;
                background: #1e293b; padding: 12px 15px; z-index: 10000;
                justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.1);
            `;
        } else {
            bar.style.cssText = `
                display: flex !important; position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
                background: rgba(30, 41, 59, 0.95); backdrop-filter: blur(12px); color: white;
                padding: 12px 24px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.3);
                z-index: 10000; align-items: center; gap: 20px; min-width: 450px;
            `;
        }

        // 🛡️ 安全获取数据
        const quota = parseInt(sessionStorage.getItem('pickNewCardsQuota')) || 0;
        const selectedCount = (typeof selectedCards !== 'undefined') ? selectedCards.size : 0;

        // 🧬 内嵌渲染内容：直接塞入 HTML，杜绝外部函数丢失
        if (isPickMode) {
            bar.innerHTML = `
                <span style="font-weight: 500; color: #94a3b8;">挑选新词: ${selectedCount}/${quota}</span>
                <div style="width: 1px; height: 16px; background: rgba(255,255,255,0.2);"></div>
                <button onclick="abortPickMode()" style="background:transparent; border:none; color:#cbd5e1; cursor:pointer;">放弃</button>
                <button onclick="autoSelectNewCards()" style="background:transparent; border:none; color:black; cursor:pointer;font-weight:bold;">随机</button>
                <button onclick="startSelectedNewCards()" style="background:#3b82f6; border:none; color:white; padding:6px 16px; border-radius:8px; cursor:pointer; font-weight:bold;">确认加入</button>
            `;
        } else {
            bar.innerHTML = `
                <span style="font-weight: 500; opacity: 0.9;">已选 ${selectedCount} 项</span>
                <div style="width: 1px; height: 16px; background: rgba(255,255,255,0.2);"></div>
                <button onclick="exitManageMode()" style="background: transparent; border: none; color: #616365; cursor: pointer;">取消</button>
                <button onclick="promptBatchMove()" style="background: transparent; border: none; color: #ffa500; cursor: pointer;">移动</button>
                <button onclick="executeBatchDelete()" style="background: transparent; border: none; color: #616365; cursor: pointer; font-weight: 500;">删除</button>
                <button onclick="batchExportCards()" style="background: transparent; border: none; color: #ffa500 ; cursor: pointer;">导出</button>
            `;
        }
    } else {
        // 🏠 退出模式：全部还原
        bar.style.display = 'none';
        if (mobileNav) mobileNav.style.setProperty('display', 'flex', 'important');
    }
}

function batchExportCards() {
    // 1. 检查是否有勾选
    if (typeof selectedCards === 'undefined' || selectedCards.size === 0) {
        alert("⚠️ 请先勾选需要导出的卡片哦！");
        return;
    }

    // 2. 提取选中的卡片数据
    const cardsToExport = window.currentDisplayQueue.filter(card => selectedCards.has(card._id));

    if (cardsToExport.length === 0) {
        alert("没找到对应的卡片数据，请重新勾选！");
        return;
    }

    try {
        // 3. 定义 CSV 表头
        const headers = ['题目(Question)', '答案(Answer)', '分类(Category)', '阶段(Stage)'];

        // 4. 组装数据行（严格处理了卡片里的回车、换行和引号，防止把表格撑破）
        const csvRows = cardsToExport.map(card => {
            const q = `"${(card.question || '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
            const a = `"${(card.answer || '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;

            // 获取分类名称，兼容你的数据结构
            const catName = card.category && card.category.name ? card.category.name : '未分类';
            const cat = `"${catName.replace(/"/g, '""')}"`;

            const stage = card.stage || 0;

            return [q, a, cat, stage].join(',');
        });

        // 5. 拼接表头和数据
        const csvContent = headers.join(',') + '\n' + csvRows.join('\n');

        // 6. 🌟 加上 \uFEFF (BOM头)，这是为了让微软 Excel 乖乖识别 UTF-8 中文，绝不乱码！
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        // 7. 触发下载
        const link = document.createElement('a');
        link.href = url;
        const dateStr = new Date().toLocaleDateString().replace(/\//g, '-');
        link.download = `我的词汇导出_${dateStr}.csv`;

        document.body.appendChild(link);
        link.click();

        // 8. 打扫战场
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        alert(`✅ 成功导出 ${cardsToExport.length} 张卡片为 CSV 格式！\n可以用 Excel 正常打开啦！`);

        // (可选) 导出后退出编辑模式，让界面恢复清爽
        if (typeof exitManageMode === 'function') {
            exitManageMode();
        }

    } catch (error) {
        console.error("CSV导出失败:", error);
        alert("导出时发生了错误，请按 F12 查看控制台。");
    }
}

// 辅助函数：专门负责塞入按钮，保持主逻辑整洁
function renderBarContent(bar, isPickMode) {
    const quota = parseInt(sessionStorage.getItem('pickNewCardsQuota')) || 0;

    if (isPickMode) {
        bar.innerHTML = `
            <span style="font-weight: 500; color: #94a3b8;">挑选新词: ${selectedCards.size}/${quota}</span>
            <div style="width: 1px; height: 16px; background: rgba(255,255,255,0.2);"></div>
            <button onclick="abortPickMode()" style="background:transparent; border:none; color:#cbd5e1; cursor:pointer;">放弃</button>
            <button onclick="autoSelectNewCards()" style="background:transparent; border:none; color:white; cursor:pointer;">🎲 随机</button>
            <button onclick="startSelectedNewCards()" style="background:#3b82f6; border:none; color:white; padding:6px 16px; border-radius:8px; cursor:pointer; font-weight:bold;">确认加入</button>
        `;
    } else {
        bar.innerHTML = `
            <span style="font-weight: 500; opacity: 0.9;">已选 ${selectedCards.size} 项</span>
            <div style="width: 1px; height: 16px; background: rgba(255,255,255,0.2);"></div>
            <button onclick="exitManageMode()" style="background: transparent; border: none; color: #cbd5e1; cursor: pointer;">取消</button>
            <button onclick="promptBatchMove()" style="background: transparent; border: none; color: white; cursor: pointer;">移动</button>
            <button onclick="executeBatchDelete()" style="background: transparent; border: none; color: #f87171; cursor: pointer; font-weight: 500;">删除</button>
            <button onclick="batchExportCards()" style="background: transparent; border: none; color: white; cursor: pointer;">导出</button>
        `;
    }
}
// ==========================================
// ✨ 进货模式的四大核心魔法
// ==========================================

// 魔法 1：一键选中
// ==========================================
// 🎲 魔法 1：一键随机选词 (盲盒进货)
// ==========================================
function autoSelectNewCards() {
    const quota = parseInt(sessionStorage.getItem('pickNewCardsQuota')) || 0;
    const availableNewCards = window.currentDisplayQueue.filter(c => !(c.stage > 0));

    if (availableNewCards.length === 0) {
        alert("📦 当前文件夹没有新的生词啦，去其他文件夹看看吧！");
        return;
    }

    // 🌟 核心魔法：把新词数组像洗扑克牌一样“随机打乱”
    const shuffledCards = [...availableNewCards].sort(() => 0.5 - Math.random());

    // 清空之前的选择，从打乱的牌堆里抽出需要的数量
    selectedCards.clear();
    const toSelect = shuffledCards.slice(0, quota);
    toSelect.forEach(c => selectedCards.add(c._id));

    if (toSelect.length < quota) {
        alert(`📦 当前文件夹只有 ${toSelect.length} 个新词，已全部随机勾选！\n\n(如果还差额度，可以直接点击底部的【分类】去其他文件夹继续凑)`);
    }

    // 刷新屏幕，让打好的勾勾显示出来
    if (typeof renderCards === 'function') renderCards(window.currentDisplayQueue);
    if (typeof updateBatchActionBar === 'function') updateBatchActionBar();
}

// 魔法 2：带着选好的卡片，直接发车！
function startSelectedNewCards() {
    if (selectedCards.size === 0) {
        alert("❌ 请至少选择 1 个新词再开始哦！");
        return;
    }
    const newCardIds = Array.from(selectedCards);
    studyCards = allCards.filter(c => newCardIds.includes(c._id));

    exitPickMode(); // 发车后自然退出进货状态

    spellCards = [];
    currentStudyIndex = 0;
    showMainView('study-view');
    renderStudyCard();
    console.log(`🚀 纯净新词主线启动: 本次发牌 ${studyCards.length} 张！`);
}

// 魔法 3：底层清理状态 (纯净退场)
function exitPickMode() {
    sessionStorage.removeItem('pickNewCardsMode');
    sessionStorage.removeItem('pickNewCardsQuota');
    selectedCards.clear();
    if (isManageMode) {
        isManageMode = false;
        // 恢复正常卡片显示和操作栏
        if (typeof renderCards === 'function') renderCards(window.currentDisplayQueue);
        updateBatchActionBar();
    }
}

// 🌟 魔法 4：【新增】带贴心提示的防误触中止
function abortPickMode() {
    const wantsToAbort = confirm("确定要放弃本次进货任务，返回主页吗？\n\n💡 提示：如果你只是想换个文件夹挑词，【不需要点退出】！直接点击屏幕底部的【分类】即可，选词状态会一直保持！");

    if (wantsToAbort) {
        exitPickMode();
        // 乖乖送回主页
        if (window.innerWidth <= 768 && typeof handleBottomNav === 'function') {
            handleBottomNav('dashboard');
        } else if (typeof showMainView === 'function') {
            showMainView('dashboard-view');
        }
    }
}


async function executeBatchDelete() {
    if (selectedCards.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedCards.size} 张卡片吗？此操作不可恢复。`)) return;

    // 🌟 1. 获取元素
    const countText = document.getElementById('selected-count-text');

    // 🌟 2. 防弹衣：如果找到了这个元素，才去读它的文字，否则给个空字符串
    const originalText = countText ? countText.textContent : "";

    // 🌟 3. 防弹衣：如果找到了，才去改成“删除中...”
    if (countText) {
        countText.textContent = "删除中...";
    }

    try {
        const deletePromises = Array.from(selectedCards).map(id => oopsyFetch(`/api/flashcards/${id}`, { method: 'DELETE' }));
        await Promise.all(deletePromises);
        exitManageMode();
        if (typeof loadFlashcards === 'function') loadFlashcards();
    } catch (error) {
        console.error("批量删除失败:", error);
        alert("网络连接异常，部分卡片可能未能清除。");

        // 🌟 4. 防弹衣：失败了恢复原状时，也要确认元素还在
        if (countText) {
            countText.textContent = originalText;
        }
    }
}

function promptBatchMove() {
    console.log("🔥 纯净版移动函数已启动！绝对没有空目录字眼！");

    if (selectedCards.size === 0) return;

    const textEl = document.getElementById('batch-move-text');
    if (textEl) {
        textEl.innerText = `将已选的 ${selectedCards.size} 张卡片移动到：`;
    }

    const parents = allCategories.filter(c => !c.parentId);
    const children = allCategories.filter(c => c.parentId);

    let optionsHtml = `<option value="uncategorized">未分类区</option>`;

    parents.forEach(p => {
        // 让所有的大类（包括默认卡片夹）都变成可选的！绑定真实的 ID！
        optionsHtml += `<option value="${p._id}" style="font-weight: bold; color: #ffa500;">📁 ${p.name}</option>`;

        const myChildren = children.filter(c => c.parentId === p._id);

        // 子包正常显示，不再做任何多余的空目录判断！
        myChildren.forEach(c => {
            optionsHtml += `<option value="${c._id}" style="color: #1e293b;">&nbsp;&nbsp;&nbsp;&nbsp;↳ 📦 ${c.name}</option>`;
        });
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
            return oopsyFetch(`/api/flashcards/${id}`, {
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
        await oopsyFetch('/api/categories', {
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

    if (quickModal) quickModal.style.zIndex = '30000';
    if (quickOverlay) quickOverlay.style.zIndex = '29999';

    const parentSelect = document.getElementById('quick-parent-select');
    if (parentSelect) {
        parentSelect.innerHTML = `<option value="CREATE_NEW_PARENT" style="color:#3b82f6; font-weight:bold;">创建全新大类...</option><option disabled>──────────────</option>`;
        allCategories.filter(c => !c.parentId).forEach(p => {
            parentSelect.innerHTML += `<option value="${p._id}">挂载到现有: ${p.name}</option>`;
        });
    }

    if (quickOverlay) quickOverlay.style.display = 'block';
    if (quickModal) quickModal.style.display = 'block';

    // 因为前面加了自动注入，现在这里调用绝对安全
    toggleNewParentInput();

    setTimeout(() => {
        if (parentSelect && parentSelect.value === 'CREATE_NEW_PARENT') {
            const newParentInput = document.getElementById('quick-new-parent-name');
            if (newParentInput) newParentInput.focus();
        } else {
            const childInput = document.getElementById('quick-child-name');
            if (childInput) childInput.focus();
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
            await oopsyFetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newParentName, parentId: null, type: 'vocabulary' })
            });

            await loadCategories();
            const createdParent = allCategories.find(c => c.name === newParentName && !c.parentId);
            if (!createdParent) throw new Error("大类创建迷失在四次元空间了");
            finalParentId = createdParent._id;
        }

        await oopsyFetch('/api/categories', {
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
            <div id="folders-view" class="view hidden" style="background: #f1f5f9; min-height: 100vh; padding-bottom: 80px;">
                
                <div style="padding: 12px 16px 8px 16px; font-size: 0.85rem; color: #64748b; font-weight: 500;">
                    我的词库与分类
                </div>
                
                <div style="background: white; border-top: 0.5px solid #e2e8f0; border-bottom: 0.5px solid #e2e8f0;">
                    <ul class="nav-menu" id="mobile-folders-menu" style="margin: 0; padding: 0; list-style: none;"></ul>
                </div>
                
                <div style="padding: 16px; text-align: center;">
                    <button onclick="var m = document.getElementById('category-modal'); if(m){ m.classList.remove('hidden'); m.style.display='flex'; m.style.zIndex='99999'; } else { alert('找不到弹窗'); }" style="position: relative; z-index: 9999; background: transparent; color: #3b82f6; border: none; font-size: 0.95rem; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        新建词库分类
                    </button>
                </div>
            </div>
        `;
        const contentArea = document.querySelector('.content-area');
        if (contentArea) contentArea.insertAdjacentHTML('beforeend', foldersViewHTML);
    }
});

// 📱 手机端底部导航路由中心
window.handleBottomNav = function (target) {
    if (window.innerWidth > 768) return; // 电脑端不执行

    // 1. 切换底部图标的高亮状态 (变蓝)
    document.querySelectorAll('.mobile-bottom-nav .nav-tab').forEach(t => {
        t.classList.remove('active');
        t.style.color = '#94a3b8'; // 恢复灰色
    });
    const tab = document.getElementById('tab-' + target);
    if (tab) {
        tab.classList.add('active');
        tab.style.color = '#3b82f6'; // 激活变成主题色
    }

    // 2. 核心：根据目标切页面
    if (target === 'dashboard') {
        const dashBtn = document.querySelector('.nav-item[onclick*="selectDashboard"]');
        if (dashBtn) selectDashboard(dashBtn);
    }
    else if (target === 'explore') {
        if (typeof showExploreView === 'function') showExploreView();
    }
    else if (target === 'folders') {
        document.getElementById('current-view-title').innerText = '词库书架';
        showMainView('folders-view');
    }
    else if (target === 'profile') {
        // 🎯 就是这里！召唤出咱们写好的高级设置页面
        if (typeof showProfileView === 'function') {
            showProfileView();
        } else {
            // 如果你没有 showProfileView 函数，直接用底层逻辑切过去：
            document.getElementById('current-view-title').innerText = '我的设置';
            showMainView('profile-view');
        }
    }
};

// ==========================================
// 👻 自由背诵模式引擎 (修复被误杀的函数)
// ==========================================
window.startFreeStudy = function () {
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
        await oopsyFetch('/api/categories', {
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

// ==========================================
// 📊 数据看板快捷跳转引擎 (修复连环跳转 Bug 版)
// ==========================================

function goToAllCards() {
    currentCategoryId = 'all'; // 显式声明
    const rootItem = document.querySelector('.root-nav');
    selectSidebarItem('all', '所有卡片', 'vocabulary', rootItem);
}

function goToHardCards() {
    currentCategoryId = 'hard';
    document.getElementById('current-view-title').innerText = '困难卡片 (待进阶)';
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    if (window.innerWidth <= 768) {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        const tabAll = document.getElementById('tab-all');
        if (tabAll) tabAll.classList.add('active');
    }

    showMainView('manage-view');
    filterCards(); // 👈 补上这一句！命令系统重新洗牌发牌
}

function goToMasteredCards() {
    currentCategoryId = 'mastered';
    document.getElementById('current-view-title').innerText = '熟练掌握 (Stage 3+)';
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    if (window.innerWidth <= 768) {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        const tabAll = document.getElementById('tab-all');
        if (tabAll) tabAll.classList.add('active');
    }

    showMainView('manage-view');
    filterCards(); // 👈 同样补上这一句！
}

// 🍏 苹果级悬浮球拖拽逻辑
const fab = document.getElementById('floating-add-btn');
let isDragging = false;
let startX, startY, initialX, initialY;

// 从本地存储读取上次的位置
const savedPos = JSON.parse(localStorage.getItem('fabPosition') || '{"right":20, "bottom":100}');
Object.assign(fab.style, { right: savedPos.right + 'px', bottom: savedPos.bottom + 'px', left: 'auto' });

fab.addEventListener('touchstart', (e) => {
    isDragging = true;
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    initialX = fab.offsetLeft;
    initialY = fab.offsetTop;
    fab.style.transition = 'none'; // 拖拽时关闭动画
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;

    // 限制在屏幕范围内
    let newX = initialX + dx;
    let newY = initialY + dy;
    fab.style.left = newX + 'px';
    fab.style.top = newY + 'px';
    fab.style.right = 'auto';
    fab.style.bottom = 'auto';
}, { passive: false });

document.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    fab.style.transition = 'all 0.5s cubic-bezier(0.19, 1, 0.22, 1)'; // 开启丝滑吸附动画

    // 自动吸附逻辑
    const screenWidth = window.innerWidth;
    const fabWidth = fab.offsetWidth;
    const currentX = fab.offsetLeft;

    if (currentX + fabWidth / 2 < screenWidth / 2) {
        fab.style.left = '20px'; // 吸附到左边
    } else {
        fab.style.left = (screenWidth - fabWidth - 20) + 'px'; // 吸附到右边
    }

    // 记忆位置
    setTimeout(() => {
        const finalPos = { left: fab.style.left, top: fab.style.top };
        localStorage.setItem('fabPosition', JSON.stringify(finalPos));
    }, 500);
});

/* ==========================================
   🔎 发现页 (Explore) 逻辑中心
   ========================================== */

// 1. 内置词库模拟数据库
const MARKET_BOOKS = [
    {
        id: 'book_001',
        title: '雅思听力·高频场景词',
        count: 1200,
        category: 'english',
        cover: '🎧',
        desc: '涵盖租房、学术讨论、旅游等核心场景'
    },
    {
        id: 'book_002',
        title: 'PTE 阅读·真题学术词',
        count: 850,
        category: 'english',
        cover: '📖',
        desc: '精准锁定学术精读与机经高频词汇'
    },
    {
        id: 'book_003',
        title: '一级建造师·法规必背',
        count: 450,
        category: 'build',
        cover: '🏗️',
        desc: '2026年最新大纲核心考点提炼'
    }
];

// 2. 渲染货架列表
function renderMarketList(filter = 'all') {
    const container = document.getElementById('market-list-container');
    if (!container) return;

    const filteredBooks = filter === 'all'
        ? MARKET_BOOKS
        : MARKET_BOOKS.filter(book => book.category === filter);

    container.innerHTML = filteredBooks.map(book => `
        <div class="market-card">
            <div class="market-card-left">
                <div class="market-cover">${book.cover}</div>
                <div class="market-info">
                    <span class="market-title">${book.title}</span>
                    <span class="market-count">${book.count} 词条 · 精选</span>
                </div>
            </div>
            <button class="get-btn" onclick="importFromMarket('${book.id}', '${book.title}')">
                获取
            </button>
        </div>
    `).join('');
}

// 3. 执行获取（导入逻辑）
function importFromMarket(bookId, bookTitle) {
    // 这里模拟导入逻辑：实际开发时你会在这里调用你的数据库保存函数
    console.log(`正在从市场导入: ${bookTitle}`);

    // 弹出成功提示 (Toast)
    showToast(`✅ 已将《${bookTitle}》加入您的词库`);

    // 模拟跳转到词库页并刷新（可选）
    // setTimeout(() => showMainView('manage-view'), 1500);
}

// 4. 简易 Toast 提示函数
function showToast(message) {
    // 检查是否已有 toast 容器，没有就创建一个
    let toast = document.getElementById('global-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'global-toast';
        // 样式我们在 CSS 里统一写过，这里只管显示
        document.body.appendChild(toast);
    }

    toast.innerText = message;
    toast.className = 'show';

    setTimeout(() => {
        toast.className = toast.className.replace('show', '');
    }, 3000);
}

// 5. 分类切换逻辑
function switchMarketTab(category) {
    // 切换按钮高亮
    const tabs = document.querySelectorAll('.tab-item');
    tabs.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    // 重新渲染列表
    renderMarketList(category);
}

// 页面加载时自动执行一次渲染
document.addEventListener('DOMContentLoaded', () => {
    renderMarketList();
});

// ==========================================
// 🌟 顶栏动态控制器：负责主页和词库页的 UI 切换
// ==========================================
function updateHeaderUI(isDashboard) {
    const manageBtn = document.getElementById('btn-toggle-manage'); // 编辑按钮
    const testBtn = document.getElementById('btn-test-mode');       // 检测按钮
    const addBtn = document.getElementById('btn-add-card');

    if (isDashboard) {
        // 🏠 场景 1：在主界面 (Dashboard)
        // 动作：隐藏专属功能按钮
        if (manageBtn) manageBtn.style.display = 'none';
        if (testBtn) testBtn.style.display = 'none';
        if (addBtn) addBtn.style.display = 'none'; // 🌟 核心：在主页把它也藏起来！
    } else {
        // 📂 场景 2：在具体词库界面
        // 动作：显示专属功能按钮，准备学习
        if (manageBtn) manageBtn.style.display = 'inline-flex';
        if (testBtn) testBtn.style.display = 'inline-flex';
        if (addBtn) addBtn.style.display = 'inline-flex'; // 🌟 核心：进词库再让它出来！
    }
}

// ==========================================
// 🌟 拼写检测：高级下划线渲染与隐形输入绑定
// ==========================================

// 1. 初始化下划线界面（每次切到新单词时调用）
function setupSpellDisplay(targetWord) {
    const displayArea = document.getElementById('spell-display-area');
    const hiddenInput = document.getElementById('spell-hidden-input');

    if (!displayArea || !hiddenInput) return;

    // 清空旧的下划线和输入框里的残留数据
    displayArea.innerHTML = '';
    hiddenInput.value = '';
    hiddenInput.maxLength = targetWord.length; // 限制最多只能输入这么多字符

    // 根据目标单词的长度和空格，动态生成对应的盒子
    for (let i = 0; i < targetWord.length; i++) {
        const char = targetWord[i];
        const box = document.createElement('div');

        if (char === ' ') {
            box.className = 'spell-space-box'; // 遇到空格，放一个隐形的占位盒子
        } else {
            box.className = 'spell-char-box';  // 遇到字母，放一个带下划线的盒子
        }
        displayArea.appendChild(box);
    }
}

// 2. 监听隐形输入框的“打字”动作，实时投影到下划线上
// 2. 监听隐形输入框的“打字”动作，极致平滑映射
document.getElementById('spell-hidden-input')?.addEventListener('input', function (e) {
    // 🌟 核心升级：剥离所有空格，只提取用户敲的纯字母！
    const pureInput = e.target.value.replace(/\s+/g, '');

    // 🌟 只抓取真正的字母下划线盒子（透明的空格占位盒子直接无视）
    const charBoxes = Array.from(document.getElementById('spell-display-area').children)
        .filter(box => box.classList.contains('spell-char-box'));

    // 纯字母依次投射，再也不用管空格在哪了！
    for (let i = 0; i < charBoxes.length; i++) {
        if (i < pureInput.length) {
            charBoxes[i].innerText = pureInput[i];
            charBoxes[i].classList.add('filled'); // 点亮变蓝
        } else {
            charBoxes[i].innerText = '';
            charBoxes[i].classList.remove('filled'); // 恢复灰色
        }
    }
});

// 3. 监听键盘的回车键 (Enter)，自动触发提交校验
document.getElementById('spell-hidden-input')?.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        if (typeof checkSpelling === 'function') {
            checkSpelling(); // 呼叫你原本就写好的检测函数
        }
    }
});

// 🌐 核心功能：全网查词 + 自动一键入库（收件箱）
async function searchWebForWord(word) {
    if (!word) return;

    // 1. 变身加载状态（给用户一个反馈）
    const btn = event.currentTarget; // 抓取你刚才点击的那个按钮
    const originalText = btn.innerHTML;
    btn.innerHTML = `⏳ 正在连线词典查询 "${word}"...`;
    btn.style.opacity = '0.8';
    btn.disabled = true;

    try {
        // 2. 📡 发起查词请求（使用 MyMemory 免费公共翻译 API 作为演示）
        // 如果你以后有自己的后端查词接口，把这里换成你的接口即可
        const fetchUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|zh-CN`;
        const res = await oopsyFetch(fetchUrl);
        const data = await res.json();

        // 提取翻译结果 (MyMemory API 的数据结构)
        let translation = "";
        if (data.responseStatus === 200 && data.responseData.translatedText) {
            translation = data.responseData.translatedText;
        }

        // 简单的防呆校验：如果翻译出来的还是原词，说明没查到
        if (!translation || translation.toLowerCase() === word.toLowerCase()) {
            alert(`🤔 哎呀，词典里没找到 "${word}" 的确切意思，可能是拼写有误？`);
            btn.innerHTML = originalText;
            btn.disabled = false;
            btn.style.opacity = '1';
            return;
        }

        // 3. 📦 组装卡片基础数据
        const payload = {
            question: word.trim(),
            answer: translation.trim()
        };

        // 🌟 核心补全：就地智能收纳 + 收藏夹 VIP 通道
        const catId = window.currentCategoryId;
        let finalCategoryId = catId;
        let targetFolderName = "默认卡片夹";

        // 判断：如果是在"全部/主页/未分类"界面，强行分配/创建" 收藏夹"
        if (!finalCategoryId || finalCategoryId === 'all' || finalCategoryId === 'dashboard' || finalCategoryId === 'uncategorized') {
            let inboxCat = typeof allCategories !== 'undefined' ?
                allCategories.find(c => c.name === '默认卡片夹') : null;

            // 如果没有真实的收藏夹，当场建一个！
            if (!inboxCat) {
                try {
                    const catRes = await oopsyFetch('/api/categories', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: '默认卡片夹', type: 'vocabulary' })
                    });
                    if (catRes.ok) {
                        if (typeof loadCategories === 'function') await loadCategories();
                        inboxCat = allCategories.find(c => c.name === '默认卡片夹');
                    }
                } catch (err) {
                    console.error("自动创建默认卡片夹失败:", err);
                }
            }

            if (inboxCat && inboxCat._id) {
                finalCategoryId = inboxCat._id;
            } else {
                alert("系统错误：无法获取或创建默认卡片夹，请先手动建一个！");
                btn.innerHTML = originalText;
                btn.disabled = false;
                btn.style.opacity = '1';
                return;
            }
        } else {
            // 如果是在特定的卡包里查词，就放进当前卡包
            if (typeof allCategories !== 'undefined') {
                const currentCatObj = allCategories.find(c => c._id === catId);
                if (currentCatObj) targetFolderName = `📁 ${currentCatObj.name}`;
            }
        }

        // 把绝对合法的真实 ID 塞进包裹
        payload.categoryId = finalCategoryId;

        console.log(`🚀 准备发送给后端的卡片数据 (目标: ${targetFolderName}):`, payload);

        // 4. 🚀 默默保存到你的数据库
        const saveRes = await oopsyFetch('/api/flashcards', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!saveRes.ok) {
            const errorText = await saveRes.text();
            console.error("🔥 后端详细报错信息:", errorText);
            throw new Error(`保存失败，状态码: ${saveRes.status}`);
        }

        // 5. 🎉 大功告成，处理 UI！
        if (typeof loadFlashcards === 'function') {
            await loadFlashcards();
        }
        if (typeof filterCards === 'function') {
            filterCards(); // 强行刷新，让新卡片瞬间出现在当前列表！
        }

        // 恢复按钮状态，并提示成功
        btn.innerHTML = `🎉 已收录至 ${targetFolderName}！`;
        btn.style.background = '#10b981'; // 变绿色表示成功
        btn.style.opacity = '1';

        setTimeout(() => {
            alert(`🎉 收录成功！\n\n单词：${word}\n释义：${translation}\n\n已智能收纳至【${targetFolderName}】啦！`);
        }, 300);

    } catch (error) {
        console.error("查词建卡崩溃:", error);
        alert('网络似乎开小差了，添加失败哦。');
        btn.innerHTML = originalText;
        btn.disabled = false;
        btn.style.opacity = '1';
    }
}

// 🌐 市场搜索全局状态
let currentMarketTab = 'word'; // 默认在“单词”页面

// 🎯 切换 Tab 样式和逻辑
function switchMarketTab(tab) {
    currentMarketTab = tab;

    // UI 样式切换
    const wordTab = document.getElementById('tab-word');
    const deckTab = document.getElementById('tab-deck');

    if (tab === 'word') {
        wordTab.style.color = '#10b981'; wordTab.style.borderColor = '#10b981'; wordTab.style.fontWeight = 'bold';
        deckTab.style.color = '#94a3b8'; deckTab.style.borderColor = 'transparent'; deckTab.style.fontWeight = 'normal';
    } else {
        deckTab.style.color = '#10b981'; deckTab.style.borderColor = '#10b981'; deckTab.style.fontWeight = 'bold';
        wordTab.style.color = '#94a3b8'; wordTab.style.borderColor = 'transparent'; wordTab.style.fontWeight = 'normal';
    }

    // 切换后重新过滤
    filterMarket();
}

// 🧹 清空搜索框
function clearMarketSearch() {
    const input = document.getElementById('market-search-input');
    if (input) input.value = '';
    filterMarket();
}

// 🚀 核心搜索逻辑
// 🚀 核心搜索逻辑 (单词联想 + 词书过滤 双管齐下)
// 🌐 全局变量：保存当前查到的释义，供加号按钮直接使用
let currentLiveTranslation = "";
let searchTimeout = null; // 防抖定时器

// 🚀 核心搜索逻辑 (加入实时查词)
function filterMarket() {
    const input = document.getElementById('market-search-input');
    const searchTerm = input ? input.value.trim().toLowerCase() : '';
    const resultsContainer = document.getElementById('market-search-results');

    if (!searchTerm) {
        // ... (清空搜索框时的历史记录和词书恢复逻辑，保持不变)
        resultsContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: #94a3b8;">暂无搜索记录</div>`;
        const allDecks = document.querySelectorAll('.category-card, .market-item, .explore-card');
        allDecks.forEach(card => card.style.display = '');
        return;
    }

    // 🟢 【单词 Tab】实时查词逻辑
    if (currentMarketTab === 'word') {
        // 1. 先展示“正在查询”的状态，加号变灰不可点
        resultsContainer.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 10px; border-bottom: 1px solid #f1f5f9;">
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <span style="font-size: 16px; color: #1e293b; font-weight: 500;">${searchTerm}</span>
                    <span id="live-translation" style="font-size: 13px; color: #64748b;">🔍 正在联网查询释义...</span>
                </div>
                <button id="add-word-btn" disabled style="color: #cbd5e1; border: 1px solid #cbd5e1; background: transparent; width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 22px; line-height: 1; transition: 0.2s;">
                    +
                </button>
            </div>
        `;

        // 2. 防抖：用户停止打字 600 毫秒后，再发送网络请求
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
            try {
                // 🌟🌟🌟 这里是你昨天搞定的有道词典 API！ 🌟🌟🌟
                // 假设你后端有一个接口专门调有道，或者前端直接发请求
                // 请把你昨天的查词代码贴在这里，把结果赋给 transText 变量！
                // (下面我先写一个模拟的后端接口调用作为示范)

                let transText = "正在尝试获取词性..."; // 默认值

                // 【请将下面这块 fetch 替换成你昨天的有道查词代码】
                const res = await oopsyFetch(`/api/dict?word=${encodeURIComponent(searchTerm)}`);// 假设你有这个后端接口
                if (res.ok) {
                    const data = await res.json();
                    transText = data.translation; // 假设返回的数据里有 "n. 苹果; 公司" 这种带词性的格式
                } else {
                    // 如果后端接口没写好，这里用个临时备用方案顶上
                    const fallbackRes = await oopsyFetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(searchTerm)}&langpair=en|zh-CN`);
                    const fallbackData = await fallbackRes.json();
                    transText = fallbackData.responseData.translatedText;
                }
                // 【替换结束】

                // 3. 把查到的带词性的释义显示到屏幕上，并保存到全局变量
                currentLiveTranslation = transText;
                const transUI = document.getElementById('live-translation');
                if (transUI) {
                    transUI.innerText = transText;
                    transUI.style.color = '#3b82f6'; // 变蓝色表示查到了
                }

                // 4. 激活加号按钮！
                const btn = document.getElementById('add-word-btn');
                if (btn) {
                    btn.disabled = false;
                    btn.style.color = '#10b981';
                    btn.style.borderColor = '#10b981';
                    btn.style.cursor = 'pointer';
                    btn.setAttribute('onclick', `quickAddMarketWord('${searchTerm}', this)`);
                }

            } catch (err) {
                console.error(err);
                document.getElementById('live-translation').innerText = "网络异常，未查到释义";
                currentLiveTranslation = "";
                // 即使没查到，也允许用户点加号添加（进去后再自己改）
                const btn = document.getElementById('add-word-btn');
                if (btn) {
                    btn.disabled = false;
                    btn.style.color = '#10b981'; btn.style.borderColor = '#10b981'; btn.style.cursor = 'pointer';
                    btn.setAttribute('onclick', `quickAddMarketWord('${searchTerm}', this)`);
                }
            }
        }, 600); // 停顿 0.6 秒后执行

    }
    // 🔵 【词书 Tab】过滤逻辑保持不变
    else {
        // ... (保留你之前的过滤词书代码即可)
        resultsContainer.innerHTML = `<div style="padding: 16px; text-align: center; color: #3b82f6; font-size: 14px; background: #eff6ff; border-radius: 8px; margin-top: 8px;">👇 已为您在下方过滤...</div>`;
        const deckCards = document.querySelectorAll('.category-card, .market-item, .explore-card, .deck-card');
        deckCards.forEach(card => {
            card.style.display = card.textContent.toLowerCase().includes(searchTerm) ? '' : 'none';
        });
    }
}

// ➕ 核心魔法：直接把刚才显示在屏幕上的释义存进去！
async function quickAddMarketWord(word, btnElement) {
    if (!word) return;

    btnElement.innerHTML = `<svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>`;
    btnElement.disabled = true;
    btnElement.style.opacity = '0.5';

    try {
        // 1. 拿收藏夹 ID
        let inboxCat = typeof allCategories !== 'undefined' ?
            allCategories.find(c => c.name.includes('默认卡片夹') || c.name.includes('收件箱') || c.name.includes('未分类')) : null;
        if (!inboxCat) {
            const catRes = await oopsyFetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: '默认卡片夹', type: 'vocabulary' }) });
            if (catRes.ok) { if (typeof loadCategories === 'function') await loadCategories(); inboxCat = allCategories.find(c => c.name.includes('默认卡片夹')); }
        }
        let finalCategoryId = (inboxCat && inboxCat._id) ? inboxCat._id : "";
        if (!finalCategoryId) throw new Error("无法获取分类ID");

        // 🌟🌟🌟 2. 重点：直接使用刚才查好的、带词性的释义！不用再费时间查一遍了！
        let finalTranslation = currentLiveTranslation || "未匹配到释义，请手动编辑";

        // 3. 发送给后端保存
        const saveRes = await oopsyFetch('/api/flashcards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: word, answer: finalTranslation, categoryId: finalCategoryId })
        });

        if (!saveRes.ok) throw new Error(`保存失败`);

        // 4. 成功 UI 反馈
        btnElement.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        btnElement.style.background = '#10b981'; btnElement.style.border = 'none'; btnElement.style.opacity = '1';

        const transUI = document.getElementById('live-translation');
        if (transUI) { transUI.innerText = `[已收藏] ${finalTranslation}`; transUI.style.color = '#10b981'; }

        if (typeof loadFlashcards === 'function') loadFlashcards();
        if (typeof filterCards === 'function') filterCards();

    } catch (err) {
        btnElement.innerHTML = `+`; btnElement.disabled = false; btnElement.style.opacity = '1';
        alert("收藏失败，请重试！");
    }
}

// 把这个函数放到 script.js 最底部
async function showStarredCards(element) {
    console.log("⭐ [Debug] 尝试进入星标收藏夹...");

    try {
        // 1. 设置专属的分类 ID
        window.currentCategoryId = 'starred';

        // 2. 退出管理模式 (复用你的安全逻辑，防误删)
        if (typeof exitManageMode === 'function' && typeof isManageMode !== 'undefined' && isManageMode) {
            exitManageMode();
        }

        // 3. 更改顶部标题 (使用你真实的 ID)
        const titleEl = document.getElementById('current-view-title');
        if (titleEl) titleEl.textContent = '🌟 星标收藏夹 (疑难词)';

        // 4. 处理左侧菜单高亮
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        if (element) {
            element.classList.add('active');
        } else {
            const starNav = document.querySelector('.starred-nav');
            if (starNav) starNav.classList.add('active');
        }

        // 5. 隐藏右上角的“分类设置”按钮 (收藏夹不需要设置)
        const settingsBtn = document.getElementById('category-settings-btn');
        if (settingsBtn) settingsBtn.classList.add('hidden');

        // 6. 🚀 核心修复：调用你真实的切屏函数！
        if (typeof showMainView === 'function') {
            showMainView('manage-view');
        }

        // 7. 同步手机端底栏状态 (复用你的逻辑)
        if (window.innerWidth <= 768) {
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            const tabAll = document.getElementById('tab-all');
            if (tabAll) tabAll.classList.add('active');
        }

        // 8. 获取数据并过滤
        const response = await oopsyFetch('/api/flashcards');
        const allCards = await response.json();
        const starredCards = allCards.filter(card => card.isStarred === true);

        console.log(`⭐ [Debug] 成功拿到 ${starredCards.length} 张星标卡片`);

        // 9. 🚀 延迟渲染：防止被 showMainView 内部的 filterCards 覆盖
        setTimeout(() => {
            if (typeof renderCards === 'function') {
                renderCards(starredCards);
            }
        }, 50); // 50毫秒的延迟，确保星星卡片最后渲染上屏

    } catch (err) {
        console.error("⭐ [Debug] 星标收藏夹加载出错:", err);
    }
}


// 🚪 退出登录
function logout() {
    // 1. 撕毁通行证和本地记录
    localStorage.removeItem('oopsy_token');
    localStorage.removeItem('oopsy_username');

    // 2. 弹窗提示一下
    alert('已安全退出账号，期待你的下次复习 👋');

    // 3. 强制刷新页面，让保安重新查票！
    window.location.reload();
}

// 👤 渲染用户信息 (把名字挂到墙上)
function renderUserInfo() {
    // 从本地兜里掏出名字，如果没有，就默认叫 "记忆大师"
    const username = localStorage.getItem('oopsy_username') || '记忆大师';

    // 1. 替换主页问候语
    const greetingEl = document.getElementById('dash-greeting');
    if (greetingEl) {
        greetingEl.innerText = `欢迎回来，${username} 👋`;
    }

    // 2. 替换设置页的名字
    const profileNameEl = document.getElementById('profile-username');
    if (profileNameEl) {
        profileNameEl.innerText = username;
    }

    // 3. 替换设置页的头像 (取名字的第一个字)
    const profileAvatarEl = document.getElementById('profile-avatar');
    if (profileAvatarEl) {
        profileAvatarEl.innerText = username.charAt(0).toUpperCase();
    }
}