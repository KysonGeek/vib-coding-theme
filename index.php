<?php
/**
 * Vib Coding Theme - Typecho博客主题
 * 
 * 采用vib coding风格，纯黑色背景，底部命令行交互界面
 * 
 * @package Vib Coding Theme
 * @author Kyson
 * @version 1.0.0
 * @link https://blog.qixin.ch
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
        } elseif ($action === 'tree') {
            $countRow = $db->fetchRow(
                $db->select('COUNT(*) AS count')
                   ->from($prefix . 'contents')
                   ->where('type = ?', 'post')
                   ->where('status = ?', 'publish')
                   ->where('created <= ?', time())
            );
            $postsTotal = intval($countRow['count']);

            $cats = $db->fetchAll(
                $db->select('mid', 'name', 'parent', 'count')
                   ->from($prefix . 'metas')
                   ->where('type = ?', 'category')
                   ->order('order', Typecho_Db::SORT_ASC)
            );

            $byParent = [];
            foreach ($cats as $c) {
                $p = intval($c['parent']);
                if (!isset($byParent[$p])) $byParent[$p] = [];
                $byParent[$p][] = [
                    'mid' => intval($c['mid']),
                    'name' => $c['name'],
                    'parent' => $p,
                    'count' => intval($c['count'])
                ];
            }

            $flat = [];
            $stack = [[0, 0]];
            while (!empty($stack)) {
                [$parentId, $depth] = array_pop($stack);
                if (!isset($byParent[$parentId])) continue;
                $children = $byParent[$parentId];
                for ($i = count($children) - 1; $i >= 0; $i--) {
                    $cat = $children[$i];
                    $flat[] = [
                        'mid' => $cat['mid'],
                        'name' => $cat['name'],
                        'count' => $cat['count'],
                        'depth' => $depth
                    ];
                    $stack[] = [$cat['mid'], $depth + 1];
                }
            }

            $rootCount = isset($byParent[0]) ? count($byParent[0]) : 0;
            $categoriesTotal = count($cats);
            $subCount = $categoriesTotal - $rootCount;

            echo json_encode([
                'code' => 0,
                'data' => [
                    'tree' => $flat,
                    'rootCount' => $rootCount,
                    'subCount' => $subCount,
                    'categoriesTotal' => $categoriesTotal,
                    'postsTotal' => $postsTotal
                ]
            ]);
            exit;
        } elseif ($action === 'search') {
            $q = isset($_GET['q']) ? trim($_GET['q']) : '';
            if ($q === '') {
                echo json_encode(['code' => 1, 'message' => 'empty query']);
                exit;
            }

            $countRow = $db->fetchRow(
                $db->select('COUNT(*) AS count')
                   ->from($prefix . 'contents')
                   ->where('type = ?', 'post')
                   ->where('status = ?', 'publish')
                   ->where('created <= ?', time())
                   ->where('(title LIKE ? OR text LIKE ?)', '%' . $q . '%', '%' . $q . '%')
            );
            $total = intval($countRow['count']);

            $rows = $db->fetchAll(
                $db->select()
                   ->from($prefix . 'contents')
                   ->where('type = ?', 'post')
                   ->where('status = ?', 'publish')
                   ->where('created <= ?', time())
                   ->where('(title LIKE ? OR text LIKE ?)', '%' . $q . '%', '%' . $q . '%')
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
                    'totalPages' => $pageSize > 0 ? intval(ceil($total / $pageSize)) : 0,
                    'query' => $q
                ]
            ]);
            exit;
        } elseif ($action === 'tags') {
            $countRow = $db->fetchRow(
                $db->select('COUNT(*) AS count')
                   ->from($prefix . 'metas')
                   ->where('type = ?', 'tag')
            );
            $total = intval($countRow['count']);

            $rows = $db->fetchAll(
                $db->select('mid', 'name', 'count')
                   ->from($prefix . 'metas')
                   ->where('type = ?', 'tag')
                   ->order('count', Typecho_Db::SORT_DESC)
                   ->page($page, $pageSize)
            );

            $list = [];
            foreach ($rows as $row) {
                $list[] = [
                    'mid' => intval($row['mid']),
                    'name' => $row['name'],
                    'count' => intval($row['count'])
                ];
            }

            echo json_encode([
                'code' => 0,
                'data' => [
                    'tags' => $list,
                    'page' => $page,
                    'pageSize' => $pageSize,
                    'total' => $total,
                    'totalPages' => $pageSize > 0 ? intval(ceil($total / $pageSize)) : 0
                ]
            ]);
            exit;
        } elseif ($action === 'categories') {
            $countRow = $db->fetchRow(
                $db->select('COUNT(*) AS count')
                   ->from($prefix . 'metas')
                   ->where('type = ?', 'category')
            );
            $total = intval($countRow['count']);

            $rows = $db->fetchAll(
                $db->select('mid', 'name', 'parent', 'count')
                   ->from($prefix . 'metas')
                   ->where('type = ?', 'category')
                   ->order('order', Typecho_Db::SORT_ASC)
                   ->page($page, $pageSize)
            );

            $list = [];
            foreach ($rows as $row) {
                $list[] = [
                    'mid' => intval($row['mid']),
                    'name' => $row['name'],
                    'parent' => intval($row['parent']),
                    'count' => intval($row['count'])
                ];
            }

            echo json_encode([
                'code' => 0,
                'data' => [
                    'categories' => $list,
                    'page' => $page,
                    'pageSize' => $pageSize,
                    'total' => $total,
                    'totalPages' => $pageSize > 0 ? intval(ceil($total / $pageSize)) : 0
                ]
            ]);
            exit;
        } elseif ($action === 'archives') {
            $rows = $db->fetchAll(
                $db->select('cid', 'created')
                   ->from($prefix . 'contents')
                   ->where('type = ?', 'post')
                   ->where('status = ?', 'publish')
                   ->where('created <= ?', time())
                   ->order('created', Typecho_Db::SORT_DESC)
            );
            $map = [];
            foreach ($rows as $row) {
                $y = date('Y', $row['created']);
                $m = date('m', $row['created']);
                $key = $y . '-' . $m;
                if (!isset($map[$key])) $map[$key] = 0;
                $map[$key]++;
            }
            krsort($map);
            $list = [];
            foreach ($map as $ym => $cnt) {
                $parts = explode('-', $ym);
                $list[] = [
                    'year' => intval($parts[0]),
                    'month' => intval($parts[1]),
                    'count' => $cnt
                ];
            }
            echo json_encode(['code' => 0, 'data' => ['archives' => $list]]);
            exit;
        } elseif ($action === 'stats') {
            $posts = $db->fetchRow(
                $db->select('COUNT(*) AS count')
                   ->from($prefix . 'contents')
                   ->where('type = ?', 'post')
                   ->where('status = ?', 'publish')
                   ->where('created <= ?', time())
            );
            $comments = $db->fetchRow(
                $db->select('COUNT(*) AS count')
                   ->from($prefix . 'comments')
                   ->where('status = ?', 'approved')
            );
            $cats = $db->fetchRow(
                $db->select('COUNT(*) AS count')
                   ->from($prefix . 'metas')
                   ->where('type = ?', 'category')
            );
            $tags = $db->fetchRow(
                $db->select('COUNT(*) AS count')
                   ->from($prefix . 'metas')
                   ->where('type = ?', 'tag')
            );
            echo json_encode([
                'code' => 0,
                'data' => [
                    'postsTotal' => intval($posts['count']),
                    'commentsTotal' => intval($comments['count']),
                    'categoriesTotal' => intval($cats['count']),
                    'tagsTotal' => intval($tags['count'])
                ]
            ]);
            exit;
        } elseif ($action === 'category_posts') {
            $mid = isset($_GET['mid']) ? intval($_GET['mid']) : 0;
            $catName = isset($_GET['name']) ? trim($_GET['name']) : '';
            if ($mid <= 0 && $catName !== '') {
                $metaRow = $db->fetchRow(
                    $db->select('mid')
                       ->from($prefix . 'metas')
                       ->where('type = ?', 'category')
                       ->where('name = ?', $catName)
                       ->limit(1)
                );
                if ($metaRow) {
                    $mid = intval($metaRow['mid']);
                }
            }
            if ($mid <= 0) {
                echo json_encode(['code' => 1, 'message' => 'invalid category']);
                exit;
            }

            $countRow = $db->fetchRow(
                $db->select('COUNT(*) AS count')
                   ->from($prefix . 'relationships')
                   ->where('mid = ?', $mid)
            );
            $total = intval($countRow['count']);

            $rows = $db->fetchAll(
                $db->select($prefix . 'contents.*')
                   ->from($prefix . 'relationships')
                   ->join($prefix . 'contents', $prefix . 'contents.cid = ' . $prefix . 'relationships.cid')
                   ->where($prefix . 'relationships.mid = ?', $mid)
                   ->where($prefix . 'contents.type = ?', 'post')
                   ->where($prefix . 'contents.status = ?', 'publish')
                   ->where($prefix . 'contents.created <= ?', time())
                   ->order($prefix . 'contents.created', Typecho_Db::SORT_DESC)
                   ->page($page, $pageSize)
            );

            $result = [];
            foreach ($rows as $row) {
                $cid = intval($row['cid']);
                $plain = trim(strip_tags($row['text']));
                $excerpt = function_exists('mb_substr') ? mb_substr($plain, 0, 120, 'UTF-8') : substr($plain, 0, 120);
                $date = date('Y-m-d', $row['created']);
                $catRow = $db->fetchRow(
                    $db->select($prefix . 'metas.name')
                       ->from($prefix . 'relationships')
                       ->join($prefix . 'metas', $prefix . 'metas.mid = ' . $prefix . 'relationships.mid')
                       ->where($prefix . 'relationships.cid = ?', $cid)
                       ->where($prefix . 'metas.type = ?', 'category')
                       ->limit(1)
                );
                $category = $catRow ? $catRow['name'] : '';
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
                        <h1 class="typewriter">Welcome to Kyson's Blog</h1>
                        <p>“The future is already here – it's just not evenly distributed.”</p>
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
            <span class="prompt">Kyson@blog:~$ </span>
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
