# 10、Spring Data JPA 实战 - 注解式方法查询之@Query、@Modifying与派生delete
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/1/10.html
- 分类：ORM框架
- 分组：教程目录
### 1、@Query

对于少量的查询，使用@NamedQuery在实体上声明查询是一种有效的办法，并且可以很好的工作。由于查询本身绑定到执行它们的java方法，实际上可以通过Spring-Data-Jpa提供的@Query注解来直接绑定它们，而不是将它们注释到domain类。这将domain类从持久化特定信息中解放出来，并将查询共同定位到存储库接口。

1.1、@Query源码

```java
/**
 * 直接注解在repository方法上声明一个查找器
 *
 */
@Retention(RetentionPolicy.RUNTIME)
@Target({ ElementType.METHOD, ElementType.ANNOTATION_TYPE })
@QueryAnnotation
@Documented
public @interface Query {
    /**
     * 定义在执行带有@Query注解方法时，要执行的JPA查询。
     */
    String value() default "";
    /**
     * 定义一个特殊的count查询，用于分页查询时，查找页面元素的总个数。如果没有配置，将根据方法名派生一个count查询。
     */
    String countQuery() default "";
    /**
     *定义为countQuery查询生成的投影部分，如果没有配置countQuery和countProjection，将根据方法名派生count查询。
     */
    String countProjection() default "";
    /**
     * 配置给定的查询是否是原生SQL查询，默认是false，query中为JPQL语句，为true时，query中应写原声SQL语句。
     */
    boolean nativeQuery() default false;
    /**
     * named query使用，如果没有定义，@NamedQuery的名字使用{$ domainClass}.${queryMethodName}
     */
    String name() default "";
    /**
     * 返回在执行count查询时@NamedQuery使用的name，默认是named query name 添加后缀.count。
     */
    String countName() default "";
}
```

1.2、使用时，在Repository接口的方法上添加即可。

```java
/**
 *  通过用户名密码进行查询
 * @param username username
 * @param password password
 * @return User
 */
@Query(value = "select u from User u where u.username = ?1 and u.password = ?2 ")
User findByUsernameAndPassword(String username,String password);
```

1.3、可以识别LIKE的分隔符字符(%)，并将查询转换为有效的JPQL查询(删除%)。在执行查询时，传递给方法调用的参数将使用之前识别的LIKE模式进行扩充。

```java
/**
 * 查询以...开头的phone用户
 * @param phone phone
 * @return list
 */
@Query(value = "select u from User u where u.phone like ?1% ")
List<User> findByPhoneIsStartingWith(String phone);
```

1.4、Spring-Data-Jpa目前不支持对nativeQuery=true时的Sort动态排序，对于原生SQL来说，它不能可靠的执行这种操作。但是可以通过指定count查询来使用分页。

```java
/**
 * 根据性别查询并分页，原生SQL，不能使用SEX枚举，要使用String
 * @param sex sex
 * @param pageable pageable
 * @return page
 */
@Query(value = "SELECT * FROM cfq_jpa_user WHERE sex = ?1 ",
        countQuery = "SELECT count(*) FROM cfq_jpa_user WHERE sex = ?1 ",
        nativeQuery = true)
Page<User> findBySexString(String sex, Pageable pageable);
```

1.5、默认情况下，Spring-Data-Jpa拒绝任何包含函数调用的Order实例，可以通过起别名或JpaSort来替代。

接口方法;

```java
/**
 *  测试Order中不支持函数
 * @param sex sex
 * @param sort sort
 * @return list
 */
@Query(value = "select u.id,length(u.email) as em_len from User u where u.sex = ?1 ")
List<Object[]> findByAsArrayAndSort(Sex sex,Sort sort);
```

测试用例：

```java
/**
 * Sort中不支持使用函数，可以使用别名或JpaSort替代
 */
@Test
void findByAsArrayAndSort(){
    //sort指向domain模型中有效的属性,jpa会自动为我们加上表的别名,不需要自己添加，添加就会报错哦。
    List<Object[]> result1 = userRepository.findByAsArrayAndSort(Sex.MAN, Sort.by("email"));
    //Sort不支持使用函数
    //Sort expression 'length(email): ASC' must only contain property references or aliases used in the select clause. If you really want to use something other than that for sorting, please use JpaSort.unsafe(…)!
    assertThrows(InvalidDataAccessApiUsageException.class,() -> userRepository.findByAsArrayAndSort(Sex.MAN, Sort.by("length(email)")));
    //使用JpaSort的unsafe来使用函数
    List<Object[]> result2 = userRepository.findByAsArrayAndSort(Sex.MAN, JpaSort.unsafe("length(email)"));
    //可以使用别名来进行排序
    List<Object[]> result3 = userRepository.findByAsArrayAndSort(Sex.MAN, Sort.by("em_len"));
}
```

1.6、默认情况下，Spring-Data-Jpa是基于位置的参数绑定，当重构关于参数位置的查询方法时容易出错，可以使用@Param指定名称，进行名称绑定。如果参数名称和定义的名称一致，可以省略@Param。

```java
/**
 * 使用@Param进行参数名称绑定后，参数位置无所谓
 * @param ppp ppp
 * @param uuu uuu
 * @return list
 */
@Query(value = "select u from User u where u.username = :username or u.phone = :phone ")
List<User> findByPhoneOrUsername(@Param("phone")String ppp,@Param("username")String uuu);
/**
 * 参数名称一致时，可以省略@Param
 * @param username
 * @param phone
 * @return
 */
@Query(value = "select u from User u where u.phone = :phone or u.username = :username ")
List<User> findByUsernameOrPhone(String username,String phone);
```

1.7、支持一个entityName的spel变量，用法是select x from #{#entityName} x，插入entityName与给定Repository的关联的域类型。如果域类设置了@Entity的name属性，使用name属性的名称，如果没设置，使用域类型的简单类名。也可以在参数上使用spel表达式。

```java
/**
 * 为了避免在查询的字符串声明中使用实体类名，可以使用#{#entityName}变量.
 * 根据用户名查询
 * @param username username
 * @return User
 */
@Query(value = "select u from{#entityName} u where u.username = ?1 ")
User findUserByUsernameWithSpelEntityName(String username);
/**
 * 使用spel表达式
 *
 * @param user user
 * @return user
 */
@Query(value = "select u from User u where u.username = :#{#user.username} ")
User findUserByUsernameWithSpel(User user);
```

1.8、对于like条件，通常在开头或结尾添加%，可以在参数绑定或spel上附加%。

```java
/**
 * like查询可以在参数绑定或spel上追加%。
 * @param email email
 * @return list
 */
@Query(value = "select u from User  u where u.email like %:#{[0]}% and u.email like %:email%")
List<User> findByEmailLikeWithSpel(String email);
/**
 * 原生sql也支持参数绑定和spel表达式
 * @param email email
 * @return list
 */
@Query(value = "SELECT * FROM cfq_jpa_user WHERE email LIKE %:#{[0]}% AND email LIKE %:email% " ,nativeQuery = true)
List<User> findByEmailLikeWithNativeQuery(String email);
```

1.9、对于like条件中的_,%进行转义，在spel中可以使用escape(String) 进行替换，将第二个参数中的字符作为第一个参数中_和%的前缀。escape(String)方法只能将_或%转义，如果数据库有其他的通配符，这无法转义。

1.10、转义的字符可以通过@EnableJpaRepositories注解的escapeCharacter属性进行设置。

```java
/**
 * like查询 escape() 定义转义字符
 * @param email email
 * @return list
 */
@Query(value = "select u from User u where u.email like %?#{escape([0])}% escape ?#{escapeCharacter()} ")
List<User> findByEmailLikeWithEscaped(String email);
```

1.11、当 #{entityName} 与参数SPEL表达式一起使用时，参数要使用?#{进行开头。例如：

```java
/**
* 使用spel表达式
* 当{#entityName} 与SPEL 一起使用时，参数要使用 ?#{
*
* @param user user
* @return user
*/
//    @Query(value = "select u from User u where u.username = :#{#user.username} ")
@Query(value = "select u from{#entityName} u where u.username = ?#{#user.username} ")
User findUserByUsernameWithSpel(User user);
```

### 2、@Modifying与派生delete

2.1、@Modifying源码

```java
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
/**
 * 指示应将查询方法视为修改查询，因为这会更改执行查询的方式。
 * 只有在使用@Query注解定义的查询方法上才考虑使用此注释。
 * 它不应该应用与自定义实现方法或从方法名派生的查询，因为它们已经控制了底层数据库访问API，或者指定是否按名称进行修改。
 *
 * 需要添加@Modifying注解的包括 INSERT、UPDATE、DELETE、DDL语句。
 * 
 */
@Retention(RetentionPolicy.RUNTIME)
@Target({ ElementType.METHOD, ElementType.ANNOTATION_TYPE })
@Documented
public @interface Modifying {
    /**
     * 定义是否应在执行修改查询之前刷新基础持久性上下文。
     */
    boolean flushAutomatically() default false;
    /**
     * 定义是否应在执行修改查询后清除基础持久性上下文。
     */
    boolean clearAutomatically() default false;
}
```

2.2、对于@Query执行INSERT、UPDATE、DELETE、DDL语句时，需要添加@Modifying注解，来改变查询方式。

2.3、@Modifying只有在使用@Query注解时，才考虑使用，对于自定义实现查询和方法名派生的查询则不需要。

2.4、由于EntityManager在执行修改查询后可能包含过时的实体，因此我们不会自动清除它，因为这实际上会删除EntityManager中仍挂起的所有为刷新的修改。如果希望自动清除EntityManager，将clearAutomatically设置为true。

2.5、Spring-Data-JPA还支持派生的delete查询，这样可以避免显式声明JPQL查询。

2.6、派生delete查询会先执行select在执行delete，使用@Query和@Modifying直接执行delete。

2.7、派生delete会触发@PreRemove，而@Query和@Modifying则不会。

源码地址：https://github.com/caofanqi/study-spring-data-jpa
