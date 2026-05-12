# 51、SpringBoot 源码分析 - ConfigFileApplicationListener配置文件加载原理二
- 来源：https://ddkk.com/zhuanlan/j2ee/springboot/6/51.html
- 分类：J2EE框架
- 分组：教程目录
## 基本流程图

## Loader的load加载配置文件

简单的说其实内部就是加载默认的配置文件，激活环境的文件，我们来看看细节。

```java
void load() {
			FilteredPropertySource.apply(this.environment, DEFAULT_PROPERTIES, LOAD_FILTERED_PROPERTY,
					(defaultProperties) -> {
						this.profiles = new LinkedList<>();
						this.processedProfiles = new LinkedList<>();
						this.activatedProfiles = false;
						this.loaded = new LinkedHashMap<>();
						initializeProfiles();
						while (!this.profiles.isEmpty()) {
							Profile profile = this.profiles.poll();
							if (isDefaultProfile(profile)) {
								addProfileToEnvironment(profile.getName());
							}
							load(profile, this::getPositiveProfileFilter,
									addToLoaded(MutablePropertySources::addLast, false));
							this.processedProfiles.add(profile);
						}
						load(null, this::getNegativeProfileFilter, addToLoaded(MutablePropertySources::addFirst, true));
						addLoadedPropertySources();
						applyActiveProfiles(defaultProperties);
					});
		}
```

### FilteredPropertySource的apply

首先默认取加载`defaultProperties`属性源，但是没有，所以就调用了传进来的`lambda`表达式。

#### initializeProfiles

定义了一些集合，用来做记录，然后我们看初始化做了什么。

这里有个想技巧，先放进一个`null`，为了后面可以优先处理这个，然后就可以去加载配置文件。后面还会去添加一个`default`默认的配置，也就是说此时`profiles`里有`null`和`default`两个配置。

```java
public static final String ACTIVE_PROFILES_PROPERTY = "spring.profiles.active";
public static final String INCLUDE_PROFILES_PROPERTY = "spring.profiles.include";
		private void initializeProfiles() {
			// The default profile for these purposes is represented as null. We add it
			// first so that it is processed first and has lowest priority.
			this.profiles.add(null);
			Set<Profile> activatedViaProperty = getProfilesFromProperty(ACTIVE_PROFILES_PROPERTY);
			Set<Profile> includedViaProperty = getProfilesFromProperty(INCLUDE_PROFILES_PROPERTY);
			List<Profile> otherActiveProfiles = getOtherActiveProfiles(activatedViaProperty, includedViaProperty);
			this.profiles.addAll(otherActiveProfiles);
			// Any pre-existing active profiles set via property sources (e.g.
			// System properties) take precedence over those added in config files.
			this.profiles.addAll(includedViaProperty);
			addActiveProfiles(activatedViaProperty);
			if (this.profiles.size() == 1) {
      // only has null profile
				for (String defaultProfileName : this.environment.getDefaultProfiles()) {
					Profile defaultProfile = new Profile(defaultProfileName, true);
					this.profiles.add(defaultProfile);
				}
			}
		}
```

#### 遍历profiles队列

这里就可以看到，遍历的时候第一个是`null`，所以先处理，不会去处理默认的`default`，他的思想就是如果第一次可以获取到配置，那就用这个配置，不用去获取默认的了。

##### isDefaultProfile

显然`null`是不满足的。

##### load加载文件

一个函数式编程的写法，其实就是获取所有的搜索路径`getSearchLocations`，挨个遍历执行lambda里面的方法，如果是个文件夹的话，搜索里面的文件名字集合，进行加载，否则就什么都不做，因为`NO_SEARCH_NAMES`是空集合

```java
		private void load(Profile profile, DocumentFilterFactory filterFactory, DocumentConsumer consumer) {
			getSearchLocations().forEach((location) -> {
				boolean isFolder = location.endsWith("/");
				Set<String> names = isFolder ? getSearchNames() : NO_SEARCH_NAMES;
				names.forEach((name) -> load(location, name, profile, filterFactory, consumer));
			});
		}
```

##### getSearchLocations获取搜索路径

先看有没`spring.config.location`属性源，有的话从这里面的找路径，没有的话再看`spring.config.additional-location`属性源，最后把`classpath:/,classpath:/config/,file:./,file:./config/`这些路径也加上返回，这里就说明了我们的配置文件可以放在这里路径下，不过遍历的时候是反序的，也就是说优先级应该是`file:./config/, file:./, classpath:/config/, classpath:/`，项目目录优先，有`config`的优先。

```java
public static final String CONFIG_LOCATION_PROPERTY = "spring.config.location";
public static final String CONFIG_ADDITIONAL_LOCATION_PROPERTY = "spring.config.additional-location";
private static final String DEFAULT_SEARCH_LOCATIONS = "classpath:/,classpath:/config/,file:./,file:./config/";
		private Set<String> getSearchLocations() {
			if (this.environment.containsProperty(CONFIG_LOCATION_PROPERTY)) {
				return getSearchLocations(CONFIG_LOCATION_PROPERTY);
			}
			Set<String> locations = getSearchLocations(CONFIG_ADDITIONAL_LOCATION_PROPERTY);
			locations.addAll(
					asResolvedSet(ConfigFileApplicationListener.this.searchLocations, DEFAULT_SEARCH_LOCATIONS));
			return locations;
		}
```

默认就这`4`个：

##### getSearchNames获取搜做的名字（关键点）

这里很关键，首先是取找`spring.config.name`属性源，不存在的话再去找`application`属性源，所以为什么配置了`bootstrap`的话会先去找，因为在配置的时候加了`spring.config.name=bootstrap`属性源，加载完毕后再删除，然后就可以去加载`application`属性源了，其实环境准备时间出发了两次，所以这两个属性源都会被处理，这个后面说。

```java
public static final String CONFIG_NAME_PROPERTY = "spring.config.name";
private static final String DEFAULT_NAMES = "application";
		private Set<String> getSearchNames() {
			if (this.environment.containsProperty(CONFIG_NAME_PROPERTY)) {
				String property = this.environment.getProperty(CONFIG_NAME_PROPERTY);
				return asResolvedSet(property, null);
			}
			return asResolvedSet(ConfigFileApplicationListener.this.names, DEFAULT_NAMES);
		}
```

后面继续说拿到了配置文件名字后怎么加载。

好了，今天就到这里了，希望对学习理解有帮助，大神看见勿喷，仅为自己的学习理解，能力有限，请多包涵。
