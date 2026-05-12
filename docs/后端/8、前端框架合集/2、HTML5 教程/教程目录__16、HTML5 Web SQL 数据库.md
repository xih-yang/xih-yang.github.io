# 16、HTML5 Web SQL 数据库
- 来源：https://ddkk.com/zhuanlan/qianduan/html5/16.html
- 分类：前端框架
- 分组：教程目录
WebSQL 数据库 API 并不是 HTML5 规范的一部分，它是一个独立的规范，引入了一组使用 SQL 操作客户端数据库的 APIs

如果想了解更多 SQL 的知识，可以访问我们的 [SQL 基础教程](/zhuanlan/db/sql/)

### 浏览器支持

WebSQL 数据库可以在最新版的 Safari, Chrome 和 Opera 浏览器中工作

## Web SQL 核心方法

下表列出了在 Web SQL 规范中定义的三个核心方法

方法
描述

openDatabase
使用现有的数据库或者新建的数据库创建一个数据库对象

transaction
让我们能够控制一个事务，以及基于这种情况执行提交或者回滚

executeSql
用于执行实际的 SQL 查询

## 打开数据库

方法openDatabase() 用来打开一个数据库

如果数据库不存在，则会创建一个新的数据库

### 使用方法

```html
var db = openDatabase('ysdb', '1.0', 'My first DB', 2 * 1024 * 1024,function(){});
```

### 参数说明

参数
说明

'ysDB'
数据库名称

'1.0'
版本号

'My first DB '
描述文本

'2 * 1024 * 1024'
数据库大小

func
创建回调，回调函数会在创建数据库后被调用

## 执行查询操作

方法database.transaction() 用来执行一个事物查询操作

```html
var db = openDatabase('ysdb', '1.0', 'My first DB', 2 * 1024 * 1024);
db.transaction(function (tx) {  
   tx.executeSql('CREATE TABLE IF NOT EXISTS logs (id unique, log)');
});
```

上面的范例执行后会在 'ysdb' 数据库中创建一个名为 logs 的表

## 插入数据

创建了数据库后，我们可以使用下面的语句插入一些数据

```html
var db = openDatabase('ysdb', '1.0', 'My first DB', 2 * 1024 * 1024);
db.transaction(function (tx) {
   tx.executeSql('CREATE TABLE IF NOT EXISTS logs (id unique, log)');
   tx.executeSql('INSERT INTO logs (id, log) VALUES (1, "DDKK.COM 弟弟快看，程序员编程资料站")');
   tx.executeSql('INSERT INTO logs (id, log) VALUES (2, "www.ddkk.com")');
});
```

我们也可以使用动态值来插入数据

```html
var db = openDatabase('ysdb', '1.0', 'My first DB', 2 * 1024 * 1024);
db.transaction(function (tx) {  
  tx.executeSql('CREATE TABLE IF NOT EXISTS logs (id unique, log)');
  tx.executeSql('INSERT INTO logs (id,log) VALUES (?, ?)', [e_id, e_log]);
});
```

范例中的 e_id 和 e_log 是外部变量，executeSql 会映射数组参数中的每个条目给 "?"

## 读取数据

我们可以使用下面的语句从读取数据库中已经存在的数据

```html
var db = openDatabase('ysdb', '1.0', 'My first DB', 2 * 1024 * 1024);
db.transaction(function (tx) {
   tx.executeSql('CREATE TABLE IF NOT EXISTS logs (id unique, log)');
   tx.executeSql('INSERT INTO logs (id, log) VALUES (1, "DDKK.COM 弟弟快看，程序员编程资料站")');
   tx.executeSql('INSERT INTO logs (id, log) VALUES (2, "www.ddkk.com")');
});
db.transaction(function (tx) {
   tx.executeSql('SELECT * FROM logs', [], function (tx, results) {
      var len = results.rows.length, i;
      msg = "<p>查询记录条数: " + len + "</p>";
      document.querySelector('#status').innerHTML +=  msg;
      for (i = 0; i < len; i++){
         alert(results.rows.item(i).log );
      }
   }, null);
});
```

## 完整的范例

```html
var db = openDatabase('ysdb', '1.0', 'My first DB', 2 * 1024 * 1024);
var msg;
db.transaction(function (tx) {
    tx.executeSql('CREATE TABLE IF NOT EXISTS logs (id unique, log)');
    tx.executeSql('INSERT INTO logs (id, log) VALUES (1, "DDKK.COM 弟弟快看，程序员编程资料站")');
    tx.executeSql('INSERT INTO logs (id, log) VALUES (2, "www.ddkk.com")');
    msg = '<p>数据表已创建，且插入了两条数据</p>';
    document.querySelector('#status').innerHTML =  msg;
});
db.transaction(function (tx) {
tx.executeSql('SELECT * FROM logs', [], function (tx, results) {
    var len = results.rows.length, i;
    msg = "<p>查询记录条数: " + len + "</p>";
    document.querySelector('#status').innerHTML +=  msg;
    for (i = 0; i < len; i++){
        msg = "<p><b>" + results.rows.item(i).log + "</b></p>";
        document.querySelector('#status').innerHTML +=  msg;
    }
}, null);
});
```

运行以上范例，浏览器显示如下

## 删除记录

我们可以使用下面的语句来删除记录

```html
db.transaction(function (tx) {
    tx.executeSql('DELETE FROM logs  WHERE id=1');
});
```

删除指定的数据 id 也可以是动态的

```html
db.transaction(function(tx) {
    tx.executeSql('DELETE FROM logs WHERE id=?', [id]);
});
```

## 更新记录

我们可以使用下面的语句来更新记录

```html
db.transaction(function (tx) {
    tx.executeSql('UPDATE logs SET log=\'ddkk.cn\' WHERE id=2');
});
```

更新指定的数据 id 也可以是动态的

```html
db.transaction(function(tx) {
    tx.executeSql('UPDATE logs SET log=\'ddkk.cn\' WHERE id=?', [id]);
});
```

## 完整范例

```html
var db = openDatabase('ysdb', '1.0', 'My first DB', 2 * 1024 * 1024);
var msg;
 db.transaction(function (tx) {
    tx.executeSql('CREATE TABLE IF NOT EXISTS logs (id unique, log)');
    tx.executeSql('INSERT INTO logs (id, log) VALUES (1, "DDKK.COM 弟弟快看，程序员编程资料站")');
    tx.executeSql('INSERT INTO logs (id, log) VALUES (2, "www.ddkk.com")');
    msg = '<p>数据表已创建，且插入了两条数据。</p>';
    document.querySelector('#status').innerHTML =  msg;
 });
 db.transaction(function (tx) {
      tx.executeSql('DELETE FROM logs  WHERE id=1');
      msg = '<p>删除 id 为 1 的记录。</p>';
      document.querySelector('#status').innerHTML =  msg;
 });
 db.transaction(function (tx) {
     tx.executeSql('UPDATE logs SET log=\'ddkk.cn\' WHERE id=2');
      msg = '<p>更新 id 为 2 的记录。</p>';
      document.querySelector('#status').innerHTML =  msg;
 });
 db.transaction(function (tx) {
    tx.executeSql('SELECT * FROM logs', [], function (tx, results) {
       var len = results.rows.length, i;
       msg = "<p>查询记录条数: " + len + "</p>";
       document.querySelector('#status').innerHTML +=  msg;
       for (i = 0; i < len; i++){
          msg = "<p><b>" + results.rows.item(i).log + "</b></p>";
          document.querySelector('#status').innerHTML +=  msg;
       }
    }, null);
 });
```

运行以上范例，浏览器显示如下
