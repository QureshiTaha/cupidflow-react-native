CREATE TABLE
    `db_users` (
        `id` INT (11) NOT NULL AUTO_INCREMENT,
        `userID` VARCHAR(100) NOT NULL,
        `userFirstName` VARCHAR(100) NOT NULL,
        `userSurname` VARCHAR(100) NOT NULL,
        `userEmail` VARCHAR(50) NOT NULL,
        `userPassword` VARCHAR(255) NOT NULL,
        `userPhone` VARCHAR(11) DEFAULT NULL,
        `userAddressLine1` VARCHAR(255) NOT NULL,
        `userAddressLine2` VARCHAR(255) NOT NULL,
        `userAddressPostcode` VARCHAR(255) NOT NULL,
        `userGender` VARCHAR(255) NOT NULL,
        `userDateOfBirth` DATE DEFAULT NULL,
        `userRole` tinyint (11) NOT NULL DEFAULT 1,
        `userDateJoined` TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
        `userDateUpdated` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
        `userLastLoggedIn` DATE DEFAULT NULL,
        `userAccountApproved` tinyint (4) DEFAULT 1,
        `userDeleted` tinyint (4) DEFAULT NULL,
        `userDeletedDate` datetime DEFAULT NULL,
        `totalFollowers` INT DEFAULT 0,
        `followings` INT DEFAULT 0,
        `posts` INT DEFAULT 0,
        `userBio` TEXT DEFAULT NULL,
        `profilePic` VARCHAR(255) DEFAULT NULL,
        `fcmToken` VARCHAR(255) DEFAULT NULL,
        `userMeta` longtext DEFAULT NULL,
        PRIMARY KEY (`id`),
        UNIQUE KEY `userID` (`userID`)
    );

INSERT INTO
    `db_users` (
        `id`,
        `userID`,
        `userFirstName`,
        `userSurname`,
        `userEmail`,
        `userPassword`,
        `userPhone`,
        `userAddressLine1`,
        `userAddressLine2`,
        `userAddressPostcode`,
        `userGender`,
        `userDateOfBirth`,
        `userRole`,
        `userDateJoined`,
        `userDateUpdated`,
        `userLastLoggedIn`,
        `userAccountApproved`,
        `userDeleted`,
        `userDeletedDate`,
        `userMeta`
    )
VALUES
    (
        1,
        '0ddc7770-bb8f-4308-aad5-4e483770fd07',
        'Testing',
        'Dev',
        'testing@dev.com',
        '$2b$10$AoLSic7y3KUs8mhYesWBoOCOPcXSlwDyNCHJCdagpMjETnVDU8iUW',
        1234567890,
        'Address 1',
        'Address 2',
        'DEV004',
        '1',
        '2000-06-24',
        0,
        '2023-08-05',
        NULL,
        NULL,
        1,
        NULL,
        NULL,
        '{\"hairColour\":\"maroon\"}'
    );

CREATE TABLE
    `db_sessions` (
        `id` INT (11) NOT NULL AUTO_INCREMENT,
        `userID` VARCHAR(100) NOT NULL,
        `refreshToken` text NOT NULL,
        `accessToken` text NOT NULL,
        `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
        `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
        PRIMARY KEY (`id`)
    );

CREATE TABLE
    `db_uploads` (
        `id` INT (11) NOT NULL AUTO_INCREMENT,
        `userID` VARCHAR(100) NOT NULL,
        `filePath` VARCHAR(100) NOT NULL,
        `thumbnailPath` VARCHAR(100) DEFAULT NULL,
        PRIMARY KEY (`id`),
        KEY `user-upload-relation` (`userID`),
        CONSTRAINT `user-upload-relation` FOREIGN KEY (`userID`) REFERENCES `db_users` (`userID`) ON DELETE CASCADE
    );

CREATE TABLE
    `db_tasks` (
        `id` INT (11) NOT NULL AUTO_INCREMENT,
        `taskID` VARCHAR(100) NOT NULL,
        `taskProjectID` VARCHAR(100) NOT NULL,
        `title` VARCHAR(255) NOT NULL,
        `description` text DEFAULT NULL,
        `created_by` VARCHAR(100) NOT NULL,
        `status` enum ('not_assigned', 'pending', 'in_progress', 'completed') DEFAULT 'not_assigned',
        `priority` enum ('low', 'medium', 'high') DEFAULT 'medium',
        `due_date` datetime DEFAULT NULL,
        `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
        `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
        PRIMARY KEY (`id`),
        UNIQUE KEY `taskId` (`taskID`),
        KEY `user-task-relation` (`created_by`),
        CONSTRAINT `user-task-relation` FOREIGN KEY (`created_by`) REFERENCES `db_users` (`userID`)
    );

CREATE TABLE
    `db_task_assignments` (
        `id` INT (11) NOT NULL AUTO_INCREMENT,
        `task_id` VARCHAR(100) NOT NULL,
        `assigned_by` VARCHAR(100) NOT NULL,
        `assigned_to` VARCHAR(100) NOT NULL,
        `assigned_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
        `message` VARCHAR(100) DEFAULT NULL,
        PRIMARY KEY (`id`),
        KEY `task-assignment-relation` (`task_id`),
        KEY `user-Assignment-r1` (`assigned_by`),
        KEY `user-Assignment-r2` (`assigned_to`)
    );

CREATE TABLE
    `db_projects` (`id` INT (11) NOT NULL AUTO_INCREMENT, `projectID` VARCHAR(100) NOT NULL, `name` VARCHAR(50) NOT NULL, `description` text NOT NULL, `project_meta` VARCHAR(200) NOT NULL, PRIMARY KEY (`id`));

CREATE TABLE
    `db_logs` (
        `id` INT (11) NOT NULL AUTO_INCREMENT,
        `logID` VARCHAR(50) NOT NULL,
        `userID` VARCHAR(100) NOT NULL,
        `taskID` VARCHAR(100) NOT NULL,
        `log_type` enum ('system', 'user') NOT NULL DEFAULT 'system',
        `message` longtext NOT NULL,
        `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
        PRIMARY KEY (`id`)
    );

CREATE TABLE
    `db_reels` (
        `id` INT (11) NOT NULL AUTO_INCREMENT,
        `reelId` VARCHAR(100) NOT NULL,
        `filepath` VARCHAR(255) NOT NULL,
        `userID` VARCHAR(100) NOT NULL,
        `title` VARCHAR(100) DEFAULT 'untitled',
        `description` VARCHAR(100) NOT NULL,
        `likes` BIGINT (20) DEFAULT 0,
        `comments` INT (11) NOT NULL DEFAULT 0,
        `isArchive` enum ('0', '1') NOT NULL DEFAULT '0',
        `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
        PRIMARY KEY (`id`),
        KEY `user-reel-relation` (`userID`),
        CONSTRAINT `user-reel-relation` FOREIGN KEY (`userID`) REFERENCES `db_users` (`userID`)
    );

CREATE TABLE
    `db_reel_comments` (
        `commentId` VARCHAR(255) NOT NULL,
        `reelId` VARCHAR(255) NOT NULL,
        `userID` VARCHAR(255) NOT NULL,
        `commentText` text NOT NULL,
        `commentedAt` datetime DEFAULT CURRENT_TIMESTAMP(),
        PRIMARY KEY (`commentId`)
    );

CREATE TABLE
    `db_reel_likes` (
        `id` INT (11) NOT NULL AUTO_INCREMENT,
        `userID` VARCHAR(255) DEFAULT NULL,
        `reelId` VARCHAR(255) DEFAULT NULL,
        `timeStamp` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
        PRIMARY KEY (`id`)
    );

CREATE TABLE
    `db_coin_store` (
        `id` INT (11) NOT NULL AUTO_INCREMENT,
        `coinStoreId` VARCHAR(100) NOT NULL,
        `ownerId` VARCHAR(100) DEFAULT NULL,
        `transactionId` VARCHAR(100) DEFAULT NULL,
        `purchasedAt` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
        PRIMARY KEY (`id`)
    );

CREATE TABLE
    `db_coin_transaction` (
        `id` INT (11) NOT NULL AUTO_INCREMENT,
        `coinTransactionId` CHAR(36) NOT NULL,
        `orderNo` VARCHAR(36) NOT NULL,
        `status` VARCHAR(20) DEFAULT 'processing',
        `senderId` VARCHAR(255) NOT NULL,
        `receiverId` VARCHAR(255) NOT NULL,
        `coinCount` INT (11) NOT NULL,
        `amount` FLOAT NOT NULL,
        `transactionDate` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP(),
        `metaData` longtext CHARACTER
        SET
            utf8mb4 COLLATE utf8mb4_bin NOT NULL,
            PRIMARY KEY (`id`)
    );

CREATE TABLE
    db_followers (
        `id` INT (11) NOT NULL AUTO_INCREMENT,
        `followBy` VARCHAR(50) NOT NULL,
        `followTo` VARCHAR(50) NOT NULL,
        `followAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX (followBy),
        INDEX (followTo)
    );

CREATE TABLE
    `db_coin_offers` (
        `id` INT (11) NOT NULL AUTO_INCREMENT,
        `offerId` VARCHAR(36) NOT NULL,
        `coinAmount` INT (11) NOT NULL,
        `actualPrice` DECIMAL(10, 2) NOT NULL,
        `offerPrice` DECIMAL(10, 2) NOT NULL,
        `createdAt` datetime DEFAULT CURRENT_TIMESTAMP(),
        `isActive` tinyint (1) DEFAULT 1,
        PRIMARY KEY (`id`),
        UNIQUE KEY `offerId` (`offerId`)
    );

CREATE TABLE
    db_otp_verification (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `userID` VARCHAR(255) UNIQUE,
        `otp` VARCHAR(6),
        `attempt` INT,
        `dateUpdated` DATETIME,
        `coolDownTime` DATETIME,
        FOREIGN KEY (`userID`) REFERENCES `db_users` (`userID`) ON DELETE CASCADE
    );

CREATE TABLE
    `db_coin_payments` (
        `id` INT (11) NOT NULL AUTO_INCREMENT,
        `paymentId` VARCHAR(100) NOT NULL,
        `userId` VARCHAR(100) NOT NULL,
        `amount` DECIMAL(10, 2) NOT NULL,
        `coinCount` INT (11) DEFAULT 0,
        `paymentMethod` VARCHAR(50) DEFAULT NULL,
        `paymentType` enum ('credit', 'debit', '') DEFAULT NULL,
        `status` VARCHAR(20) DEFAULT 'pending',
        `transactionId` VARCHAR(100) DEFAULT NULL,
        `createdAt` datetime DEFAULT CURRENT_TIMESTAMP(),
        `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
        PRIMARY KEY (`id`),
        UNIQUE KEY `paymentId` (`paymentId`),
        KEY `userId` (`userId`),
        CONSTRAINT `db_coin_payments_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `db_users` (`userID`)
    );

CREATE TABLE
    `db_userpayout_details` (
        `id` INT (11) NOT NULL AUTO_INCREMENT,
        `userID` VARCHAR(100),
        `payout_userEmail` VARCHAR(50) NOT NULL,
        `payout_ifscCode` VARCHAR(20) NOT NULL,
        `payout_mobileNumber` VARCHAR(13) NOT NULL,
        `payout_payeeName` text NOT NULL,
        `payout_toAccount` VARCHAR(20) NOT NULL,
        `payout_toUpi` VARCHAR(30) NOT NULL,
        `payout_meta` longtext DEFAULT NULL,
        PRIMARY KEY (`id`),
        KEY `payout_userRelation` (`userID`),
        CONSTRAINT `payout_userRelation` FOREIGN KEY (`userID`) REFERENCES `db_users` (`userID`)
    );

CREATE TABLE
    `db_chat_messages` (
        `id` INT (11) NOT NULL AUTO_INCREMENT,
        `messageID` VARCHAR(100) NOT NULL,
        `senderID` VARCHAR(100) NOT NULL,
        `receiverID` VARCHAR(100) DEFAULT NULL,
        `chatID` VARCHAR(100) NOT NULL,
        `message` text NOT NULL,
        `messageType` enum ('text', 'image', 'video', 'file') DEFAULT 'text',
        `timestamp` datetime DEFAULT CURRENT_TIMESTAMP(),
        `isRead` tinyint (1) DEFAULT 0,
        PRIMARY KEY (`id`),
        UNIQUE KEY `messageID` (`messageID`),
        KEY `senderID` (`senderID`),
        KEY `idx_chat_messages_chatid_timestamp` (`chatID`, `timestamp`),
        KEY `idx_chatID_timestamp` (`chatID`, `timestamp`),
        CONSTRAINT `db_chat_messages_ibfk_1` FOREIGN KEY (`senderID`) REFERENCES `db_users` (`userID`)
    );

CREATE TABLE
    `db_chats` (
        `id` INT (11) NOT NULL AUTO_INCREMENT,
        `chatID` VARCHAR(100) NOT NULL,
        `chatType` enum ('private', 'broadcast', 'group') NOT NULL,
        `chatName` VARCHAR(255) DEFAULT NULL,
        `chatWith` VARCHAR(100) DEFAULT NULL,
        `createdBy` VARCHAR(100) DEFAULT NULL,
        `createdAt` datetime DEFAULT CURRENT_TIMESTAMP(),
        PRIMARY KEY (`id`),
        UNIQUE KEY `chatID` (`chatID`),
        KEY `idx_chat_createdAt` (`chatID`, `createdAt`),
        KEY `idx_chatID_createdAt` (`chatID`, `createdAt`),
        KEY `idx_createdBy_chatWith` (`createdBy`, `chatWith`)
    );

CREATE TABLE
    `db_chat_members` (
        `id` INT (11) NOT NULL AUTO_INCREMENT,
        `chatID` VARCHAR(100) DEFAULT NULL,
        `userID` VARCHAR(100) DEFAULT NULL,
        `joinedAt` datetime DEFAULT CURRENT_TIMESTAMP(),
        PRIMARY KEY (`id`),
        KEY `userID` (`userID`),
        KEY `chatID` (`chatID`),
        CONSTRAINT `db_chat_members_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `db_users` (`userID`),
        CONSTRAINT `db_chat_members_ibfk_2` FOREIGN KEY (`chatID`) REFERENCES `db_chats` (`chatID`)
    );