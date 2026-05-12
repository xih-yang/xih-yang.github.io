# 10、Mybatis-Plus入门 - 自动填充功能
- 来源：https://ddkk.com/zhuanlan/orm/mybatisplus/5/10.html
- 分类：ORM框架
- 分组：教程目录
### 前言

**必要性:**

在实际开发中，设计数据库表时，通常都会添加公共字段，比如创建时间、操作人、更新时间等。

**阿里巴巴规范**：

建表规约9【**强制**】表必备三字段：id, gmt_create, gmt_modified。

**说明**：其中 id必为主键，类型为 unsigned bigint、单表时自增、步长为 1。gmt_create,gmt_modified的类型均为 date_time类型，前者现在时表示主动创建，后者过去分词表示被动更新。

### MybatisPlus自动填充

Plus提供了MetaObjectHandler接口，实现公共字段自动写入。

```java
public interface MetaObjectHandler {
    /**
     * 是否开启了插入填充
     */
    default boolean openInsertFill() {
        return true;
    }
    /**
     * 是否开启了更新填充
     */
    default boolean openUpdateFill() {
        return true;
    }
    /**
     * 插入元对象字段填充（用于插入时对公共字段的填充）
     *
     * @param metaObject 元对象
     */
    void insertFill(MetaObject metaObject);
    /**
     * 更新元对象字段填充（用于更新时对公共字段的填充）
     *
     * @param metaObject 元对象
     */
    void updateFill(MetaObject metaObject);
    /**
     * 通用填充
     *
     * @param fieldName  java bean property name
     * @param fieldVal   java bean property value
     * @param metaObject meta object parameter
     */
    default MetaObjectHandler setFieldValByName(String fieldName, Object fieldVal, MetaObject metaObject) {
        if (Objects.nonNull(fieldVal) && metaObject.hasSetter(fieldName)) {
            metaObject.setValue(fieldName, fieldVal);
        }
        return this;
    }
    /**
     * get value from java bean by propertyName
     *
     * @param fieldName  java bean property name
     * @param metaObject parameter wrapper
     * @return 字段值
     */
    default Object getFieldValByName(String fieldName, MetaObject metaObject) {
        return metaObject.hasGetter(fieldName) ? metaObject.getValue(fieldName) : null;
    }
    /**
     * find the tableInfo cache by metaObject </p>
     * 获取 TableInfo 缓存
     *
     * @param metaObject meta object parameter
     * @return TableInfo
     * @since 3.3.0
     */
    default TableInfo findTableInfo(MetaObject metaObject) {
        return TableInfoHelper.getTableInfo(metaObject.getOriginalObject().getClass());
    }
    /**
     * @param metaObject metaObject meta object parameter
     * @return this
     * @since 3.3.0
     */
    default <T, E extends T> MetaObjectHandler strictInsertFill(MetaObject metaObject, String fieldName, Class<T> fieldType, E fieldVal) {
        return strictInsertFill(findTableInfo(metaObject), metaObject, Collections.singletonList(StrictFill.of(fieldName, fieldType, fieldVal)));
    }
    /**
     * @param metaObject metaObject meta object parameter
     * @return this
     * @since 3.3.0
     */
    default <T, E extends T> MetaObjectHandler strictInsertFill(MetaObject metaObject, String fieldName, Supplier<E> fieldVal, Class<T> fieldType) {
        return strictInsertFill(findTableInfo(metaObject), metaObject, Collections.singletonList(StrictFill.of(fieldName, fieldVal, fieldType)));
    }
    /**
     * @param metaObject metaObject meta object parameter
     * @return this
     * @since 3.3.0
     */
    default MetaObjectHandler strictInsertFill(TableInfo tableInfo, MetaObject metaObject, List<StrictFill<?, ?>> strictFills) {
        return strictFill(true, tableInfo, metaObject, strictFills);
    }
    /**
     * @param metaObject metaObject meta object parameter
     * @return this
     * @since 3.3.0
     */
    default <T, E extends T> MetaObjectHandler strictUpdateFill(MetaObject metaObject, String fieldName, Supplier<E> fieldVal, Class<T> fieldType) {
        return strictUpdateFill(findTableInfo(metaObject), metaObject, Collections.singletonList(StrictFill.of(fieldName, fieldVal, fieldType)));
    }
    /**
     * @param metaObject metaObject meta object parameter
     * @return this
     * @since 3.3.0
     */
    default <T, E extends T> MetaObjectHandler strictUpdateFill(MetaObject metaObject, String fieldName, Class<T> fieldType, E fieldVal) {
        return strictUpdateFill(findTableInfo(metaObject), metaObject, Collections.singletonList(StrictFill.of(fieldName, fieldType, fieldVal)));
    }
    /**
     * @param metaObject metaObject meta object parameter
     * @return this
     * @since 3.3.0
     */
    default MetaObjectHandler strictUpdateFill(TableInfo tableInfo, MetaObject metaObject, List<StrictFill<?, ?>> strictFills) {
        return strictFill(false, tableInfo, metaObject, strictFills);
    }
    /**
     * 严格填充,只针对非主键的字段,只有该表注解了fill 并且 字段名和字段属性 能匹配到才会进行填充(null 值不填充)
     *
     * @param insertFill  是否验证在 insert 时填充
     * @param tableInfo   cache 缓存
     * @param metaObject  metaObject meta object parameter
     * @param strictFills 填充信息
     * @return this
     * @since 3.3.0
     */
    default MetaObjectHandler strictFill(boolean insertFill, TableInfo tableInfo, MetaObject metaObject, List<StrictFill<?, ?>> strictFills) {
        if ((insertFill && tableInfo.isWithInsertFill()) || (!insertFill && tableInfo.isWithUpdateFill())) {
            strictFills.forEach(i -> {
                final String fieldName = i.getFieldName();
                final Class<?> fieldType = i.getFieldType();
                tableInfo.getFieldList().stream()
                    .filter(j -> j.getProperty().equals(fieldName) && fieldType.equals(j.getPropertyType()) &&
                        ((insertFill && j.isWithInsertFill()) || (!insertFill && j.isWithUpdateFill()))).findFirst()
                    .ifPresent(j -> strictFillStrategy(metaObject, fieldName, i.getFieldVal()));
            });
        }
        return this;
    }
    /**
     * 填充策略,默认有值不覆盖,如果提供的值为null也不填充
     *
     * @param metaObject metaObject meta object parameter
     * @param fieldName  java bean property name
     * @param fieldVal   java bean property value of Supplier
     * @return this
     * @since 3.3.0
     */
    default MetaObjectHandler fillStrategy(MetaObject metaObject, String fieldName, Object fieldVal) {
        if (getFieldValByName(fieldName, metaObject) == null) {
            setFieldValByName(fieldName, fieldVal, metaObject);
        }
        return this;
    }
    /**
     * 严格模式填充策略,默认有值不覆盖,如果提供的值为null也不填充
     *
     * @param metaObject metaObject meta object parameter
     * @param fieldName  java bean property name
     * @param fieldVal   java bean property value of Supplier
     * @return this
     * @since 3.3.0
     */
    default MetaObjectHandler strictFillStrategy(MetaObject metaObject, String fieldName, Supplier<?> fieldVal) {
        if (metaObject.getValue(fieldName) == null) {
            Object obj = fieldVal.get();
            if (Objects.nonNull(obj)) {
                metaObject.setValue(fieldName, obj);
            }
        }
        return this;
    }
}
```

### 测试案例

**1、** 数据库表中添加gmt_createg（创建时间）、mt_modified（最后更新时间）、oper_user（操作人账号）字段；

**2、** 实体类添加字段,使用@TableField设置字段填充策略；

```java
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private String operUser;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime gmtCreate;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime gmtModified;
```

```java
/**
 * 字段填充策略枚举类
 *
 * <p>
 * 判断注入的 insert 和 update 的 sql 脚本是否在对应情况下忽略掉字段的 if 标签生成
 * <if test="...">......</if>
 * 判断优先级比 {@link FieldStrategy} 高
 * </p>
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @since 2017-06-27
 */
public enum FieldFill {
    /**
     * 默认不处理
     */
    DEFAULT,
    /**
     * 插入时填充字段
     */
    INSERT,
    /**
     * 更新时填充字段
     */
    UPDATE,
    /**
     * 插入和更新时填充字段
     */
    INSERT_UPDATE
}
```

**1、** 编写自定义MyMetaObjectHandler类，实现MetaObjectHandler接口；

```java
@Slf4j
@Component
public class MyMetaObjectHandler implements MetaObjectHandler {
    /**
     * 插入时执行填充逻辑
     *
     * @param metaObject
     */
    @Override
    public void insertFill(MetaObject metaObject) {
        log.info("start insert fill ....");
        this.strictInsertFill(metaObject, "gmtCreate", LocalDateTime.class, LocalDateTime.now()); // 自动填充插入时间
        this.strictInsertFill(metaObject, "gmtModified", LocalDateTime.class, LocalDateTime.now());// 自动填充更新时间
        this.strictInsertFill(metaObject, "operUser", String.class, "zhangsan");// 自动填充操作人
    }
    /**
     * 更新时执行填充逻辑
     *
     * @param metaObject
     */
    @Override
    public void updateFill(MetaObject metaObject) {
        log.info("start update fill ....");
        this.strictUpdateFill(metaObject, "gmtModified", LocalDateTime.class, LocalDateTime.now());
        this.strictUpdateFill(metaObject, "operUser", String.class, "zhangsan_update");
    }
}
```

**1、** 插入数据测试，发现已自动填充；

**2、** 更新测试,更新时会自动填充这些更新字段，但是如果这个更新字段已有值，则不能实现更新，所以需要把更新字段设置为null,或者设置当前信息（这样更新自动插入是否又没有什么使用意义了）；

### 注意事项

- 填充原理是直接给entity的属性设置值!!!，自定义语句时无效。
- 注解则是指定该属性在对应情况下必有值,如果无值则入库会是null
- MetaObjectHandler提供的默认方法的策略均为:如果属性有值则不覆盖,如果填充值为null则不填充
- 字段必须声明TableField注解,属性fill选择对应策略,该声明告知Mybatis-Plus需要预留注入SQL字段
- 填充处理器MyMetaObjectHandler在 Spring Boot 中需要声明@Component或@Bean注入
- 要想根据注解FieldFill.xxx和字段名以及字段类型来区分必须使用父类的strictInsertFill或者strictUpdateFill方法
- 不需要根据任何来区分可以使用父类的fillStrategy方法

### 遇到的问题

#### 先查询再更新时无法更新公共字段

因为默认方法的策略均为:如果属性有值则不覆盖,如果填充值为null则不填充。所以先查询后更新，则无法自动填充更新值。

**解决方式1**：直接把metaObject中的公共字段设置为空，让plus去填充，不过这样自己就无法设置这些公共字段了。

```java
    @Override
    public void updateFill(MetaObject metaObject) {
        log.info("start update fill ....");
        // 
        metaObject.setValue("gmtModified",null);
        metaObject.setValue("operUser",null);
        this.strictUpdateFill(metaObject, "gmtModified", LocalDateTime.class, LocalDateTime.now());
        this.strictUpdateFill(metaObject, "operUser", String.class, "zhangsan_update");
    }
```

**解决方式2**：在mapper中添加自定义更新的方法，需要强制更新公共字段时使用这个，不需要时使用自带的update,使用时应抽取到自己定义的通用Mapper中。

```java
    default int updateByIdWithAutoFill(OrderTbl orderTbl) {
        orderTbl.setGmtModified(LocalDateTime.now());
        orderTbl.setOperUser("mappper_user");
        return updateById(orderTbl);
    }
```

#### 逻辑删除时无法更新公共字段

deleteById时，只是设置了删除状态，没有自动填充更新值，此时应该设置更新时间和操作人。

**解决方式1** ：通过Sql 注入器解决，下篇介绍。。。

**解决方式2** ：自己写个通用方法进行处理。。。
