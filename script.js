// Vibe Coding Theme - 命令行交互脚本

// 全局变量
let commandHistory = [];
let historyIndex = -1;
let currentCommand = '';
let pageSize = 10;
let currentPage = 1;
let totalPosts = 0;
let currentListPosts = [];
let currentSearchQuery = '';

// 命令映射表
const commands = {
    'ls': handleLsCommand,
    'cat': handleCatCommand,
    'about': handleAboutCommand,
    'home': handleHomeCommand,
    'tree': handleTreeCommand,
    'help': handleHelpCommand,
    'search': handleSearchCommand,
    'tags': handleTagsCommand,
    'categories': handleCategoriesCommand,
    'archives': handleArchivesCommand,
    'stats': handleStatsCommand
};

// 自动补全命令列表
const commandList = Object.keys(commands);

// 初始化函数
function init() {
    const commandInput = document.getElementById('command-input');
    const terminalOutput = document.getElementById('command-output');
    
    // 添加事件监听器
    commandInput.addEventListener('keydown', handleKeyDown);
    commandInput.addEventListener('input', handleAutoComplete);
    
    // 设置命令行输入光标
    setupCursor(commandInput);
    
    // 显示欢迎信息
    // showWelcomeMessage();
    
    // 启动动态文本效果
    startDynamicTextAnimation();
    
    // 定期更新终端资源信息
    updateTerminalInfo(); // 立即更新一次
    setInterval(updateTerminalInfo, 3000); // 每3秒更新一次
    
    // 聚焦到输入框
    commandInput.focus();
    
    // 响应式调整
    handleResponsiveLayout();
    
    // 添加窗口大小变化监听
    window.addEventListener('resize', handleResponsiveLayout);

    setupGlobalShortcuts();
}

// 响应式布局处理
function handleResponsiveLayout() {
    // 根据屏幕尺寸调整布局和功能
    const isMobile = window.innerWidth <= 768;
    const isSmallMobile = window.innerWidth <= 480;
    const isLandscape = window.innerHeight < window.innerWidth;
    
    // 调整内容区域高度
    const terminalContainer = document.querySelector('.terminal-container');
    const mainContent = document.querySelector('.main-content');
    
    if (terminalContainer && mainContent) {
        if (isSmallMobile) {
            mainContent.style.height = 'calc(100vh - 160px)';
            terminalContainer.style.height = '35vh';
        } else if (isMobile) {
            mainContent.style.height = 'calc(100vh - 180px)';
            terminalContainer.style.height = '40vh';
        } else if (isLandscape && window.innerHeight <= 500) {
            mainContent.style.height = 'calc(100vh - 140px)';
            terminalContainer.style.height = '45vh';
        } else {
            // 恢复默认高度
            mainContent.style.height = 'calc(100vh - 200px)';
            terminalContainer.style.height = '50vh';
        }
    }
    
    // 在移动设备上优化触摸体验
    if (isMobile) {
        // 为命令行输入添加触摸事件优化
        const commandInput = document.getElementById('command-input');
        if (commandInput) {
            commandInput.style.touchAction = 'manipulation';
            commandInput.style.fontSize = '16px'; // 防止iOS自动缩放
        }
        
        // 优化可点击元素的触摸区域
        const clickableElements = document.querySelectorAll('.expand-icon, .post-label, .article-title, .pagination a, .back-button');
        clickableElements.forEach(element => {
            element.style.touchAction = 'manipulation';
            // 增加触摸区域大小
            if (!element.classList.contains('touch-optimized')) {
                element.classList.add('touch-optimized');
            }
        });
    }
}

// 动态文本动画
function startDynamicTextAnimation() {
    const dynamicText = document.querySelector('.dynamic-text');
    if (!dynamicText) return;
    
    const texts = [
        '探索终端风格的博客体验',
        '使用命令行浏览文章和归档',
        '输入 ls 查看最新文章',
        '输入 about 了解博主信息',
        '输入 help 获取帮助'
    ];
    
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;
    
    function type() {
        const currentText = texts[textIndex];
        
        if (isDeleting) {
            // 删除文本
            dynamicText.textContent = '> ' + currentText.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 50;
        } else {
            // 输入文本
            dynamicText.textContent = '> ' + currentText.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 100;
        }
        
        // 控制动画流程
        if (!isDeleting && charIndex === currentText.length) {
            // 文本输入完成，暂停一下
            typingSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            // 文本删除完成，切换到下一个文本
            isDeleting = false;
            textIndex = (textIndex + 1) % texts.length;
            typingSpeed = 500;
        }
        
        setTimeout(type, typingSpeed);
    }
    
    // 开始动画
    setTimeout(type, 1000);
}

// 显示欢迎信息
function showWelcomeMessage() {
    const terminalOutput = document.getElementById('command-output');
    const welcomeMessage = `
<div><span class="terminal-prompt">vibe-coding@blog:~$ </span><span class="command">Welcome to Vibe Coding Theme</span></div>
<div>这是一个终端风格的Typecho博客主题。</div>
<div>输入 <span class="command">help</span> 查看可用命令。</div>
    `;
    terminalOutput.innerHTML += welcomeMessage;
    scrollToBottom();
}

// 模拟终端资源使用情况更新
function updateTerminalInfo() {
    const cpuUsage = document.querySelector('.cpu-usage');
    const memoryUsage = document.querySelector('.memory-usage');
    
    if (cpuUsage && memoryUsage) {
        // 随机更新CPU和内存使用情况，模拟真实终端
        const cpu = (Math.random() * 2 + 0.1).toFixed(1);
        const memory = Math.floor(Math.random() * 200 + 100);
        
        cpuUsage.textContent = `CPU: ${cpu}%`;
        memoryUsage.textContent = `MEM: ${memory}MB`;
    }
}

// 处理键盘事件
function handleKeyDown(event) {
    const commandInput = document.getElementById('command-input');
    const terminalOutput = document.getElementById('command-output');
    
    switch(event.key) {
        case 'Enter':
            event.preventDefault();
            const command = commandInput.value.trim();
            if (command) {
                // 添加到历史记录
                commandHistory.push(command);
                historyIndex = -1;
                
                // 显示命令
                terminalOutput.innerHTML += `<div><span class="terminal-prompt">vibe-coding@blog:~$ </span><span class="command">${command}</span></div>`;
                
                // 执行命令
                executeCommand(command);
                
                // 清空输入框
                commandInput.value = '';
            }
            break;
        
        case 'ArrowUp':
            if (document.activeElement === commandInput) {
                event.preventDefault();
                if (commandHistory.length > 0) {
                    if (historyIndex === -1) {
                        currentCommand = commandInput.value;
                        historyIndex = commandHistory.length - 1;
                    } else if (historyIndex > 0) {
                        historyIndex--;
                    }
                    commandInput.value = commandHistory[historyIndex];
                }
            }
            break;
        
        case 'ArrowDown':
            if (document.activeElement === commandInput) {
                event.preventDefault();
                if (commandHistory.length > 0) {
                    if (historyIndex < commandHistory.length - 1) {
                        historyIndex++;
                        commandInput.value = commandHistory[historyIndex];
                    } else {
                        historyIndex = -1;
                        commandInput.value = currentCommand;
                    }
                }
            }
            break;
        
        case 'Tab':
            event.preventDefault();
            autoCompleteCommand();
            break;

        case 'Escape':
            event.preventDefault();
            commandInput.blur();
            break;
    }
}

// 处理自动补全
function handleAutoComplete() {
    // 这里可以添加实时自动补全逻辑
}

// 自动补全命令
function autoCompleteCommand() {
    const commandInput = document.getElementById('command-input');
    const terminalOutput = document.getElementById('command-output');
    const currentValue = commandInput.value.trim();
    
    if (currentValue) {
        // 查找匹配的命令
        const matches = commandList.filter(cmd => cmd.startsWith(currentValue));
        
        if (matches.length === 1) {
            // 如果只有一个匹配项，直接补全
            commandInput.value = matches[0];
        } else if (matches.length > 1) {
            // 如果有多个匹配项，显示所有可能的命令
            terminalOutput.innerHTML += `<div class="suggestion-message">可能的命令: ${matches.join(', ')}</div>`;
            scrollToTop();
        }
    }
}

// 执行命令
function executeCommand(command) {
    const parts = command.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    // 获取元素引用
    const introduction = document.getElementById('introduction');
    const terminalOutput = document.getElementById('command-output');
    
    // 显示命令输出时隐藏introduction
    if (introduction) introduction.classList.add('hidden');
    if (terminalOutput) terminalOutput.classList.remove('hidden');
    
    // 清空终端输出区域，隐藏欢迎语
    terminalOutput.innerHTML = '';
    
    try {
        if (commands.hasOwnProperty(cmd)) {
            commands[cmd](args);
        } else {
            // 显示未知命令错误
            showErrorMessage(`命令不存在: ${cmd}\n输入 'help' 查看可用命令`);
            // 提供可能的相似命令提示
            suggestSimilarCommands(cmd);
        }
    } catch (error) {
        // 捕获执行过程中的错误
        showErrorMessage(`执行命令时发生错误: ${error.message}`);
        console.error('Command execution error:', error);
    }
}

// 建议相似命令
function suggestSimilarCommands(cmd) {
    const knownCommands = Object.keys(commands);
    const suggestions = knownCommands.filter(c => {
        // 简单的模糊匹配算法
        return c.includes(cmd) || cmd.includes(c) || 
               levenshteinDistance(c, cmd) <= 2;
    }).slice(0, 3);
    
    if (suggestions.length > 0) {
        const terminalOutput = document.getElementById('command-output');
        terminalOutput.innerHTML += `<div class="suggestion-message">你是指: ${suggestions.join(', ')}?</div>`;
        scrollToBottom();
    }
}

// 计算Levenshtein距离（字符串相似度）
function levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    
    const matrix = [];
    
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i-1) === a.charAt(j-1)) {
                matrix[i][j] = matrix[i-1][j-1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i-1][j-1] + 1,  // 替换
                    Math.min(matrix[i][j-1] + 1,  // 插入
                             matrix[i-1][j] + 1)  // 删除
                );
            }
        }
    }
    
    return matrix[b.length][a.length];
}

// 显示错误信息
function showErrorMessage(message) {
    const terminalOutput = document.getElementById('command-output');
    terminalOutput.innerHTML += `<div class="error-message">${message}</div>`;
    scrollToBottom();
}

// 显示加载状态
function showLoading() {
    const terminalOutput = document.getElementById('command-output');
    terminalOutput.innerHTML += `<div class="loading"></div>`;
    scrollToBottom();
}

// 滚动到底部
function scrollToBottom() {
    const terminalOutput = document.getElementById('command-output');
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function scrollToTop() {
    const terminalOutput = document.getElementById('command-output');
    terminalOutput.scrollTop = 0;
}

function scrollOutputBy(delta) {
    const terminalOutput = document.getElementById('command-output');
    terminalOutput.scrollTop = Math.max(0, Math.min(terminalOutput.scrollTop + delta, terminalOutput.scrollHeight));
}

// 继续替换剩余的terminal-output引用

// 命令处理函数

// ls命令 - 显示文章列表
function handleLsCommand(args) {
    // 检查是否有页码参数
    let page = 1;
    if (args.length > 0) {
        const pageArg = parseInt(args[0]);
        if (!isNaN(pageArg) && pageArg > 0) {
            page = pageArg;
        } else {
            showErrorMessage(`无效的页码参数: ${args[0]}`);
            return;
        }
    }
    
    currentPage = page;
    
    showLoading();
    fetch(`/?vibe_api=posts&page=${page}&pageSize=${pageSize}`)
        .then(resp => resp.json())
        .then(json => {
            const terminalOutput = document.getElementById('command-output');
            const lastLoadingIndex = terminalOutput.innerHTML.lastIndexOf('<div class="loading"></div>');
            if (lastLoadingIndex !== -1) {
                terminalOutput.innerHTML = terminalOutput.innerHTML.substring(0, lastLoadingIndex);
            }

            const introduction = document.getElementById('introduction');
            const commandOutput = document.getElementById('command-output');
            if (introduction) introduction.classList.add('hidden');
            if (commandOutput) commandOutput.classList.remove('hidden');

            if (json.code !== 0) {
                showErrorMessage(`获取文章列表失败: ${json.message || '未知错误'}`);
                return;
            }

            const data = json.data || {};
            const posts = data.posts || [];
            currentListPosts = posts;
            totalPosts = data.total || 0;
            const totalPages = data.totalPages || 0;

            if (page > totalPages && totalPages > 0) {
                showErrorMessage(`页码越界。总页数: ${totalPages}`);
                return;
            }

            if (commandOutput) {
                commandOutput.innerHTML = `<div class="list-header">博客文章列表 (第 ${page}/${totalPages} 页)</div><div class="post-list">`;
                posts.forEach((post, index) => {
                    commandOutput.innerHTML += `
                    <div class="post-item" data-id="${post.id}">
                        <div class="post-id">[${index + 1}]</div>
                        <div class="post-info">
                            <div class="post-title" onclick="handleCatCommand(['${index + 1}'])"> ${post.title}</div>
                            <div class="post-meta">发布时间: ${post.date} | 分类: ${post.category || ''} | 评论数: ${post.comments ?? 0}</div>
                            <div class="post-excerpt">${post.excerpt || ''}</div>
                        </div>
                    </div>
                    `;
                });
                commandOutput.innerHTML += `</div>`;
                commandOutput.innerHTML += generatePagination(page, totalPages);
                addPaginationEventListeners();
                scrollToTop();
            }
        })
        .catch(error => {
            showErrorMessage(`获取文章列表时发生错误: ${error.message}`);
            console.error('Error fetching posts:', error);
        });
}

// 生成模拟文章数据

// 生成分页导航
function generatePagination(currentPage, totalPages) {
    let pagination = '<div class="pagination">';
    
    // 添加上一页按钮
    if (currentPage > 1) {
        pagination += `<a href="#" data-page="${currentPage - 1}" class="prev-page">上一页</a>`;
    }
    
    // 添加页码按钮
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    
    if (startPage > 1) {
        pagination += `<a href="#" data-page="1">1</a>`;
        if (startPage > 2) {
            pagination += '<span class="page-ellipsis">...</span>';
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            pagination += `<a href="#" data-page="${i}" class="current-page">${i}</a>`;
        } else {
            pagination += `<a href="#" data-page="${i}">${i}</a>`;
        }
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            pagination += '<span class="page-ellipsis">...</span>';
        }
        pagination += `<a href="#" data-page="${totalPages}">${totalPages}</a>`;
    }
    
    // 添加下一页按钮
    if (currentPage < totalPages) {
        pagination += `<a href="#" data-page="${currentPage + 1}" class="next-page">下一页</a>`;
    }
    
    pagination += '</div>';
    return pagination;
}

// 为分页按钮添加事件监听器
function addPaginationEventListeners() {
    const paginationLinks = document.querySelectorAll('.pagination a');
    
    paginationLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const page = parseInt(this.getAttribute('data-page'));
            if (!isNaN(page)) {
                handleLsCommand([page.toString()]);
            }
        });
    });
}

function addSearchPaginationEventListeners(query) {
    const paginationLinks = document.querySelectorAll('.pagination a');
    paginationLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const page = parseInt(this.getAttribute('data-page'));
            if (!isNaN(page)) {
                handleSearchCommand([query, page.toString()]);
            }
        });
    });
}

// cat命令 - 显示文章内容
function handleCatCommand(args) {
    if (args.length === 0) {
        showErrorMessage('请指定文章ID。例如: cat 1');
        return;
    }
    
    const postId = args[0];
    
    // 验证文章ID是否为有效数字
    if (isNaN(postId) || postId < 1) {
        showErrorMessage('无效的文章ID');
        return;
    }
    
    let cidForFetch = parseInt(postId);
    if (!isNaN(cidForFetch) && cidForFetch >= 1 && cidForFetch <= currentListPosts.length) {
        cidForFetch = parseInt(currentListPosts[cidForFetch - 1]?.id);
    }
    showLoading();
    fetch(`/?vibe_api=post&id=${cidForFetch}`)
        .then(resp => resp.json())
        .then(json => {
            const terminalOutput = document.getElementById('command-output');
            const lastLoadingIndex = terminalOutput.innerHTML.lastIndexOf('<div class="loading"></div>');
            if (lastLoadingIndex !== -1) {
                terminalOutput.innerHTML = terminalOutput.innerHTML.substring(0, lastLoadingIndex);
            }

            const introduction = document.getElementById('introduction');
            const commandOutput = document.getElementById('command-output');
            if (introduction) introduction.classList.add('hidden');
            if (commandOutput) commandOutput.classList.remove('hidden');

            if (json.code !== 0) {
                showErrorMessage(`获取文章内容失败: ${json.message || '未知错误'}`);
                return;
            }

            const post = json.data || {};
            commandOutput.innerHTML = `
            <div class="article-container">
                <div class="article-header">
                    <h1 class="article-title">${post.title}</h1>
                    <div class="article-meta">
                        <span class="article-date">📅 ${post.date}</span>
                        <span class="article-category">🏷 ${post.category || ''}</span>
                    </div>
                </div>
                <div class="article-content">
                    ${post.content || ''}
                </div>
                <div class="article-footer">
                    <div class="article-actions">
                        <button class="back-button" onclick="handleLsCommand(['${currentPage}'])" title="返回列表">← 返回列表</button>
                    </div>
                </div>
            </div>
            `;
            scrollToTop();
        })
        .catch(error => {
            showErrorMessage(`获取文章内容时发生错误: ${error.message}`);
            console.error('Error fetching post content:', error);
        });
}

function handleSearchCommand(args) {
    let page = 1;
    let q = '';
    if (args.length === 0) {
        showErrorMessage('请提供搜索关键词');
        return;
    }
    const last = args[args.length - 1];
    if (!isNaN(parseInt(last))) {
        page = Math.max(1, parseInt(last));
        q = args.slice(0, -1).join(' ').trim();
    } else {
        q = args.join(' ').trim();
    }
    if (!q) {
        showErrorMessage('请提供搜索关键词');
        return;
    }
    currentSearchQuery = q;
    currentPage = page;
    showLoading();
    fetch(`/?vibe_api=search&q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}`)
        .then(resp => resp.json())
        .then(json => {
            const terminalOutput = document.getElementById('command-output');
            const lastLoadingIndex = terminalOutput.innerHTML.lastIndexOf('<div class="loading"></div>');
            if (lastLoadingIndex !== -1) {
                terminalOutput.innerHTML = terminalOutput.innerHTML.substring(0, lastLoadingIndex);
            }
            const introduction = document.getElementById('introduction');
            const commandOutput = document.getElementById('command-output');
            if (introduction) introduction.classList.add('hidden');
            if (commandOutput) commandOutput.classList.remove('hidden');
            if (json.code !== 0) {
                showErrorMessage(`搜索失败: ${json.message || '未知错误'}`);
                return;
            }
            const data = json.data || {};
            const posts = data.posts || [];
            currentListPosts = posts;
            totalPosts = data.total || 0;
            const totalPages = data.totalPages || 0;
            if (page > totalPages && totalPages > 0) {
                showErrorMessage(`页码越界。总页数: ${totalPages}`);
                return;
            }
            if (commandOutput) {
                commandOutput.innerHTML = `<div class="list-header">搜索结果: ${q} (第 ${page}/${totalPages} 页)</div><div class="post-list">`;
                posts.forEach((post, index) => {
                    commandOutput.innerHTML += `
                    <div class="post-item" data-id="${post.id}">
                        <div class="post-id">[${post.id}]</div>
                        <div class="post-info">
                            <div class="post-title" onclick="handleCatCommand(['${index + 1}'])">[${index + 1}] ${post.title}</div>
                            <div class="post-meta">发布时间: ${post.date} | 分类: ${post.category || ''} | 评论数: ${post.comments ?? 0}</div>
                            <div class="post-excerpt">${post.excerpt || ''}</div>
                        </div>
                    </div>
                    `;
                });
                commandOutput.innerHTML += `</div>`;
                commandOutput.innerHTML += generatePagination(page, totalPages);
                addSearchPaginationEventListeners(q);
                scrollToTop();
            }
        })
        .catch(error => {
            showErrorMessage(`搜索时发生错误: ${error.message}`);
            console.error('Error searching posts:', error);
        });
}

function handleTagsCommand(args) {
    let page = 1;
    if (args.length > 0) {
        const p = parseInt(args[0]);
        if (!isNaN(p) && p > 0) page = p;
    }
    currentPage = page;
    showLoading();
    fetch(`/?vibe_api=tags&page=${page}&pageSize=${pageSize}`)
        .then(resp => resp.json())
        .then(json => {
            const terminalOutput = document.getElementById('command-output');
            const lastLoadingIndex = terminalOutput.innerHTML.lastIndexOf('<div class="loading"></div>');
            if (lastLoadingIndex !== -1) {
                terminalOutput.innerHTML = terminalOutput.innerHTML.substring(0, lastLoadingIndex);
            }
            const introduction = document.getElementById('introduction');
            const commandOutput = document.getElementById('command-output');
            if (introduction) introduction.classList.add('hidden');
            if (commandOutput) commandOutput.classList.remove('hidden');
            if (json.code !== 0) {
                showErrorMessage(`获取标签失败: ${json.message || '未知错误'}`);
                return;
            }
            const data = json.data || {};
            const tags = data.tags || [];
            const totalPages = data.totalPages || 0;
            if (page > totalPages && totalPages > 0) {
                showErrorMessage(`页码越界。总页数: ${totalPages}`);
                return;
            }
            if (commandOutput) {
                commandOutput.innerHTML = `<div class="list-header">标签列表 (第 ${page}/${totalPages} 页)</div><div class="post-list">`;
                tags.forEach(tag => {
                    commandOutput.innerHTML += `
                    <div class="post-item">
                        <div class="post-info">
                            <div class="post-title">${tag.name}</div>
                            <div class="post-meta">文章数: ${tag.count}</div>
                        </div>
                    </div>
                    `;
                });
                commandOutput.innerHTML += `</div>`;
                commandOutput.innerHTML += generatePagination(page, totalPages);
                addPaginationEventListeners();
                scrollToTop();
            }
        })
        .catch(error => {
            showErrorMessage(`获取标签时发生错误: ${error.message}`);
            console.error('Error fetching tags:', error);
        });
}

function handleCategoriesCommand(args) {
    let page = 1;
    if (args.length > 0) {
        const p = parseInt(args[0]);
        if (!isNaN(p) && p > 0) page = p;
    }
    currentPage = page;
    showLoading();
    fetch(`/?vibe_api=categories&page=${page}&pageSize=${pageSize}`)
        .then(resp => resp.json())
        .then(json => {
            const terminalOutput = document.getElementById('command-output');
            const lastLoadingIndex = terminalOutput.innerHTML.lastIndexOf('<div class="loading"></div>');
            if (lastLoadingIndex !== -1) {
                terminalOutput.innerHTML = terminalOutput.innerHTML.substring(0, lastLoadingIndex);
            }
            const introduction = document.getElementById('introduction');
            const commandOutput = document.getElementById('command-output');
            if (introduction) introduction.classList.add('hidden');
            if (commandOutput) commandOutput.classList.remove('hidden');
            if (json.code !== 0) {
                showErrorMessage(`获取分类失败: ${json.message || '未知错误'}`);
                return;
            }
            const data = json.data || {};
            const categories = data.categories || [];
            const totalPages = data.totalPages || 0;
            if (page > totalPages && totalPages > 0) {
                showErrorMessage(`页码越界。总页数: ${totalPages}`);
                return;
            }
            if (commandOutput) {
                commandOutput.innerHTML = `<div class="list-header">分类列表 (第 ${page}/${totalPages} 页)</div><div class="post-list">`;
                categories.forEach(cat => {
                    commandOutput.innerHTML += `
                    <div class="post-item">
                        <div class="post-info">
                            <div class="post-title" onclick="handleCategoryOpen('${cat.mid}','${cat.name}')">${cat.name}</div>
                            <div class="post-meta">文章数: ${cat.count}</div>
                        </div>
                    </div>
                    `;
                });
                commandOutput.innerHTML += `</div>`;
                commandOutput.innerHTML += generatePagination(page, totalPages);
                addPaginationEventListeners();
                scrollToTop();
            }
        })
        .catch(error => {
            showErrorMessage(`获取分类时发生错误: ${error.message}`);
            console.error('Error fetching categories:', error);
        });
}

function handleCategoryOpen(mid, name, page = 1) {
    currentPage = page;
    showLoading();
    fetch(`/?vibe_api=category_posts&mid=${encodeURIComponent(mid)}&page=${page}&pageSize=${pageSize}`)
        .then(resp => resp.json())
        .then(json => {
            const terminalOutput = document.getElementById('command-output');
            const lastLoadingIndex = terminalOutput.innerHTML.lastIndexOf('<div class=\"loading\"></div>');
            if (lastLoadingIndex !== -1) {
                terminalOutput.innerHTML = terminalOutput.innerHTML.substring(0, lastLoadingIndex);
            }
            const introduction = document.getElementById('introduction');
            const commandOutput = document.getElementById('command-output');
            if (introduction) introduction.classList.add('hidden');
            if (commandOutput) commandOutput.classList.remove('hidden');
            if (json.code !== 0) {
                showErrorMessage(`获取分类文章失败: ${json.message || '未知错误'}`);
                return;
            }
            const data = json.data || {};
            const posts = data.posts || [];
            currentListPosts = posts;
            totalPosts = data.total || 0;
            const totalPages = data.totalPages || 0;
            if (page > totalPages && totalPages > 0) {
                showErrorMessage(`页码越界。总页数: ${totalPages}`);
                return;
            }
            if (commandOutput) {
                commandOutput.innerHTML = `<div class=\"list-header\">分类: ${name} 文章列表 (第 ${page}/${totalPages} 页)</div><div class=\"post-list\">`;
                posts.forEach((post, index) => {
                    commandOutput.innerHTML += `
                    <div class=\"post-item\" data-id=\"${post.id}\">\n
                        <div class=\"post-id\">[${post.id}]</div>
                        <div class=\"post-info\">
                            <div class=\"post-title\" onclick=\"handleCatCommand(['${index + 1}'])\">[${index + 1}] ${post.title}</div>
                            <div class=\"post-meta\">发布时间: ${post.date} | 分类: ${post.category || ''} | 评论数: ${post.comments ?? 0}</div>
                            <div class=\"post-excerpt\">${post.excerpt || ''}</div>
                        </div>
                    </div>
                    `;
                });
                commandOutput.innerHTML += `</div>`;
                commandOutput.innerHTML += generatePagination(page, totalPages);
                addCategoryPaginationEventListeners(mid, name);
                scrollToTop();
            }
        })
        .catch(error => {
            showErrorMessage(`获取分类文章时发生错误: ${error.message}`);
            console.error('Error fetching category posts:', error);
        });
}

function addCategoryPaginationEventListeners(mid, name) {
    const paginationLinks = document.querySelectorAll('.pagination a');
    paginationLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const page = parseInt(this.getAttribute('data-page'));
            if (!isNaN(page)) {
                handleCategoryOpen(mid, name, page);
            }
        });
    });
}

function handleArchivesCommand() {
    showLoading();
    fetch(`/?vibe_api=archives`)
        .then(resp => resp.json())
        .then(json => {
            const terminalOutput = document.getElementById('command-output');
            const lastLoadingIndex = terminalOutput.innerHTML.lastIndexOf('<div class="loading"></div>');
            if (lastLoadingIndex !== -1) {
                terminalOutput.innerHTML = terminalOutput.innerHTML.substring(0, lastLoadingIndex);
            }
            const introduction = document.getElementById('introduction');
            const commandOutput = document.getElementById('command-output');
            if (introduction) introduction.classList.add('hidden');
            if (commandOutput) commandOutput.classList.remove('hidden');
            if (json.code !== 0) {
                showErrorMessage(`获取归档失败: ${json.message || '未知错误'}`);
                return;
            }
            const data = json.data || {};
            const archives = data.archives || [];
            let html = '<div class="archive-tree">';
            html += '<div class="tree-root">归档</div>';
            archives.forEach(item => {
                const ym = `${item.year}-${String(item.month).padStart(2, '0')}`;
                html += `<div class="tree-item"><span class="tree-prefix">├──</span><span class="month-label">${ym}</span> <span class="month-count">(${item.count})</span></div>`;
            });
            html += '</div>';
            commandOutput.innerHTML = html;
            scrollToTop();
        })
        .catch(error => {
            showErrorMessage(`获取归档时发生错误: ${error.message}`);
            console.error('Error fetching archives:', error);
        });
}

function handleStatsCommand() {
    showLoading();
    fetch(`/?vibe_api=stats`)
        .then(resp => resp.json())
        .then(json => {
            const terminalOutput = document.getElementById('command-output');
            const lastLoadingIndex = terminalOutput.innerHTML.lastIndexOf('<div class="loading"></div>');
            if (lastLoadingIndex !== -1) {
                terminalOutput.innerHTML = terminalOutput.innerHTML.substring(0, lastLoadingIndex);
            }
            const introduction = document.getElementById('introduction');
            const commandOutput = document.getElementById('command-output');
            if (introduction) introduction.classList.add('hidden');
            if (commandOutput) commandOutput.classList.remove('hidden');
            if (json.code !== 0) {
                showErrorMessage(`获取统计失败: ${json.message || '未知错误'}`);
                return;
            }
            const data = json.data || {};
            commandOutput.innerHTML = `
            <div class="about-container">
                <div class="about-content">
                    <h3>站点统计</h3>
                    <div class="tech-stack">
                        <div class="tech-item">文章: ${data.postsTotal || 0}</div>
                        <div class="tech-item">评论: ${data.commentsTotal || 0}</div>
                        <div class="tech-item">分类: ${data.categoriesTotal || 0}</div>
                        <div class="tech-item">标签: ${data.tagsTotal || 0}</div>
                    </div>
                </div>
                <div class="about-footer">
                    <button class="back-button" onclick="handleHomeCommand()" title="返回首页">← 返回首页</button>
                </div>
            </div>`;
            scrollToTop();
        })
        .catch(error => {
            showErrorMessage(`获取统计时发生错误: ${error.message}`);
            console.error('Error fetching stats:', error);
        });
}

// 生成模拟文章内容

// about命令 - 显示关于信息
function handleAboutCommand() {
    // 显示加载状态
    showLoading();
    
    // 模拟API调用延迟
    setTimeout(() => {
        try {
            const terminalOutput = document.getElementById('command-output');
            const lastLoadingIndex = terminalOutput.innerHTML.lastIndexOf('<div class="loading"></div>');
            
            if (lastLoadingIndex !== -1) {
                terminalOutput.innerHTML = terminalOutput.innerHTML.substring(0, lastLoadingIndex);
            }
            
            // 隐藏介绍页面，显示命令输出区域
            const introduction = document.getElementById('introduction');
            const commandOutput = document.getElementById('command-output');
            
            if (introduction) introduction.classList.add('hidden');
            if (commandOutput) commandOutput.classList.remove('hidden');
            
            // 显示关于信息
            commandOutput.innerHTML = `
            <div class="about-container">
                <div class="about-header">
                    <h1>关于博主</h1>
                </div>
                <div class="about-content">
                    <p>欢迎访问我的个人博客！我是一名热爱编程的开发者，喜欢分享技术心得和学习感悟。</p>
                    <h3>技术栈</h3>
                    <div class="tech-stack">
                        <div class="tech-item">Java/Python</div>
                        <div class="tech-item">Git</div>
                        <div class="tech-item">Elasticsearch</div>
                        <div class="tech-item">SQL</div>
                        <div class="tech-item">Spark</div>
                    </div>
                    <h3>兴趣爱好</h3>
                    <ul>
                        <li>💻 编程和学习新技术</li>
                        <li>📚 阅读技术书籍</li>
                        <li>🎮 LOL</li>
                        <li>🎵 听音乐</li>
                        <li>🏃 运动</li>
                    </ul>
                    <h3>联系方式</h3>
                    <div class="contact-info">
                        <p>📧 Email: <a href="mailto:hi@qixin.ch">hi@qixin.ch</a></p>
                        <p>🐙 GitHub: <a href="https://github.com/KysonGeek" target="_blank" rel="noopener noreferrer">github.com/KysonGeek</a></p>
                        <p>🔗 个人网站: <a href="https://qixin.ch" target="_blank" rel="noopener noreferrer">qixin.ch</a></p>
                    </div>
                </div>
                <div class="about-footer">
                    <button class="back-button" onclick="handleHomeCommand()" title="返回首页">← 返回首页</button>
                </div>
            </div>
            `;
            
            scrollToBottom();
        } catch (error) {
            showErrorMessage(`获取关于信息时发生错误: ${error.message}`);
            console.error('Error fetching about info:', error);
        }
    }, 500);
}

// home命令 - 返回首页
function handleHomeCommand() {
    // 隐藏命令输出区域，显示介绍页面
    const introduction = document.getElementById('introduction');
    const commandOutput = document.getElementById('command-output');
    
    if (introduction) introduction.classList.remove('hidden');
    if (commandOutput) commandOutput.classList.add('hidden');
    
    // 清空命令输出内容
    if (commandOutput) commandOutput.innerHTML = '';
}

// tree命令 - 显示博客结构
function handleTreeCommand() {
    showLoading();
    fetch(`/?vibe_api=tree`)
        .then(resp => resp.json())
        .then(json => {
            const terminalOutput = document.getElementById('command-output');
            const lastLoadingIndex = terminalOutput.innerHTML.lastIndexOf('<div class="loading"></div>');
            if (lastLoadingIndex !== -1) {
                terminalOutput.innerHTML = terminalOutput.innerHTML.substring(0, lastLoadingIndex);
            }

            const introduction = document.getElementById('introduction');
            const commandOutput = document.getElementById('command-output');
            if (introduction) introduction.classList.add('hidden');
            if (commandOutput) commandOutput.classList.remove('hidden');

            if (json.code !== 0) {
                showErrorMessage(`获取博客结构失败: ${json.message || '未知错误'}`);
                return;
            }

            const data = json.data || {};
            const flat = data.tree || [];
            const postsTotal = data.postsTotal || 0;
            const rootCount = data.rootCount || 0;
            const subCount = data.subCount || 0;

            let contentHtml = '<div class="tree-container">';
            contentHtml += '<div class="tree-header">博客结构</div>';
            contentHtml += '<div class="tree-content">';
            contentHtml += '<div class="tree-item">/</div>';
            flat.forEach(node => {
                const indent = '&nbsp;&nbsp;'.repeat(node.depth + 1);
                contentHtml += `<div class="tree-item">${indent}├── ${node.name} <span class="tree-count">(${node.count})</span></div>`;
            });
            contentHtml += '</div>';
            contentHtml += `<div class="tree-footer"><p>共有 <strong>${rootCount}</strong> 个主要分类，<strong>${subCount}</strong> 个子分类，<strong>${postsTotal}</strong> 篇文章。</p><button class="back-button" onclick="handleHomeCommand()" title="返回首页">← 返回首页</button></div>`;
            contentHtml += '</div>';
            commandOutput.innerHTML = contentHtml;
            scrollToBottom();
        })
        .catch(error => {
            showErrorMessage(`获取博客结构时发生错误: ${error.message}`);
            console.error('Error fetching blog structure:', error);
        });
}

// help命令 - 显示帮助信息
function handleHelpCommand() {
    // 显示帮助信息
    const terminalOutput = document.getElementById('command-output');
    
    // 隐藏介绍页面，显示命令输出区域
    const introduction = document.getElementById('introduction');
    const commandOutput = document.getElementById('command-output');
    
    if (introduction) introduction.classList.add('hidden');
    if (commandOutput) commandOutput.classList.remove('hidden');
    
    terminalOutput.innerHTML = `
    <style>
    .command-table {
        width: 50%;
        table-layout: fixed;
    }
    .command-table th,
    .command-table td {
        width: 33%;
        text-align: left;
        padding: 8px;
    }
    </style>
    <div class="help-container">
        <div class="help-header">
            <h1>命令帮助</h1>
        </div>
        <div class="help-content">
            <div class="command-help">
                <h2>基本命令</h2>
                <table class="command-table">
                <colgroup>
                    <col style="width: 20%;">
                    <col style="width: 50%;">
                    <col style="width: 30%;">
                </colgroup>
                    <tr>
                        <th>命令</th>
                        <th>描述</th>
                        <th>示例</th>
                    </tr>
                    <tr>
                        <td>ls</td>
                        <td>列出博客文章，可指定页码</td>
                        <td><code>ls</code> 或 <code>ls 2</code></td>
                    </tr>
                    <tr>
                        <td>cat</td>
                        <td>查看文章内容</td>
                        <td><code>cat 1</code></td>
                    </tr>
                    <tr>
                        <td>about</td>
                        <td>查看关于博主信息</td>
                        <td><code>about</code></td>
                    </tr>
                    <tr>
                        <td>home</td>
                        <td>返回首页</td>
                        <td><code>home</code></td>
                    </tr>
                    <tr>
                        <td>tree</td>
                        <td>显示博客分类结构</td>
                        <td><code>tree</code></td>
                    </tr>
                    <tr>
                        <td>tags</td>
                        <td>列出标签，支持分页</td>
                        <td><code>tags</code> 或 <code>tags 2</code></td>
                    </tr>
                    <tr>
                        <td>categories</td>
                        <td>列出分类，支持分页</td>
                        <td><code>categories</code> 或 <code>categories 2</code></td>
                    </tr>
                    <tr>
                        <td>archives</td>
                        <td>按年月显示归档统计</td>
                        <td><code>archives</code></td>
                    </tr>
                    <tr>
                        <td>stats</td>
                        <td>显示站点统计信息</td>
                        <td><code>stats</code></td>
                    </tr>
                    <tr>
                        <td>search</td>
                        <td>搜索文章标题</td>
                        <td><code>search xx</code></td>
                    </tr>
                    <tr>
                        <td>help</td>
                        <td>显示帮助信息</td>
                        <td><code>help</code></td>
                    </tr>
                </table>
            </div>
            <div class="navigation-tips">
                <h2>导航技巧</h2>
                <ul>
                    <li>使用 <kbd>j</kbd> <kbd>k</kbd> 控制列表滚动；在输入框中使用 <kbd>↑</kbd>/<kbd>↓</kbd> 浏览命令历史</li>
                    <li>按 <kbd>Esc</kbd> 使命令行失焦，然后使用 <kbd>j</kbd>/<kbd>k</kbd> 滚动内容</li>
                    <li>使用 <kbd>Tab</kbd> 键自动补全命令</li>
                    <li>点击文章标题可以直接查看文章内容</li>
                    <li>分页按钮可以浏览更多文章</li>
                </ul>
            </div>
        </div>
        <div class="help-footer">
            <button class="back-button" onclick="handleHomeCommand()" title="返回首页">← 返回首页</button>
        </div>
    </div>
    `;
    
    scrollToBottom();
}

// 设置光标效果
function setupCursor(commandInput) {
    // 确保光标始终可见并使用CSS动画实现闪烁效果
    commandInput.classList.add('cursor-blink');
}

// 页面加载完成后初始化
function setupGlobalShortcuts() {
    document.addEventListener('keydown', function(event) {
        const t = event.target;
        const editable = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
        const input = document.getElementById('command-input');
        const output = document.getElementById('command-output');

        if (editable) {
            if (String(event.key) === 'Escape' && t === input) {
                input.blur();
                event.preventDefault();
            }
            return;
        }

        if (!event.ctrlKey && !event.altKey && !event.metaKey && String(event.key).toLowerCase() === 'i') {
            if (input) {
                input.focus();
                event.preventDefault();
            }
            return;
        }

        if (String(event.key).toLowerCase() === 'k') {
            if (output) {
                scrollOutputBy(-Math.max(output.clientHeight * 0.8, 200));
                event.preventDefault();
            }
            return;
        }
        if (String(event.key).toLowerCase() === 'j') {
            if (output) {
                scrollOutputBy(Math.max(output.clientHeight * 0.8, 200));
                event.preventDefault();
            }
            return;
        }
    });
}

window.addEventListener('DOMContentLoaded', init);
