# 03、JDBC 教程 - JDBC 连接 Oracle 数据库的具体流程
- 来源：https://ddkk.com/zhuanlan/db/jdbc/1/3.html
- 分类：缓存数据库
- 分组：教程目录
## JDBC 连接数据库的具体流程

### 一、引入数据库的驱动 jar 包

Oracle：[ojdbc6.jar](https://pan.baidu.com/s/1m5NYRkkQ8CXwLWzM8bD7Yg)，提取码：hahg，链接失效请留言 。

### 二、获取连接

**1、** 获取连接需要两步，一是使用DriverManager来注册驱动，二是使用DriverManager来获取Connection对象；

注册驱动就只有一句话：`Class.forName(“oracle.jdbc.OracleDriver”);`

获取连接的也只有一句代码：`DriverManager.getConnection(url,username,password);`

① username 和 password 是登录数据库的用户名和密码

② url 相对复杂一点，它是用来找到要连接数据库 “网址”，就好比你要浏览器中查找百度时，也需要提供一个 url。

**2、** oracle的url：`jdbc:oracle:thin:@127.0.0.1:1521:orcl`；

JDBC 规定 url 的格式由三部分组成，每个部分中间使用冒号分隔。

① 第一部分是 jdbc，这是固定的；

② 第二部分是数据库名称，那么连接 oracle 数据库，第二部分当然是 oracle 了；

③ 第三部分是由数据库厂商规定的，我们需要了解每个数据库厂商的要求，oracle 的第三部分分别由数据库服务器的 IP 地址（localhost）、端口号（1521），以及 DATABASE 名称（orcl）组成。

**3、** 获取连接的语句：；

```java
Connection con = DriverManager.getConnection("jdbc:oracle:thin:@127.0.0.1:1521:orcl","username","password");
```

### 三、获取 Statement

在得到Connectoin 之后，说明已经与数据库连接上了，下面是通过 Connection 获取 Statement 对象的代码：`Statement stmt = con.createStatement();`，Statement 是用来向数据库发送要执行的 SQL 语句的！

### 四、发送SQL增、删、改语句

示例

```java
// 定义 sql 插入语句
String sql = "insert into person(id,name,gender,birthday)values(personid.nextval,'魏宇轩','1',to_date('1997-09-23','yyyy-mm-dd'))";
// 定义 sql 更新语句
String sql = "update person t set t.gender = '2',t.birthday=to_date('2000-09-23','yyyy-mm-dd') where t.id=2";
// 定义 sql 删除语句
String sql = "delete person t where t.id=2";
// 创建 sql 执行对象
stmt = conn.createStatement();			
// 执行查询 sql 并返回更新条数
int count = stmt.executeUpdate(sql);	
```

（1）其中 int 类型的返回值表示执行这条 SQL 语句所影响的行数，我们知道，对 insert 来说，最后只能影响一行，而 update 和 delete 可能会影响 0~n 行。

（2）如果 SQL 语句执行失败，那么 executeUpdate() 会抛出一个 SQLException。

### 五、发送 SQL 查询语句

**1、** 示例；

```java
String sql = "select * from personr";
ResultSet rs = stmt.executeQuery(sql);
```

请注意，执行查询使用的不是 executeUpdate() 方法，而是 executeQuery() 方法。executeQuery() 方法返回的是 ResultSet，ResultSet 封装了查询结果，我们称之为结果集。
**2、** 如果是查询读取结果集中的数据；

ResultSet 就是一张二维的表格，它内部有一个 “行光标”，光标默认的位置在 “第一行上方”，我们可以调用 rs 对象的 next() 方法把 “行光标” 向下移动一行，当第一次调用 next() 方法时，“行光标”就到了第一行记录的位置，这时就可以使用 ResultSet 提供的 getXXX(int col) 方法来获取指定列的数据了：

```java
rs.next();//光标移动到下一行
rs.getInt(1);//获取第一行第一列的数据
```

当你使用 rs.getInt(1) 方法时，你必须可以肯定第 1 列的数据类型就是int类型，如果你不能肯定，那么最好使用 rs.getObject(1)。在 ResultSet 类中提供了一系列的 getXXX() 方法，比较常用的方法有：

```java
Object getObject(int col)
String getString(int col)
int getInt(int col)
double getDouble(int col)
```

更多请参见 API

### 六、关闭资源

与IO 流一样，使用后的东西都需要关闭！关闭的顺序是先得到的后关闭，后得到的先关闭。

```java
rs.close();
stmt.close();
con.close(); 
```

## 示例见后两讲

如有错误，欢迎指正!
