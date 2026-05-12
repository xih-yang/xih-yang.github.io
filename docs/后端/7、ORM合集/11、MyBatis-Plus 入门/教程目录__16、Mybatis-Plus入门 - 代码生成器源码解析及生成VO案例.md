# 16、Mybatis-Plus入门 - 代码生成器源码解析及生成VO案例
- 来源：https://ddkk.com/zhuanlan/orm/mybatisplus/5/16.html
- 分类：ORM框架
- 分组：教程目录
### 前言

在上篇文档中，讲解了如何生成代码及自定义模板，可以实现基础的一些代码生成。

但是除了这些代码，比如现在需要生成VO\PO等对象，以及生成其他更多功能的代码生成，应该怎么做呢。

所以接下来分析下MybatisPlus代码生成源码，这样就可以对症下药了。

### 源码分析

#### 1. 获取配置项

用以下代码示例，可以看出AutoGenerator会加载各种配置。

```java
        // 添加以上配置到AutoGenerator中
        AutoGenerator autoGenerator = new AutoGenerator(dataSourceConfig); // 数据源配置
        autoGenerator.global(globalConfig); // 全局策略配置
        autoGenerator.packageInfo(packageConfig);    // 包配置
        autoGenerator.template(templateConfig); // 配置模板
        // 生成代码,传入模板
        autoGenerator.execute(templateEngine);
```

#### 2. execute执行入口

AutoGenerator的execute方法是代码生成的入口。

```java
    public void execute(AbstractTemplateEngine templateEngine) {
        logger.debug("==========================准备生成文件...==========================");
        // 1. 加载配置
        if (null == this.config) {
            this.config = new ConfigBuilder(this.packageInfo, this.dataSource, this.strategy, this.template, this.globalConfig, this.injection);
        }
		// 2. 初始化模板引擎
        if (null == templateEngine) {
            templateEngine = new VelocityTemplateEngine();
        }
		// 3. 调用模板引擎  生成代码    
		((AbstractTemplateEngine)templateEngine).setConfigBuilder(this.config);
        ((AbstractTemplateEngine)templateEngine).init(this.config).batchOutput().open();
        logger.debug("==========================文件生成完成！！！==========================");
    }
```

#### 3. 模板引擎初始化

接着调用init()方法初始化不同的模板引擎，因为这里使用的是Freemarker，所以进入FreemarkerTemplateEngine的init()方法。

```java
    @NotNull
    public FreemarkerTemplateEngine init(@NotNull ConfigBuilder configBuilder) {
    	//  模板引擎配置
    	// 1. 设置Freemarker版本
        this.configuration = new Configuration(Configuration.DEFAULT_INCOMPATIBLE_IMPROVEMENTS);
        // 2. 设置字符集
        this.configuration.setDefaultEncoding(ConstVal.UTF8);
        // 3. 设置模板加载类
        this.configuration.setClassForTemplateLoading(FreemarkerTemplateEngine.class, "/");
        return this;
    }
```

#### 4. 批量输出

模板引擎初始化及配置完成后，接着进入AbstractTemplateEngine的batchOutput()方法。该方法主要是查询数据库，然后生成MVC三层代码

```java
    @NotNull
    public AbstractTemplateEngine batchOutput() {
        try {
            ConfigBuilder config = this.getConfigBuilder();
            // 1. 查询数据库表结构信息
            List<TableInfo> tableInfoList = config.getTableInfoList();
            tableInfoList.forEach((tableInfo) -> {
                Map<String, Object> objectMap = this.getObjectMap(config, tableInfo);
                Optional.ofNullable(config.getInjectionConfig()).ifPresent((t) -> {
                    t.beforeOutputFile(tableInfo, objectMap);
                });
                // 2. 输出相关代码
                this.outputEntity(tableInfo, objectMap);
                this.outputMapper(tableInfo, objectMap);
                this.outputService(tableInfo, objectMap);
                this.outputController(tableInfo, objectMap);
            });
            return this;
        } catch (Exception var3) {
            throw new RuntimeException("无法创建文件，请检查配置信息！", var3);
        }
    }
```

#### 5. 查询表结构信息并转换Map

在batchOutput()方法，首先会查询表结构信息，并封装为TableInfo对象集合。图中可以看到TableInfo对象，会封装数据库表信息，并且会根据表信息，生成相应的controller、mappper、service等信息。

获取了表结构信息后，会转为Map，调用的是AbstractTemplateEngine的getObjectMap()方法。

```java
    public Map<String, Object> getObjectMap(@NotNull ConfigBuilder config, @NotNull TableInfo tableInfo) {
        GlobalConfig globalConfig = config.getGlobalConfig();
        Map<String, Object> controllerData = config.getStrategyConfig().controller().renderData(tableInfo);
        Map<String, Object> objectMap = new HashMap(controllerData);
        Map<String, Object> mapperData = config.getStrategyConfig().mapper().renderData(tableInfo);
        objectMap.putAll(mapperData);
        Map<String, Object> serviceData = config.getStrategyConfig().service().renderData(tableInfo);
        objectMap.putAll(serviceData);
        Map<String, Object> entityData = config.getStrategyConfig().entity().renderData(tableInfo);
        objectMap.putAll(entityData);
        objectMap.put("config", config);
        objectMap.put("package", config.getPackageConfig().getPackageInfo());
        objectMap.put("author", globalConfig.getAuthor());
        objectMap.put("kotlin", globalConfig.isKotlin());
        objectMap.put("swagger", globalConfig.isSwagger());
        objectMap.put("date", globalConfig.getCommentDate());
        String schemaName = config.getDataSourceConfig().getSchemaName();
        if (StringUtils.isNotBlank(schemaName)) {
            schemaName = schemaName + ".";
            tableInfo.setConvert(true);
        } else {
            schemaName = "";
        }
        objectMap.put("schemaName", schemaName);
        objectMap.put("table", tableInfo);
        objectMap.put("entity", tableInfo.getEntityName());
        return objectMap;
    }
```

该方法会读取相关的策略配置，转换数据表信息为模板所需要的属性。

最后返回的Map结构入下图所示：

#### 6. 输出

获取到Map之后，会输出各层代码文件。

例如输出实体类，调用的是AbstractTemplateEngine的outputEntity方法。

```java
    protected void outputEntity(@NotNull TableInfo tableInfo, @NotNull Map<String, Object> objectMap) {
    	// 1. 获取实体类的名称 Base_dict
        String entityName = tableInfo.getEntityName();
        // 2. 获取输出文件夹路径  D:\output\aa\b\entity
        String entityPath = this.getPathInfo("entity_path");
        if (StringUtils.isNotBlank(entityName) && StringUtils.isNotBlank(entityPath)) {
        	// 3. 获取模板 /templates/entity.java.ftl
            this.getTemplateFilePath((template) -> {
                return template.getEntity(this.getConfigBuilder().getGlobalConfig().isKotlin());
            }).ifPresent((entity) -> {
            	// 4. 创建输出文件名 D:\output\a\b\entity\Base_dict.java
                String entityFile = String.format(entityPath + File.separator + "%s" + this.suffixJavaOrKt(), entityName);
                this.outputFile(new File(entityFile), objectMap, entity);
            });
        }
    }
```

最终调用的是AbstractTemplateEngine的outputFile()方法。

```java
    protected void outputFile(@NotNull File file, @NotNull Map<String, Object> objectMap, @NotNull String templatePath) {
        if (this.isCreate(file)) {
            try {
                boolean exist = file.exists();
                if (!exist) {
                // 1. 文件是否创建成功 ,不逊在创建文件夹。D:\output\a\b\entity\Base_dict.java
                    File parentFile = file.getParentFile();
                    FileUtils.forceMkdir(parentFile);
                }
                this.writer(objectMap, templatePath, file);
            } catch (Exception var6) {
                throw new RuntimeException(var6);
            }
        }
    }
```

#### 6. writer

最终调用的是模板引擎的writer方法输出文件。

```java
    public void writer(@NotNull Map<String, Object> objectMap, @NotNull String templatePath, @NotNull File outputFile) throws Exception {
    	// 1. 根据路径获取模板
        Template template = this.configuration.getTemplate(templatePath);
        // 2. 创建输出流对象
        FileOutputStream fileOutputStream = new FileOutputStream(outputFile);
        Throwable var6 = null;
        try {
        	// 3. 调用模板输出
            template.process(objectMap, new OutputStreamWriter(fileOutputStream, ConstVal.UTF8));
        } catch (Throwable var15) {
            var6 = var15;
            throw var15;
        } finally {
            if (fileOutputStream != null) {
                if (var6 != null) {
                    try {
                        fileOutputStream.close();
                    } catch (Throwable var14) {
                        var6.addSuppressed(var14);
                    }
                } else {
                    fileOutputStream.close();
                }
            }
        }
    }
```

### MybatisPlus代码生成器生成VO

**1、** 创建VO模板，直接套用entity.java.ftl，删除和数据库相关的标签配置；

```java
package ${package.Entity};
<#list table.importPackages as pkg>
    import ${pkg};
</#list>
<#if swagger>
    import io.swagger.annotations.ApiModel;
    import io.swagger.annotations.ApiModelProperty;
</#if>
<#if entityLombokModel>
    import lombok.Data;
    import lombok.EqualsAndHashCode;
    <#if chainModel>
        import lombok.experimental.Accessors;
    </#if>
</#if>
/**
* <p>
    * ${table.comment!}
    * </p>
*
* @author ${author}
* @since ${date}
*/
<#if entityLombokModel>
    @Data
    <#if superEntityClass??>
        @EqualsAndHashCode(callSuper = true)
    <#else>
        @EqualsAndHashCode(callSuper = false)
    </#if>
    <#if chainModel>
        @Accessors(chain = true)
    </#if>
</#if>
<#--<#if table.convert>
    @TableName("${schemaName}${table.name}")
</#if>-->
<#if swagger>
    @ApiModel(value = "${entity}对象", description = "${table.comment!}")
</#if>
<#if superEntityClass??>
    public class ${entity}VO extends ${superEntityClass}<#if activeRecord><${entity}></#if> {
<#elseif activeRecord>
    public class ${entity}VO extends Model<${entity}> {
<#else>
    public class ${entity}VO implements Serializable {
</#if>
<#if entitySerialVersionUID>
    private static final long serialVersionUID = 1L;
</#if>
<#-- ----------  BEGIN 字段循环遍历  ---------->
<#list table.fields as field>
    <#if field.keyFlag>
        <#assign keyPropertyName="${field.propertyName}"/>
    </#if>
    <#if field.comment!?length gt 0>
        <#if swagger>
            @ApiModelProperty(value = "${field.comment}")
        <#else>
            /**
            * ${field.comment}
            */
        </#if>
    </#if>
    <#if field.keyFlag>
    <#-- 主键 -->
<#--        <#if field.keyIdentityFlag>
            @TableId(value = "${field.annotationColumnName}", type = IdType.AUTO)
        <#elseif idType??>
            @TableId(value = "${field.annotationColumnName}", type = IdType.${idType})
        <#elseif field.convert>
            @TableId("${field.annotationColumnName}")
        </#if>-->
    <#-- 普通字段 -->
    <#elseif field.fill??>
    <#-- -----   存在字段填充设置   ----->
<#--        <#if field.convert>
            @TableField(value = "${field.annotationColumnName}", fill = FieldFill.${field.fill})
        <#else>
            @TableField(fill = FieldFill.${field.fill})
        </#if>-->
    <#elseif field.convert>
        @TableField("${field.annotationColumnName}")
    </#if>
<#-- 乐观锁注解 -->
<#--    <#if field.versionField>
        @Version
    </#if>-->
<#-- 逻辑删除注解 -->
<#--    <#if field.logicDeleteField>
        @TableLogic
    </#if>-->
    private ${field.propertyType} ${field.propertyName};
</#list>
<#------------  END 字段循环遍历  ---------->
<#if !entityLombokModel>
    <#list table.fields as field>
        <#if field.propertyType == "boolean">
            <#assign getprefix="is"/>
        <#else>
            <#assign getprefix="get"/>
        </#if>
        public ${field.propertyType} ${getprefix}${field.capitalName}() {
        return ${field.propertyName};
        }
        <#if chainModel>
            public ${entity} set${field.capitalName}(${field.propertyType} ${field.propertyName}) {
        <#else>
            public void set${field.capitalName}(${field.propertyType} ${field.propertyName}) {
        </#if>
        this.${field.propertyName} = ${field.propertyName};
        <#if chainModel>
            return this;
        </#if>
        }
    </#list>
</#if>
<#if entityColumnConstant>
    <#list table.fields as field>
        public static final String ${field.name?upper_case} = "${field.name}";
    </#list>
</#if>
<#if activeRecord>
    @Override
    protected Serializable pkVal() {
    <#if keyPropertyName??>
        return this.${keyPropertyName};
    <#else>
        return null;
    </#if>
    }
</#if>
<#if !entityLombokModel>
    @Override
    public String toString() {
    return "${entity}{" +
    <#list table.fields as field>
        <#if field_index==0>
            "${field.propertyName}=" + ${field.propertyName} +
        <#else>
            ", ${field.propertyName}=" + ${field.propertyName} +
        </#if>
    </#list>
    "}";
    }
</#if>
}
```

**1、** 重写FreemarkerTemplateEngine，主要是添加生成VO逻辑；

```java
public class MybatisFreemarkerTemplateEngine extends FreemarkerTemplateEngine {
    @Override
    public AbstractTemplateEngine batchOutput() {
        System.out.println(" 进子类方法");
        try {
            ConfigBuilder config = this.getConfigBuilder();
            List<TableInfo> tableInfoList = config.getTableInfoList();
            tableInfoList.forEach((tableInfo) -> {
                Map<String, Object> objectMap = this.getObjectMap(config, tableInfo);
                Optional.ofNullable(config.getInjectionConfig()).ifPresent((t) -> {
                    t.beforeOutputFile(tableInfo, objectMap);
                });
                this.outputEntity(tableInfo, objectMap);
                this.outputMapper(tableInfo, objectMap);
                this.outputService(tableInfo, objectMap);
                this.outputController(tableInfo, objectMap);
                this.outputVO(tableInfo, objectMap);
            });
            return this;
        } catch (Exception var3) {
            throw new RuntimeException("无法创建文件，请检查配置信息！", var3);
        }
    }
    /**
     * 输出VO文件
     *
     * @param tableInfo 表信息
     * @param objectMap 渲染数据
     * @since 3.0.0
     */
    protected void outputVO(TableInfo tableInfo,  Map<String, Object> objectMap) {
        // VO类名： 实体类+"VO"
        String voName = tableInfo.getEntityName()+"VO";
        // String voPath = this.getPathInfo("entity_path");
        String voPath = "D:\\output\\a\\v\\vo";
        if (StringUtils.isNotBlank(voName) && StringUtils.isNotBlank(voPath)) {
            String entityFile = String.format(voPath + File.separator + "%s" + this.suffixJavaOrKt(), voName);
            this.outputFile(new File(entityFile), objectMap, "/templates/view/mybatis/VO.java.ftl");
        }
    }
}
```

**1、** AutoGenerator添加自定义模板引擎；

```java
        // 设置自定义模板引擎
        AbstractTemplateEngine templateEngine = new MybatisFreemarkerTemplateEngine();
        // 生成代码,传入模板
        autoGenerator.execute(templateEngine);
```

**1、** 生成VO，这里只是演示，具体的细节需要自己修改；
