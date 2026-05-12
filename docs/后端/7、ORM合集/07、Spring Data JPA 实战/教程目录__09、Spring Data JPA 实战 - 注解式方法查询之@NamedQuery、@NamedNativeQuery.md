# 09、Spring Data JPA 实战 - 注解式方法查询之@NamedQuery、@NamedNativeQuery
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/1/9.html
- 分类：ORM框架
- 分组：教程目录
### 1、@NamedQuery、@NamedNativeQuery

@NamedQuery与@NamedNativeQuery都是定义查询的一种形式，@NamedQuery使用的是JPQL，而@NamedNativeQuery使用的是原生SQL。这两种不常用，所以简单介绍一下。

使用方法：

1.1、在实体@Entity下添加@NamedQuery或@NamedNativeQuery定义。

```java
/**
 * 类别
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
@Data
@Entity
@Builder
@Table(name = "jpa_category")
@NoArgsConstructor
@AllArgsConstructor
@NamedQuery(name = "Category.selectByName",query = "SELECT c FROM Category c WHERE c.categoryName = ?1 ")
@NamedNativeQuery(name = "Category.selectByNameLike",query = "SELECT * FROM cfq_jpa_category WHERE category_name LIKE ?1 ",resultClass = Category.class)
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private  String categoryName;
    /**
     * 门类和书是一对多的关系
     * 由多的一方来维护关联关系
     */
    @OneToMany(mappedBy = "category")
    @OrderBy("bookName DESC")
    private List<Book> books;
}
```

1.2、在Repository接口中声明方法

```java
/**
 * 门类持久层
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
public interface CategoryRepository extends JpaRepository<Category,Long> {
    /**
     * 使用@NamedQuery进行方法查询
     * @param name 分类名称
     * @return category
     */
    Category selectByName(String name);
    /**
     * 使用@NamedNativeQuery进行方法查询
     * @param name 分类名称
     * @return category
     */
    List<Category> selectByNameLike(String name);
}
```

单元测试：

```java
@Transactional
@SpringBootTest
class CategoryRepositoryTest {
    @Resource
    private CategoryRepository categoryRepository;
    @BeforeEach
    void setup(){
        Category category1 = Category.builder().categoryName("Java").build();
        Category category2 = Category.builder().categoryName("数据库").build();
        Category category3 = Category.builder().categoryName("数据结构").build();
        ArrayList<Category> categories = Lists.newArrayList(category1, category2, category3);
        categoryRepository.saveAll(categories);
    }
    @Test
    void selectByName() {
        Category category = categoryRepository.selectByName("Java");
        assertEquals("Java",category.getCategoryName());
    }
    @Test
    void selectByNameLike(){
        List<Category> categoryList = categoryRepository.selectByNameLike("%据%");
        assertEquals(2,categoryList.size());
    }
}
```

注意：

1.3、@NamedQuery、@NamedNativeQuery注解也可以使用、标签来替代写在orm.xml中。

1.4、@NamedNativeQuery还可以与@SqlResultSetMapping(@EntityResult、@ConstructorResult、@ColumnResult、@FieldResult)注解配置使用，指定映射。

1.5、@NamedQueries、@NamedNativeQueries、@SqlResultSetMappings用于装多个@NamedQuery、@NamedNativeQuery、@SqlResultSetMapping。

1.6、我们一般不推荐使用@NamedQuery、@NamedNativeQuery，而使用下面的@Query注解。

源码地址：https://github.com/caofanqi/study-spring-data-jpa
