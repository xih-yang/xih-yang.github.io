# 26、Perl 访问数据库
- 来源：https://ddkk.com/zhuanlan/other/perl/26.html
- 分类：Perl 教程
- 分组：教程目录
访问数据库是任何一门语言重中之重的功能之一， Perl5 可以使用 DBI 模块来连接数据库。

DBI英文全称：Database Independent Interface，中文名为数据库独立接口

DBI作为 Perl 语言中和数据库进行通讯的标准接口，它定义了一系列的方法，变量和常量，提供一个和具体数据库平台无关的数据库持久层

## DBI 结构

DBI和具体数据库平台无关，我们可以它来访问 Oracle, MySQL 或 Informix 等数据库

图表中DBI 获取所有 API（Application Programming Interface：应用程序接口） 发送过来的 SQL 数据，然后分发到对应的驱动上执行，最后再获取数据返回。

### 变量名约定

下面是DBI 中比较常用的变量命令方法：

```sh
$dsn    驱动程序对象的句柄
$dbh    一个数据库对象的句柄
$sth    一个语句或者一个查询对象的句柄
$h      通用的句柄 ($dbh, $sth, 或 $drh)，依赖于上下文
$rc     操作代码返回的布什值（true 或 false）
$rv     操作代码返回的整数值
@ary    查询返回的一行值的数组（列表）
$rows   操作代码返回的行数值
$fh     文件句柄
undef   NULL 值表示未定义
\%attr  引用属性的哈希值并传到方法上
```

## 连接 MySQL 数据库

接下来我们将用 DBI 来操作 MySQL 数据库，演示 Perl 是如何对数据库进行操作的

继续范例之前，我们先要创建一个 perl_db 的数据库，然后在数据库中创建一个表 websites

表结构及数据如下图所示：

你可以在以下网址下载到我们的范例表:

[/static/media/perl_websites.sql](/static/media/perl_websites.sql)

## 安装 DBI 和 DBD::mysql 模块，使用以下方法

**1、** 打开终端，可以使用Ctrl-Alt-t组合键；

**2、** 输入cpan进入cpan命令行；

**3、** 在cpan交互命令行中输入installDBI安装DBI，注意大小写；

**4、** 在cpan交互命令行中输入installDBD::mysql安装DBD::mysql；

**5、** 输入exit退出cpan；

### 范例 : Perl 连接 MySQL 的例子

```sh
#!/usr/bin/perl
=pod
  file: mail.pl
  author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
  Copyright © 2015-2065 www.ddkk.com. All rights reserved.
=cut
use strict;
use DBI;
my $host = "localhost";         # 主机地址
my $driver = "mysql";           # 接口类型 默认为 localhost
my $database = "perl_db";        # 数据库
# 驱动程序对象的句柄
my $dsn = "DBI:$driver:database=$database:$host";  
my $userid = "root";            # 数据库用户名
my $password = "";        # 数据库密码
# 连接数据库
my $dbh = DBI->connect($dsn, $userid, $password ) or die $DBI::errstr;
my $sth = $dbh->prepare("SELECT * FROM websites");   # 预处理 SQL  语句
$sth->execute();    # 执行 SQL 操作
# 注释这部分使用的是绑定值操作
# $alexa = 20;
# my $sth = $dbh->prepare("SELECT name, url
#                        FROM Websites
#                        WHERE alexa > ?");
# $sth->execute( $alexa ) or die $DBI::errstr;
# 循环输出所有数据
while ( my @row = $sth->fetchrow_array() )
{
       print join("\t", @row)."\n";
}
$sth->finish();
$dbh->disconnect();
```

运行以上范例，输出结果如下

```sh
$ perl main.pl
1 Google         https://www.google.cm/    1     USA
2 淘宝           https://www.taobao.com/    13    CN
3 DDKK.COM 弟弟快看，程序员编程资料站        /       5000  USA
4 微博           http://weibo.com/          20    CN
5 Facebook      https://www.facebook.com/  3     USA
7 stackoverflow http://stackoverflow.com/  0     IND
```

### DBD::mysql 插入操作

使用 **DBD::mysql** 插入数据到 mysql 中需要以下步骤：

**1、** 使用prepare()函数预处理SQL语句；

**2、** 使用execute()函数执行SQL语句；

**3、** 使用finish()函数释放语句句柄；

如果执行执行成功，那么就会 DBD::mysql 就会提交以上执行操作

```sh
my $sth = $dbh->prepare("INSERT INTO Websites
                       (name, url, alexa, conutry )
                        values
                       ('Twitter', 'https://twitter.com/', 10, 'USA')");
$sth->execute() or die $DBI::errstr;
$sth->finish();
$dbh->commit or die $DBI::errstr;
```

DBD::mysql 还可以绑定输出和输入参数,下面的代码通过用变量取代 ? 占位符的位置来执行一条插入查询：

```sh
my $name = "Tencent";
my $url = "https://www.qq.com/";
my $alexa = 5;
my $conutry = "CN";
my $sth = $dbh->prepare("INSERT INTO Websites
                       (name, url, alexa, conutry )
                        values
                       (?,?,?,?)");
$sth->execute($name,$url,$alexa, $conutry) 
          or die $DBI::errstr;
$sth->finish();
$dbh->commit or die $DBI::errstr;
```

### DBD::mysql 更新操作

使用DBD::mysql 更新 mysql 中的数据需要以下步骤：

**1、** 使用prepare()函数预处理SQL语句；

**2、** 使用execute()函数执行SQL语句；

**3、** 使用finish()函数释放语句句柄；

如果执行执行成功，那么就会 DBD::mysql 就会提交以上执行操作

```sh
my $sth = $dbh->prepare("UPDATE Websites
                        SET   alexa = alexa + 1 
                        WHERE country = 'CN'");
$sth->execute() or die $DBI::errstr;
print "更新的记录数 :" + $sth->rows;
$sth->finish();
$dbh->commit or die $DBI::errstr;
```

DBD::mysql 还可以绑定输出和输入参数,下面例子通过用变量取代 ? 占位符的位置来执行一条更新查询：

```sh
$name = 'DDKK.COM 弟弟快看，程序员编程资料站';
my $sth = $dbh->prepare("UPDATE Websites
                        SET   alexa = alexa + 1 
                        WHERE name = ?");
$sth->execute('$name') or die $DBI::errstr;
print "更新的记录数 :" + $sth->rows;
$sth->finish();
```

当然我们也可以绑定要设置的值，如下所示将 country 为 CN 的 alexa 都修改为 1000 ：

```sh
$country = 'CN';
$alexa = 1000：;
my $sth = $dbh->prepare("UPDATE Websites
                        SET   alexa = ?
                        WHERE country = ?");
$sth->execute( $alexa, '$country') or die $DBI::errstr;
print "更新的记录数 :" + $sth->rows;
$sth->finish();
```

### DBD::mysql 删除数据

使用DBD::mysql 删除 mysql 中的数据需要以下步骤：

**1、** 使用prepare()函数预处理SQL语句；

**2、** 使用execute()函数执行SQL语句；

**3、** 使用finish()函数释放语句句柄；

如果执行执行成功，那么就会 DBD::mysql 就会提交以上执行操作

下面的代码 Websites 中 alexa 字段大于 1000 的数据都删除：

```sh
$alexa = 1000;
my $sth = $dbh->prepare("DELETE FROM Websites
                        WHERE alexa = ?");
$sth->execute( $alexa ) or die $DBI::errstr;
print "删除的记录数 :" + $sth->rows;
$sth->finish();
$dbh->commit or die $DBI::errstr;
```

### 断开数据库连接

当需要断开数据库连接时，可以使用 **disconnect** 函数

```sh
$rc = $dbh->disconnect  or warn $dbh->errstr;
```

### DBD::mysql 使用 do 函数来执行 SQL 语句

DBD::mysql 中的 **do** 函数可以执行 UPDATE, INSERT, 或 DELETE 操作

**do** 函数执行成功返回 true，执行失败返回 false

```sh
$dbh->do('DELETE FROM Websites WHERE alexa>1000');
```

### COMMIT 函数

DBD::mysql 中的 commit 函数用来提交事务，完成数据库的操作

```sh
$dbh->commit or die $dbh->errstr;
```

### ROLLBACK 函数

DBD::mysql 中的 **rollback** 函数用在当 SQL 执行过程中发生错误，可以回滚数据，不做任何改变

```sh
$dbh->rollback or die $dbh->errstr;
```

## 事务

Perl DBI 也支持数据库的事务处理。

DBI实现事务处理的方式有两种：

### 1. 在连接数据库的时候就开始一个事务

```sh
$dbh = DBI->connect($dsn, $userid, $password, {AutoCommit => 0}) or die $DBI::errstr;
```

只要在DBI 中的 connect 函数中设置 AutoCommit =>` 0 就可以开启事务。

这样对数据库进行更新操作的时候， 它不会自动地把那些更新直接写到数据库里， 而是要程序通过 `$` dbh->`commit 来使数据真正地写到数据库里， 或`$`dbh->`rollback 来回滚刚才的操作

### 2. 通过 $ dbh->`begin_work() 语句来开始一个事务

**begin_work** 函数不需要在在连接数据库的时候设置 AutoCommit ＝ 0

它可以实现一次数据库连接进行多次事务操作， 不用每一次事务的开始都去连接一次数据库

```sh
$rc  = $dbh->begin_work  or die $dbh->errstr;
#####################
##这里执行一些 SQL 操作
#####################
$dbh->commit;    # 成功后操作
$dbh->rollback;  # 失败后回滚
```
