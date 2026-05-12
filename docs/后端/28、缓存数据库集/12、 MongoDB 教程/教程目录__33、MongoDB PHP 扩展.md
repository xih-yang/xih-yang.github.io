# 33、MongoDB PHP 扩展
- 来源：https://ddkk.com/zhuanlan/db/mongodb/33.html
- 分类：缓存数据库
- 分组：教程目录
mongo 扩展不是 PHP 官方内置的扩展，需要开发者自己手动安装和配置

本章我们将学习如何在 Linux、Window、Mac 平台上安装 mongo 扩展

## Linux 上安装 PHP MongoDB 扩展

### 通过 pecl 来安装

在Linux 系统上可以通过执行以下命令来来安装 MongoDB 的 PHP 扩展驱动

```sh
$ pecl install mongodb
```

### 编译源码安装

如果想通过源码来编译扩展驱动，必须手动编译源码包，这样做的好处是可以使用最新的版本

我们可以在 Github 上下载 MongoDB PHP 驱动包

PHPMongoDB Github 地址为：[https://github.com/mongodb/mongo-php-driver](https://github.com/mongodb/mongo-php-driver)

下载好源码包后，执行以下命令来安装

```sh
$ tar zxvf mongodb-mongodb-php-driver-<commit_id>.tar.gz
$ cd mongodb-mongodb-php-driver-<commit_id>
$ phpize
$ ./configure
$ sudo make install
```

如果你的 PHP 也是自己从源码编译安装的，则安装方法如下：

假设PHP 编译安装在 /usr/local/php 目录中

```sh
$ tar zxvf mongodb-mongodb-php-driver-<commit_id>.tar.gz
$ cd mongodb-mongodb-php-driver-<commit_id>
$ /usr/local/php/bin/phpize
$ ./configure --with-php-config=/usr/local/php/bin/php-config
$ sudo make install
```

安装完成后，我们需要修改 php.ini 添加 mongo.so 扩展

添加如下配置如下：

```sh
extension=mongo.so
```

> 注意： 可能需要指明 extension_dir 配置项的路径

重启服务器

然后通过使用以下命令来判断是否安装正确

```sh
php -i | grep mongo
```

如果安装正确，一般会输出类似下面的信息

```sh
$ php -i | grep mongo
/usr/local/etc/php/5.6/conf.d/ext-mongo.ini,
mongo
mongo.allow_empty_keys => 0 => 0
mongo.chunk_size => 261120 => 261120
mongo.cmd => $ => $
mongo.default_host => localhost => localhost
mongo.default_port => 27017 => 27017
mongo.is_master_interval => 15 => 15
mongo.long_as_object => 0 => 0
mongo.native_long => 1 => 1
mongo.ping_interval => 5 => 5
```

## Window 系统上安装 MongoDB PHP 扩展

Github 上已经提供了用于 Window 平台的预编译 PHP MongoDB 驱动二进制包

下载地址为 ： [https://pecl.php.net/package/mongodb](https://pecl.php.net/package/mongodbl)

你可以下载与你 PHP 对应的版本，但是需要注意以下几点问题：

**1、** VC6是运行于Apache服务器；

**2、** ‘Threadsafe’（线程安全）是运行在Apache上以模块的PHP上，如果你以CGI的模式运行PHP，请选择非线程安全模式（’non-threadsafe’）；

**3、** VC9是运行于IIS服务器上；

**4、** 下载完需要的二进制包后，解压压缩包，将php_mongo.dll文件添加到你的PHP扩展目录中（ext）ext目录通常在PHP安装目录下的ext目录；

打开PHP 配置文件 php.ini 添加以下配置：

```sh
extension=php_mongo.dll
```

重启服务器

然后通过使用以下命令来判断是否安装正确

```sh
php -i | grep mongo
```

如果安装正确，一般会输出类似下面的信息

```sh
$ php -i | grep mongo
/usr/local/etc/php/5.6/conf.d/ext-mongo.ini,
mongo
mongo.allow_empty_keys => 0 => 0
mongo.chunk_size => 261120 => 261120
mongo.cmd => $ => $
mongo.default_host => localhost => localhost
mongo.default_port => 27017 => 27017
mongo.is_master_interval => 15 => 15
mongo.long_as_object => 0 => 0
mongo.native_long => 1 => 1
mongo.ping_interval => 5 => 5
```

## MAC OS 系统安装 MongoDB PHP 扩展驱动

可以使用 **autoconf** 安装 MongoDB PHP 扩展驱动

可以使用 **Xcode** 安装 MongoDB PHP 扩展驱动

如果你使用 XAMPP，可以使用以下命令安装 MongoDB PHP 扩展驱动

```sh
sudo /Applications/XAMPP/xamppfiles/bin/pecl install mongo
```

如果以上命令在 XMPP 或者 MAMP 中不起作用，你需要在 Github 上下载兼容的预编译包

然后添加 extension=mongo.so 配置到你的 php.ini 文件中
