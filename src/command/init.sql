CREATE TABLE  IF NOT EXISTS `Answer` (
  `id` varchar(30) NOT NULL , ---- COMMENT '答案id，唯一值',
  `author_url_token` varchar(100) NOT NULL , ---- COMMENT '答主url_token',
  `author_id` varchar(100) NOT NULL , ---- COMMENT '答主id',
  `question_id` varchar(30) NOT NULL , ---- COMMENT '问题id',
  `raw_json` text, --- COMMENT '原始响应json'
  PRIMARY KEY (`id`)
) ; 


CREATE TABLE  IF NOT EXISTS `Article` (
  `id` varchar(100) NOT NULL  , ---- COMMENT '文章id',
  `raw_json` text, --- COMMENT '原始响应json'
  PRIMARY KEY (`id`)
) ; 


CREATE TABLE  IF NOT EXISTS `Author` (
  `id` varchar(100) NOT NULL DEFAULT '' , ---- COMMENT 'hash_id',
  `url_token` varchar(200) NOT NULL , ---- COMMENT '用户主页id.随时可能会更换',
  `raw_json` text, --- COMMENT '原始响应json'
  PRIMARY KEY (`id`)
) ; 


CREATE TABLE  IF NOT EXISTS `Collection` (
  `collection_id` int(11) NOT NULL , ---- COMMENT '收藏夹id',
  `answer_count` int(11) NOT NULL DEFAULT '0' , ---- COMMENT '答案数',
  `comment_count` int(11) NOT NULL DEFAULT '0' , ---- COMMENT '评论数',
  `created_time` int(11) NOT NULL DEFAULT '0' , ---- COMMENT '创建时间',
  `follower_count` int(11) NOT NULL DEFAULT '0' , ---- COMMENT '关注人数',
  `description` varchar(200) NOT NULL DEFAULT '' , ---- COMMENT '描述',
  `title` varchar(200) NOT NULL DEFAULT '' , ---- COMMENT '收藏夹名',
  `updated_time` int(11) NOT NULL DEFAULT '0' , ---- COMMENT '最后更新时间',
  `creator_id` varchar(200) NOT NULL DEFAULT '' , ---- COMMENT '创建者的hashid',
  `creator_name` varchar(200) NOT NULL DEFAULT '' , ---- COMMENT '创建者名字',
  `creator_headline` varchar(200) NOT NULL DEFAULT '' , ---- COMMENT '创建者签名档',
  `creator_avatar_url` varchar(200) NOT NULL DEFAULT '' , ---- COMMENT '创建者头像',
  `collected_answer_id_list` text NOT NULL,  ---- COMMENT '收藏夹下以逗号分隔的答案id列表'
  `raw_json` text, --- COMMENT '原始响应json'
  PRIMARY KEY (`collection_id`)
) ; 


CREATE TABLE  IF NOT EXISTS `Column` (
  `column_id` varchar(200) NOT NULL , ---- COMMENT '专栏id',
  `title` varchar(200) NOT NULL , ---- COMMENT '专栏名',
  `article_count` int(11) NOT NULL , ---- COMMENT '专栏内文章数',
  `follower_count` int(11) NOT NULL , ---- COMMENT '关注人数',
  `description` varchar(5000) NOT NULL , ---- COMMENT '专栏描述',
  `image_url` varchar(5000) NOT NULL , ---- COMMENT '专栏封面',
  `raw_json` text, --- COMMENT '原始响应json'
  PRIMARY KEY (`column_id`)
) ; 


CREATE TABLE  IF NOT EXISTS `Question` (
  `question_id` int(11) NOT NULL , ---- COMMENT '问题id',
  `answer_count` int(11) NOT NULL DEFAULT '0' , ---- COMMENT '回答数',
  `comment_count` int(11) NOT NULL DEFAULT '0' , ---- COMMENT '评论数',
  `follower_count` int(11) NOT NULL DEFAULT '0' , ---- COMMENT '关注数',
  `title` varchar(200) NOT NULL DEFAULT '' , ---- COMMENT '问题',
  `detail` varchar(200) NOT NULL DEFAULT '' , ---- COMMENT '问题详情',
  `updated_time` int(11) NOT NULL DEFAULT '0',  ---- COMMENT '更新时间'
  `raw_json` text, --- COMMENT '原始响应json'
  PRIMARY KEY (`question_id`)
) ; 


CREATE TABLE  IF NOT EXISTS `Topic` (
  `topic_id` int(11) NOT NULL , ---- COMMENT '话题id',
  `avatar_url` varchar(300) NOT NULL , ---- COMMENT '话题图片',
  `best_answerers_count` int(11) NOT NULL , ---- COMMENT '最佳回答的作者数',
  `best_answers_count` int(11) NOT NULL , ---- COMMENT '最佳回答数',
  `excerpt` text NOT NULL , ---- COMMENT '简介(无html标签)',
  `followers_count` int(11) NOT NULL , ---- COMMENT '关注者人数',
  `introduction` text NOT NULL , ---- COMMENT '介绍，含html标签',
  `name` varchar(200) NOT NULL , ---- COMMENT '话题名称',
  `questions_count` int(11) NOT NULL , ---- COMMENT '话题下的问题数量',
  `unanswered_count` int(11) NOT NULL , ---- COMMENT '话题下等待回答的问题数量',
  `best_answer_id_list` text NOT NULL,  ---- COMMENT '逗号分隔形式的话题下精华答案id列表'
  `raw_json` text, --- COMMENT '原始响应json'
  PRIMARY KEY (`topic_id`)
) ; 