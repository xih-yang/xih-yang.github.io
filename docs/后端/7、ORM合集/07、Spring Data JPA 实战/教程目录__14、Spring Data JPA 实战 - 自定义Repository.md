# 14、Spring Data JPA 实战 - 自定义Repository
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/1/14.html
- 分类：ORM框架
- 分组：教程目录
有些时候，我们需要自定义Repository实现一些特殊的业务场景。

### 1、自定义单个Repository

1.1、首先提供一个片段接口和实现（接口的实现默认要使用Impl为后缀，实现本身不依赖spring-data，可以是常规的spring-bean，所以可以注入其他的bean，例如JdbcTemplate）。

```java
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
public interface StudentRepositoryCustomJdbc {
    List<Student> findStudentByJdbcName(String name);
}
/**
 * 默认要以Impl结尾
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
public class StudentRepositoryCustomJdbcImpl implements StudentRepositoryCustomJdbc {
    @Resource
    private JdbcTemplate jdbcTemplate;
    @Override
    public List<Student> findStudentByJdbcName(String name) {
        String sql = "SELECT * FROM cfq_jpa_student WHERE name = " + "'" + name + "'";
        return jdbcTemplate.query(sql, BeanPropertyRowMapper.newInstance(Student.class));
    }
}
```

1.2、自己的Repository继承自定义接口，就可以使用拓展的功能了。

```java
/**
 * 继承jpa的repository，和自己自定义的扩展
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
public interface StudentRepository extends JpaRepositoryImplementation<Student,Long>, StudentRepositoryCustomJdbc {
}
```

1.3、测试如下：

```java
@BeforeEach
void setup(){
    Student s1 = Student.builder().name("张三").age(23).build();
    Student s2 = Student.builder().name("李四").age(24).build();
    Student s3 = Student.builder().name("王五").age(25).build();
    studentRepository.saveAll(Lists.newArrayList(s1,s2,s3));
}
@Test
void testFindStudentByJdbcName(){
    List<Student> list = studentRepository.findStudentByJdbcName("张三");
    list.forEach(s -> System.out.println(s.getName()));
}
```

1.4、控制台打印：

```java
Hibernate: insert into cfq_jpa_student (age, name) values (?, ?)
Hibernate: insert into cfq_jpa_student (age, name) values (?, ?)
Hibernate: insert into cfq_jpa_student (age, name) values (?, ?)
张三
```

1.5、自定义扩展可以有多个。自定义的优先级高于spring-data为我们提供的。

```java
/**
 * 继承jpa的repository，和自己自定义的扩展
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
public interface StudentRepository extends JpaRepositoryImplementation<Student,Long>, StudentRepositoryCustomJdbc,StudentRepositoryCustom<Student,Long> {
}
```

```java
/**
 * 自定义student功能
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
public interface StudentRepositoryCustom<T,ID> {
    Optional<T> findById(ID id);
}
/**
 * 自定义实现repository功能
 *
 * @author caofnqi
 */
@Slf4j
public class StudentRepositoryCustomImpl<T,ID> implements StudentRepositoryCustom<T,ID> {
    @PersistenceContext
    private EntityManager entityManager;
    @Override
    public Optional<T> findById(ID id) {
        log.info("自定义的findById");
        T t = (T) entityManager.find(Student.class, id);
        return Optional.of(t);
    }
}
```

**1、** 6、可以通过@EnableJpaRepositories的repositoryImplementationPostfix属性自定义后缀，默认是Impl；

```java
/**
 * 启动类
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
@SpringBootApplication
@EnableAsync
@EnableJpaRepositories(repositoryImplementationPostfix = "MyPostfix")
public class StudySpringDataJpaApplication {
    public static void main(String[] args) {
        SpringApplication.run(StudySpringDataJpaApplication.class, args);
    }
}
```

### 2、自定义BaseRepository

2.1、SpringDataJpa为我们提供的代理类其实是SimpleJpaRepository。

2.2、如果我们想要对所有的Repository的保存操作都进行记录日志，我们可以自定义BaseRepository，来充当代理类。（还可以是逻辑删除等场景）

2.2.1、自定义baseRepository

```java
/**
 * 自定义base Repository
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
@Slf4j
public class MyRepositoryImpl<T,ID> extends SimpleJpaRepository<T,ID> {
    private final EntityManager entityManager;
    MyRepositoryImpl(JpaEntityInformation entityInformation, EntityManager entityManager) {
        super(entityInformation, entityManager);
        this.entityManager = entityManager;
    }
    @Override
    public <S extends T> S save(S entity) {
        S save = super.save(entity);
        log.info("保存了：{}",save);
        return  save;
    }
}
```

2.2.2、告知Spring-Data-Jpa使用我们自定义的baseRepository

```java
/**
 * 启动类
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
@SpringBootApplication
@EnableAsync
@EnableJpaRepositories(
        /*queryLookupStrategy = QueryLookupStrategy.Key.CREATE_IF_NOT_FOUND*/
     /*   ,repositoryImplementationPostfix = "MyPostfix",*/
        repositoryBaseClass = MyRepositoryImpl.class)
public class StudySpringDataJpaApplication {
    public static void main(String[] args) {
        SpringApplication.run(StudySpringDataJpaApplication.class, args);
    }
}
```

2.2.3、再次测试testSave方法，如下

### 3、entityManager执行原生复杂sql返回DTO

使用方法派生查询和@Query注解查询时，我们可以使用投影来面向对象编程，但是使用entityManager执行原生sql复杂sql时，怎么返回实体呢？如下：

3.1、DTO

```java
/**
 * entityManager使用的结果映射，需要一个无参构造函数与set方法，这一点与投影不一样
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentAgeAndAgeCountDTO {
    private Integer age;
    private Long ageCount;
}
```

3.2、查询方法

```java
public List<StudentAgeAndAgeCountDTO> findCountGroupByAge(){
    /*
     *sql可以是更复杂的
     */
    String sql = "SELECT age,count(*) AS ageCount FROM cfq_jpa_student GROUP BY age ";
    Query nativeQuery = entityManager.createNativeQuery(sql);
    nativeQuery.unwrap(NativeQuery.class)
            //设置类型
            .addScalar("age", StandardBasicTypes.INTEGER)
            .addScalar("ageCount",StandardBasicTypes.LONG)
            //设置返回bean
            .setResultTransformer(Transformers.aliasToBean(StudentAgeAndAgeCountDTO.class));
    return nativeQuery.getResultList();
}
```

3.3、测试及结果

源码地址：https://github.com/caofanqi/study-spring-data-jpa
