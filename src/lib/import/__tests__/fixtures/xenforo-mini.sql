-- MySQL dump 10.13  Distrib 8.0.36
DROP TABLE IF EXISTS `xf_user`;
CREATE TABLE `xf_user` (
  `user_id` int unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(120) NOT NULL,
  `register_date` int unsigned NOT NULL DEFAULT '0',
  `is_banned` tinyint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB;

INSERT INTO `xf_user` VALUES (1,'admin','admin@example.com',1600000000,0),(2,'jane_doe','jane@example.com',1650000000,0),(3,'O\'Brien','obrien@example.com',1660000000,0);

DROP TABLE IF EXISTS `xf_node`;
CREATE TABLE `xf_node` (
  `node_id` int unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(50) NOT NULL,
  `description` text,
  `node_type_id` varbinary(25) NOT NULL,
  `display_order` int unsigned NOT NULL DEFAULT '1',
  PRIMARY KEY (`node_id`)
) ENGINE=InnoDB;

INSERT INTO `xf_node` VALUES (5,'General Discussion','Talk about anything','Forum',10),(6,'Support','Get help here','Forum',20),(7,'Link Category',NULL,'LinkForum',30);

DROP TABLE IF EXISTS `xf_thread`;
CREATE TABLE `xf_thread` (
  `thread_id` int unsigned NOT NULL AUTO_INCREMENT,
  `node_id` int unsigned NOT NULL,
  `title` varchar(150) NOT NULL,
  `user_id` int unsigned NOT NULL,
  `username` varchar(50) NOT NULL,
  `post_date` int unsigned NOT NULL,
  `last_post_date` int unsigned NOT NULL,
  `reply_count` int unsigned NOT NULL DEFAULT '0',
  `sticky` tinyint unsigned NOT NULL DEFAULT '0',
  `discussion_open` tinyint unsigned NOT NULL DEFAULT '1',
  `discussion_state` enum('visible','moderated','deleted') NOT NULL DEFAULT 'visible',
  PRIMARY KEY (`thread_id`)
) ENGINE=InnoDB;

INSERT INTO `xf_thread` VALUES (101,5,'Welcome to the forum!',1,'admin',1700000000,1700005000,1,1,1,'visible'),(102,6,'How do I reset my password?',2,'jane_doe',1700100000,1700100000,0,0,1,'visible'),(103,5,'Spam thread',3,'O\'Brien',1700200000,1700200000,0,0,1,'deleted');

DROP TABLE IF EXISTS `xf_post`;
CREATE TABLE `xf_post` (
  `post_id` int unsigned NOT NULL AUTO_INCREMENT,
  `thread_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `username` varchar(50) NOT NULL,
  `post_date` int unsigned NOT NULL,
  `message` mediumtext NOT NULL,
  `message_state` enum('visible','moderated','deleted') NOT NULL DEFAULT 'visible',
  PRIMARY KEY (`post_id`)
) ENGINE=InnoDB;

INSERT INTO `xf_post` VALUES (1001,101,1,'admin',1700000000,'[b]Welcome![/b] Please read the [url=https://example.com/rules]rules[/url].\n\n[quote=oldtimer]forums are great[/quote]','visible'),(1002,101,2,'jane_doe',1700005000,'Thanks [USER=1]admin[/USER]! Here is a list:\n[list]\n[*]item one\n[*]item two\n[/list]','visible'),(1003,102,2,'jane_doe',1700100000,'I can\'t log in — [i]help[/i]?\n\n[code]Error: 403[/code]','visible'),(1004,103,3,'O\'Brien',1700200000,'buy stuff','visible');
