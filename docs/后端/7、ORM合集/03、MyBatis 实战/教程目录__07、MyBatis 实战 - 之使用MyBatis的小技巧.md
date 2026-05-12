# 07、MyBatis 实战 - 之使用MyBatis的小技巧
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/6/7.html
- 分类：ORM框架
- 分组：教程目录
## 一、#{}和${}的区别

### 1、演示代码

#### （1）准备实体类 Account

```java
package com.powernode.bank.pojo;
public class Account {
    private Long id ;
    private String actno;
    private Double balance;
    ....
```

#### （2）准备 AccountMapper.xml文件

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="account">
    <select id="selectByActno" resultType="com.powernode.bank.pojo.Account">
        select * from t_act where actno ={actno}
    </select>
</mapper>
```

#### （3）测试类

```java
public class Test {
    @org.junit.Test
    public void test1(){
        SqlSession sqlSession = SqlSessionUtil.openSqlSession();
        Account account = sqlSession.selectOne("account.selectByActno", "act001");
        System.out.println(account.toString());
    }
}
```

```java
先测试 {} 语法，运行结果如下：
```

```java
17:03:22.973 default [main] DEBUG o.a.i.t.jdbc.JdbcTransaction - Setting autocommit to false on JDBC Connection [com.mysql.cj.jdbc.ConnectionImpl@71ba6d4e]
17:03:22.978 default [main] DEBUG account.selectByActno - ==>  Preparing: select * from t_act where actno = ?
17:03:23.026 default [main] DEBUG account.selectByActno - ==> Parameters: act001(String)
17:03:23.080 default [main] DEBUG account.selectByActno - <==      Total: 1
Account{
     id=1, actno='act001', balance=10004.0}
```

```java
在测试 ${}语法，运行结果如下：
```

```java
17:04:15.335 default [main] DEBUG o.a.i.t.jdbc.JdbcTransaction - Setting autocommit to false on JDBC Connection [com.mysql.cj.jdbc.ConnectionImpl@1cf6d1be]
17:04:15.342 default [main] DEBUG account.selectByActno - ==>  Preparing: select * from t_act where actno = act001
17:04:15.414 default [main] DEBUG account.selectByActno - ==> Parameters: 
org.apache.ibatis.exceptions.PersistenceException: 
### Error querying database.  Cause: java.sql.SQLSyntaxErrorException: Unknown column 'act001' in 'where clause'
```

### 2、区别描述

```java
1、#{}:底层使用PreparedStatement。特点:先进行SQL语句的编译，
然后给SQL语句的占位符问号?传值。可以避免SQL注入的风险。
2、${}:底层使用Statement。特点:先进行SQL语句的拼接，
然后再对SQL语句进行编译。存在SQL注入的风险。优先使用#{}，这是原则。
避免SQL注入的风险。
```

## 二、什么时候使用 ${}

```java
1、当需要往sql语句中，传入关键字时，可以是使用${}，比如 前端传递排序字段值 asc或者 desc
```

案例场景：前台传入排序字段值，该值为mysql关键字，我们分别使用#{}和`$`{}来处理：

```java
#{
     }的执行结果，将关键字加了单引号 ，造成语法错误:
select car_num as carNum, brandfrom t car order by produce_time 'asc'
```

```java
${
     }的执行结果，相当于拼接了关键字:
select car_num as carNum, brandfrom t car order by produce_time asc
```

```java
2、或者想先进行sql语句拼接，然后再对sql语句进行编译，再执行时，也可以使用 ${} 
```

## 三、拼接表名

```java
场景：
现实业务当中，可能会存在分表存储数据的情况。因为一张表存的话，数据量太大。查询效率比较低。可以将这些数据有规律的分表存储，这样在查询的时候效率就比较高。因为扫描的数据量变少了。
日志表:专门存储日志信息的。如果t_log只有一张表，这张表中每一天都会产生很多log，慢慢的，这个表中数据会很多。
怎么解决问题?
可以每天生成一个新表。每张表以当天日期作为名称，例如:
t_log_20220901 t_log_20220902
....
你想知道某一天的日志信息怎么办?
假设今天是20220901，那么直接查:t_log_20220901的表即可。
所以 ，向SQL语句当中拼接表名，就需要使用${}
```

## 四、批量删除

```java
1、批量删除:一次删除多条记录。
2、批量删除的SQL语句有两种写法:
第一种or: delete from t car where id=1 or id=2 or id=3
第二种int: delete from t car where id in(1,2,3);
应该采用 ${} 的方式:
delete from t_car where id in(${ids});
代码如下：
```

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="account">
    <delete id="deleteBatch">
        delete from t_act where id in (${ids})
    </delete>
</mapper>
```

```java
	@Test
    public void testDelete(){
        SqlSession sqlSession = SqlSessionUtil.openSqlSession();
        int deleteBatch = sqlSession.delete("deleteBatch", "1,2");
        System.out.println(deleteBatch);
        sqlSession.commit();
        sqlSession.close();
    }
```

```java
运行结果
```

```java
22:20:06.304 default [main] DEBUG account.deleteBatch - ==>  Preparing: delete from t_act where id in (1,2)
22:20:06.376 default [main] DEBUG account.deleteBatch - ==> Parameters: 
22:20:06.380 default [main] DEBUG account.deleteBatch - <==    Updates: 2
2
```

## 五、模糊查询

**模糊查询: like**

```java
需求:根据汽车品牌进行模糊查询
select * from t car where brand like'%奔驰%'; 
select * from t car where brand like'%比亚迪%';
在mybatis的xml文件中有如下写法：
第一种方案:	'%${brand}%'
第二种方案:concat函数，这个是mysql数据库当中的一个函数，专门进行字符串拼接
concat('%' ,#{brand},'%')
第三种方案:比较鸡肋了。可以不算。
concat('%','${brand}', '%')
第四种方案:		"%"#{brand} "%"
```

## 六、起别名

```java
1、核心配置文件mybatis-config.xml 增加typeAliases标签,用来配置别名
```

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
        PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
    <properties resource="jdbc.properties"/>
    <typeAliases>
        <typeAlias type="com.powernode.bank.pojo.Account" alias="account"/>
    </typeAliases>
    <environments default="development">
    .......
```

```java
2、修改sql文件，resultType的值可以直接使用别名，并且不区分大小写
```

```xml
<select id="selectActLike" resultType="account">
          select * from t_act where actno like concat ('',#{actno},'%')
    </select>
```

## 七、mybatis-config.xml文件的mapper配置

**1、mybatis-config.xml文件中的mappers标签。**

```xml
<mapper resource="CarMapper.xml"/> 要求类的根路径下必须有:CarMapper.xml
<mapper url="file:///d:/CarMapper.xml"/> 要求在d:/下有CarMapper.xml文件
<mapper class="全限定接口名，带有包名"/>
```

**2、mapper标签的属性可以有三个:**

```java
resource:这种方式是从类的根路径下开始查找资源。采用这种方式的话，
你的配置文件需要放到类路径当中才行。
url:这种方式是一种绝对路径的方式，这种方式不要求配置文件必须放到类路径当中，
哪里都行，只要提供一个绝对路径就行。这种方式使用极少
 class:这个位置提供的是mapper接口的全限定接口名，必须带有包名的。
```

**3、思考:mapper标签的作用是指定SalMapper.xml文件的路径，指定接口名有什么用呢?**

```xml
<mapper class="com.powernode.mybatis.mapper.CarMapper"/>
如果你class指定是:com.powernode.mybatis.mapper.CarMapper
那么mybatis框架会自动去com/powernode/mybatis/mapper目录下查找CarMapper.xml文件。
```

**注意:也就是说:**

```java
如果你采用这种方式，那么你必须保证CarMapper.xml文件和CarMapper接口必须在同一个目录下。
并且名字一致。 CarMapper接口-> CarMapper.xml LogMapper接口-> LogMapper.xml
....
```

## 八、获取插入数据时自动生成的主键

```xml
<insert id="insertAct" useGeneratedKeys="true" keyProperty="id">
        insert into t_act values (null,#{actno},#{balance})
    </insert>
```

说明：

```java
useGeneratedKeys="true"  使用自动生成的主键值
keyProperty="id"	 指定主键值赋给对象的哪个属性
```
