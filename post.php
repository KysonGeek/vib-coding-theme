<?php if (!defined('__TYPECHO_ROOT_DIR__')) exit; ?>
<?php $this->need('header.php'); ?>

<div id="main">
    <div id="content">
        <article class="post">
            <h1 class="post-title"><?php $this->title() ?></h1>
            <div class="post-meta">
                <span class="author">作者: <?php $this->author(); ?></span>
                <span class="date">发布时间: <?php $this->date('Y-m-d H:i'); ?></span>
                <span class="category">分类: <?php $this->category(','); ?></span>
            </div>
            <div class="post-content">
                <?php $this->content(); ?>
            </div>
            <div class="post-tags">
                <?php $this->tags(' ', true, ''); ?>
            </div>
            <div id="comments">
                <?php $this->comments(); ?>
            </div>
        </article>
    </div>
</div>

<?php $this->need('footer.php'); ?>