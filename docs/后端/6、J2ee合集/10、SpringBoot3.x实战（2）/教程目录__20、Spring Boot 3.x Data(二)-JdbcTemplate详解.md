# 20、Spring Boot 3.x Data(二)-JdbcTemplate详解
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/9/20.html
- 分类：Spring Boot 3.x 实战
- 分组：教程目录
本节将介绍如何使用`JDBC`核心类来控制基本的`JDBC`处理，包括错误处理。

### 数据库准备

本文已`mysql5.7`数据库为例:

```java
DROP TABLE IF EXISTS tb_student;
CREATE TABLE tb_student (
  id int(11) NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  name varchar(255) COLLATE utf8mb4_bin DEFAULT NULL COMMENT '姓名',
  sex tinyint(1) DEFAULT NULL COMMENT '性别',
  age int(11) DEFAULT NULL COMMENT '年龄',
  grade varchar(255) COLLATE utf8mb4_bin DEFAULT NULL COMMENT '年级',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
```

```java
INSERT INTO tb_student VALUES (1, '张三', 1, 14, '初中');
INSERT INTO tb_student VALUES (2, '李四', 1, 16, '高中');
```

### 引入依赖

```java
<!--jdbctemplate 依赖-->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-jdbc</artifactId>
</dependency>
<!-- mysql驱动 -->
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <scope>runtime</scope>
</dependency>
```

### 配置数据源

```java
spring:
  datasource:
   数据库驱动完整类名
    driver-class-name: com.mysql.jdbc.Driver
   数据库连接url
    url: jdbc:mysql://127.0.0.1:3306/spring-boot-data-learn
   数据库用户名
    username: root
   数据库密码
    password: 123456
  jdbc:
    template:
      fetch-size: -1
      max-rows: -1
     查询超时。默认是使用JDBC驱动程序的默认配置。如果没有指定持续时间后缀，则使用seconds。
      query-timeout:
```

`spring.jdbc.template.max-rows`: 将此 `Statement` 对象生成的所有 `ResultSet` 对象可以包含的最大行数限制设置为给定数。最大以后的数据会被丢掉，设置这个参数虽然可以避免报内存错误，不过此方法局限性比较大，一般情况下是需要获取所有符合条件的数据。这个方法和`limit`类似。默认值`-1`,使用`JDBC`驱动程序的默认配置。

`spring.jdbc.template.fetch-size`:为 JDBC 驱动程序提供一个提示，它提示此 `Statement` 生成的 `ResultSet` 对象需要更多行时应该从数据库获取的行数。Spring Boot中默认值`-1`,使用`JDBC`驱动程序的默认配置(默认值为`0`一次性获取数据),在自动提交模式下无效，需设置`autocommit`为`false`。

> jdbc fetch-size实现原理：
>
> 1、先在服务端执行查询后将数据缓存在服务端。
>
> 2、java端获取数据时，利用服务端游标进行指针跳动，如果fetchSize为1000，则一次性跳动1000条，返回给java端缓存起来。（耗时较短，跳动次数为N/1000）
>
> 3、在调用next函数时，优先从缓存中取数

### JdbcTemplate自动配置

Spring的`JdbcTemplate`和`NamedParameterJdbcTemplate`类在Spring Boot中自动配置的，你可以直接将它们`@Autowire`到你自己的`bean`中。

```java
@Component
public class StudentDao {
    private final JdbcTemplate jdbcTemplate;
    public StudentDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }
    public void select(){
        this.jdbcTemplate.queryForList("select * from tb_student");
    }
}
```

### 执行SQL打印配置

```java
logging:
  level:
    org.springframework.jdbc.core.JdbcTemplate: DEBUG
```

## JdbcTemplate使用

`JdbcTemplate`是`JDBC`核心包中的中心类，它处理资源的创建和释放，这有助于避免常见错误，比如忘记关闭连接。它执行核心`JDBC`工作流的基本任务(如语句创建和执行)，而让应用程序代码提供`SQL`并提取结果。

`JdbcTemplate`类功能如下：

- 运行SQL查询
- update语句和存储过程调用
- 对ResultSet实例进行迭代并提取返回的参数值。
- 捕获JDBC异常并将其转换为泛型, 异常层次结构定义在org.springframework.dao包中。

### 查询(select)

**下面的查询获取行数:**

```java
public Integer count() {
   return this.jdbcTemplate.queryForObject("select count(*) from tb_student", Integer.class);
}
```

**下面的查询使用了一个绑定变量:**

```java
public Integer countByName(String name) {
    return this.jdbcTemplate.queryForObject("select count(*) from tb_student where name=?", Integer.class, name);
}
```

```java
@Test
void daoTest() {
    Integer count = studentDao.countByName("张三");
}
```

```java
SQL statement [select count(*) from tb_student where name='张三']
```

**下面的查询查找一个字符串:**

```java
public String selectName(Integer id) {
    return this.jdbcTemplate.queryForObject("select name from tb_student where id=?", String.class, id);
}
```

```java
@Test
void daoTest() {
    studentDao.selectName(1);
}
```

```java
SQL statement [select name from tb_student where id=1]
```

**查询并填充单个对象:**

新建实体对象:

```java
public class Student implements Serializable {
    private Integer id;
    private String name;
    private Integer sex;
    private Integer age;
    private String grade;
    //get set
}
```

新建查询：

```java
public Student selectById(Integer id) {
    return this.jdbcTemplate.queryForObject("select * from tb_student where id=?", (resultSet, rowNum) -> {
        Student student = new Student();
        student.setId(resultSet.getInt("id"));
        student.setName(resultSet.getString("name"));
        student.setSex(resultSet.getInt("sex"));
        student.setAge(resultSet.getInt("age"));
        student.setGrade(resultSet.getString("grade"));
        return student;
    }, id);
}
```

测试：

```java
Student student=studentDao.selectById(1);
```

```java
Student{
 id=1, name='张三', sex=1, age=14, grade='初中'}
```

**查询并填充List对象:**

```java
public List<Student> list() {
    return this.jdbcTemplate.query("select * form tb_student", (resultSet, rowNum) -> {
        Student student = new Student();
        student.setId(resultSet.getInt("id"));
        student.setName(resultSet.getString("name"));
        student.setSex(resultSet.getInt("sex"));
        student.setAge(resultSet.getInt("age"));
        student.setGrade(resultSet.getString("grade"));
        return student;
    });
}
```

上面填充单个对象和`List`对象，有重复的代码，删除两个`RowMapper``lambda`表达式中出现的重复，并将它们提取到一个字段中，然后根据需要由`DAO`方法引用，这样做是有意义的。

```java
private final RowMapper<Student> studentRowMapper = (resultSet, rowNum) -> {
    Student student = new Student();
    student.setId(resultSet.getInt("id"));
    student.setName(resultSet.getString("name"));
    student.setSex(resultSet.getInt("sex"));
    student.setAge(resultSet.getInt("age"));
    student.setGrade(resultSet.getString("grade"));
    return student;
};
public List<Student> list() {
    return this.jdbcTemplate.query("select * from tb_student", studentRowMapper);
}
```

### Update(INSERT, UPDATE, DELETE)

可以使用`update(..)`方法执行`插入`、`更新`和`删除`操作。

**插入数据：**

```java
public void insert(Student student) {
    this.jdbcTemplate.update("insert into tb_student (name,sex,age,grade) value (?,?,?,?)",
            student.getName(), student.getSex(), student.getSex(), student.getGrade());
}
```

测试

```java
@Test
void daoTest() {
    Student student = new Student();
    student.setName("王五");
    student.setSex(1);
    student.setAge(20);
    student.setGrade("大学");
    studentDao.insert(student);
    }
```

```java
SQL statement [insert into tb_student (name,sex,age,grade) value ('王五',1,20,'大学')]
```

**更新数据**

```java
this.jdbcTemplate.update(
    "update tb_student set grade = ? where id = ?",
    "大学", 2);
```

**删除数据**

```java
this.jdbcTemplate.update(
        "delete from tb_student  where id = ?",
       2);
```

### 其它操作

可以使用`execute(..)`方法运行任意`SQL`。因此，该方法经常用于`DDL`语句。

```java
this.jdbcTemplate.execute("create table mytable (id integer, name varchar(100))");
```

下面的例子调用了一个存储过程:

```java
this.jdbcTemplate.update(
        "call SUPPORT.REFRESH_ACTORS_SUMMARY(?)",
        Long.valueOf(unionId));
```

**批量更新：**

```java
public void batchUpdate(List<Student> students) {
    this.jdbcTemplate.batchUpdate("insert into tb_student (name,sex,age,grade) value (?,?,?,?)", new BatchPreparedStatementSetter() {
        @Override
        public void setValues(PreparedStatement ps, int i) throws SQLException {
            ps.setString(1, students.get(i).getName());
            ps.setInt(2, students.get(2).getSex());
        }
        @Override
        public int getBatchSize() {
            return students.size();
        }
    });
}
```

## 总结

以上把`JdbcTemplate`常见的操作实践了一遍，详细的细节可以参考官方文档。[jdbc-core](https://docs.spring.io/spring-framework/docs/6.0.0-M3/reference/html/data-access.html#jdbc-core)
