# 30、Spring Boot 3.x - MybatisPlus集成
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/9/30.html
- 分类：Spring Boot 3.x 实战
- 分组：教程目录
**官网介绍:**

> MyBatis-Plus （简称 MP）是一个 MyBatis 的增强工具，在 MyBatis 的基础上只做增强不做改变，为简化开发、提高效率而生。

## 一、快速开始

数据使用`mysql`

### 1.数据库表和数据准备

表

```java
DROP TABLE IF EXISTS tb_student;
CREATE TABLE tb_student (
  id int(11) NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  name varchar(255) COLLATE utf8mb4_bin DEFAULT NULL COMMENT '姓名',
  sex int(1) DEFAULT NULL COMMENT '性别',
  age int(11) DEFAULT NULL COMMENT '年龄',
  grade varchar(255) COLLATE utf8mb4_bin DEFAULT NULL COMMENT '年级',
  PRIMARY KEY (id)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
```

数据

```java
INSERT INTO tb_student VALUES (1, '张三', 1, 14, '初中');
INSERT INTO tb_student VALUES (2, '李四', 1, 16, '高中');
INSERT INTO tb_student VALUES (3, '王五', 1, 20, '大学');
INSERT INTO tb_student VALUES (5, '小红', 0, 20, '大学');
INSERT INTO tb_student VALUES (8, '大牛', 1, 30, '博士');
```

### 2.新增项目&导入依赖

使用`SpringInitializr`新增项目

导入依赖

添加`mybatisplus`依赖

```java
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-boot-starter</artifactId>
    <version>3.5.1</version>
</dependency>
```

```java
在这里插入代码片
```

### 3.配置

在`application.yaml`中添加数据库相关配置

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
```

启动类中添加 `@MapperScan` 注解，扫描 `Mapper` 文件夹：

```java
@SpringBootApplication
@MapperScan(basePackages = "com.example.springbootmybatisplusdemo.mapper")
public class SpringBootMybatisplusDemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(SpringBootMybatisplusDemoApplication.class, args);
    }
}
```

### 4.开发编码

**1、** 新建表对应的实体类`Student`；

```java
@Data
//表名与实体类名称不一致需要手动指定表名
@TableName("tb_student")
public class Student implements Serializable {
    private Integer id;
    private String name;
    private Integer sex;
    private Integer age;
    private String grade;
}
```

**2、**`mapper`文件夹下新建`StudentMapper`接口；

```java
public interface StudentMapper extends BaseMapper<Student> {
}
```

### 5.运行测试

```java
@SpringBootTest
class SpringBootMybatisplusDemoApplicationTests {
    @Autowired
    private StudentMapper studentMapper;
    @Test
    public void testSelectList() {
        System.out.println(("----- selectAll method test ------"));
        List<Student> userList = studentMapper.selectList(null);
        userList.forEach(System.out::println);
    }
}
```

控制台输出：

```java
Student(id=1, name=张三, sex=1, age=14, grade=初中)
Student(id=2, name=李四, sex=1, age=16, grade=高中)
Student(id=3, name=王五, sex=1, age=20, grade=大学)
Student(id=5, name=小红, sex=0, age=20, grade=大学)
Student(id=8, name=大牛, sex=1, age=30, grade=博士)
```

## 二、注解

注解详细内容参见官网：[MybatisPlus注解](https://baomidou.com/pages/223848/)

注解
功能

@TableName
标示实体对应的表

@TableId
主键注解

@TableField
字段 注解非主键

@Version
乐观锁注解

@EnumValue
普通枚举类注解(注解在枚举字段上)

@TableLogic
表字段逻辑处理注解（逻辑删除）

@OrderBy
内置 SQL 默认指定排序，优先级低于 wrapper 条件查询

## 三、测试

自动导入 `MyBatis-Plus` 测试所需相关配置，通过 `@MybatisPlusTest` 注解快速配置测试类。

```java
@MybatisPlusTest
//因为使用的是外部数据库，不是嵌入式数据库，因此需要加入此注解
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
public class MybatisPlusTestDemo {
    @Autowired
    private StudentMapper studentMapper;
    @Test
    void testSelectAll() {
        Student student = new Student();
        student.setName("赵六");
        student.setSex(1);
        student.setAge(40);
        student.setGrade("博士");
        studentMapper.insert(student);
        assertThat(student.getId()).isNotNull();
    }
}
```

## 四、CRUD

官方文档地址：[CRUD](https://baomidou.com/pages/49cc81/#service-crud-%E6%8E%A5%E5%8F%A3)

### Service CRUD

**官网定义：**

> 通用 Service CRUD 封装IService 接口，进一步封装 CRUD 采用 get 查询单行 remove 删除 list 查询集合 page 分页 前缀命名方式区分 Mapper 层避免混淆，

增

```java
// 插入一条记录（选择字段，策略插入）
boolean save(T entity);
// 插入（批量）
boolean saveBatch(Collection<T> entityList);
// 插入（批量）
boolean saveBatch(Collection<T> entityList, int batchSize);
```

删

```java
// 根据 entity 条件，删除记录
boolean remove(Wrapper<T> queryWrapper);
// 根据 ID 删除
boolean removeById(Serializable id);
// 根据 columnMap 条件，删除记录
boolean removeByMap(Map<String, Object> columnMap);
// 删除（根据ID 批量删除）
boolean removeByIds(Collection<? extends Serializable> idList);
```

改

```java
// 根据 UpdateWrapper 条件，更新记录 需要设置sqlset
boolean update(Wrapper<T> updateWrapper);
// 根据 whereWrapper 条件，更新记录
boolean update(T updateEntity, Wrapper<T> whereWrapper);
// 根据 ID 选择修改
boolean updateById(T entity);
// 根据ID 批量更新
boolean updateBatchById(Collection<T> entityList);
// 根据ID 批量更新
boolean updateBatchById(Collection<T> entityList, int batchSize);
```

查

```java
// 根据 ID 查询
T getById(Serializable id);
// 根据 Wrapper，查询一条记录。结果集，如果是多个会抛出异常，随机取一条加上限制条件 wrapper.last("LIMIT 1")
T getOne(Wrapper<T> queryWrapper);
// 根据 Wrapper，查询一条记录
T getOne(Wrapper<T> queryWrapper, boolean throwEx);
// 根据 Wrapper，查询一条记录
Map<String, Object> getMap(Wrapper<T> queryWrapper);
// 根据 Wrapper，查询一条记录
<V> V getObj(Wrapper<T> queryWrapper, Function<? super Object, V> mapper);
//查询所有
List<T> list();
// 查询列表
List<T> list(Wrapper<T> queryWrapper);
// 查询（根据ID 批量查询）
Collection<T> listByIds(Collection<? extends Serializable> idList);
// 查询（根据 columnMap 条件）
Collection<T> listByMap(Map<String, Object> columnMap);
// 查询所有列表
List<Map<String, Object>> listMaps();
// 查询列表
List<Map<String, Object>> listMaps(Wrapper<T> queryWrapper);
// 查询全部记录
List<Object> listObjs();
// 查询全部记录
<V> List<V> listObjs(Function<? super Object, V> mapper);
// 根据 Wrapper 条件，查询全部记录
List<Object> listObjs(Wrapper<T> queryWrapper);
// 根据 Wrapper 条件，查询全部记录
<V> List<V> listObjs(Wrapper<T> queryWrapper, Function<? super Object, V> mapper);
//分页查
// 无条件分页查询
IPage<T> page(IPage<T> page);
// 条件分页查询
IPage<T> page(IPage<T> page, Wrapper<T> queryWrapper);
// 无条件分页查询
IPage<Map<String, Object>> pageMaps(IPage<T> page);
// 条件分页查询
IPage<Map<String, Object>> pageMaps(IPage<T> page, Wrapper<T> queryWrapper);
```

### Mapper CRUD

官网定义：

> 通用 CRUD 封装BaseMapper (opens new window)接口，为 Mybatis-Plus 启动时自动解析实体表关系映射转换为 Mybatis 内部对象注入容器

增

```java
// 插入一条记录
int insert(T entity);
```

删

```java
// 根据 entity 条件，删除记录
int delete(@Param(Constants.WRAPPER) Wrapper<T> wrapper);
// 删除（根据ID 批量删除）
int deleteBatchIds(@Param(Constants.COLLECTION) Collection<? extends Serializable> idList);
// 根据 ID 删除
int deleteById(Serializable id);
// 根据 columnMap 条件，删除记录
int deleteByMap(@Param(Constants.COLUMN_MAP) Map<String, Object> columnMap);
```

改

```java
/ 根据 whereWrapper 条件，更新记录
int update(@Param(Constants.ENTITY) T updateEntity, @Param(Constants.WRAPPER) Wrapper<T> whereWrapper);
// 根据 ID 修改
int updateById(@Param(Constants.ENTITY) T entity);
```

查

```java
// 根据 ID 查询
T selectById(Serializable id);
// 根据 entity 条件，查询一条记录
T selectOne(@Param(Constants.WRAPPER) Wrapper<T> queryWrapper);
// 查询（根据ID 批量查询）
List<T> selectBatchIds(@Param(Constants.COLLECTION) Collection<? extends Serializable> idList);
// 根据 entity 条件，查询全部记录
List<T> selectList(@Param(Constants.WRAPPER) Wrapper<T> queryWrapper);
// 查询（根据 columnMap 条件）
List<T> selectByMap(@Param(Constants.COLUMN_MAP) Map<String, Object> columnMap);
// 根据 Wrapper 条件，查询全部记录
List<Map<String, Object>> selectMaps(@Param(Constants.WRAPPER) Wrapper<T> queryWrapper);
// 根据 Wrapper 条件，查询全部记录。注意： 只返回第一个字段的值
List<Object> selectObjs(@Param(Constants.WRAPPER) Wrapper<T> queryWrapper);
// 根据 entity 条件，查询全部记录（并翻页）
IPage<T> selectPage(IPage<T> page, @Param(Constants.WRAPPER) Wrapper<T> queryWrapper);
// 根据 Wrapper 条件，查询全部记录（并翻页）
IPage<Map<String, Object>> selectMapsPage(IPage<T> page, @Param(Constants.WRAPPER) Wrapper<T> queryWrapper);
// 根据 Wrapper 条件，查询总记录数
Integer selectCount(@Param(Constants.WRAPPER) Wrapper<T> queryWrapper);
```

## 五、完整CRUD例子

entity：

```java
@Data
@TableName("tb_student")
public class Student implements Serializable {
    private Integer id;
    private String name;
    private Integer sex;
    private Integer age;
    private String grade;
}
```

mapper:

```java
public interface StudentMapper extends BaseMapper<Student> {
}
```

service接口:

```java
public interface IStudentService extends IService<Student> {
}
```

service实现：

```java
@Service("studentService")
public class StudentServiceImpl extends ServiceImpl<StudentMapper, Student> implements IStudentService {
}
```

测试：

```java
 @Autowired
private IStudentService studentService;
@Test
public  void testCRUD(){
   Student student= studentService.getById(5);
   System.out.println(student);
   studentService.removeById(5);
    Student student1 = new Student();
    student.setName("赵六");
    student.setSex(1);
    student.setAge(40);
    student.setGrade("博士");
   studentService.save(student1);
}
```

项目结构

[源代码](https://download.csdn.net/download/renpeng301/85329243)
