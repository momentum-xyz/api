CREATE DATABASE `momentum-test`;
USE `momentum-test`;

ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY 'test-password';
FLUSH PRIVILEGES;