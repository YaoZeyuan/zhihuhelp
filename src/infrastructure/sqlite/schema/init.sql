---- 三大原子型数据: 回答/想法/文章, 构成知乎助手的基础
---- 其余均为集合型数据
CREATE TABLE  IF NOT EXISTS `Answer` (
  `answer_id` varchar(100) NOT NULL , ---- COMMENT '答案id，唯一值',
  `author_url_token` varchar(100) NOT NULL , ---- COMMENT '答主url_token',
  `author_id` varchar(100) NOT NULL , ---- COMMENT '答主id',
  `question_id` varchar(100) NOT NULL , ---- COMMENT '问题id',
  `raw_json` json, --- COMMENT '原始响应json'
  --- '总答案记录表'
  PRIMARY KEY (`answer_id`)
); 

CREATE TABLE  IF NOT EXISTS `Pin` (
  `pin_id` varchar(100) NOT NULL , ---- COMMENT '想法id',
  `author_id` varchar(100) NOT NULL , ---- COMMENT '答主id',
  `author_url_token` varchar(100) NOT NULL , ---- COMMENT '答主url_token',
  `raw_json` json, --- COMMENT '原始响应json'
  --- '总想法记录表'
  PRIMARY KEY (`pin_id`)
); 

CREATE TABLE  IF NOT EXISTS `Article` (
  `article_id` varchar(100) NOT NULL  , ---- COMMENT '文章id',
  `author_url_token` varchar(100) NOT NULL  , ---- COMMENT '答主url_token',
  `author_id` varchar(100) NOT NULL , ---- COMMENT '答主id',
  `column_id` varchar(100) NOT NULL  , ---- COMMENT '专栏id',
  `raw_json` json, --- COMMENT '原始响应json'
  --- 专栏文章表
  PRIMARY KEY (`article_id`)
) ; 


CREATE TABLE  IF NOT EXISTS `Column` (
  `column_id` varchar(100) NOT NULL  , ---- COMMENT '专栏id',
  `raw_json` json, --- COMMENT '原始响应json'
  --- 专栏信息表
  PRIMARY KEY (`column_id`)
) ; 

CREATE TABLE  IF NOT EXISTS `Author` (
  `id` varchar(100) NOT NULL DEFAULT '' , ---- COMMENT 'hash_id',
  `url_token` varchar(200) NOT NULL , ---- COMMENT '用户主页id.随时可能会更换',
  `raw_json` json, --- COMMENT '原始响应json'
  --- 作者信息表
  PRIMARY KEY (`id`)
) ; 


CREATE TABLE  IF NOT EXISTS `Activity` (
  `id` varchar(100) NOT NULL DEFAULT '' , ---- COMMENT 'id', 实际上是用户行为记录发生时间,
  `url_token` varchar(200) NOT NULL , ---- COMMENT '用户主页id.随时可能会更换',
  `verb` varchar(200) NOT NULL , ---- COMMENT '行为类别',
  `raw_json` json, --- COMMENT '原始响应json'
  --- 用户活动列表
  PRIMARY KEY (`id`, `url_token`)
) ; 


CREATE TABLE  IF NOT EXISTS `Collection` (
  `collection_id` varchar(100) NOT NULL , ---- COMMENT '收藏夹id',
  `raw_json` json, --- COMMENT '收藏夹信息json'
  --- 收藏夹信息表
  PRIMARY KEY (`collection_id`)
); 

CREATE TABLE  IF NOT EXISTS `Collection_Record` (
  `collection_id` varchar(100) NOT NULL , ---- COMMENT '收藏夹id',
  `record_type` varchar(100) NOT NULL , ---- COMMENT '收藏夹记录类型:answer/pin/article',
  `record_id` varchar(100) NOT NULL , ---- COMMENT '收藏夹记录id',
  `record_at` int(11) NOT NULL , ---- COMMENT '添加到收藏的时间戳',
  `raw_json` json, --- COMMENT '收藏夹内的消息内容json'
  --- 收藏夹内回答列表(收藏夹接口只提供了answer响应, 没有返回文章列表)
  PRIMARY KEY (`collection_id`, `record_type`, `record_id`)
);


CREATE TABLE  IF NOT EXISTS `Topic` (
  `topic_id` int(11) NOT NULL , ---- COMMENT '话题id',
  `raw_json` json, --- COMMENT '原始响应json'
  --- 话题信息表
  PRIMARY KEY (`topic_id`)
) ; 


CREATE TABLE  IF NOT EXISTS `Topic_Answer` (
  `topic_id` int(11) NOT NULL , ---- COMMENT '话题id',
  `answer_id` int(11) NOT NULL , ---- COMMENT '答案id',
  --- 话题下精华回答表
  PRIMARY KEY (`topic_id`, `answer_id`)
) ; 

CREATE TABLE  IF NOT EXISTS `Author_Ask_Question` (
  `question_id` varchar(100) NOT NULL , ---- COMMENT '问题id',
  `author_url_token` varchar(100) NOT NULL , ---- COMMENT '答主url_token',
  `author_id` varchar(100) NOT NULL , ---- COMMENT '答主id',
  `raw_json` json, --- COMMENT '原始响应json'
  --- '总答案记录表'
  PRIMARY KEY (`question_id`)
); 
