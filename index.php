<?php
/**
 * Vib Coding Theme - Typecho博客主题
 * 
 * 采用vib coding风格，纯黑色背景，底部命令行交互界面
 * 
 * @package Vib Coding Theme
 * @author Vib
 * @version 1.0.0
 * @link https://vibcoding.com
 */

if (!defined('__TYPECHO_ROOT_DIR__')) exit;
if (isset($_GET['vib_api'])) {
    header('Content-Type: application/json; charset=UTF-8');
    $action = isset($_GET['vib_api']) ? $_GET['vib_api'] : '';
    $pageSize = isset($_GET['pageSize']) ? max(1, intval($_GET['pageSize'])) : 10;
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;

    try {
        $db = Typecho_Db::get();
        $prefix = $db->getPrefix();

        if ($action === 'posts') {
            $countRow = $db->fetchRow(
                $db->select('COUNT(*) AS count')
                   ->from($prefix . 'contents')
                   ->where('type = ?', 'post')
                   ->where('status = ?', 'publish')
                   ->where('created <= ?', time())
            );
            $total = intval($countRow['count']);

            $rows = $db->fetchAll(
                $db->select()
                   ->from($prefix . 'contents')
                   ->where('type = ?', 'post')
                   ->where('status = ?', 'publish')
                   ->where('created <= ?', time())
                   ->order('created', Typecho_Db::SORT_DESC)
                   ->page($page, $pageSize)
            );

            $result = [];
            foreach ($rows as $row) {
                $cid = intval($row['cid']);
                $catRow = $db->fetchRow(
                    $db->select($prefix . 'metas.name')
                       ->from($prefix . 'relationships')
                       ->join($prefix . 'metas', $prefix . 'metas.mid = ' . $prefix . 'relationships.mid')
                       ->where($prefix . 'relationships.cid = ?', $cid)
                       ->where($prefix . 'metas.type = ?', 'category')
                       ->limit(1)
                );
                $category = $catRow ? $catRow['name'] : '';
                $plain = trim(strip_tags($row['text']));
                $excerpt = function_exists('mb_substr') ? mb_substr($plain, 0, 120, 'UTF-8') : substr($plain, 0, 120);
                $date = date('Y-m-d', $row['created']);
                $result[] = [
                    'id' => $cid,
                    'title' => $row['title'],
                    'date' => $date,
                    'category' => $category,
                    'comments' => intval($row['commentsNum']),
                    'views' => 0,
                    'likes' => 0,
                    'excerpt' => $excerpt
                ];
            }

            echo json_encode([
                'code' => 0,
                'data' => [
                    'posts' => $result,
                    'page' => $page,
                    'pageSize' => $pageSize,
                    'total' => $total,
                    'totalPages' => $pageSize > 0 ? intval(ceil($total / $pageSize)) : 0
                ]
            ]);
            exit;
        } elseif ($action === 'post') {
            $cid = isset($_GET['id']) ? intval($_GET['id']) : 0;
            if ($cid <= 0) {
                echo json_encode(['code' => 1, 'message' => 'invalid id']);
                exit;
            }

            $row = $db->fetchRow(
                $db->select()
                   ->from($prefix . 'contents')
                   ->where('cid = ?', $cid)
                   ->where('type = ?', 'post')
                   ->where('status = ?', 'publish')
                   ->limit(1)
            );
            if (!$row) {
                echo json_encode(['code' => 1, 'message' => 'post not found']);
                exit;
            }

            $postWidget = $this->widget('Widget_Archive@single-' . $cid, 'type=single', array('cid' => $cid));
            ob_start();
            $postWidget->title();
            $titleText = ob_get_clean();
            ob_start();
            $postWidget->content();
            $contentHtml = ob_get_clean();
            ob_start();
            $postWidget->date('Y-m-d');
            $dateText = ob_get_clean();

            $catRow = $db->fetchRow(
                $db->select($prefix . 'metas.name')
                   ->from($prefix . 'relationships')
                   ->join($prefix . 'metas', $prefix . 'metas.mid = ' . $prefix . 'relationships.mid')
                   ->where($prefix . 'relationships.cid = ?', $cid)
                   ->where($prefix . 'metas.type = ?', 'category')
                   ->limit(1)
            );
            $category = $catRow ? $catRow['name'] : '';
            $date = $dateText;

            echo json_encode([
                'code' => 0,
                'data' => [
                    'id' => $cid,
                    'title' => $titleText,
                    'date' => $date,
                    'category' => $category,
                    'comments' => intval($row['commentsNum']),
                    'views' => 0,
                    'likes' => 0,
                    'content' => $contentHtml
                ]
            ]);
            exit;
        } else {
            echo json_encode(['code' => 1, 'message' => 'unknown action']);
            exit;
        }
    } catch (Exception $e) {
        echo json_encode(['code' => 1, 'message' => $e->getMessage()]);
        exit;
    }
}
?>

<!DOCTYPE html>
<html>
<head>
    <meta charset="<?php $this->options->charset(); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <style>
        /* 确保移动设备上没有底部安全区域留白 */
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
            #terminal {
                padding-bottom: env(safe-area-inset-bottom);
            }
        }
    </style>
    <title><?php $this->options->title(); ?><?php $this->archiveTitle(); ?></title>
    <link rel="stylesheet" href="<?php $this->options->themeUrl('style.css'); ?>">
    <?php $this->header(); ?>
</head>
<body>
    <div id="main">
        <div id="content">
            <!-- 主内容区域 -->
            <div id="introduction">
                <div class="intro-container">
                    <div class="code-brackets">
                        <span class="bracket">{</span>
                    </div>
                    <div class="intro-content">
                        <h1 class="typewriter">Welcome to Vib Coding Theme</h1>
                        <p>A terminal-styled Typecho blog theme with command line interface</p>
                        <p class="sub-title">输入 <span class="command">help</span> 开始探索</p>
                        <div class="dynamic-text"></div>
                    </div>
                    <div class="code-brackets">
                        <span class="bracket">}</span>
                    </div>
                </div>
            </div>
            
            <div id="command-output" class="terminal-content">
                <!-- 命令输出和终端交互信息将显示在这里 -->
            </div>
        </div>
    </div>
    
    <!-- 底部命令行界面 -->
    <div id="terminal" style="position: fixed; bottom: 0; left: 0; right: 0; margin: 0; padding: 0; z-index: 9999; width: 100%;">
        <div class="terminal-input-container">
            <span class="prompt">vib-coding@blog:~$ </span>
            <input type="text" id="command-input" autocomplete="off" spellcheck="false" autofocus placeholder="输入命令...">
        </div>
        <div class="terminal-footer">
            <span class="terminal-hint">提示: 输入 help 查看可用命令 | 使用上下箭头浏览历史命令</span>
        </div>
    </div>
    
    <script src="<?php $this->options->themeUrl('script.js'); ?>"></script>
    <?php $this->footer(); ?>
</body>
</html>
