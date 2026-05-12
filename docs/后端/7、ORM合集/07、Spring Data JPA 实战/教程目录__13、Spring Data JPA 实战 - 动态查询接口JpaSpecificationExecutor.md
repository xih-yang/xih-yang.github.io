# 13、Spring Data JPA 实战 - 动态查询接口JpaSpecificationExecutor
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/1/13.html
- 分类：ORM框架
- 分组：教程目录
### 1、JpaSpecificationExecutor

JPA2引入了一个criteria API，我们可以使用它以编程的形式构建查询。通过编写criteria，动态生成query语句。JpaSpecificationExecutor是Spring-Data-JPA为我们执行基于JPA criteria API的Specification查询接口。想要使用该功能，我们自己的Repository接口继承这个接口就可以了。该接口提供了几个根据Specification进行查询的方法。

JpaSpecificationExecutor源码：

```java
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.lang.Nullable;
/**
 *  接口，允许执行基于JPA criteria API的Specification查询。
 */
public interface JpaSpecificationExecutor<T> {
    /**
     * 返回匹配给定Specification的单个实体，如果没找到返回 Optional.empty()，如果结果集有多个，抛出IncorrectResultSizeDataAccessException异常
     */
    Optional<T> findOne(@Nullable Specification<T> spec);
    /**
     * 返回匹配给定Specification的所有实体
     */
    List<T> findAll(@Nullable Specification<T> spec);
    /**
     * 返回所有匹配给定Specification的实体并分页
     */
    Page<T> findAll(@Nullable Specification<T> spec, Pageable pageable);
    /**
     * 返回所有匹配Specification的实体并排序
     */
    List<T> findAll(@Nullable Specification<T> spec, Sort sort);
    /**
     * 返回所有匹配给定Specification的记录数
     */
    long count(@Nullable Specification<T> spec);
}
```

### 2、Specification

JpaSpecificationExecutor的每一个方法中都有一个Specification参数，Specification接口中的toPredicate方法是该接口的核心方法。Specification可以很容易的在实体上构建一组可扩展的Predicate。然后可以对其进行组合使用，这样JpaRepository就不用为每一种情况都写一个查询方法了。

toPredicate方法种有三个参数：

Root``，代表查询和操作实体的根，我们可以通过它的get方法来获得我们操作的字段，可以写实体属性字符串，也可以使用@StaticMetamodel标记的类来指定（后面有示例）。

CriteriaQuery``，抽象了整个查询语句，用来把各个段组合在一起。

CriteriaBuilder，用来构建CritiaQuery的构建器对象，其实就相当于条件或者是条件组合，以谓语即Predicate的形式返回。

Specification源码：

```java
import static org.springframework.data.jpa.domain.SpecificationComposition.*;
import java.io.Serializable;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;
import org.springframework.lang.Nullable;
/**
 * 领域驱动设计意义上的规范。
 */
public interface Specification<T> extends Serializable {
    long serialVersionUID = 1L;
    /**
     * 否定给定的Specification
     */
    static <T> Specification<T> not(@Nullable Specification<T> spec) {
        return spec == null //
                ? (root, query, builder) -> null//
                : (root, query, builder) -> builder.not(spec.toPredicate(root, query, builder));
    }
    /**
     * 简单的静态工厂方法，给Specification周围添加一些语法糖
     */
    @Nullable
    static <T> Specification<T> where(@Nullable Specification<T> spec) {
        return spec == null ? (root, query, builder) -> null : spec;
    }
    /**
     * 将给定Specification与当前Specification进行and关联
     */
    @Nullable
    default Specification<T> and(@Nullable Specification<T> other) {
        return composed(this, other, (builder, left, rhs) -> builder.and(left, rhs));
    }
    /**
     * 将给定specification与当前specification进行or关联
     */
    @Nullable
    default Specification<T> or(@Nullable Specification<T> other) {
        return composed(this, other, (builder, left, rhs) -> builder.or(left, rhs));
    }
    /**
     * 以给定根和CriteriaQuery的谓词的形式为引用实体的查询创建WHERE子句。
     */
    @Nullable
    Predicate toPredicate(Root<T> root, CriteriaQuery<?> query, CriteriaBuilder criteriaBuilder);
}
```

### 3、SpecificationComposition

帮助类，以支持specification的组合模式。

```java
import java.io.Serializable;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.lang.Nullable;
/**
 * 帮助类，以支持specification的组合模式
 */
class SpecificationComposition {
    /**
     * 函数式接口，组合器
     */
    interface Combiner extends Serializable {
        Predicate combine(CriteriaBuilder builder, @Nullable Predicate lhs, @Nullable Predicate rhs);
    }
    /**
     *  静态组合方法，将给定的两个Specification用指定的组合器进行组合成新的Specification
     */
    @Nullable
    static <T> Specification<T> composed(@Nullable Specification<T> lhs, @Nullable Specification<T> rhs,
                                         Combiner combiner) {
        return (root, query, builder) -> {
            Predicate otherPredicate = toPredicate(lhs, root, query, builder);
            Predicate thisPredicate = toPredicate(rhs, root, query, builder);
            if (thisPredicate == null) {
                return otherPredicate;
            }
            return otherPredicate == null ? thisPredicate : combiner.combine(builder, thisPredicate, otherPredicate);
        };
    }
    /**
     * 将Specification转换为Predicate对象
     */
    private static <T> Predicate toPredicate(Specification<T> specification, Root<T> root, CriteriaQuery<?> query,
            CriteriaBuilder builder) {
        return specification == null ? null : specification.toPredicate(root, query, builder);
    }
}
```

### 4、使用JPAMetaModelEntityProcessor生成元模型

4.1、导入hibernate-jpamodelgen依赖

```xml
<!-- 自动生成元模型 -->
<dependency>
    <groupId>org.hibernate</groupId>
    <artifactId>hibernate-jpamodelgen</artifactId>
    <version>5.2.17.Final</version>
</dependency>
```

4.2、IDEA配置Annoation Processors

4.3、和lombok一起使用，添加maven插件（如果两个同时使用，不添加额外配置的话，lombok不生效）

```xml
<!--     JPAMetaModelEntityProcessor与lombok共存       -->
<plugin>
    <artifactId>maven-compiler-plugin</artifactId>
    <configuration>
        <compilerArguments>
            <processor>org.hibernate.jpamodelgen.JPAMetaModelEntityProcessor,lombok.launch.AnnotationProcessorHider$AnnotationProcessor</processor>
        </compilerArguments>
    </configuration>
</plugin>
```

### 5、JpaRepositoryImplementation

JpaRepository和JpaSpecificationExecutor接口的子类，我们可以直接继承改接口。

### 6、使用示例

6.1、继承接口

6.2、Specification条件工厂（各条件可以组合使用）

```java
/**
 * book Specification 条件
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
public class BookSpecs {
    /**
     *  书名模糊
     */
    public static Specification<Book> bookNameLike(String bookName){
        return (Specification<Book>) (root, query, builder) -> {
            //设置抓取策略，解决N+1条SQL问题
            root.fetch("category", JoinType.LEFT);
            return builder.like(root.get("bookName"),"%" + bookName + "%");
        };
    }
    /**
     * 大于前六个月的认为是新书
     */
    public static Specification<Book> isNewBook(){
        return (Specification<Book>) (root, query, builder) -> {
            LocalDate beforeSixMonth = LocalDate.now().minusMonths(6);
            root.fetch(Book_.category, JoinType.LEFT);
            return builder.greaterThan(root.get(Book_.publishDate),beforeSixMonth);
        };
    }
    /**
     *  门类名称模糊
     */
    public static Specification<Book> categoryNameLike(String categoryName){
        return (Specification<Book>) (root, query, builder) -> {
            root.fetch(Book_.category, JoinType.INNER);
            return builder.like(root.get(Book_.category).get(Category_.categoryName),"%" + categoryName + "%");
        };
    }
}
```

6.3、单元测试

```java
@Test
void testSpec1(){
    List<Book> books = bookRepository.findAll(BookSpecs.bookNameLike("java"));
    books.forEach(b-> System.out.println(b.getBookName()));
}
@Test
void testSpec2(){
    List<Book> books = bookRepository.findAll(BookSpecs.bookNameLike("java").and(BookSpecs.isNewBook()));
    books.forEach(b-> System.out.println(b.getBookName()));
}
/**
 * 排序和分页一样使用
 */
@Test
void testSpec3(){
    List<Book> books = bookRepository.findAll(BookSpecs.isNewBook(),Sort.by(Sort.Direction.DESC,"publishDate"));
    books.forEach(b-> System.out.println(b.getBookName()));
}
@Test
void testSpec4(){
    List<Book> books = bookRepository.findAll(BookSpecs.categoryNameLike("数据库"));
    books.forEach(b-> System.out.println(b.getBookName()));
}
```

源码地址：https://github.com/caofanqi/study-spring-data-jpa
