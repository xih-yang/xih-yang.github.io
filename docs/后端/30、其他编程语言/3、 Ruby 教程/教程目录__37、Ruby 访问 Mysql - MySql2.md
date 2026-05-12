# 37、Ruby 访问 Mysql - MySql2
- 来源：https://ddkk.com/zhuanlan/other/ruby/37.html
- 分类：Ruby 教程
- 分组：教程目录
前面一章节我们已经学习了 Ruby DBI 的使用

接下来我们将学习 Ruby 如何访问 Mysql

我们将使用 mysql2 模块，这也是 Ruby 社区推荐的使用模块快

### 安装 mysql2 驱动

```ruby
gem install mysql2
```

可能需要使用 –with-mysql-config 配置 mysql_config 的路径

### 加载 MySQL2 模块

```ruby
require 'mysql2'
```

### 连接到 MySQL

使用MySQL2 创建连接的语法格式如下

```ruby
conn = Mysql2::Client.new(:host => "localhost", :username => "root")
```

更多参数可以查看 [http://www.rubydoc.info/gems/mysql2/0.2.3/frames](http://www.rubydoc.info/gems/mysql2/0.2.3/frames)

### 查询

```ruby
rs = conn.query("SELECT * FROM mysql.users WHERE user='root'")
```

### 特殊字符转义

```ruby
escaped = conn.escape("gi'thu\"bbe\0r's")
rs = conn.query("SELECT * FROM users WHERE group='#{escaped}'")
```

### 计算结果集返回的数量

```ruby
rs.count
```

### 迭代结果集

```ruby
results.each do |row|
  # row 是哈希
  # 键值是数据库字段
  # 值都是对应 MySQL中数据
  puts row["id"] # row["id"].class == Fixnum
  if row["dne"]  # 不存在则是 nil
    puts row["dne"]
  end
end
```

### 范例

```ruby
# !/usr/bin/ruby -w
# -*- encoding:utf-8 -*-
# filename: main.rb
# author: DDKK.COM 弟弟快看，程序员编程资料站(www.ddkk.com)
# Copyright © 2015-2065 www.ddkk.com. All rights reserved.
require 'mysql2'
client = Mysql2::Client.new(
    :host     => '127.0.0.1', # 主机
    :username => 'root',      # 用户名
    :password => '',    # 密码
    :database => 'test',      # 数据库
    :encoding => 'utf8'       # 编码
    )
results = client.query("SELECT VERSION()")
results.each do |row|
  puts row
end
```

运行以上范例，输出结果如下

```ruby
$ ruby main.rb
{"VERSION()"=>"10.2.9-MariaDB"}
```

### 连接选项

```ruby
Mysql2::Client.new(
  :host,
  :username,
  :password,
  :port,
  :database,
  :socket = '/path/to/mysql.sock',
  :flags = REMEMBER_OPTIONS | LONG_PASSWORD | LONG_FLAG | TRANSACTIONS | PROTOCOL_41 | SECURE_CONNECTION | MULTI_STATEMENTS,
  :encoding = 'utf8',
  :read_timeout = seconds,
  :write_timeout = seconds,
  :connect_timeout = seconds,
  :reconnect = true/false,
  :local_infile = true/false,
  :secure_auth = true/false,
  :default_file = '/path/to/my.cfg',
  :default_group = 'my.cfg section',
  :init_command => sql
  )
```

更多内容请参阅： [http://www.rubydoc.info/gems/mysql2/0.2.3/frames](http://www.rubydoc.info/gems/mysql2/0.2.3/frames)
